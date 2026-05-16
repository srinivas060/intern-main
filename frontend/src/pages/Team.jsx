import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { avatarColor, initials } from '../utils';
import Modal from '../components/Modal';

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const loadUsers = () => api.get('/auth/users').then(r => { setUsers(r.data); setLoading(false); });
  useEffect(() => { loadUsers(); }, []);

  const toggleRole = async (u) => {
    const newRole = u.role === 'Admin' ? 'Member' : 'Admin';
    await api.patch(`/auth/users/${u.id}/role`, { role: newRole });
    loadUsers();
  };

  if (user.role !== 'Admin') return (
    <>
      <div className="topbar"><span className="topbar-title">Team</span></div>
      <div className="content"><div className="empty"><i className="ti ti-lock"></i>Admin access required</div></div>
    </>
  );

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Team</span>
        <button className="btn btn-sm btn-primary" onClick={() => setShowInvite(true)}><i className="ti ti-plus"></i>Invite User</button>
      </div>
      <div className="content">
        {loading ? <div className="spinner"><i className="ti ti-loader-2"></i></div> : (
          <div className="team-grid">
            {users.map(u => (
              <div key={u.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className={`avatar ${avatarColor(u.name)}`} style={{ width: 40, height: 40, fontSize: 15 }}>{initials(u.name)}</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.name}{u.id === user.id && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>(you)</span>}</div>
                    <span className={`badge ${u.role === 'Admin' ? 'b-admin' : 'b-member'}`}>{u.role}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{u.email}</div>
                {u.id !== user.id && (
                  <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => toggleRole(u)}>
                    {u.role === 'Admin' ? 'Make Member' : 'Make Admin'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onCreated={() => { loadUsers(); setShowInvite(false); }} />}
    </>
  );
}

function InviteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: 'password123', role: 'Member' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr('');
    try { await api.post('/auth/register', form); onCreated(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); } finally { setLoading(false); }
  };

  return (
    <Modal title="Invite User" icon="user-plus" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
        <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
        <div className="form-group"><label>Temporary Password</label><input type="password" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
        <div className="form-group"><label>Role</label><select value={form.role} onChange={e => set('role', e.target.value)}><option>Member</option><option>Admin</option></select></div>
        {err && <div className="error-msg">{err}</div>}
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>Invite</button>
        </div>
      </form>
    </Modal>
  );
}
