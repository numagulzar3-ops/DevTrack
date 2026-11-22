
import { useEffect, useState } from "react";
import "./ProjectsPage.css";

const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("devtrack_token");

function ProjectsPage({ onProjectCreated, onProjectDeleted, onProjectOpen, search = "" }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: controller.signal,
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to load projects.");
      if (!controller.signal.aborted) setProjects(data);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [retry]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create project.");
      }

      // Update the projects list
      setProjects((current) => [data, ...current]);

      // Notify App.jsx that a project was created
      if (onProjectCreated) {
        onProjectCreated(data);
      }

      setNewProject({ name: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project and its tasks?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Unable to delete project.");
      }

      setProjects((current) =>
        current.filter((project) => project.id !== projectId)
      );
      onProjectDeleted?.(projectId);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  };

  const visibleProjects = projects.filter(project =>
    `${project.name} ${project.description || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="projects-page">
      <section className="projects-hero">
        <div>
          <div className="projects-eyebrow">
            <span></span>
            YOUR WORKSPACE
          </div>

          <h1>My Projects</h1>

          <p>
            Bring your ideas together, organize your work,
            and keep everything moving.
          </p>
        </div>

        <button
          className="projects-create-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          <span>{showForm ? "×" : "＋"}</span>
          {showForm ? "Close form" : "Create project"}
        </button>
      </section>

      <section className="projects-summary">
        <div className="projects-summary-icon">▦</div>
        <div>
          <strong>{projects.length}</strong>
          <span>
            {projects.length === 1 ? "Project" : "Projects"} in your workspace
          </span>
        </div>
      </section>

      {showForm && (
        <section className="project-form-card">
          <div className="project-form-heading">
            <div>
              <h2>Create a new project</h2>
              <p>Give your next idea a place to grow.</p>
            </div>
            <span className="form-sparkle">✦</span>
          </div>

          <form onSubmit={handleCreateProject}>
            <label>
              Project name
              <input
                type="text"
                placeholder="e.g. Website Redesign"
                value={newProject.name}
                onChange={(event) =>
                  setNewProject({
                    ...newProject,
                    name: event.target.value,
                  })
                }
                minLength={2}
                maxLength={150}
                required
              />
            </label>

            <label>
              Description
              <textarea
                placeholder="What is this project about?"
                value={newProject.description}
                onChange={(event) =>
                  setNewProject({
                    ...newProject,
                    description: event.target.value,
                  })
                }
                rows={3}
              />
            </label>

            <div className="project-form-actions">
              <button
                type="button"
                className="project-cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="projects-create-button"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create project →"}
              </button>
            </div>
          </form>
        </section>
      )}

      {error && (
        <div className="projects-error">
          <span>!</span>
          {error}
          <button onClick={() => { setLoading(true); setError(""); setRetry(value => value + 1); }}>Try again</button>
        </div>
      )}

      <section className="projects-section-heading">
        <div>
          <h2>All projects</h2>
          <p>Your saved projects, all in one place.</p>
        </div>
        <span>{projects.length} total</span>
      </section>

      {loading ? (
        <div className="projects-state">
          <div className="projects-spinner"></div>
          <p>Loading your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">✦</div>
          <h2>Your workspace is ready for something great.</h2>
          <p>
            You haven't created any projects yet. Start with your
            first idea and build something amazing.
          </p>
          <button
            className="projects-create-button"
            onClick={() => setShowForm(true)}
          >
            ＋ Create your first project
          </button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <p className="projects-state">No projects match your search.</p>
      ) : (
        <div className="projects-card-grid">
          {visibleProjects.map((project, index) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <div className={`project-card-icon color-${index % 3}`}>
                  {project.name.charAt(0).toUpperCase()}
                </div>

                <button
                  className="project-delete-button"
                  title="Delete project"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => handleDeleteProject(project.id)}
                >
                  ⋯
                </button>
              </div>

              <div className="project-card-content">
                <span className="project-status">
                  <span></span>
                  {project.status}
                </span>

                <h3>{project.name}</h3>

                <p>
                  {project.description ||
                    "No description has been added yet."}
                </p>
              </div>

              <div className="project-card-footer">
                {onProjectOpen && <button className="project-open-button" onClick={() => onProjectOpen(project.id)}>Open project →</button>}
                <div className="project-owner">
                  <div className="project-owner-avatar">U</div>
                  <span>Owner #{project.owner_id}</span>
                </div>

                <span>
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
