
import { useMemo, useState } from "react";
import "./App.css";
import ProjectsPage from "./ProjectsPage";

const initialProjects = [
  { id: 1, name: "DevTrack Platform", category: "Product Development", description: "Building a modern project and issue management platform.", progress: 72, color: "purple", tasks: 25, completed: 18, deadline: "December 15, 2026", status: "In Progress" },
  { id: 2, name: "Website Redesign", category: "Design & Development", description: "Refreshing the company website and user experience.", progress: 48, color: "blue", tasks: 25, completed: 12, deadline: "December 22, 2026", status: "In Progress" },
  { id: 3, name: "Mobile App", category: "Application", description: "Developing a responsive mobile application.", progress: 86, color: "orange", tasks: 28, completed: 24, deadline: "December 8, 2026", status: "In Progress" },
];

const initialTasks = [
  { id: 1, title: "Design the dashboard interface", project: "Website Redesign", priority: "High", status: "Done", due: "Nov 23" },
  { id: 2, title: "Set up authentication API", project: "DevTrack Platform", priority: "High", status: "In Progress", due: "Nov 25" },
  { id: 3, title: "Review mobile responsiveness", project: "Mobile App", priority: "Medium", status: "To Do", due: "Nov 26" },
  { id: 4, title: "Prepare project documentation", project: "DevTrack Platform", priority: "Low", status: "To Do", due: "Nov 28" },
  { id: 5, title: "Create database models", project: "DevTrack Platform", priority: "High", status: "In Progress", due: "Nov 29" },
  { id: 6, title: "Test registration flow", project: "DevTrack Platform", priority: "Medium", status: "Done", due: "Nov 20" },
];

const team = [
  { name: "Numa Khan", role: "Administrator", email: "numa@example.com", initials: "NK", color: "purple" },
  { name: "Alex Smith", role: "Frontend Developer", email: "alex@example.com", initials: "AS", color: "blue" },
  { name: "Sarah Johnson", role: "UI/UX Designer", email: "sarah@example.com", initials: "SJ", color: "orange" },
  { name: "Daniel Lee", role: "Backend Developer", email: "daniel@example.com", initials: "DL", color: "green" },
];

const initialActivity = [
  { initials: "NK", color: "purple", title: "You created a new task", detail: "Set up authentication API", time: "10 minutes ago" },
  { initials: "AS", color: "blue", title: "Alex updated a project", detail: "Website Redesign", time: "1 hour ago" },
  { initials: "NK", color: "orange", title: "You completed a task", detail: "Design the dashboard interface", time: "3 hours ago" },
  { initials: "SJ", color: "green", title: "Sarah joined the workspace", detail: "Team Members", time: "Yesterday" },
];

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
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [activityItems, setActivityItems] = useState(initialActivity);
  const [search, setSearch] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: "", category: "Product Development", description: "", deadline: "" });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("DevTrack Platform");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [profileName, setProfileName] = useState("Numa Khan");
  const [profileEmail, setProfileEmail] = useState("numa@example.com");
  const [savedSettings, setSavedSettings] = useState(false);

  const completedTasks = tasks.filter(task => task.status === "Done").length;
  const pendingTasks = tasks.filter(task => task.status !== "Done").length;
  function addActivity(title, detail, color = "purple") {
  const newActivity = {
    id: Date.now(),
    initials: "NK",
    color,
    title,
    detail,
    time: "Just now",
  };

  setActivityItems(current => [newActivity, ...current]);
}

  const filteredProjects = useMemo(
    () => projects.filter(project =>
      `${project.name} ${project.category}`.toLowerCase().includes(search.toLowerCase())
    ),
    [projects, search]
  );

  const filteredTasks = useMemo(
    () => tasks.filter(task =>
      `${task.title} ${task.project} ${task.priority}`.toLowerCase().includes(search.toLowerCase())
    ),
    [tasks, search]
  );

  function createProject(event) {
    event.preventDefault();
    if (!newProject.name.trim()) return;

    const project = {
      ...newProject,
      id: Date.now(),
      progress: 0,
      color: ["purple", "blue", "orange", "green"][projects.length % 4],
      tasks: 0,
      completed: 0,
      status: "In Progress",
    };

    setProjects(current => [...current, project]);
    addActivity("You created a new project", project.name, project.color);
    setNewProject({ name: "", category: "Product Development", description: "", deadline: "" });
    setShowProjectModal(false);
  }

  function createTask(event) {
    event.preventDefault();
    if (!newTaskTitle.trim()) return;

    setTasks(current => [
      ...current,
      {
        id: Date.now(),
        title: newTaskTitle,
        project: newTaskProject,
        priority: newTaskPriority,
        status: "To Do",
        due: "Not set",
      },
    ]);
    addActivity("You created a new task", newTaskTitle, "blue");

    setNewTaskTitle("");
    setShowTaskForm(false);
  }


function updateTaskStatus(id, status) {
  const previousTask = tasks.find(task => task.id === id);

  if (!previousTask || previousTask.status === status) return;

  setTasks(current =>
    current.map(task =>
      task.id === id ? { ...task, status } : task
    )
  );

  setProjects(current => current.map(project => {
    const projectTasks = tasks.filter(
      task => task.project === project.name
    );

    if (!projectTasks.length) return project;

    const completed = projectTasks.filter(task =>
      task.id === id ? status === "Done" : task.status === "Done"
    ).length;

    const total = projectTasks.length;

    return {
      ...project,
      completed,
      tasks: total,
      progress: Math.round((completed / total) * 100),
    };
  }));

  addActivity(
    status === "Done" ? "You completed a task" : "You updated a task",
    `${previousTask.title} · ${status}`,
    status === "Done" ? "green" : "orange"
  );
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
          value={task.status}
          onChange={event => updateTaskStatus(task.id, event.target.value)}
          aria-label={`Status for ${task.title}`}
        >
          <option>To Do</option>
          <option>In Progress</option>
          <option>Done</option>
        </select>
      </div>
    );
  }

  function renderProjects() {
    if (selectedProject) {
      const projectTasks = tasks.filter(task => task.project === selectedProject.name);
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
            <span className="project-status">{selectedProject.status}</span>
          </div>
          <div className="stats-grid detail-stats">
            <div className="stat-card"><span className="stat-label">Completion</span><div className="stat-value">{selectedProject.progress}%</div><ProgressBar value={selectedProject.progress} color={selectedProject.color} /></div>
            <div className="stat-card"><span className="stat-label">Total tasks</span><div className="stat-value">{selectedProject.tasks}</div><span className="stat-note">Tasks in this project</span></div>
            <div className="stat-card"><span className="stat-label">Completed</span><div className="stat-value">{selectedProject.completed}</div><span className="stat-note">Successfully finished</span></div>
            <div className="stat-card"><span className="stat-label">Deadline</span><div className="deadline-value">{selectedProject.deadline || "Not set"}</div><span className="stat-note">Target completion</span></div>
          </div>
          <div className="panel">
            <div className="panel-heading">
              <div><h2>Project tasks</h2><p>Track the work happening in this project.</p></div>
              <button className="primary-button small-button" onClick={() => { setNewTaskProject(selectedProject.name); setShowTaskForm(true); }}>＋ Add task</button>
            </div>
            {projectTasks.length ? projectTasks.map(renderTask) : <div className="empty-state">No tasks yet. Add your first task to get started.</div>}
          </div>
        </section>
      );
    }
     return (
      <section className="page-section">
        <div className="page-intro">
          <div><span className="eyebrow">YOUR WORKSPACE</span><h2>All projects</h2><p>Organize your work and keep every project moving.</p></div>
          <button className="primary-button" onClick={() => setShowProjectModal(true)}>＋ New project</button>
        </div>
        <div className="project-summary-strip">
          <div><strong>{projects.length}</strong><span>Total projects</span></div>
          <div><strong>{projects.filter(p => p.status === "In Progress").length}</strong><span>In progress</span></div>
          <div><strong>{projects.filter(p => p.progress === 100).length}</strong><span>Completed</span></div>
        </div>
        <div className="project-card-grid">
          {filteredProjects.map(project => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <div className={`project-logo ${project.color}`}>{project.name.slice(0, 2).toUpperCase()}</div>
                <span className="project-menu">···</span>
              </div>
              <span className="project-category">{project.category}</span>
              <h3>{project.name}</h3>
              <p className="project-description">{project.description || "A new project in your workspace."}</p>
              <div className="project-progress-label"><span>Progress</span><strong>{project.progress}%</strong></div>
              <ProgressBar value={project.progress} color={project.color} />
              <div className="project-card-footer"><span>{project.completed}/{project.tasks} tasks</span><span>{project.deadline || "No deadline"}</span></div>
              <button className="project-open-button" onClick={() => setSelectedProject(project)}>Open project →</button>
            </article>
          ))}
          <button className="add-project-card" onClick={() => setShowProjectModal(true)}>
            <span className="add-project-icon">＋</span>
            <strong>Create a new project</strong>
            <span>Start organizing your next big idea.</span>
          </button>
        </div>
        {filteredProjects.length === 0 && <div className="empty-state">No projects match your search.</div>}
      </section>
    );
  }

  function renderTasks() {
    return (
      <section className="page-section">
        <div className="page-intro">
          <div><span className="eyebrow">GET THINGS DONE</span><h2>My tasks</h2><p>All your tasks, organized in one place.</p></div>
          <button className="primary-button" onClick={() => setShowTaskForm(true)}>＋ Add task</button>
        </div>
        <div className="project-summary-strip">
          <div><strong>{tasks.length}</strong><span>Total tasks</span></div>
          <div><strong>{tasks.filter(t => t.status === "In Progress").length}</strong><span>In progress</span></div>
          <div><strong>{completedTasks}</strong><span>Completed</span></div>
        </div>
        <div className="panel task-table-panel">
          <div className="panel-heading"><div><h2>Task list</h2><p>Update task status directly from the list.</p></div></div>
          <div className="task-table-head"><span>TASK</span><span>PRIORITY</span><span>STATUS</span></div>
          {filteredTasks.map(renderTask)}
          {filteredTasks.length === 0 && <div className="empty-state">No tasks match your search.</div>}
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
          <button className="primary-button" onClick={() => setShowTaskForm(true)}>＋ Add task</button>
        </div>
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
                      <select value={task.status} onChange={event => updateTaskStatus(task.id, event.target.value)} aria-label={`Move ${task.title}`}>
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
    const current = new Date(2026, 10 + monthOffset, 1);
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
              const hasTasks = day && tasks.some(task => Number(task.due.split(" ")[1]) === day && month === 10 && year === 2026);
              return <div className={`calendar-cell ${!day ? "blank" : ""}`} key={index}><span className={day === 21 && month === 10 && year === 2026 ? "today-number" : ""}>{day || ""}</span>{hasTasks && <div className="calendar-event">Task deadline</div>}</div>;
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
          <span className="week-label">
            {activityItems.length} updates
          </span>
        </div>

        <div className="activity-list">
          {activityItems.map(item => (
            <div className="activity-item" key={item.id}>
              <Avatar
                initials={item.initials}
                color={item.color}
              />

              <div className="activity-copy">
                <p>{item.title}</p>
                <strong>{item.detail}</strong>
                <span>{item.time}</span>
              </div>
            </div>
          ))}

          {activityItems.length === 0 && (
            <div className="empty-state">
              No activity yet. Start by creating a project or task!
            </div>
          )}
        </div>
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
            <span className="live-dot" /> YOUR WORKSPACE AT A GLANCE
          </div>
          <h1>
            Good evening, Numa <span className="wave">✦</span>
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your projects today.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowProjectModal(true)}
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
          <div className="stat-value">{projects.length + 9}</div>
          <div className="stat-foot">
            <span className="trend">↗ 12%</span> vs. last month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Tasks completed</span>
            <span className="stat-icon green-bg">✓</span>
          </div>
          <div className="stat-value">
            {completedTasks + 38}
            <span className="stat-total"> / 60</span>
          </div>
          <div className="stat-foot">
            <span className="trend">↗ 8.4%</span> vs. last month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>In progress</span>
            <span className="stat-icon orange-bg">◷</span>
          </div>
          <div className="stat-value">
            {String(
              tasks.filter(t => t.status === "In Progress").length + 6
            ).padStart(2, "0")}
          </div>
          <div className="stat-foot">
            <span className="neutral-trend">Active</span> across all projects
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Team members</span>
            <span className="stat-icon blue-bg">♙</span>
          </div>
          <div className="stat-value">06</div>
          <div className="stat-foot">
            <span className="neutral-trend">Your team</span> collaborating today
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

          {activityItems.slice(0, 3).map(item => (
            <div className="activity-item" key={item.id}>
              <Avatar
                initials={item.initials}
                color={item.color}
              />

              <div className="activity-copy">
                <p>{item.title}</p>
                <strong>{item.detail}</strong>
                <span>{item.time}</span>
              </div>
            </div>
          ))}

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

        <div className="panel productivity-panel">
          <div className="panel-heading">
            <div>
              <h2>Weekly productivity</h2>
              <p>Your activity this week.</p>
            </div>
            <span className="week-label">This week⌄</span>
          </div>

          <div className="chart-summary">
            <strong>
              34 <span>tasks</span>
            </strong>
            <span className="trend">↗ 16.8%</span>
          </div>

          <div className="chart">
            {[42, 68, 52, 88, 62, 100, 74].map((height, index) => (
              <div className="chart-column" key={index}>
                <div className="chart-bar-wrap">
                  <div
                    className={`chart-bar ${
                      index === 5 ? "highlight-bar" : ""
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
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
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{selectedProject ? selectedProject.name : activePage}</strong></div>
          <div className="topbar-actions"><div className="search-box"><span>⌕</span><input placeholder="Search anything..." value={search} onChange={event => setSearch(event.target.value)} /><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Help">?</button><button className="icon-button notification-button" aria-label="Notifications">♧<span className="notification-dot" /></button><Avatar initials="NK" /></div>
        </header>

        {activePage === "My Projects" ? (
          <ProjectsPage
  onProjectCreated={(project) =>
    addActivity(
      "You created a new project",
      project.name,
      "purple"
    )
  }
/>
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


      {showProjectModal && <div className="modal-backdrop" onClick={() => setShowProjectModal(false)}><form className="modal" onSubmit={createProject} onClick={event => event.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">WORKSPACE</span><h2>Create a project</h2><p>Give your next idea a place to grow.</p></div><button type="button" className="modal-close" onClick={() => setShowProjectModal(false)}>×</button></div><label>Project name<input required autoFocus placeholder="e.g. Customer Portal" value={newProject.name} onChange={event => setNewProject({ ...newProject, name: event.target.value })} /></label><label>Category<select value={newProject.category} onChange={event => setNewProject({ ...newProject, category: event.target.value })}><option>Product Development</option><option>Design & Development</option><option>Marketing</option><option>Research</option><option>Application</option></select></label><label>Description<textarea placeholder="What is this project about?" value={newProject.description} onChange={event => setNewProject({ ...newProject, description: event.target.value })} /></label><label>Deadline<input type="date" value={newProject.deadline} onChange={event => setNewProject({ ...newProject, deadline: event.target.value })} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowProjectModal(false)}>Cancel</button><button className="primary-button" type="submit">Create project</button></div></form></div>}

      {showTaskForm && <div className="modal-backdrop" onClick={() => setShowTaskForm(false)}><form className="modal" onSubmit={createTask} onClick={event => event.stopPropagation()}><div className="modal-heading"><div><span className="eyebrow">TASK MANAGEMENT</span><h2>Create a task</h2><p>Add a new item to your team's workflow.</p></div><button type="button" className="modal-close" onClick={() => setShowTaskForm(false)}>×</button></div><label>Task title<input required autoFocus placeholder="What needs to be done?" value={newTaskTitle} onChange={event => setNewTaskTitle(event.target.value)} /></label><label>Project<select value={newTaskProject} onChange={event => setNewTaskProject(event.target.value)}>{projects.map(project => <option key={project.id}>{project.name}</option>)}</select></label><label>Priority<select value={newTaskPriority} onChange={event => setNewTaskPriority(event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowTaskForm(false)}>Cancel</button><button className="primary-button" type="submit">Create task</button></div></form></div>}
    </div>
  );
}

export default App;