export function createDemoWorkspace() {
  const created_at = new Date().toISOString();
  const dueDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00Z`;
  };
  const projects = [
    { id: 1, name: "Launch a team handbook", description: "Give new teammates a single place to get started." },
    { id: 2, name: "Improve workspace onboarding", description: "Make the first visit easier to navigate." },
  ].map(project => ({ ...project, created_at, owner_id: 1, status: "active" }));
  const tasks = [
    { id: 1, project_id: 1, title: "Outline the handbook", status: "done", priority: "medium", due_date: dueDate(0) },
    { id: 2, project_id: 1, title: "Review the onboarding checklist", status: "in_progress", priority: "high", due_date: dueDate(2) },
    { id: 3, project_id: 2, title: "Draft a welcome walkthrough", status: "todo", priority: "low", due_date: dueDate(4) },
  ].map(task => ({ ...task, created_at, description: null, completed: task.status === "done" }));
  const activity = [];
  let nextProjectId = 3;
  let nextTaskId = 4;

  function record(action, subject, project_id) {
    activity.unshift({ id: activity.length + 1, action, subject, project_id, created_at: new Date().toISOString() });
  }

  projects.forEach(project => record("project_created", project.name, project.id));
  tasks.forEach(task => record("task_created", task.title, task.project_id));

  return async function request(path, { method = "GET", body, signal } = {}) {
    signal?.throwIfAborted();
    const [pathname, query] = path.split("?");
    const [, resource, identifier, child] = pathname.split("/");
    const id = Number(identifier);

    if (resource === "activity" && method === "GET") {
      const params = new URLSearchParams(query);
      const kind = params.get("kind");
      const projectId = params.get("project_id");
      return activity.filter(event =>
        (!kind || event.action.startsWith(`${kind}_`)) &&
        (!projectId || event.project_id === Number(projectId))
      ).slice(0, Number(params.get("limit") || 50));
    }

    if (pathname === "/projects" && method === "GET") return [...projects];
    if (pathname === "/tasks" && method === "GET") return [...tasks];

    if (pathname === "/projects" && method === "POST") {
      const project = { ...body, id: nextProjectId++, status: "active", owner_id: 1, created_at: new Date().toISOString() };
      projects.unshift(project);
      record("project_created", project.name, project.id);
      return project;
    }

    if (resource === "projects") {
      const index = projects.findIndex(project => project.id === id);
      if (index < 0) throw new Error("Project not found.");

      if (child === "tasks" && method === "POST") {
        const task = { ...body, id: nextTaskId++, project_id: id, status: "todo", completed: false, created_at: new Date().toISOString() };
        tasks.unshift(task);
        record("task_created", task.title, id);
        return task;
      }

      if (!child && method === "PUT") {
        projects[index] = { ...projects[index], ...body };
        record("project_updated", projects[index].name, id);
        return projects[index];
      }

      if (!child && method === "DELETE") {
        const [project] = projects.splice(index, 1);
        for (let index = tasks.length - 1; index >= 0; index--) {
          if (tasks[index].project_id === id) tasks.splice(index, 1);
        }
        record("project_deleted", project.name, id);
        return;
      }
    }

    if (resource === "tasks") {
      const index = tasks.findIndex(task => task.id === id);
      if (index < 0) throw new Error("Task not found.");
      const task = tasks[index];

      if (method === "PATCH") {
        const next = { ...task, ...body };
        next.completed = next.status === "done";
        tasks[index] = next;
        const action = next.completed === task.completed ? "task_updated"
          : next.completed ? "task_completed" : "task_reopened";
        record(action, next.title, next.project_id);
        return next;
      }
      if (method === "DELETE") {
        tasks.splice(index, 1);
        record("task_deleted", task.title, task.project_id);
        return;
      }
    }

    throw new Error("This action is unavailable in the demo.");
  };
}
