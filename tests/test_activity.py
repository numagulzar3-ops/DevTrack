def test_activity_records_changes_and_is_scoped_to_owner(client):
    def register_and_login(email):
        password = "test-password"
        response = client.post("/register", json={
            "full_name": "Test User", "email": email, "password": password,
        })
        assert response.status_code == 201
        response = client.post("/login", json={"email": email, "password": password})
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    owner = register_and_login("owner@example.com")
    other = register_and_login("other@example.com")
    assert client.get("/activity").status_code == 401

    project = client.post("/projects", headers=owner, json={"name": "Release"})
    assert project.status_code == 201
    project_url = f"/projects/{project.json()['id']}"
    assert client.put(project_url, headers=other, json={"name": "Other name"}).status_code == 404
    edited = client.put(project_url, headers=owner, json={"name": "Release plan", "description": "Ready"})
    assert edited.status_code == 200
    assert client.get(project_url, headers=owner).json()["name"] == "Release plan"
    task = client.post(f"{project_url}/tasks", headers=owner, json={"title": "Review release"})
    assert task.status_code == 201
    task_url = f"/tasks/{task.json()['id']}"

    assert client.get("/tasks", headers=other).json() == []
    assert client.patch(task_url, headers=other, json={"status": "done"}).status_code == 404
    updated = client.patch(task_url, headers=owner, json={
        "status": "in_progress",
        "due_date": "2026-12-02T00:00:00Z",
    })
    assert updated.status_code == 200
    assert updated.json()["completed"] is False
    saved = client.get("/tasks", headers=owner).json()[0]
    assert saved["status"] == "in_progress"
    assert saved["due_date"].startswith("2026-12-02")

    description = client.patch(task_url, headers=owner, json={"description": "Review the notes"})
    assert description.status_code == 200
    assert client.get("/tasks", headers=owner).json()[0]["description"] == "Review the notes"
    project_id = project.json()["id"]
    assert client.post("/projects", headers=owner, json={"name": "Separate project"}).status_code == 201
    scoped = client.get(f"/activity?project_id={project_id}", headers=owner)
    assert scoped.status_code == 200
    assert [event["action"] for event in scoped.json()] == [
        "task_updated", "task_updated", "task_created", "project_updated", "project_created",
    ]
    assert client.get(f"/activity?project_id={project_id}", headers=other).status_code == 404
    assert client.patch(task_url, headers=owner, json={
        "status": "done", "completed": False,
    }).status_code == 422
    assert client.patch(task_url, headers=owner, json={"completed": True}).status_code == 200
    assert client.patch(task_url, headers=owner, json={"completed": True}).status_code == 200
    assert client.patch(task_url, headers=owner, json={"completed": False}).status_code == 200
    assert client.delete(task_url, headers=owner).status_code == 204
    assert client.delete(project_url, headers=owner).status_code == 204

    events = client.get("/activity", headers=owner).json()
    assert [event["action"] for event in events] == [
        "project_deleted", "task_deleted", "task_reopened", "task_completed",
        "project_created", "task_updated", "task_updated", "task_created", "project_updated", "project_created",
    ]
    assert all(event["created_at"] for event in events)
    assert client.get("/activity?kind=task&limit=1", headers=owner).json() == events[1:2]
    assert client.get("/activity?kind=project", headers=owner).json() == [events[0], events[4], *events[-2:]]
    assert client.get("/activity", headers=other).json() == []
