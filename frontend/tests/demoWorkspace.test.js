import assert from "node:assert/strict";
import test from "node:test";
import { createDemoWorkspace } from "../src/demoWorkspace.js";

test("demo project and task changes are isolated from a new session", async () => {
  const request = createDemoWorkspace();
  const project = await request("/projects", { method: "POST", body: { name: "Demo release" } });
  const task = await request(`/projects/${project.id}/tasks`, {
    method: "POST", body: { title: "Publish notes", priority: "high" },
  });
  const completed = await request(`/tasks/${task.id}`, {
    method: "PATCH", body: { status: "done", description: "Ready to ship" },
  });
  assert.equal(completed.completed, true);
  assert.equal((await request("/tasks")).find(item => item.id === task.id).description, "Ready to ship");

  const events = await request(`/activity?project_id=${project.id}`);
  assert.deepEqual(events.map(event => event.action), ["task_completed", "task_created", "project_created"]);

  const nextSession = createDemoWorkspace();
  assert.equal((await nextSession("/projects")).some(item => item.id === project.id), false);
  await request(`/projects/${project.id}`, { method: "DELETE" });
  assert.equal((await request("/tasks")).some(item => item.project_id === project.id), false);
});
