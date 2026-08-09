import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck, Grid3x3, Bookmark, MoreVertical, UserPlus, UserMinus, MapPin, Camera, X, UserRound,
  Pencil, LogOut, RefreshCw, Lock, Bell, Palette, Globe, Moon, Eye, Shield, HelpCircle, Trash2, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import * as api from '../api';
import PostCard from '../components/PostCard.jsx';

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${on ? 'on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      aria-pressed={on}
    >
      <span className="settings-toggle-knob" />
    </button>
  );
}

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me, setUser, logout } = useAuth();
  const { pushToast } = useNotifications();
  const navigate = useNavigate();
  const avatarRef = useRef();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');
  const [hasStory, setHasStory] = useState(false);
  const [listModal, setListModal] = useState(null);
  const [listUsers, setListUsers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [settingsView, setSettingsView] = useState('main');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [notifsOn, setNotifsOn] = useState(() =>
    me?.notificationsEnabled !== undefined
      ? me.notificationsEnabled
      : localStorage.getItem('notifPopups') !== 'off'
  );
  const [activityOn, setActivityOn] = useState(() =>
    me?.activityStatus !== undefined ? me.activityStatus : localStorage.getItem('activityStatus') !== 'off'
  );
  const [pwForm, setPwForm] = useState({ old: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [delPassword, setDelPassword] = useState('');
  const [delMsg, setDelMsg] = useState('');
  const [delSaving, setDelSaving] = useState(false);

  const isOwnProfile = !username || username === me?.username;

  const openMenu = () => {
    setSettingsView('main');
    setPwMsg('');
    setPwForm({ old: '', next: '', confirm: '' });
    setShowMenu(true);
  };

  const toggleNotifs = (v) => {
    const prev = notifsOn;
    setNotifsOn(v);
    localStorage.setItem('notifPopups', v ? 'on' : 'off');
    setUser((u) => (u ? { ...u, notificationsEnabled: v } : u));
    api.updateSettings({ notificationsEnabled: v }).catch(() => {
      setNotifsOn(prev);
      localStorage.setItem('notifPopups', prev ? 'on' : 'off');
      setUser((u) => (u ? { ...u, notificationsEnabled: prev } : u));
    });
  };

  const toggleActivity = (v) => {
    const prev = activityOn;
    setActivityOn(v);
    localStorage.setItem('activityStatus', v ? 'on' : 'off');
    setUser((u) => (u ? { ...u, activityStatus: v } : u));
    api.updateSettings({ activityStatus: v }).catch(() => {
      setActivityOn(prev);
      localStorage.setItem('activityStatus', prev ? 'on' : 'off');
      setUser((u) => (u ? { ...u, activityStatus: prev } : u));
    });
  };

  const handleChangePassword = async () => {
    if (pwForm.next.length < 6) {
      setPwMsg('New password must be at least 6 characters');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg('New passwords do not match');
      return;
    }
    setPwSaving(true);
    setPwMsg('');
    try {
      await api.changePassword({ oldPassword: pwForm.old, newPassword: pwForm.next });
      setPwForm({ old: '', next: '', confirm: '' });
      setSettingsView('main');
      pushToast({ name: 'You', avatar: me?.avatar, message: 'Password updated successfully', accent: '#37d67a' });
    } catch (err) {
      setPwMsg(err?.response?.data?.message || 'Failed to change password');
    }
    setPwSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDelSaving(true);
    setDelMsg('');
    try {
      await api.deleteAccountApi(delPassword);
      try { await api.logoutApi(); } catch {}
      logout();
      navigate('/login');
    } catch (err) {
      setDelMsg(err?.response?.data?.message || 'Failed to delete account');
      setDelSaving(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      name: profile?.name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
    });
    setEditMsg('');
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    setSavingEdit(true);
    setEditMsg('');
    try {
      const { user: updated } = await api.updateProfile({
        name: editForm.name.trim(),
        bio: editForm.bio.trim(),
        location: editForm.location.trim(),
      });
      setUser(updated);
      setProfile((p) => ({ ...p, name: updated.name, bio: updated.bio, location: updated.location }));
      setShowEdit(false);
    } catch (err) {
      setEditMsg(err?.response?.data?.message || 'Failed to update profile');
    }
    setSavingEdit(false);
  };

  const handleLogout = async () => {
    try { await api.logoutApi(); } catch {}
    logout();
    navigate('/login');
  };

  useEffect(() => {
    api.fetchStories().then(({ stories }) => {
      setHasStory(stories.some((s) => String(s.author?._id || s.author) === String(profile?.id)));
    }).catch(() => {});
  }, [username, me, profile?.id]);

  useEffect(() => {
    setLoading(true);
    if (isOwnProfile) {
      setProfile({
        id: me.id,
        name: me.name,
        username: me.username,
        avatar: me.avatar,
        bio: me.bio,
        location: me.location,
        verified: me.verified,
        followersCount: me.followers?.length || 0,
        followingCount: me.following?.length || 0,
      });
      setFollowersCount(me.followers?.length || 0);
      api.getUserPosts(me.id).then(({ posts }) => { setPosts(posts); setLoading(false); }).catch(() => setLoading(false));
    } else {
      api.fetchUserProfile(username).then(({ user, posts }) => {
        setProfile(user);
        setPosts(posts);
        setFollowing(user.followers?.includes(me?.id));
        setFollowersCount(user.followersCount || 0);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [username, me]);

  const openList = (type) => {
    if (!profile) return;
    setListModal(type);
    setListLoading(true);
    const req = type === 'followers'
      ? api.getUserFollowers(profile.username)
      : api.getUserFollowing(profile.username);
    req.then(({ users }) => {
      setListUsers(users.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setListLoading(false);
    }).catch(() => setListLoading(false));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { user: updated } = await api.updateProfile({ avatar: ev.target.result });
        setUser(updated);
        setProfile((p) => ({ ...p, avatar: updated.avatar }));
      } catch {}
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFollow = async () => {
    try {
      const { following: f, followersCount: fc } = await api.toggleFollow(profile.id);
      setFollowing(f);
      setFollowersCount(fc);
    } catch {}
  };

  useEffect(() => {
    if (activeTab !== 'saved' || !isOwnProfile) return;
    setLoadingSaved(true);
    api.getSavedPosts().then(({ posts: saved }) => {
      setSavedPosts(saved);
      setLoadingSaved(false);
    }).catch(() => setLoadingSaved(false));
  }, [activeTab, isOwnProfile]);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)', marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!profile) {
    return <div className="profile-not-found"><h2>User not found</h2></div>;
  }

  return (
    <div className="profile-page">
      {isOwnProfile && (
        <div className="profile-menu-wrap">
          <button className="profile-more-btn" onClick={openMenu} title="Settings">
            <MoreVertical size={22} />
          </button>
        </div>
      )}

      {showMenu && (
        <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMenu(false); }}>
          <div className="settings-page">
            <div className="settings-head">
              <button className="settings-close" onClick={() => setShowMenu(false)}><X size={20} /></button>
              <h3>{settingsView === 'password' ? 'Change Password' : 'Settings'}</h3>
              <span className="settings-head-spacer" />
            </div>

            {settingsView === 'password' ? (
              <div className="settings-body">
                <p className="settings-hint">Enter your current password and choose a new one.</p>
                <label className="settings-label">Current password</label>
                <input
                  className="settings-input"
                  type="password"
                  value={pwForm.old}
                  onChange={(e) => setPwForm({ ...pwForm, old: e.target.value })}
                  placeholder="Current password"
                />
                <label className="settings-label">New password</label>
                <input
                  className="settings-input"
                  type="password"
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder="At least 6 characters"
                />
                <label className="settings-label">Confirm new password</label>
                <input
                  className="settings-input"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Repeat new password"
                />
                {pwMsg && <p className="settings-msg">{pwMsg}</p>}
                <button
                  className="settings-primary"
                  disabled={pwSaving || !pwForm.old || !pwForm.next}
                  onClick={handleChangePassword}
                >
                  {pwSaving ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            ) : (
              <div className="settings-body">
                <div className="settings-section-label">Account</div>
                <button className="settings-row" onClick={() => { setShowMenu(false); openEdit(); }}>
                  <span className="settings-row-ic"><Pencil size={17} /></span> Edit Profile <ChevronRight size={15} />
                </button>
                <button className="settings-row" onClick={() => { setPwMsg(''); setSettingsView('password'); }}>
                  <span className="settings-row-ic"><Lock size={17} /></span> Change Password <ChevronRight size={15} />
                </button>
                <button className="settings-row danger" onClick={() => { setDelMsg(''); setDelConfirm(true); }}>
                  <span className="settings-row-ic"><Trash2 size={17} /></span> Delete Account <ChevronRight size={15} />
                </button>

                <div className="settings-section-label">Preferences</div>
                <div
                  className="settings-row toggle-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleNotifs(!notifsOn)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleNotifs(!notifsOn); }}
                >
                  <span className="settings-row-ic"><Bell size={17} /></span> Notifications
                  <Toggle on={notifsOn} onChange={toggleNotifs} />
                </div>
                <div
                  className="settings-row toggle-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleActivity(!activityOn)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleActivity(!activityOn); }}
                >
                  <span className="settings-row-ic"><Eye size={17} /></span> Activity Status
                  <Toggle on={activityOn} onChange={toggleActivity} />
                </div>
                <button className="settings-row">
                  <span className="settings-row-ic"><Palette size={17} /></span> Appearance
                  <span className="settings-row-val">System</span><ChevronRight size={15} />
                </button>
                <button className="settings-row">
                  <span className="settings-row-ic"><Globe size={17} /></span> Language
                  <span className="settings-row-val">English</span><ChevronRight size={15} />
                </button>
                <button className="settings-row">
                  <span className="settings-row-ic"><Moon size={17} /></span> Dark Mode
                  <span className="settings-row-val">Off</span><ChevronRight size={15} />
                </button>
                <button className="settings-row">
                  <span className="settings-row-ic"><Shield size={17} /></span> Privacy Settings <ChevronRight size={15} />
                </button>

                <div className="settings-section-label">Support</div>
                <button className="settings-row">
                  <span className="settings-row-ic"><HelpCircle size={17} /></span> Help Center <ChevronRight size={15} />
                </button>
                <button className="settings-row" onClick={() => { setShowMenu(false); navigate('/login'); }}>
                  <span className="settings-row-ic"><RefreshCw size={17} /></span> Switch Account <ChevronRight size={15} />
                </button>
                <button className="settings-row logout" onClick={handleLogout}>
                  <span className="settings-row-ic"><LogOut size={17} /></span> Log out <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {hasStory ? (
            <span className="">
              <img src={profile.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'} alt={profile.name} className="profile-avatar" />
            </span>
          ) : (
            <img src={profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={profile.name} className="profile-avatar" />
          )}
          {isOwnProfile && activityOn && <span className="online-dot" />}
          {isOwnProfile && (
            <>
              <button className="profile-avatar-cam" onClick={() => avatarRef.current?.click()} title="Change photo">
                <Camera size={18} color="#fff" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <h1>{profile.name}</h1>
            {profile.verified && <BadgeCheck size={20} fill="#3897f0" color="#fff" />}
            {isOwnProfile && (
              <button className="edit-profile-btn" onClick={openEdit}>
                <Pencil size={14} /> Edit profile
              </button>
            )}
            {!isOwnProfile && (
              <button className={`follow-btn ${following ? 'following' : ''}`} onClick={handleFollow}>
                {following ? <><UserMinus size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
              </button>
            )}
          </div>
          <p className="profile-handle">@{profile.username}</p>
          <div className="profile-stats">
            <span><strong>{posts.length}</strong> posts</span>
            <button className="stat-link" onClick={() => openList('followers')}><strong>{followersCount}</strong> followers</button>
            <button className="stat-link" onClick={() => openList('following')}><strong>{profile.followingCount || 0}</strong> following</button>
          </div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          {profile.location && (
            <p className="profile-location"><MapPin size={14} /> {profile.location}</p>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
          <Grid3x3 size={18} /> Posts
        </button>
        {isOwnProfile && (
          <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>
            <Bookmark size={18} /> Saved
          </button>
        )}
      </div>

      {activeTab === 'posts' && (
        <div className="profile-posts">
          {posts.length === 0 && <p className="empty-profile">No posts yet.</p>}
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdate={(updated) => setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
            />
          ))}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="profile-posts">
          {loadingSaved && <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />}
          {!loadingSaved && savedPosts.length === 0 && (
            <p className="empty-profile">Nothing saved yet. Tap the bookmark on posts or reels to keep them here.</p>
          )}
          {!loadingSaved && savedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              saved
              onSavedChange={(id, isSaved) => {
                if (!isSaved) setSavedPosts((prev) => prev.filter((p) => p._id !== id));
              }}
            />
          ))}
        </div>
      )}

      {listModal && (
        <div className="pp-modal-overlay" onClick={() => setListModal(null)}>
          <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-head">
              <h3>{listModal === 'followers' ? 'Followers' : 'Following'}</h3>
              <button className="pp-modal-close" onClick={() => setListModal(null)}><X size={18} /></button>
            </div>
            <div className="pp-modal-body">
              {listLoading && <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />}
              {!listLoading && listUsers.length === 0 && (
                <p className="pp-modal-empty">{listModal === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>
              )}
              {!listLoading && listUsers.map((u) => (
                <button
                  key={u._id}
                  className="pp-user-row"
                  onClick={() => {
                    setListModal(null);
                    if (u.username === me?.username) navigate('/profile');
                    else navigate(`/u/${u.username}`);
                  }}
                >
                  <img src={u.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'} alt={u.name} />
                  <span className="pp-user-info">
                    <span className="pp-user-name">{u.name}{u.verified && <BadgeCheck size={15} fill="#3897f0" color="#fff" />}</span>
                    <span className="pp-user-handle">@{u.username}</span>
                  </span>
                  <UserRound size={16} className="pp-user-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="pp-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="pp-modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-head">
              <h3>Edit profile</h3>
              <button className="pp-modal-close" onClick={() => setShowEdit(false)}><X size={18} /></button>
            </div>
            <div className="edit-fields">
              <label>Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                maxLength={20}
                placeholder="Your name"
              />
              <span className="edit-count">{editForm.name.length}/20</span>
              <label>Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                maxLength={200}
                rows={4}
                placeholder="Tell people about yourself"
              />
              <span className="edit-count">{editForm.bio.length}/200</span>
              <label>Location</label>
              <input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                maxLength={100}
                placeholder="Add your location"
              />
              {editMsg && <p className="edit-msg">{editMsg}</p>}
              <div className="edit-actions">
                <button className="cancel-btn" onClick={() => setShowEdit(false)}>Cancel</button>
                <button
                  className="save-btn"
                  onClick={handleEditSave}
                  disabled={savingEdit || !editForm.name.trim()}
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {delConfirm && (
        <div className="pp-modal-overlay" onClick={() => { if (!delSaving) setDelConfirm(false); }}>
          <div className="pp-modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-head">
              <h3>Delete Account</h3>
              <button className="pp-modal-close" onClick={() => { if (!delSaving) setDelConfirm(false); }}><X size={18} /></button>
            </div>
            <div className="edit-fields">
              <p className="del-warning">
                This permanently deletes your account, posts, stories and messages. This cannot be undone.
              </p>
              <label>Enter your password to confirm</label>
              <input
                type="password"
                value={delPassword}
                onChange={(e) => setDelPassword(e.target.value)}
                placeholder="Password"
              />
              {delMsg && <p className="edit-msg">{delMsg}</p>}
              <div className="edit-actions">
                <button className="cancel-btn" onClick={() => { if (!delSaving) setDelConfirm(false); }}>Cancel</button>
                <button
                  className="del-btn"
                  onClick={handleDeleteAccount}
                  disabled={delSaving || !delPassword}
                >
                  {delSaving ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page { animation: floatIn 0.35s ease; position: relative; }
        .profile-menu-wrap { position: absolute; top: 4px; right: 4px; z-index: 30; }
        .profile-more-btn {
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
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        .settings-page {
          width: min(420px, calc(100vw - 24px));
          max-height: 88vh;
          background: var(--surface);
          border-radius: 20px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: floatIn 0.25s ease;
        }
        .settings-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
        }
        .settings-head h3 { margin: 0; font-size: 17px; font-weight: 800; }
        .settings-close {
          border: none;
          background: var(--surface-soft);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
        }
        .settings-head-spacer { width: 34px; }
        .settings-body { overflow-y: auto; padding: 8px 12px 20px; }
        .settings-section-label {
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--ink-faint);
          padding: 14px 6px 6px;
        }
        .settings-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 14px;
          border: none;
          background: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          text-align: left;
        }
        .settings-row:hover { background: var(--surface-soft); }
        .settings-row svg:last-child { margin-left: auto; color: var(--ink-faint); flex-shrink: 0; }
        .settings-row-ic { color: var(--ink-soft); display: flex; flex-shrink: 0; }
        .settings-row-val { margin-left: auto; font-size: 12.5px; color: var(--ink-faint); font-weight: 500; }
        .settings-row.danger { color: #d1453b; }
        .settings-row.danger .settings-row-ic { color: #d1453b; }
        .settings-row.logout { color: #d1453b; font-weight: 700; }
        .settings-row.logout .settings-row-ic { color: #d1453b; }
        .settings-toggle {
          width: 44px;
          height: 26px;
          border-radius: 14px;
          border: none;
          background: var(--surface-soft);
          position: relative;
          transition: background 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
          margin-left: auto;
        }
        .settings-toggle.on { background: var(--accent-purple); }
        .settings-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }
        .settings-toggle.on .settings-toggle-knob { transform: translateX(18px); }
        .settings-row.toggle-row { cursor: pointer; }
        .settings-hint { color: var(--ink-soft); font-size: 13.5px; margin: 8px 6px 4px; }
        .settings-label { font-size: 12.5px; font-weight: 700; color: var(--ink-soft); margin-top: 12px; display: block; padding-left: 6px; }
        .settings-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          margin-top: 6px;
          font-family: inherit;
        }
        .settings-input:focus { border-color: var(--accent-purple); }
        .settings-msg { margin: 12px 6px 0; font-size: 13px; color: #d1453b; }
        .settings-primary {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: none;
          background: var(--gradient-warm);
          color: #fff;
          font-weight: 700;
          font-size: 14.5px;
          margin-top: 20px;
        }
        .settings-primary:disabled { opacity: 0.6; }
        .del-warning {
          color: #d1453b;
          background: #fdecec;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.5;
          margin: 0 0 6px;
        }
        .del-btn {
          flex: 1;
          padding: 11px;
          border-radius: 12px;
          border: none;
          background: #d1453b;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
        }
        .del-btn:disabled { opacity: 0.6; }
        .edit-modal { max-height: 85vh; }
        .edit-modal .edit-fields { padding: 18px; overflow-y: auto; }
        .edit-fields label { font-size: 12.5px; font-weight: 700; color: var(--ink-soft); margin-top: 10px; display: block; }
        .edit-fields input, .edit-fields textarea {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 14px;
          outline: none;
          resize: none;
          margin-top: 6px;
          box-sizing: border-box;
          font-family: inherit;
        }
        .edit-fields input:focus, .edit-fields textarea:focus { border-color: var(--accent-purple); }
        .edit-count { display: block; text-align: right; font-size: 11.5px; color: var(--ink-faint); margin-top: 3px; }
        .edit-msg { margin: 10px 0 0; font-size: 13px; color: #d1453b; }
        .edit-actions { display: flex; gap: 10px; margin-top: 18px; }
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
        .profile-ring {
          display: inline-block;
          padding: 3px;
          border-radius: 50%;
          background: var(--gradient-warm);
        }
        .profile-ring .profile-avatar { border: 3px solid #fff; box-shadow: 0 4px 20px rgba(139, 107, 255, 0.2); }
        .profile-stats .stat-link {
          border: none;
          background: none;
          padding: 0;
          margin: 0;
          font-size: 14px;
          color: var(--ink-soft);
          cursor: pointer;
        }
        .profile-stats .stat-link:hover strong { text-decoration: underline; }
        .pp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        .pp-modal {
          width: min(380px, calc(100vw - 32px));
          max-height: 70vh;
          background: var(--surface);
          border-radius: 20px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: floatIn 0.25s ease;
        }
        .pp-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
        }
        .pp-modal-head h3 { margin: 0; font-size: 17px; font-weight: 800; }
        .pp-modal-close {
          border: none;
          background: var(--surface-soft);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
        }
        .pp-modal-body { overflow-y: auto; padding: 8px; }
        .pp-modal-empty { text-align: center; color: var(--ink-faint); font-size: 14px; padding: 30px 0; }
        .pp-user-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px;
          border: none;
          background: none;
          border-radius: 14px;
          text-align: left;
        }
        .pp-user-row:hover { background: var(--surface-soft); }
        .pp-user-row img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .pp-user-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .pp-user-name {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pp-user-handle { font-size: 12.5px; color: var(--ink-soft); }
        .pp-user-arrow { color: var(--ink-faint); flex-shrink: 0; }
        .profile-header {
          background: var(--surface);
          border-radius: 2%;
          box-shadow: var(--shadow-card);
          padding: 28px;
          margin-bottom: 18px;
          display: flex;
          gap: 28px;
          align-items: flex-start;
        }
        .profile-avatar-wrap { position: relative; flex-shrink: 0; }
        .profile-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--accent-purple-soft);
          box-shadow: 0 4px 20px rgba(139, 107, 255, 0.2);
        }
        .profile-avatar-wrap .online-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #37d67a;
          border: 3px solid #fff;
        }
        .profile-avatar-cam {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 3px solid var(--surface);
          background: var(--gradient-warm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-info { flex: 1; }
        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .profile-name-row h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 600;
        }
        .edit-profile-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
        }
        .follow-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 12px;
          border: none;
          background:#1a99b6;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }
        .follow-btn.following {
          background: var(--surface-soft);
          color: var(--ink);
          border: 1px solid var(--border);
        }
        .profile-handle { font-size: 14px; color: var(--ink-soft); }
        .profile-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 10px;
        }
        .profile-stats span { font-size: 14px; color: var(--ink-soft); }
        .profile-stats strong { color: var(--ink); font-weight: 800; }
        .profile-bio { margin: 4px 0; font-size: 14px; color: var(--ink); line-height: 1.5; }
        .profile-location {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--ink-soft);
        }
        .profile-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 6px;
          box-shadow: var(--shadow-card);
          margin-bottom: 18px;
        }
        .profile-tabs button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border: none;
          border-radius: 16px;
          background: transparent;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink-soft);
        }
        .profile-tabs button.active { background: #16141f; color: #fff; }
        .profile-posts { display: flex; flex-direction: column; gap: 18px; }
        .empty-profile { text-align: center; color: var(--ink-faint); font-size: 14px; padding: 40px 0; }
        .profile-not-found { text-align: center; padding: 60px 0; color: var(--ink-soft); }
        @media (max-width: 600px) {
          .profile-header { flex-direction: column; align-items: center; text-align: center; }
          .profile-name-row { justify-content: center; }
          .profile-stats { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
