import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import * as api from '../api';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

const typeLabel = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  share: 'shared your post',
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIds = useRef(new Set());
  const hasLoadedOnce = useRef(false);

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const { notifications, unreadCount: count } = await api.getNotifications();
      setUnreadCount(count);

      if (hasLoadedOnce.current) {
        const popupsOn =
          user?.notificationsEnabled !== false &&
          localStorage.getItem('notifPopups') !== 'off';
        const fresh = notifications
          .filter((n) => !seenIds.current.has(n._id))
          .slice(0, 3);
        fresh.forEach((n) => {
          seenIds.current.add(n._id);
          if (!popupsOn) return;
          const msg =
            n.type === 'follow'
              ? `${n.sender?.name} ${typeLabel.follow}`
              : `${n.sender?.name} ${typeLabel[n.type]} "${n.text || ''}"`;
          const toastId = Date.now() + Math.random();
          setToasts((prev) => [...prev, { id: toastId, name: n.sender?.name, avatar: n.sender?.avatar, message: msg, type: n.type }]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toastId));
          }, 4000);
        });
      } else {
        notifications.forEach((n) => seenIds.current.add(n._id));
        hasLoadedOnce.current = true;
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) {
      seenIds.current = new Set();
      hasLoadedOnce.current = false;
      setUnreadCount(0);
      return;
    }
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [user, poll]);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const pushToast = useCallback(({ name, avatar, message, type = 'info', accent = 'var(--accent-purple)' }) => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, name, avatar, message, type, accent }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, unreadCount, dismissToast, refresh: poll, pushToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast-card" style={{ borderLeftColor: t.accent }} onClick={() => dismissToast(t.id)}>
            <img src={t.avatar} alt="" className="toast-avatar" />
            <div className="toast-body">
              <span className="toast-title">{t.name}</span>
              <span className="toast-msg">{t.message}</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .toast-stack {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 500;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }
        .toast-card {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border-radius: 16px;
          box-shadow: var(--shadow-soft);
          padding: 12px 16px;
          min-width: 240px;
          max-width: 320px;
          border-left: 4px solid var(--accent-purple);
          cursor: pointer;
          animation: floatIn 0.3s ease;
        }
        .toast-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .toast-body { display: flex; flex-direction: column; }
        .toast-title { font-weight: 700; font-size: 13.5px; }
        .toast-msg { font-size: 12.5px; color: var(--ink-soft); }
        @media (max-width: 600px) {
          .toast-stack { left: 16px; right: 16px; }
          .toast-card { min-width: 0; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
