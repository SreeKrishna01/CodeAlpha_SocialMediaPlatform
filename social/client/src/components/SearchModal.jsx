import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft, BadgeCheck } from 'lucide-react';
import * as api from '../api';

export default function SearchModal({ onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recentSearches') || '[]')
  );
  const inputRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLoading(true);
      api.searchUsers(query).then(({ users }) => {
        setResults(users);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 300);
  }, [query]);

  const handleSelect = (user) => {
    const updated = [user, ...recentSearches.filter((r) => r._id !== user._id)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    onClose();
    navigate(`/profile/${user.username}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-topbar">
          <button className="back-btn" onClick={onClose}><ArrowLeft size={20} /></button>
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              ref={inputRef}
              placeholder="Search by username or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && <button className="clear-search" onClick={() => setQuery('')}><X size={14} /></button>}
          </div>
        </div>

        <div className="search-results">
          {loading && (
            <div className="search-loading">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="search-result-item">
                  <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
                  <div><div className="skeleton" style={{ width: 120, height: 13, marginBottom: 4 }} />
                  <div className="skeleton" style={{ width: 80, height: 11 }} /></div>
                </div>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <p className="no-results">No users found for "{query}"</p>
          )}

          {!loading && results.map((user) => (
            <button key={user._id} className="search-result-item" onClick={() => handleSelect(user)}>
              <img src={user.avatar} alt="" className="sr-avatar" />
              <div className="sr-info">
                <span className="sr-name">
                  {user.name}
                  {user.verified && <BadgeCheck size={14} fill="#3897f0" color="#fff" />}
                </span>
                <span className="sr-username">@{user.username}</span>
              </div>
            </button>
          ))}

          {!query && recentSearches.length > 0 && (
            <div className="recent-section">
              <div className="recent-header">
                <span>Recent</span>
                <button onClick={clearRecent}>Clear all</button>
              </div>
              {recentSearches.map((user) => (
                <button key={user._id} className="search-result-item" onClick={() => handleSelect(user)}>
                  <img src={user.avatar} alt="" className="sr-avatar" />
                  <div className="sr-info">
                    <span className="sr-name">{user.name}</span>
                    <span className="sr-username">@{user.username}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className="search-empty">
              <Search size={40} strokeWidth={1.2} />
              <p>Search for users</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20,18,30,0.45);
          z-index: 200;
          display: flex;
          justify-content: center;
        }
        .search-modal {
          width: 100%;
          max-width: 500px;
          background: var(--bg);
          height: 100%;
          animation: floatIn 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .search-topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: var(--surface);
        }
        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
          flex-shrink: 0;
        }
        .search-input-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-soft);
          border-radius: 14px;
          padding: 10px 14px;
          color: var(--ink-faint);
        }
        .search-input-wrap input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
        }
        .clear-search {
          background: none;
          border: none;
          color: var(--ink-faint);
          padding: 2px;
        }
        .search-results {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px;
          background-color:#FFFFFF;
        }
        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          border-radius: 14px;
        }
        .search-result-item:hover { background: var(--surface-soft); }
        .sr-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }
        .sr-info { display: flex; flex-direction: column; }
        .sr-name { font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 4px; }
        .sr-username { font-size: 13px; color: var(--ink-faint); }
        .no-results { text-align: center; color: var(--ink-faint); font-size: 14px; padding: 30px 0; }
        .recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0 6px;
        }
        .recent-header span { font-weight: 700; font-size: 13px; color: var(--ink-soft); }
        .recent-header button { background: none; border: none; font-size: 13px; color: var(--accent-purple); font-weight: 600; }
        .search-empty {
          text-align: center;
          padding: 60px 0;
          color: var(--ink-faint);
        }
        .search-empty p { margin: 12px 0 0; font-size: 14px; }
        .search-loading { display: flex; flex-direction: column; gap: 4px; }
      `}</style>
    </div>
  );
}
