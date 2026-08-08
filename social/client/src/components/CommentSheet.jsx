import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function CommentSheet({ post, onClose, onCommentsChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(post.comments || []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      const { comments: updated } = await api.commentOnPost(post._id, text.trim());
      setComments(updated);
      if (onCommentsChange) onCommentsChange(updated);
      setText('');
    } catch {}
    setSending(false);
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>Comments</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sheet-body">
          {comments.length === 0 && <p className="empty">No comments yet. Be the first!</p>}
          {comments.map((c, i) => (
            <div key={i} className="comment-row">
              <img src={c.author?.avatar} alt="" />
              <div>
                <p><strong>{c.author?.name}</strong> {c.text}</p>
                <span className="comment-time">
                  {c.createdAt ? `${Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 60000))}m` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
        <form className="sheet-form" onSubmit={submit}>
          {user && <img src={user.avatar} alt="" className="comment-user-avatar" />}
          <input
            placeholder={user ? 'Add a comment...' : 'Log in to comment'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!user}
          />
          <button type="submit" disabled={!text.trim() || sending}>
            <Send size={18} />
          </button>
        </form>
      </div>

      <style>{`
        .sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 18, 30, 0.45);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
        }
        .sheet {
          background: var(--surface);
          width: 100%;
          max-width: 480px;
          border-radius: 24px 24px 0 0;
          padding: 20px;
          max-height: 70vh;
          display: flex;
          flex-direction: column;
          animation: floatIn 0.25s ease;
        }
        .sheet-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .sheet-head h3 { margin: 0; font-size: 16px; }
        .sheet-head button { background: none; border: none; color: var(--ink-soft); }
        .sheet-body { overflow-y: auto; flex: 1; margin-bottom: 12px; }
        .empty { color: var(--ink-faint); font-size: 13.5px; text-align: center; padding: 20px 0; }
        .comment-row { display: flex; gap: 10px; margin-bottom: 14px; }
        .comment-row img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .comment-row p { margin: 0; font-size: 13.5px; line-height: 1.4; }
        .comment-time { font-size: 11px; color: var(--ink-faint); margin-top: 2px; display: block; }
        .sheet-form {
          display: flex;
          gap: 8px;
          border-top: 1px solid var(--border);
          padding-top: 12px;
          align-items: center;
        }
        .comment-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .sheet-form input {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 10px 16px;
          font-size: 13.5px;
          outline: none;
        }
        .sheet-form button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #16141f;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sheet-form button:disabled { opacity: 0.4; }
      `}</style>
    </div>
  );
}
