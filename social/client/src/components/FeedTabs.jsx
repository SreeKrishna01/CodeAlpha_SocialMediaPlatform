import React from 'react';
import { Star, Users, Flame } from 'lucide-react';

const tabs = [
  { key: 'for-you', label: 'For you', icon: Star },
  { key: 'following', label: 'Following', icon: Users },
  { key: 'trending', label: 'Trending', icon: Flame },
];

export default function FeedTabs({ active, onChange }) {
  return (
    <div className="feed-tabs">
      <div className="tabs-track">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`tab-btn ${active === key ? 'is-active' : ''}`}
            onClick={() => onChange(key)}
          >
            <Icon size={15} fill={active === key ? '#fff' : 'none'} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      <style>{`
        .feed-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .tabs-track {
          display: flex;
          gap: 6px;
          background: var(--surface);
          padding: 6px;
          border-radius: 22px;
          box-shadow: var(--shadow-card);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabs-track::-webkit-scrollbar { display: none; }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          padding: 10px 16px;
          border-radius: 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink-soft);
          white-space: nowrap;
        }
        .tab-btn.is-active {
          background: #16141f;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
