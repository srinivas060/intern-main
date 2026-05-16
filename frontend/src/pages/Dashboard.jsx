import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { isOverdue, formatDate, statusBadgeClass, avatarColor, initials } from '../utils';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/dashboard'),
      api.get('/tasks'),
      api.get('/projects'),
    ]).then(([s, t, p]) => {
      setStats(s.data);
      setTasks(t.data.slice(0, 6));
      setProjects(p.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner"><i className="ti ti-loader-2"></i></div>;

  const overdue = tasks.filter(t => isOverdue(t));

  return (
    <>
      <div className="topbar"><span className="topbar-title">Dashboard</span><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Welcome back, {user?.name}</span></div>
      <div className="content">
        <div className="grid-metrics">
          {[
            { label: 'Total Tasks', val: stats?.total || 0, color: 'var(--accent)' },
            { label: 'In Progress', val: stats?.in_progress || 0, color: '#185FA5' },
            { label: 'Completed', val: stats?.done || 0, color: 'var(--success)' },
            { label: 'Overdue', val: stats?.overdue || 0, color: 'var(--danger)' },
          ].map(m => (
            <div key={m.label} className="metric-card">
              <div className="metric-label">{m.label}</div>
              <div className="metric-val" style={{ color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="section-header"><h2>Recent Tasks</h2></div>
            {tasks.length ? tasks.map(t => <TaskRow key={t.id} task={t} />) : <div className="empty"><i className="ti ti-checkbox"></i>No tasks</div>}
          </div>
          <div className="card">
            <div className="section-header"><h2>Projects</h2></div>
            {projects.length ? projects.map(p => {
              const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
              return (
                <div key={p.id} style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            }) : <div className="empty">No projects</div>}
          </div>
        </div>

        {overdue.length > 0 && (
          <div className="card">
            <div className="section-header">
              <h2 style={{ color: 'var(--danger)' }}><i className="ti ti-alert-circle" style={{ marginRight: 4 }}></i>Overdue Tasks</h2>
            </div>
            {overdue.map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
      </div>
    </>
  );
}

function TaskRow({ task }) {
  const over = isOverdue(task);
  return (
    <div className="task-row">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13 }}>{task.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {task.project_name} · {formatDate(task.due_date)}
        </div>
      </div>
      {over && <span className="badge b-over">Overdue</span>}
      <span className={`badge ${statusBadgeClass(task.status)}`}>{task.status}</span>
      {task.assignee_name && (
        <div className={`avatar ${avatarColor(task.assignee_name)}`} style={{ width: 24, height: 24, fontSize: 10 }} title={task.assignee_name}>
          {initials(task.assignee_name)}
        </div>
      )}
    </div>
  );
}
