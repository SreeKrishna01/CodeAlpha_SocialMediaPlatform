import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, MessageCircle, Bell, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/profile', label: 'Profile' },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className="sidebar-item">
            {({ isActive }) => (
              <>
                <span className={`sidebar-icon ${isActive ? 'is-active' : ''}`}>
                  {to === '/profile' ? (
                    <img
                      className="sidebar-avatar"
                      src={user?.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'}
                      alt={label}
                    />
                  ) : (
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  )}
                </span>
                <span className="sidebar-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <NavLink to="/create" className="sidebar-create">
        <Plus size={22} strokeWidth={2.2} color="#fff" />
        <span>Create</span>
      </NavLink>

      <style>{`
        .sidebar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 22px 0;
          background: var(--surface);
          border-radius: 30px;
          box-shadow: var(--shadow-card);
          height: fit-content;
          position: sticky;
          top: 24px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
        .sidebar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 4px;
          color: var(--ink-faint);
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 16px;
          transition: color 0.15s ease;
        }
        .sidebar-item:hover { color: var(--ink-soft); }
        .sidebar-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          color: inherit;
        }
        .sidebar-icon.is-active {
          background: var(--surface-soft);
          color: var(--ink);
        }
        .sidebar-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--accent-purple-soft);
        }
        .sidebar-item:has(.sidebar-icon.is-active) {
          color: var(--ink);
        }
        .sidebar-create {
          margin-top: 18px;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #16141f;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
        }
        .sidebar-create span {
          color: #fff;
          font-size: 10.5px;
          font-weight: 700;
        }
        @media (max-width: 900px) {
          .sidebar { display: none; }
        }
      `}</style>
    </aside>
  );
}
