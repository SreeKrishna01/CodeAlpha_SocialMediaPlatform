import React, { useEffect, useMemo, useState } from 'react';
import { Search, Send, X, CheckCircle2, Circle, BadgeCheck, Image as ImageIcon } from 'lucide-react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function ShareSheet({ post, onClose, onSent }) {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getConnections().then((r) => r.connections || []),
      api.getConversations().then((r) => r.conversations || []),
    ])
      .then(([conns, convs]) => {
        const map = new Map();
        conns.forEach((c) => map.set(c._id, c));
        convs.forEach((c) => {
          const o = c.otherUser;
          if (o) map.set(o._id, o);
        });
        setRecipients([...map.values()].filter((u) => u._id !== user?.id));
      })
      .catch(() => setError('Could not load your chat list'));
  }, [user?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
    );
  }, [recipients, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setError('');
    try {
      const share = {
        image: post.images?.[0] || '',
        caption: post.caption || '',
        author: post.author?.name || '',
        authorAvatar: post.author?.avatar || '',
      };
      await Promise.all(
        [...selected].map((id) =>
          api.sendMessage(id, { text: 'Shared a post', postId: post._id, share })
        )
      );
      if (onSent) onSent();
      if (onClose) onClose();
    } catch (e) {
      setError('Failed to send. Please try again.');
      setSending(false);
    }
  };

  return (
    <div className="share-sheet-overlay" onClick={onClose}>
      <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="share-sheet-head">
          <button className="share-sheet-close" onClick={onClose}>
            <X size={20} />
          </button>
          <h3>Share to chat</h3>
          <span className="share-sheet-count">{selected.size} selected</span>
        </div>

        <div className="share-preview">
          {post.images?.[0] ? (
            /\.(mp4|webm|mov|m4v|mkv|avi|3gp|ogv)$/i.test(post.images[0]) || post.images[0].startsWith('data:video/') ? (
              <video src={post.images[0]} muted playsInline className="share-preview-media" />
            ) : (
              <img src={post.images[0]} alt="" className="share-preview-media" />
            )
          ) : (
            <div className="share-preview-empty"><ImageIcon size={22} /></div>
          )}
          <div className="share-preview-text">
            <strong>{post.author?.name || 'Post'}</strong>
            <p>{post.caption || 'Shared a post'}</p>
          </div>
        </div>

        <div className="share-search">
          <Search size={16} />
          <input
            placeholder="Search people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="share-list">
          {filtered.length === 0 && (
            <p className="share-empty">
              {recipients.length === 0
                ? 'No chats yet. Message someone first.'
                : 'No people match your search.'}
            </p>
          )}
          {filtered.map((u) => (
            <button
              key={u._id}
              className={`share-row ${selected.has(u._id) ? 'selected' : ''}`}
              onClick={() => toggle(u._id)}
            >
              <img src={u.avatar} alt="" className="share-avatar" />
              <div className="share-row-text">
                <strong>
                  {u.name}
                  {u.verified && <BadgeCheck size={14} fill="#3897f0" color="#fff" />}
                </strong>
                <span>@{u.username}</span>
              </div>
              {selected.has(u._id) ? (
                <CheckCircle2 size={22} color="#3897f0" />
              ) : (
                <Circle size={22} color="#999" />
              )}
            </button>
          ))}
        </div>

        {error && <p className="share-error">{error}</p>}

        <button
          className="share-send"
          disabled={selected.size === 0 || sending}
          onClick={handleSend}
        >
          <Send size={16} />
          {sending ? 'Sending...' : selected.size === 0 ? 'Select people' : `Send to ${selected.size}`}
        </button>
      </div>

      <style>{`
        .share-sheet-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .share-sheet {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border-radius: 20px 20px 0 0;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          padding: 16px 0 0;
        }
        .share-sheet-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 12px;
          border-bottom: 1px solid #efefef;
        }
        .share-sheet-head h3 { margin: 0; font-size: 16px; }
        .share-sheet-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #262626;
          display: flex;
        }
        .share-sheet-count { font-size: 13px; color: #8e8e8e; }
        .share-preview {
          display: flex;
          gap: 12px;
          align-items: center;
          margin: 12px 16px;
          padding: 10px;
          background: #fafafa;
          border-radius: 12px;
        }
        .share-preview img,
        .share-preview video {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          object-fit: cover;
        }
        .share-preview-empty {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background: #efefef;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }
        .share-preview-text { min-width: 0; }
        .share-preview-text strong { display: block; font-size: 14px; }
        .share-preview-text p {
          margin: 2px 0 0;
          font-size: 13px;
          color: #555;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .share-search {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 4px 16px 8px;
          padding: 8px 12px;
          background: #f5f5f5;
          border-radius: 10px;
          color: #8e8e8e;
        }
        .share-search input {
          border: none;
          background: none;
          outline: none;
          flex: 1;
          font-size: 14px;
        }
        .share-list { flex: 1; overflow-y: auto; padding: 0 8px 8px; }
        .share-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          background: none;
          border: none;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
        }
        .share-row:hover { background: #fafafa; }
        .share-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          background: #efefef;
        }
        .share-row-text { flex: 1; min-width: 0; }
        .share-row-text strong {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }
        .share-row-text span { font-size: 13px; color: #8e8e8e; }
        .share-empty { text-align: center; color: #8e8e8e; font-size: 14px; padding: 24px 0; }
        .share-error { text-align: center; color: #ed4956; font-size: 13px; margin: 4px 16px; }
        .share-send {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 8px 16px 16px;
          padding: 12px;
          border: none;
          border-radius: 12px;
          background: #0095f6;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }
        .share-send:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
