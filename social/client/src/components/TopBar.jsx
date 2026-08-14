import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import SearchModal from './SearchModal.jsx';

export default function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="brand" onClick={() => navigate('/')}>
          <span className="brand-logo">
            <img
              className="brand-logo-img"
              src="https://yt3.googleusercontent.com/ytc/AIdro_nC2ZJ937Vbv94eqVs_1k-jncgK8cAl1NR_Td2Anc6Kqg=s900-c-k-c0x00ffffff-no-rj"
              alt="Kek Start"
            />
          </span>
          <span className="brand-name">Kek Start</span>
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setShowSearch(true)}><Search size={18} /></button>
          <button className="icon-btn notif-btn" onClick={() => navigate('/alerts')}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <div className="avatar-wrap" onClick={() => navigate('/profile')}>
            <img
              className="topbar-avatar"
              src={user?.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'}
              alt="You"
            />
            <span className="online-dot" />
          </div>
        </div>
      </div>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      <style>{`
        .topbar { margin-bottom: 14px; animation: floatIn 0.4s ease; }
        .topbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .brand { cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .brand-logo {
          width: 30px;
          height: 30px;
          border-radius: 50px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: var(--shadow-card);
        }
        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.8);
          padding: 4px;
        }
        .brand-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          background: url('https://c4.wallpaperflare.com/wallpaper/391/562/489/net-background-surface-dark-wallpaper-preview.jpg');
          -webkit-background-clip: text;
          color: transparent;
          -webkit-text-stroke: 0.5px #d9d3de;
          animation: animate 80s linear infinite;
        }
        @keyframes animate {
         0%{
         background-position: 0% 50%;}
         100% {
         background-position:100% 50%;}
         }
        .topbar-actions { display: flex; align-items: center; gap: 12px; }
        .icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: var(--surface);
          box-shadow: var(--shadow-card);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
          position: relative;
        }
        .notif-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          background: var(--accent-pink);
          color: #fff;
          font-size: 9.5px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        .avatar-wrap { position: relative; width: 44px; height: 44px; cursor: pointer; }
        .topbar-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #000000b0;
          
        }
        .online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #37d67a;
          border: 2px solid #fff;
        }
      `}</style>
    </header>
  );
}
