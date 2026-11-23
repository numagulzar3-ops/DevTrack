import { useEffect, useRef } from "react";

export default function TaskPanel({ editing, draft, setDraft, projects, statuses, saving, error, onSubmit, onClose }) {
  const dialog = useRef(null);

  useEffect(() => {
    const panel = dialog.current;
    panel.showModal();
    return () => panel.close();
  }, []);

  return (
    <dialog ref={dialog} className="modal task-panel" aria-labelledby="task-panel-title"
      onCancel={event => {
        event.preventDefault();
        if (!saving) onClose();
      }}>
      <form onSubmit={onSubmit}>
        <div className="task-panel-heading">
          <h2 id="task-panel-title">{editing ? "Task details" : "Create a task"}</h2>
          <button type="button" className="secondary-button" aria-label="Close task panel"
            disabled={saving} onClick={onClose}>×</button>
        </div>
        {error && <p role="alert">{error}</p>}
        <label>Task title<input required minLength={2} maxLength={200} autoFocus value={draft.title}
          onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
        <label>Description<textarea rows={4} value={draft.description}
          onChange={event => setDraft({ ...draft, description: event.target.value })} /></label>
        <label>Project<select required disabled={editing} value={draft.projectId}
          onChange={event => setDraft({ ...draft, projectId: event.target.value })}>
          {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select></label>
        {editing && <label>Status<select value={draft.status}
          onChange={event => setDraft({ ...draft, status: event.target.value })}>
          {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>}
        <label>Priority<select value={draft.priority}
          onChange={event => setDraft({ ...draft, priority: event.target.value })}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select></label>
        <label>Due date<input type="date" value={draft.due}
          onChange={event => setDraft({ ...draft, due: event.target.value })} /></label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={saving}>{editing ? "Save task" : "Create task"}</button>
        </div>
      </form>
    </dialog>
  );
}
