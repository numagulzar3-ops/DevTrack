
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import ProjectsPage from "./ProjectsPage";
import { workspaceRequest } from "./workspaceApi";

const taskStatuses = { todo: "To Do", in_progress: "In Progress", done: "Done" };
const projectColors = ["purple", "blue", "orange", "green"];
const emptyTask = { title: "", projectId: "", priority: "medium", due: "" };

const team = [
  { name: "Numa Khan", role: "Administrator", email: "numa@example.com", initials: "NK", color: "purple" },
  { name: "Alex Smith", role: "Frontend Developer", email: "alex@example.com", initials: "AS", color: "blue" },
  { name: "Sarah Johnson", role: "UI/UX Designer", email: "sarah@example.com", initials: "SJ", color: "orange" },
  { name: "Daniel Lee", role: "Backend Developer", email: "daniel@example.com", initials: "DL", color: "green" },
];

const activityLabels = {
  project_updated: "You updated a project",
  project_created: "You created a project",
  project_deleted: "You deleted a project",
  task_created: "You created a task",
  task_updated: "You updated a task",
  task_completed: "You completed a task",
  task_reopened: "You reopened a task",
  task_deleted: "You deleted a task",
};

const navGroups = [
  { section: "WORKSPACE", items: [{ icon: "◫", name: "Overview" }, { icon: "▦", name: "My Projects" }, { icon: "☑", name: "My Tasks" }, { icon: "▤", name: "Calendar" }] },
  { section: "MANAGEMENT", items: [{ icon: "♙", name: "Team Members" }, { icon: "◷", name: "Activity" }] },
];

function Avatar({ initials, color = "purple" }) {
  return <div className={`avatar avatar-${color}`}>{initials}</div>;
}

function ProgressBar({ value, color = "purple" }) {
  return (
    <div className="progress-track">
      <div className={`progress-fill ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [projectRecords, setProjectRecords] = useState([]);
  const [taskRecords, setTaskRecords] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceRetry, setWorkspaceRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activityRevision, setActivityRevision] = useState(0);
  const [activityItems, setActivityItems] = useState([]);
  const [activityError, setActivityError] = useState("");
  const [activityKind, setActivityKind] = useState("");
  const [activityLoading, setActivityLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [search, setSearch] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [taskDraft, setTaskDraft] = useState(emptyTask);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [profileName, setProfileName] = useState("Numa Khan");
  const [profileEmail, setProfileEmail] = useState("numa@example.com");
  const [savedSettings, setSavedSettings] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([workspaceRequest("/projects", options), workspaceRequest("/tasks", options)])
      .then(([projects, tasks]) => {
        if (controller.signal.aborted) return;
        setProjectRecords(projects);
        setTaskRecords(tasks);
      })
      .catch(error => {
        if (!controller.signal.aborted) setWorkspaceError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setWorkspaceLoading(false);
      });
    return () => controller.abort();
  }, [workspaceRetry]);

  const projects = useMemo(() => projectRecords.map(project => {
    const projectTasks = taskRecords.filter(task => task.project_id === project.id);
    const completed = projectTasks.filter(task => task.completed).length;
    const total = projectTasks.length;
    return {
      ...project,
      category: "Project",
      status: project.status === "active" ? "In Progress" : project.status,
      color: projectColors[project.id % projectColors.length],
      tasks: total,
      completed,
      progress: total ? Math.round(completed / total * 100) : 0,
    };
  }), [projectRecords, taskRecords]);

  const selectedProject = projects.find(project => project.id === selectedProjectId);

  const tasks = useMemo(() => {
    const names = new Map(projectRecords.map(project => [project.id, project.name]));
    return taskRecords.map(task => ({
      ...task,
      project: names.get(task.project_id) || "Project",
      status: taskStatuses[task.status],
      priority: task.priority[0].toUpperCase() + task.priority.slice(1),
      due: task.due_date?.slice(0, 10) || "Not set",
    }));
  }, [projectRecords, taskRecords]);

  const completedTasks = tasks.filter(task => task.status === "Done").length;
  const pendingTasks = tasks.filter(task => task.status !== "Done").length;
  useEffect(() => {
    if (activePage !== "Overview" && activePage !== "Activity") return;

    const controller = new AbortController();
    const params = new URLSearchParams({ limit: activePage === "Overview" ? "3" : "50" });
    if (activePage === "Activity" && activityKind) params.set("kind", activityKind);

    async function loadActivity() {
      setActivityLoading(true);
      setActivityError("");
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/activity?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("devtrack_token")}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load activity.");
        const events = await response.json();
        if (!controller.signal.aborted) setActivityItems(events);
      } catch {
        if (!controller.signal.aborted) setActivityError("Unable to load activity.");
      } finally {
        if (!controller.signal.aborted) setActivityLoading(false);
      }
    }

    loadActivity();
    return () => controller.abort();
  }, [activePage, activityKind, activityRevision]);

  const today = new Date();
  const todayKey = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((value, index) => index ? String(value).padStart(2, "0") : value).join("-");
  const overdueTasks = tasks.filter(task => task.status !== "Done" && task.due_date && task.due < todayKey);
  const filteredTasks = tasks.filter(task =>
    (!projectFilter || String(task.project_id) === projectFilter) &&
    (taskFilter === "all" || (taskFilter === "overdue" ? overdueTasks.includes(task) : task.status === taskFilter)) &&
    `${task.title} ${task.project} ${task.priority}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  function renderTaskFilters() {
    return (
      <div className="task-filters">
        <label>Project <select value={projectFilter} onChange={event => setProjectFilter(event.target.value)}>
          <option value="">All projects</option>
          {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select></label>
        <label>Status <select value={taskFilter} onChange={event => setTaskFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="overdue">Overdue</option>
          {Object.values(taskStatuses).map(label => <option key={label}>{label}</option>)}
        </select></label>
      </div>
    );
  }

  async function saveWorkspaceChange(change) {
    setSaving(true);
    setSaveError("");
    try {
      await change();
      setActivityRevision(value => value + 1);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function projectCreated(project) {
    setProjectRecords(current => [project, ...current.filter(item => item.id !== project.id)]);
  }

  function projectDeleted(id) {
    setProjectFilter(current => current === String(id) ? "" : current);
    setProjectRecords(current => current.filter(project => project.id !== id));
    setTaskRecords(current => current.filter(task => task.project_id !== id));
  }

  function openProjectForm(project = null) {
    setSaveError("");
    setEditingProject(project?.id ?? null);
    setNewProject({ name: project?.name ?? "", description: project?.description ?? "" });
    setShowProjectModal(true);
  }

  function createProject(event) {
    event.preventDefault();
    saveWorkspaceChange(async () => {
      const project = await workspaceRequest(editingProject ? `/projects/${editingProject}` : "/projects", {
        method: editingProject ? "PUT" : "POST",
        body: { name: newProject.name.trim(), description: newProject.description.trim() || null },
      });
      projectCreated(project);
      setNewProject({ name: "", description: "" });
      setShowProjectModal(false);
    });
  }

  function openTaskForm(task = null) {
    setSaveError("");
    setEditingTask(task?.id ?? null);
    setTaskDraft(task ? {
      title: task.title,
      projectId: String(task.project_id),
      priority: task.priority.toLowerCase(),
      due: task.due_date?.slice(0, 10) || "",
    } : { ...emptyTask, projectId: String(selectedProject?.id ?? projects[0]?.id ?? "") });
    setShowTaskForm(true);
  }

  function createTask(event) {
    event.preventDefault();
    saveWorkspaceChange(async () => {
      const path = editingTask ? `/tasks/${editingTask}` : `/projects/${taskDraft.projectId}/tasks`;
      const task = await workspaceRequest(path, {
        method: editingTask ? "PATCH" : "POST",
        body: {
          title: taskDraft.title.trim(),
          priority: taskDraft.priority,
          due_date: taskDraft.due ? `${taskDraft.due}T00:00:00Z` : null,
        },
      });
      setTaskRecords(current => editingTask
        ? current.map(item => item.id === task.id ? task : item)
        : [task, ...current]);
      setShowTaskForm(false);
    });
  }

  function updateTaskStatus(id, label) {
    const status = Object.keys(taskStatuses).find(value => taskStatuses[value] === label);
    saveWorkspaceChange(async () => {
      const task = await workspaceRequest(`/tasks/${id}`, { method: "PATCH", body: { status } });
      setTaskRecords(current => current.map(item => item.id === id ? task : item));
    });
  }

  function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    saveWorkspaceChange(async () => {
      await workspaceRequest(`/tasks/${task.id}`, { method: "DELETE" });
      setTaskRecords(current => current.filter(item => item.id !== task.id));
    });
  }

  function openPage(page) {
    setActivePage(page);
    setSelectedProject(null);
    setSearch("");
  }

  function renderTask(task) {
    return (
      <div className="task-row" key={task.id}>
        <div className="task-row-main">
          <div className={`task-status-dot ${task.status.toLowerCase().replace(" ", "-")}`} />
          <div className="task-copy">
            <strong>{task.title}</strong>
            <span>{task.project} · Due {task.due}</span>
          </div>
        </div>
        <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
        <select
          className="status-select"
          disabled={saving}
          value={task.status}
          onChange={event => updateTaskStatus(task.id, event.target.value)}
          aria-label={`Status for ${task.title}`}
        >
          <option>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
        <div className="task-row-actions">
          <button type="button" className="secondary-button" disabled={saving} onClick={() => openTaskForm(task)}>Edit</button>
          <button type="button" className="secondary-button" disabled={saving} onClick={() => deleteTask(task)}>Delete</button>
        </div>
      </div>
    );
  }

  function renderProjects() {
    if (selectedProject) {
      const projectTasks = tasks.filter(task => task.project_id === selectedProject.id);
      return (
        <section className="page-section">
          <button className="back-button" onClick={() => setSelectedProject(null)}>← Back to projects</button>
          <div className="detail-header">
            <div className={`project-logo large ${selectedProject.color}`}>{selectedProject.name.slice(0, 2).toUpperCase()}</div>
            <div className="detail-title">
              <span className="eyebrow">PROJECT WORKSPACE</span>
              <h2>{selectedProject.name}</h2>
              <p>{selectedProject.description || selectedProject.category}</p>
            </div>
            <button className="secondary-button" disabled={saving} onClick={() => openProjectForm(selectedProject)}>Edit project</button>
          </div>
          <div className="stats-grid detail-stats">
            <div className="stat-card"><span className="stat-label">Completion</span><div className="stat-value">{selectedProject.progress}%</div><ProgressBar value={selectedProject.progress} color={selectedProject.color} /></div>
            <div className="stat-card"><span className="stat-label">Total tasks</span><div className="stat-value">{selectedProject.tasks}</div><span className="stat-note">Tasks in this project</span></div>
            <div className="stat-card"><span className="stat-label">Completed</span><div className="stat-value">{selectedProject.completed}</div><span className="stat-note">Successfully finished</span></div>
          </div>
          <div className="panel">
            <div className="panel-heading">
              <div><h2>Project tasks</h2><p>Track the work happening in this project.</p></div>
              <button className="primary-button small-button" disabled={saving} onClick={() => openTaskForm()}>＋ Add task</button>
            </div>
            {projectTasks.length ? projectTasks.map(renderTask) : <div className="empty-state">No tasks yet. Add your first task to get started.</div>}
          </div>
        </section>
      );
    }
  }

  function renderTasks() {
    return (
      <section className="page-section">
        <div className="page-intro">
          <div><span className="eyebrow">GET THINGS DONE</span><h2>My tasks</h2><p>All your tasks, organized in one place.</p></div>
          <button className="primary-button" onClick={() => openTaskForm()} disabled={saving || !projects.length}>＋ Add task</button>
        </div>
        <div className="project-summary-strip">
          <div><strong>{tasks.length}</strong><span>Total tasks</span></div>
          <div><strong>{tasks.filter(t => t.status === "In Progress").length}</strong><span>In progress</span></div>
          <div><strong>{completedTasks}</strong><span>Completed</span></div>
        </div>
        {renderTaskFilters()}
        <div className="panel task-table-panel">
          <div className="panel-heading"><div><h2>Task list</h2><p>Update task status directly from the list.</p></div></div>
          <div className="task-table-head"><span>TASK</span><span>PRIORITY</span><span>STATUS</span></div>
          {filteredTasks.map(renderTask)}
          {filteredTasks.length === 0 && <div className="empty-state">No tasks match your filters.</div>}
        </div>
      </section>
    );
  }
   function renderKanban() {
    const columns = ["To Do", "In Progress", "Done"];
    return (
      <section className="page-section">
        <div className="page-intro">
          <div><span className="eyebrow">TASK MANAGEMENT</span><h2>Task board</h2><p>See what needs doing, what's moving and what's finished.</p></div>
          <button className="primary-button" onClick={() => openTaskForm()} disabled={saving || !projects.length}>＋ Add task</button>
        </div>
        {renderTaskFilters()}
        <div className="kanban-board">
          {columns.map(column => {
            const columnTasks = filteredTasks.filter(task => task.status === column);
            return (
              <div className="kanban-column" key={column}>
                <div className="kanban-heading"><div><span className={`column-dot ${column.toLowerCase().replace(" ", "-")}`} /><strong>{column}</strong><span className="column-count">{columnTasks.length}</span></div></div>
                {columnTasks.map(task => (
                  <article className="kanban-card" key={task.id}>
                    <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <h3>{task.title}</h3>
                    <p>{task.project}</p>
                    <div className="kanban-card-bottom">
                      <span>◷ {task.due}</span>
                      <select disabled={saving} value={task.status} onChange={event => updateTaskStatus(task.id, event.target.value)} aria-label={`Move ${task.title}`}>
                        {columns.map(status => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                  </article>
                ))}
                {columnTasks.length === 0 && <div className="kanban-empty">No tasks here yet.</div>}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderCalendar() {
    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const monthName = current.toLocaleString("en-US", { month: "long", year: "numeric" });

    return (
      <section className="page-section">
        <div className="page-intro"><div><span className="eyebrow">PLAN YOUR WORK</span><h2>Calendar</h2><p>Keep track of upcoming deadlines and milestones.</p></div></div>
        <div className="panel calendar-panel">
          <div className="calendar-toolbar"><button onClick={() => setMonthOffset(v => v - 1)}>←</button><h3>{monthName}</h3><button onClick={() => setMonthOffset(v => v + 1)}>→</button><button className="today-button" onClick={() => setMonthOffset(0)}>Current month</button></div>
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div className="calendar-day-name" key={day}>{day}</div>)}
            {cells.map((day, index) => {
              const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dueTasks = day ? tasks.filter(task => task.due === date) : [];
              const isToday = day === today.getDate() && monthOffset === 0;
              return (
                <div className={`calendar-cell ${!day ? "blank" : ""}`} key={index}>
                  <span className={isToday ? "today-number" : ""}>{day || ""}</span>
                  {dueTasks.map(task => <div className="calendar-event" key={task.id}>{task.title}</div>)}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
    function renderSettings() {
    return (
      <section className="page-section">
        <div className="page-intro"><div><span className="eyebrow">PERSONALIZE YOUR SPACE</span><h2>Settings</h2><p>Manage your profile and workspace preferences.</p></div></div>
        <div className="panel settings-panel">
          <h3>Profile information</h3><p className="settings-description">Update the details associated with your workspace profile.</p>
          <form onSubmit={event => { event.preventDefault(); setSavedSettings(true); }}>
            <label>Full name<input value={profileName} onChange={event => setProfileName(event.target.value)} /></label>
            <label>Email address<input type="email" value={profileEmail} onChange={event => setProfileEmail(event.target.value)} /></label>
            <button className="primary-button" type="submit">Save changes</button>
            {savedSettings && <span className="saved-message">Your profile changes are saved in this session.</span>}
          </form>
        </div>
      </section>
    );
  }



function renderActivityItems() {
  if (activityLoading) return <p className="empty-state" role="status">Loading activity…</p>;
  if (activityError) return <p className="empty-state" role="alert">{activityError}</p>;
  if (!activityItems.length) return <p className="empty-state">No activity yet.</p>;

  return activityItems.map(item => (
    <div className="activity-item" key={item.id}>
      <div className="activity-copy">
        <p>{activityLabels[item.action] || "Workspace updated"}</p>
        <strong>{item.subject}</strong>
        <span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></span>
      </div>
    </div>
  ));
}

function renderActivity() {
  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <span className="eyebrow">WORKSPACE UPDATES</span>
          <h2>Activity</h2>
          <p>Stay up to date with everything happening in your workspace.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Everything happening in your workspace.</p>
          </div>
          <label>
            Filter activity{" "}
            <select value={activityKind} onChange={event => setActivityKind(event.target.value)}>
              <option value="">All activity</option>
              <option value="project">Projects</option>
              <option value="task">Tasks</option>
            </select>
          </label>
        </div>

        <div className="activity-list">{renderActivityItems()}</div>
      </div>
    </section>
  );
}





function renderOverview() {
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            DEVTRACK
          </div>
          <h1>
            Workspace overview
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your projects today.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => openProjectForm()}
        >
          ＋ New project
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total projects</span>
            <span className="stat-icon purple-bg">▦</span>
          </div>
          <div className="stat-value">{projects.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Tasks completed</span>
            <span className="stat-icon green-bg">✓</span>
          </div>
          <div className="stat-value">
            {completedTasks}
            <span className="stat-total"> / {tasks.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>In progress</span>
            <span className="stat-icon orange-bg">◷</span>
          </div>
          <div className="stat-value">
            {String(
              tasks.filter(t => t.status === "In Progress").length
            ).padStart(2, "0")}
          </div>
          <div className="stat-foot">
            <span className="neutral-trend">Active</span> across all projects
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Overdue tasks</span>
            <span className="stat-icon blue-bg">♙</span>
          </div>
          <div className="stat-value">{overdueTasks.length}</div>
          <div className="stat-foot">
            <button className="text-button" onClick={() => { openPage("My Tasks"); setProjectFilter(""); setTaskFilter("overdue"); }}>View overdue tasks →</button>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel projects-panel">
          <div className="panel-heading">
            <div>
              <h2>Projects overview</h2>
              <p>Keep track of your team's progress.</p>
            </div>
            <button
              className="text-button"
              onClick={() => openPage("My Projects")}
            >
              View all ↗
            </button>
          </div>

          {projects.slice(0, 3).map(project => (
            <div className="project-row" key={project.id}>
              <div className={`project-logo ${project.color}`}>
                {project.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="project-main">
                <div className="project-title-row">
                  <div>
                    <h3>{project.name}</h3>
                    <span>{project.category}</span>
                  </div>
                  <strong>{project.progress}%</strong>
                </div>

                <ProgressBar
                  value={project.progress}
                  color={project.color}
                />

                <div className="project-meta">
                  <span>
                    {project.completed}/{project.tasks} tasks completed
                  </span>
                  <span>{project.deadline || "No deadline"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DYNAMIC ACTIVITY SECTION */}
        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest workspace updates.</p>
            </div>
            <button className="more-button">···</button>
          </div>

          {renderActivityItems()}

          <button
            className="activity-link"
            onClick={() => openPage("Activity")}
          >
            View all activity →
          </button>
        </div>
      </section>

      <section className="content-grid lower-grid">
        <div className="panel tasks-panel">
          <div className="panel-heading">
            <div>
              <h2>My tasks</h2>
              <p>Your personal to-do list for today.</p>
            </div>
            <button
              className="text-button"
              onClick={() => openPage("My Tasks")}
            >
              View all ↗
            </button>
          </div>

          <div className="task-progress-line">
            <span>
              {completedTasks} of {tasks.length} tasks completed
            </span>
            <span>
              {Math.round(
                completedTasks / Math.max(tasks.length, 1) * 100
              )}%
            </span>
          </div>

          <ProgressBar
            value={completedTasks / Math.max(tasks.length, 1) * 100}
          />

          <div className="task-list">
            {tasks.slice(0, 4).map(task => (
              <div
                className={`task-item ${
                  task.status === "Done" ? "task-done" : ""
                }`}
                key={task.id}
              >
                <button
                  className={`task-check ${
                    task.status === "Done" ? "checked" : ""
                  }`}
                  disabled={saving}
                  aria-label={task.status === "Done" ? `Reopen ${task.title}` : `Complete ${task.title}`}
                  onClick={() =>
                    updateTaskStatus(
                      task.id,
                      task.status === "Done" ? "To Do" : "Done"
                    )
                  }
                >
                  {task.status === "Done" ? "✓" : ""}
                </button>

                <div className="task-copy">
                  <strong>{task.title}</strong>
                  <span>{task.project}</span>
                </div>

                <span
                  className={`priority priority-${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

      </section>
    </>
  );
}


function renderTeam() {
  return (
    <section className="page-section">
      <div className="page-intro">
        <div>
          <span className="eyebrow">PEOPLE & COLLABORATION</span>
          <h2>Team members</h2>
          <p>Meet the people working in your workspace.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => alert("Team invitations will be connected to the backend soon.")}
        >
          ＋ Invite member
        </button>
      </div>

      <div className="team-grid">
        {team.map(member => (
          <article className="team-card" key={member.email}>
            <Avatar initials={member.initials} color={member.color} />
            <h3>{member.name}</h3>
            <span className="team-role">{member.role}</span>
            <p>{member.email}</p>
            <span className="member-active">
              <i /> Workspace member
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}


  const pageContent = {
    "Overview": renderOverview,
    "My Projects": renderProjects,
    "My Tasks": renderTasks,
    "Task Board": renderKanban,
    "Calendar": renderCalendar,
    "Team Members": renderTeam,
    "Activity": renderActivity,
    "Settings": renderSettings,
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">D</div><span>dev<span className="brand-light">track</span></span></div>
        <div className="workspace-switcher"><div className="workspace-icon">N</div><div className="workspace-info"><strong>Numa's Workspace</strong><span>Free workspace</span></div><span className="switch-arrow">⌄</span></div>
        <nav className="side-navigation">
          {navGroups.map(group => <div className="nav-group" key={group.section}><p className="nav-heading">{group.section}</p>{group.items.map(item => <button key={item.name} className={`nav-link ${activePage === item.name ? "active" : ""}`} onClick={() => openPage(item.name)}><span className="nav-icon">{item.icon}</span>{item.name}{item.name === "My Tasks" && <span className="nav-count">{pendingTasks}</span>}</button>)}</div>)}
          <div className="nav-group"><p className="nav-heading">TOOLS</p><button className={`nav-link ${activePage === "Task Board" ? "active" : ""}`} onClick={() => openPage("Task Board")}><span className="nav-icon">▥</span>Kanban Board</button></div>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card"><div className="upgrade-sparkle">✦</div><strong>Make more progress</strong><p>Keep your projects organized and your team in sync.</p><button onClick={() => openPage("My Projects")}>Explore workspace ↗</button></div>
          <button className={`nav-link settings-link ${activePage === "Settings" ? "active" : ""}`} onClick={() => openPage("Settings")}><span className="nav-icon">⚙</span>Settings</button>
          <div className="profile"><Avatar initials="NK" /><div className="profile-info"><strong>{profileName}</strong><span>Administrator</span></div><span className="profile-menu">···</span></div>
        </div>
      </aside>

      <main className="main-content">
        {saveError && <p className="empty-state" role="alert">{saveError}</p>}
        {workspaceLoading && <p className="empty-state" role="status">Loading workspace…</p>}
        {workspaceError && <div className="empty-state" role="alert">
          {workspaceError} <button onClick={() => {
            setWorkspaceError("");
            setWorkspaceLoading(true);
            setWorkspaceRetry(value => value + 1);
          }}>Retry</button>
        </div>}
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{selectedProject ? selectedProject.name : activePage}</strong></div>
          {["My Projects", "My Tasks", "Task Board"].includes(activePage) && !selectedProject && (
            <div className="topbar-actions">
              <div className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search this page" placeholder="Search this page" value={search} onChange={event => setSearch(event.target.value)} /></div>
            </div>
          )}
        </header>

        {workspaceLoading || workspaceError ? null : activePage === "My Projects" && !selectedProject ? (
          <ProjectsPage onProjectCreated={projectCreated} onProjectDeleted={projectDeleted}
            onProjectOpen={setSelectedProject} search={search} />
        ) : (
          <div className="dashboard">
            {pageContent[activePage]
              ? pageContent[activePage]()
              : renderOverview()}

            <footer className="dashboard-footer">
              <span>© 2026 DevTrack. Built to keep great work moving.</span>
              <span>
                Made with focus <span className="footer-heart">✦</span>
              </span>
            </footer>
          </div>
        )}
      </main>


      {showProjectModal && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createProject}>
            <h2>{editingProject ? "Edit project" : "Create a project"}</h2>
            {saveError && <p role="alert">{saveError}</p>}
            <label>Project name<input required minLength={2} maxLength={150} autoFocus
              value={newProject.name} onChange={event => setNewProject({ ...newProject, name: event.target.value })} /></label>
            <label>Description<textarea value={newProject.description}
              onChange={event => setNewProject({ ...newProject, description: event.target.value })} /></label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" disabled={saving}
                onClick={() => { setShowProjectModal(false); setSaveError(""); }}>Cancel</button>
              <button className="primary-button" disabled={saving}>{editingProject ? "Save project" : "Create project"}</button>
            </div>
          </form>
        </div>
      )}
      {showTaskForm && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={createTask}>
            <h2>{editingTask ? "Edit task" : "Create a task"}</h2>
            {saveError && <p role="alert">{saveError}</p>}
            <label>Task title<input required minLength={2} maxLength={200} autoFocus value={taskDraft.title}
              onChange={event => setTaskDraft({ ...taskDraft, title: event.target.value })} /></label>
            <label>Project<select required disabled={Boolean(editingTask)} value={taskDraft.projectId}
              onChange={event => setTaskDraft({ ...taskDraft, projectId: event.target.value })}>
              {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select></label>
            <label>Priority<select value={taskDraft.priority}
              onChange={event => setTaskDraft({ ...taskDraft, priority: event.target.value })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select></label>
            <label>Due date<input type="date" value={taskDraft.due}
              onChange={event => setTaskDraft({ ...taskDraft, due: event.target.value })} /></label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" disabled={saving}
                onClick={() => { setShowTaskForm(false); setSaveError(""); }}>Cancel</button>
              <button className="primary-button" disabled={saving}>{editingTask ? "Save task" : "Create task"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;