import React from 'react';
import TopBar from '../components/TopBar.jsx';

export default function PlaceholderPage({ title }) {
  return (
    <div>
      <TopBar />
      <div className="placeholder-card">
        <h2>{title}</h2>
        <p>This section is ready to be built out — the API and layout shell are already in place.</p>
      </div>
      <style>{`
        .placeholder-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 40px 24px;
          text-align: center;
        }
        .placeholder-card h2 { font-family: var(--font-display); margin: 0 0 8px; }
        .placeholder-card p { color: var(--ink-soft); font-size: 14px; margin: 0; }
      `}</style>
    </div>
  );
}
