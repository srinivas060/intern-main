import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { avatarColor, initials } from '../utils';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <i className="ti ti-layout-kanban"></i>
          TaskFlow
        </div>
        <div className="sidebar-nav">
          <div className="nav-label">Menu</div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-dashboard"></i> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-folder"></i> Projects
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-checkbox"></i> My Tasks
          </NavLink>
          {user?.role === 'Admin' && (
            <NavLink to="/team" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <i className="ti ti-users"></i> Team
            </NavLink>
          )}
        </div>
        <div className="sidebar-footer">
          <div className={`avatar ${avatarColor(user?.name)}`}>{initials(user?.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user?.role}</div>
          </div>
          <button className="btn btn-sm" onClick={handleLogout} title="Sign out">
            <i className="ti ti-logout"></i>
          </button>
        </div>
      </nav>
      <div className="main">
        <Outlet />
      </div>
    </div>
  );
}
