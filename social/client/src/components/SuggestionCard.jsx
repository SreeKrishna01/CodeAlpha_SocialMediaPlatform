import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, UserPlus, UserCheck } from 'lucide-react';
import * as api from '../api';

export default function SuggestionCard({ suggestion, inline }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleFollow = async (e) => {
    e.stopPropagation();
    try {
      const { following: f } = await api.toggleFollow(suggestion._id);
      setFollowing(f);
    } catch {}
  };

  if (dismissed) return null;

  if (inline) {
    return (
      <div className="sug-inline-item">
        <img
          src={suggestion.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'}
          alt=""
          className="sug-inline-avatar"
          onClick={() => navigate(`/profile/${suggestion.username}`)}
        />
        <div className="sug-inline-info">
          <span className="sug-inline-name" onClick={() => navigate(`/profile/${suggestion.username}`)}>
            {suggestion.name}
            {suggestion.verified && <BadgeCheck size={13} fill="#3897f0" color="#fff" />}
          </span>
          <span className="sug-inline-user">@{suggestion.username}</span>
        </div>
        <button
          className={`sug-follow-btn ${following ? 'following' : ''}`}
          onClick={handleFollow}
        >
          {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
          {following ? 'Following' : 'Follow'}
        </button>
      </div>
    );
  }

  return (
    <div className="suggestion-card">
      <button className="sug-dismiss" onClick={(e) => { e.stopPropagation(); setDismissed(true); }}>×</button>
      <img
        src={suggestion.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
        alt=""
        className="sug-avatar"
        onClick={() => navigate(`/profile/${suggestion.username}`)}
      />
      <span className="sug-name" onClick={() => navigate(`/profile/${suggestion.username}`)}>
        {suggestion.name}
      </span>
      <span className="sug-username">@{suggestion.username}</span>
      {suggestion.bio && <span className="sug-bio">{suggestion.bio}</span>}
      <button
        className={`sug-follow-btn-card ${following ? 'following' : ''}`}
        onClick={handleFollow}
      >
        {following ? 'Following' : 'Follow'}
      </button>

      <style>{`
        .suggestion-card {
          flex-shrink: 0;
          width: 160px;
          background: #e1fdb47a;
          border-radius: 3%;
          box-shadow: var(--shadow-card);
          padding: 20px 14px;
          text-align: center;
          position: relative;
        }
        .sug-dismiss {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: var(--surface-soft);
          color: var(--ink-faint);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sug-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #000000d0 ;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .sug-name {
          display: block;
          font-weight: 700;
          font-size: 13.5px;
          margin-bottom: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }
        .sug-username {
          display: block;
          font-size: 12px;
          color: var(--ink-faint);
          margin-bottom: 6px;
        }
        .sug-bio {
          display: block;
          font-size: 11.5px;
          color: var(--ink-soft);
          margin-bottom: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sug-follow-btn-card {
          width: 100%;
          padding: 8px;
          border-radius: 8px;
          border: none;
          background: #1a99b6;
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
        }
        .sug-follow-btn-card.following {
          background: #1A99B6;
          color: var(--ink);
          border: 1px solid var(--border);
        }
        .sug-inline-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }
        .sug-inline-item:last-child { border-bottom: none; }
        .sug-inline-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          cursor: pointer;
        }
        .sug-inline-info { flex: 1; }
        .sug-inline-name {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
        }
        .sug-inline-user { display: block; font-size: 12px; color: var(--ink-faint); }
        .sug-follow-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 7px 14px;
          border-radius: 10px;
          border: none;
          background: #1A99B6;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sug-follow-btn.following {
          background: #1A99B6;
          color: var(--ink);
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
