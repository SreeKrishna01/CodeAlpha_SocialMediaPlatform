import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sun, Compass, Grid2x2, MessageCircle, User, X } from 'lucide-react';

const items = [
  { to: '/', icon: Sun, end: true, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/create', icon: Grid2x2, label: 'Create', center: true },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const [expanded, setExpanded] = useState(false);
  const wrapRef = useRef();
  const location = useLocation();

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!expanded) return;
    const collapse = () => setExpanded(false);
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setExpanded(false);
    };
    window.addEventListener('scroll', collapse, { passive: true });
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('scroll', collapse);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [expanded]);

  return (
    <div className={`bn-wrap ${expanded ? 'expanded' : ''}`} ref={wrapRef}>
      {expanded ? (
        <nav className="bottom-nav">
          {items.map(({ to, icon: Icon, end, center }) => (
            <NavLink key={to} to={to} end={end} className="bn-item" onClick={() => setExpanded(false)}>
              {({ isActive }) => (
                <span className={`bn-icon ${center ? 'bn-center' : ''} ${isActive ? 'is-active' : ''}`}>
                  <Icon size={center ? 22 : 20} strokeWidth={2} color={center ? '#fff' : undefined} />
                </span>
              )}
            </NavLink>
          ))}
          
        </nav>
      ) : (
        <button className="bn-circle" onClick={() => setExpanded(true)} title="Menu">
          <Grid2x2 size={24} strokeWidth={2.2} color="#fff" />
        </button>
      )}

      <style>{`
        .bn-wrap {
          display: none;
        }
        @media (max-width: 900px) {
          .bn-wrap {
            display: block;
            position: fixed;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 60;
          }
        }
        .bn-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: none;
          background: #16141f;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .bn-circle:hover { transform: scale(1.06); }
        .bn-circle:active { transform: scale(0.96); }
        .bn-wrap.expanded .bn-circle { display: none; }
        .bottom-nav {
          position: relative;
          width: auto;
          background: var(--surface);
          border-radius: 26px;
          box-shadow: var(--shadow-soft);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          padding: 10px 12px;
          animation: floatIn 0.25s ease;
        }
        .bn-item { display: flex; }
        .bn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: var(--ink-faint);
        }
        .bn-icon.is-active { color: var(--accent-coral); }
        .bn-center {
          background: #16141f;
          width: 52px;
          height: 52px;
        }
        .bn-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: var(--surface-soft);
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
