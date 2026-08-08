import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, LogOut, User, Bell, Shield, Moon, Globe, HelpCircle,
  ChevronRight, Palette, Lock, Eye, RefreshCw, Trash2, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../api';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const avatarRef = useRef();
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const { user: updated } = await api.updateProfile({ ...form, avatar });
      setUser(updated);
      setEditing(false);
      setMsg('Profile updated!');
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Failed to update');
    }
    setSaving(false);
  };

  const openAvatarPicker = () => avatarRef.current?.click();

  const handleLogout = async () => {
    try { await api.logoutApi(); } catch {}
    logout();
    navigate('/login');
  };

  const settingGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', onClick: () => setEditing(!editing) },
        { icon: RefreshCw, label: 'Switch Account', onClick: () => navigate('/login') },
        { icon: Lock, label: 'Change Password', onClick: () => {} },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', onClick: () => navigate('/alerts') },
        { icon: Palette, label: 'Appearance', onClick: () => {} },
        { icon: Globe, label: 'Language', sub: 'English', onClick: () => {} },
        { icon: Moon, label: 'Dark Mode', sub: 'Off', onClick: () => {} },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: Eye, label: 'Activity Status', sub: 'On', onClick: () => {} },
        { icon: Shield, label: 'Privacy Settings', onClick: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', onClick: () => {} },
        { icon: Trash2, label: 'Delete Account', danger: true, onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h2>Settings</h2>
      </div>

      {editing && (
        <div className="edit-profile-card">
          <h3>Edit Profile</h3>
          <div className="edit-avatar-section">
            <span className="edit-avatar-wrap">
              <img src={avatarPreview || user?.avatar} alt="" className="edit-avatar" />
              <button type="button" className="avatar-camera-btn" onClick={openAvatarPicker}>
                <Camera size={16} color="#fff" />
              </button>
            </span>
            <div className="edit-avatar-actions">
              <button className="change-avatar-btn" onClick={openAvatarPicker}>Change Photo</button>
              <span className="avatar-hint">You can change your photo anytime</span>
            </div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <div className="edit-fields">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={200} rows={3} />
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          {msg && <p className="settings-msg">{msg}</p>}
          <div className="edit-actions">
            <button className="cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
            <button className="save-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      )}

      {settingGroups.map((group) => (
        <div key={group.title} className="settings-group">
          <h4>{group.title}</h4>
          <div className="settings-list">
            {group.items.map(({ icon: Icon, label, sub, onClick, danger }) => (
              <button key={label} className={`settings-item ${danger ? 'danger' : ''}`} onClick={onClick}>
                <span className="si-left">
                  <Icon size={18} />
                  <span>{label}</span>
                </span>
                <span className="si-right">
                  {sub && <span className="si-sub">{sub}</span>}
                  <ChevronRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} /> Log out
      </button>

      <p className="settings-version">Circle v1.0</p>

      <style>{`
        .settings-page { animation: floatIn 0.35s ease; max-width: 500px; margin: 0 auto; }
        .settings-topbar {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }
        .settings-topbar h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 22px;
        }
        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: var(--surface);
          box-shadow: var(--shadow-card);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
        }
        .edit-profile-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 24px;
          margin-bottom: 20px;
          animation: floatIn 0.3s ease;
        }
        .edit-profile-card h3 { margin: 0 0 16px; font-size: 16px; }
        .edit-avatar-section { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
        .edit-avatar-wrap { position: relative; flex-shrink: 0; }
        .edit-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent-purple-soft);
        }
        .avatar-camera-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--surface);
          background: var(--gradient-warm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .edit-avatar-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .change-avatar-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-soft);
          font-size: 13px;
          font-weight: 600;
        }
        .avatar-hint { font-size: 11.5px; color: var(--ink-faint); }
        .edit-fields { display: flex; flex-direction: column; gap: 8px; }
        .edit-fields label { font-size: 12.5px; font-weight: 700; color: var(--ink-soft); margin-top: 6px; }
        .edit-fields input, .edit-fields textarea {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 14px;
          outline: none;
          resize: none;
        }
        .edit-fields input:focus, .edit-fields textarea:focus { border-color: var(--accent-purple); }
        .settings-msg { margin: 8px 0 0; font-size: 13px; color: #37d67a; }
        .edit-actions { display: flex; gap: 10px; margin-top: 14px; }
        .cancel-btn {
          flex: 1;
          padding: 11px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-weight: 600;
          font-size: 14px;
        }
        .save-btn {
          flex: 1;
          padding: 11px;
          border-radius: 12px;
          border: none;
          background: var(--gradient-warm);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
        }
        .save-btn:disabled { opacity: 0.6; }
        .settings-group { margin-bottom: 20px; }
        .settings-group h4 {
          margin: 0 0 10px;
          font-size: 12.5px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--ink-faint);
          font-weight: 700;
        }
        .settings-list {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }
        .settings-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 15px 18px;
          border: none;
          background: none;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          color: var(--ink);
          text-align: left;
        }
        .settings-item:last-child { border-bottom: none; }
        .settings-item.danger { color: #d1453b; }
        .si-left { display: flex; align-items: center; gap: 12px; }
        .si-right { display: flex; align-items: center; gap: 6px; color: var(--ink-faint); }
        .si-sub { font-size: 13px; color: var(--ink-faint); }
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-lg);
          border: none;
          background: #d1453b;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          margin-top: 8px;
        }
        .settings-version {
          text-align: center;
          font-size: 12px;
          color: var(--ink-faint);
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
