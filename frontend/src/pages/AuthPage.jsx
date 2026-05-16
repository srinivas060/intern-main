import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'admin@demo.com', password: 'password', role: 'Member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password, form.role);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="ti ti-layout-kanban"></i>
          TaskFlow
        </div>
        <div className="auth-tabs">
          <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Sign in</button>
          <button className={`tab-btn ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>Sign up</button>
        </div>

        <form onSubmit={submit}>
          {tab === 'signup' && (
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
          </div>
          {tab === 'signup' && (
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}
          {tab === 'login' && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Demo: admin@demo.com / member@demo.com (password: password)
            </p>
          )}
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}></i> : null}
            {tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
