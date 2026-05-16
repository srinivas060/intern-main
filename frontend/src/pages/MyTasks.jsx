import React, { useEffect, useState } from 'react';
import api from '../api';
import { formatDate, statusBadgeClass, priorityBadgeClass, isOverdue } from '../utils';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/my').then(r => { setTasks(r.data); setLoading(false); });
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'todo') return t.status === 'Todo';
    if (filter === 'inprog') return t.status === 'In Progress';
    if (filter === 'done') return t.status === 'Done';
    if (filter === 'overdue') return isOverdue(t);
    return true;
  });

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">My Tasks</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tasks.length} total</span>
      </div>
      <div className="content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[['all','All'],['todo','Todo'],['inprog','In Progress'],['done','Done'],['overdue','Overdue']].map(([val,lbl]) => (
            <button key={val} className={`tab-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{lbl}</button>
          ))}
        </div>

        {loading ? (
          <div className="spinner"><i className="ti ti-loader-2"></i></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><i className="ti ti-checkbox"></i>No tasks here</div>
        ) : (
          <div className="card">
            {filtered.map(t => (
              <div key={t.id} className="task-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.project_name} · Due: {formatDate(t.due_date)}</div>
                </div>
                {isOverdue(t) && <span className="badge b-over">Overdue</span>}
                <span className={`badge ${priorityBadgeClass(t.priority)}`}>{t.priority}</span>
                <span className={`badge ${statusBadgeClass(t.status)}`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
