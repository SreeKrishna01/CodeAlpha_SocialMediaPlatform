import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Send, ArrowLeft, Bell } from 'lucide-react';
import * as api from '../api';

function timeAgo(dateStr) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

const typeIcons = {
  like: { icon: Heart, color: '#ff3b5c', bg: '#fff1f3' },
  comment: { icon: MessageCircle, color: '#8b6bff', bg: '#efe9ff' },
  follow: { icon: UserPlus, color: '#37d67a', bg: '#eafaf0' },
  share: { icon: Send, color: '#ff7a59', bg: '#fff5f0' },
};

const typeText = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
  share: 'shared your post',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(({ notifications }) => {
      setNotifications(notifications);
      setLoading(false);
      api.markNotificationsRead().catch(() => {});
    }).catch(() => setLoading(false));
  }, []);

  const handleNotifClick = (notif) => {
    if (notif.type === 'follow') {
      navigate(`/profile/${notif.sender?.username}`);
    } else if (notif.post) {
      navigate('/');
    }
  };

  return (
    <div className="notif-page">
      <div className="notif-header">
        <h2>Notifications</h2>
      </div>

      {loading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="notif-item">
          <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: 200, height: 13, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 60, height: 11 }} />
          </div>
        </div>
      ))}

      {!loading && notifications.length === 0 && (
        <div className="empty-notif">
          <Bell size={48} strokeWidth={1.2} />
          <p>No notifications yet</p>
          <span>When someone interacts with your posts, you'll see it here.</span>
        </div>
      )}

      {!loading && notifications.map((notif) => {
        const cfg = typeIcons[notif.type] || typeIcons.like;
        const Icon = cfg.icon;
        return (
          <button key={notif._id} className="notif-item" onClick={() => handleNotifClick(notif)}>
            <div className="notif-avatar-wrap">
              <img src={notif.sender?.avatar} alt="" className="notif-avatar" />
              <span className="notif-type-icon" style={{ background: cfg.bg, color: cfg.color }}>
                <Icon size={12} />
              </span>
            </div>
            <div className="notif-content">
              <p className="notif-text">
                <strong>{notif.sender?.name}</strong> {typeText[notif.type]}
                {notif.text && notif.type === 'comment' && <span className="notif-comment-text"> — "{notif.text}"</span>}
              </p>
              <span className="notif-time">{timeAgo(notif.createdAt)}</span>
            </div>
            {notif.post?.images?.[0] && (
              <img src={notif.post.images[0]} alt="" className="notif-thumb" />
            )}
          </button>
        );
      })}

      <style>{`
        .notif-page { animation: floatIn 0.35s ease; max-width: 500px; margin: 0 auto; }
        .notif-header { margin-bottom: 18px; }
        .notif-header h2 { margin: 0; font-family: var(--font-display); font-size: 22px; }
        .notif-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: none;
          background: var(--surface);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-card);
          margin-bottom: 8px;
          width: 100%;
          text-align: left;
        }
        .notif-avatar-wrap { position: relative; flex-shrink: 0; }
        .notif-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
        }
        .notif-type-icon {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
        }
        .notif-content { flex: 1; overflow: hidden; }
        .notif-text { margin: 0; font-size: 13.5px; line-height: 1.4; }
        .notif-comment-text { color: var(--ink-faint); }
        .notif-time { font-size: 12px; color: var(--ink-faint); }
        .notif-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .empty-notif {
          text-align: center;
          padding: 60px 20px;
          color: var(--ink-faint);
        }
        .empty-notif p { margin: 16px 0 4px; font-weight: 700; font-size: 16px; color: var(--ink-soft); }
        .empty-notif span { font-size: 13.5px; }
      `}</style>
    </div>
  );
}
