import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { avatarColor, initials, isOverdue, formatDate, statusBadgeClass, priorityBadgeClass } from '../utils';
import Modal from '../components/Modal';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProj, setShowNewProj] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  const loadProjects = () => api.get('/projects').then(r => { setProjects(r.data); setLoading(false); });
  useEffect(() => {
    loadProjects();
    if (user.role === 'Admin') api.get('/auth/users').then(r => setUsers(r.data));
  }, []);

  const openProject = async (p) => {
    setSelected(p);
    const r = await api.get(`/tasks/project/${p.id}`);
    setTasks(r.data);
  };

  const changeTaskStatus = async (task) => {
    const order = ['Todo', 'In Progress', 'Done'];
    const next = order[(order.indexOf(task.status) + 1) % 3];
    await api.patch(`/tasks/${task.id}`, { status: next });
    const r = await api.get(`/tasks/project/${selected.id}`);
    setTasks(r.data);
  };

  if (loading) return <div className="spinner"><i className="ti ti-loader-2"></i></div>;

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">{selected ? selected.name : 'Projects'}</span>
        {selected ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => setSelected(null)}><i className="ti ti-arrow-left"></i>Back</button>
            {user.role === 'Admin' && <button className="btn btn-sm btn-primary" onClick={() => setShowNewTask(true)}><i className="ti ti-plus"></i>Add task</button>}
          </div>
        ) : (
          user.role === 'Admin' && <button className="btn btn-sm btn-primary" onClick={() => setShowNewProj(true)}><i className="ti ti-plus"></i>New Project</button>
        )}
      </div>
      <div className="content">
        {!selected ? (
          <>
            {projects.length === 0 && <div className="empty"><i className="ti ti-folder"></i>No projects yet</div>}
            <div className="proj-grid">
              {projects.map(p => {
                const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
                return (
                  <div key={p.id} className="card card-hover" onClick={() => openProject(p)}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>{p.description || 'No description'}</div>
                    <div style={{ display: 'flex', gap: -4, marginBottom: 8 }}>
                      {(p.members || []).slice(0, 4).map(m => (
                        <div key={m.id} className={`avatar ${avatarColor(m.name)}`} style={{ width: 24, height: 24, fontSize: 10, marginRight: -6, border: '2px solid var(--bg-card)' }} title={m.name}>{initials(m.name)}</div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      <span>{p.task_count} tasks</span><span>{pct}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }}></div></div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Team:</span>
              {(selected.members || []).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className={`avatar ${avatarColor(m.name)}`} style={{ width: 24, height: 24, fontSize: 10 }}>{initials(m.name)}</div>
                  <span style={{ fontSize: 12 }}>{m.name}</span>
                  <span className={`badge ${m.role === 'Admin' ? 'b-admin' : 'b-member'}`} style={{ fontSize: 10 }}>{m.role}</span>
                </div>
              ))}
            </div>
            <div className="grid-3">
              {['Todo', 'In Progress', 'Done'].map(col => {
                const colTasks = tasks.filter(t => t.status === col);
                return (
                  <div key={col} className="card kanban-col">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className={`badge ${statusBadgeClass(col)}`}>{col}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{colTasks.length}</span>
                    </div>
                    {colTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: 16 }}>Empty</div>}
                    {colTasks.map(t => (
                      <div key={t.id} className={`kanban-card pri-${t.priority?.toLowerCase()}`}>
                        <div style={{ fontSize: 13, marginBottom: 6 }}>{t.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {t.assignee_name && (
                            <div className={`avatar ${avatarColor(t.assignee_name)}`} style={{ width: 22, height: 22, fontSize: 10 }} title={t.assignee_name}>{initials(t.assignee_name)}</div>
                          )}
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
                            {isOverdue(t) && <span className="badge b-over" style={{ fontSize: 10 }}>Late</span>}
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDate(t.due_date)}</span>
                            {user.role === 'Admin' && (
                              <button className="btn btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => changeTaskStatus(t)}>
                                Move →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showNewProj && (
        <NewProjectModal
          users={users}
          currentUser={user}
          onClose={() => setShowNewProj(false)}
          onCreated={() => { loadProjects(); setShowNewProj(false); }}
        />
      )}
      {showNewTask && selected && (
        <NewTaskModal
          project={selected}
          onClose={() => setShowNewTask(false)}
          onCreated={async () => {
            const r = await api.get(`/tasks/project/${selected.id}`);
            setTasks(r.data);
            setShowNewTask(false);
          }}
        />
      )}
    </>
  );
}

function NewProjectModal({ users, currentUser, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', memberIds: [currentUser.id] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr('');
    try {
      await api.post('/projects', form);
      onCreated();
    } catch (e) { setErr(e.response?.data?.error || 'Error'); } finally { setLoading(false); }
  };

  return (
    <Modal title="New Project" icon="folder" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group"><label>Project Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Website Redesign" /></div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this project about?" /></div>
        <div className="form-group">
          <label>Members (Ctrl+click to multi-select)</label>
          <select multiple value={form.memberIds.map(String)} onChange={e => set('memberIds', Array.from(e.target.selectedOptions, o => parseInt(o.value)))}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
        {err && <div className="error-msg">{err}</div>}
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>Create</button>
        </div>
      </form>
    </Modal>
  );
}

function NewTaskModal({ project, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', status: 'Todo', priority: 'Medium', assigneeId: '', dueDate: '', projectId: project.id });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr('');
    try { await api.post('/tasks', { ...form, assigneeId: form.assigneeId ? parseInt(form.assigneeId) : null }); onCreated(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); } finally { setLoading(false); }
  };

  return (
    <Modal title="Add Task" icon="plus" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group"><label>Title</label><input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Task title" /></div>
        <div className="form-group">
          <label>Assignee</label>
          <select value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
            <option value="">Unassigned</option>
            {(project.members || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {['Todo','In Progress','Done'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
        {err && <div className="error-msg">{err}</div>}
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>Add Task</button>
        </div>
      </form>
    </Modal>
  );
}
