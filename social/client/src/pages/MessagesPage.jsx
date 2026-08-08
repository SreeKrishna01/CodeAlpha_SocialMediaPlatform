import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Camera, Mic, Paperclip, Smile, Send, Phone, Video,
  Star, Check, CheckCheck, FileText, Film, Music, Image as ImageIcon,
  Edit, MoreHorizontal, ArrowLeft, ChevronRight, Users, Plus, Trash2, X, XCircle, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import * as api from '../api';
import PostCard from '../components/PostCard.jsx';

const C = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  blue: '#4F8EF7',
  blueSoft: '#E8F0FF',
  ink: '#202124',
  sub: '#8D8D8D',
  line: '#ECECEC',
  success: '#32D74B',
};

function Avatar({ src, name = '', size = 50, online, ring = false }) {
  return (
    <span className="ms-avatar" style={{ width: size, height: size }}>
      <img
        src={src || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%' }}
      />
      {online && <span className="ms-online-dot" style={{ width: size * 0.24, height: size * 0.24 }} />}
    </span>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

function formatDay(dateStr) {
  if (!dateStr) return 'Today';
  const d = new Date(dateStr);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - startMsg) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ---------------------------------- LEFT SIDEBAR ---------------------------------- */

function ChatSidebar({ user, conversations, connections, selectedId, onSelect, onNew, force = false }) {
  const [query, setQuery] = useState('');

  const filtered = conversations.filter(
    (c) =>
      !query ||
      c.otherUser?.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.otherUser?.username?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <aside className={`ms-col ms-sidebar ${force ? 'force' : ''}`}>
      <div className="ms-profile-card">
        <div className="ms-profile-row">
          <Avatar src={user?.avatar} name={user?.name} size={50} online />
          <div className="ms-profile-text">
            <span className="ms-profile-name">{user?.name || 'Alex Morgan'}</span>
            <span className="ms-profile-sub">{user?.bio || 'Senior Developer'}</span>
          </div>
          <button className="ms-icon-btn" title="Edit profile"><Edit size={18} /></button>
        </div>
      </div>

      <div className="ms-search-wrap">
        <Search size={17} className="ms-search-icon" />
        <input
          placeholder="Search Here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="ms-circles-label">
        <Users size={14} />
        <span>Kek Start</span>
      </div>
      <div className="ms-circles-row">
        <button className="ms-circle-add" onClick={onNew}><Plus size={18} /></button>
        {connections.map((c) => (
          <button key={c.id || c._id} className="ms-circle" onClick={() => onSelect(c)}>
            <Avatar src={c.avatar} name={c.name} size={46} online={c.isOnline} />
            <span>{c.name?.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="ms-list-head">
        <span className="ms-list-title">Messages</span>
      </div>

      <div className="ms-conv-list">
        {filtered.map((conv) => {
          const uid = conv.otherUser?.id || conv.otherUser?._id;
          const active = selectedId === uid;
          const mine = conv.lastMessage?.sender === user?.id;
          return (
            <button
              key={conv.id || uid}
              className={`ms-conv ${active ? 'active' : ''}`}
              onClick={() => onSelect(conv.otherUser)}
            >
              <Avatar
                src={conv.otherUser?.avatar}
                name={conv.otherUser?.name}
                size={50}
                online={conv.otherUser?.isOnline}
              />
              <div className="ms-conv-mid">
                <div className="ms-conv-top">
                  <span className="ms-conv-name">{conv.otherUser?.name}</span>
                  <span className="ms-conv-time">{conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ''}</span>
                </div>
                <div className="ms-conv-bot">
                  <span className="ms-conv-preview">
                    {mine && <CheckCheck size={13} className="ms-tick" />}
                    {conv.lastMessage?.postId
                      ? 'Shared a post'
                      : conv.lastMessage?.attachments?.length
                      ? conv.lastMessage.attachments.length > 1
                        ? `📎 ${conv.lastMessage.attachments.length} attachments`
                        : `📎 ${conv.lastMessage.attachments[0].kind === 'image' ? 'Photo' : conv.lastMessage.attachments[0].name || conv.lastMessage.attachments[0].kind}`
                      : conv.lastMessage?.text || 'Start a conversation...'}
                  </span>
                  {conv.unread > 0 && <span className="ms-unread">{conv.unread}</span>}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="ms-empty-list">
            <p>No conversations</p>
            <span>Tap a circle or search to start chatting.</span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ---------------------------------- MESSAGE BUBBLE ---------------------------------- */

function Bubble({ msg, isMine, user, prevSender, otherUserId, onViewSharedPost }) {
  const showAvatar = !isMine && msg.sender !== prevSender;
  const isPdf = msg.text?.toLowerCase().includes('.pdf') || msg.image?.includes('pdf');
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';
  const seen = isMine && msg.readBy?.some((id) => String(id) === String(otherUserId));
  const delivered = isMine && !seen && Boolean(msg.deliveredAt);

  const attachments = msg.attachments || [];

  return (
    <div className={`ms-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
      {!isMine && (
        <span className="ms-bubble-avatar-slot">
          {showAvatar ? (
            <img
              src={msg.sender?.avatar || 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg'}
              alt=""
              className="ms-bubble-avatar"
            />
          ) : null}
        </span>
      )}
      <div className={`ms-bubble ${isMine ? 'mine' : 'theirs'} ${isPdf ? 'pdf' : ''}`}>
        {isPdf && (
          <span className="ms-pdf-card">
            <span className="ms-pdf-icon"><FileText size={18} /></span>
            <span className="ms-pdf-meta">
              <strong>project_report.pdf</strong>
              <small>PDF · 2.4 MB</small>
            </span>
          </span>
        )}

        {msg.postId && (
          <button
            className="ms-share-card"
            onClick={() => onViewSharedPost && onViewSharedPost(msg.postId)}
          >
            {msg.share?.image ? (
              /\.(mp4|webm|mov|m4v|mkv|avi|3gp|ogv)$/i.test(msg.share.image) || msg.share.image.startsWith('data:video/') ? (
                <video src={msg.share.image} muted playsInline preload="metadata" className="ms-share-thumb" />
              ) : (
                <img src={msg.share.image} alt="" className="ms-share-thumb" />
              )
            ) : (
              <span className="ms-share-noimg"><ImageIcon size={22} /></span>
            )}
            <span className="ms-share-body">
              <strong><ImageIcon size={14} /> Shared a post</strong>
              <span className="ms-share-author">{msg.share?.author || 'A post'}</span>
              {msg.share?.caption && <small className="ms-share-caption">{msg.share.caption}</small>}
            </span>
          </button>
        )}

        {attachments.length > 0 && (
          <div className="ms-attach-msg">
            {attachments.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="ms-attach-item"
                onClick={(e) => e.stopPropagation()}
              >
                {a.kind === 'image' ? (
                  <img src={a.url} alt="" className="ms-attach-img" />
                ) : a.kind === 'video' ? (
                  <video src={a.url} muted playsInline preload="metadata" className="ms-attach-img" />
                ) : (
                  <span className="ms-attach-file-icon"><FileText size={20} /></span>
                )}
                {a.kind !== 'image' && a.kind !== 'video' && (
                  <span className="ms-attach-file-meta">
                    <strong>{a.name || a.kind}</strong>
                    <small>{a.size ? `${(a.size / 1024).toFixed(1)} KB` : ''}</small>
                  </span>
                )}
                <Download size={14} className="ms-attach-dl" />
              </a>
            ))}
          </div>
        )}

        {msg.text && <span className="ms-bubble-text">{msg.text}</span>}
        <span className="ms-bubble-meta">
          {time}
          {isMine &&
            (seen ? (
              <CheckCheck size={13} className="ms-tick-seen" />
            ) : delivered ? (
              <CheckCheck size={13} className="ms-tick-delivered" />
            ) : (
              <Check size={13} className="ms-tick-sent" />
            ))}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------- CENTER THREAD ---------------------------------- */

function ChatThread({ user, otherUser, onBack, onOpenProfile, force = false }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [viewingPost, setViewingPost] = useState(null);
  const bottomRef = useRef();
  const fileRef = useRef();
  const cameraRef = useRef();
  const { pushToast } = useNotifications();
  const uid = otherUser?.id || otherUser?._id;

  const sampleThread = [
    { _id: 's1', text: 'Hi David, have you got the project report pdf?', createdAt: new Date(), sender: user, isMine: false },
    { _id: 's2', text: 'NO. I did not get it', createdAt: new Date(), sender: { _id: user?.id, name: 'Me', avatar: user?.avatar } },
  ];
  const displayMessages = messages.length > 0 ? messages : sampleThread;

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    api.getMessages(uid).then(({ messages: msgs }) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }).catch(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const interval = setInterval(() => {
      api.getMessages(uid).then(({ messages: msgs }) => setMessages(msgs)).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [uid]);

  const kindOfFile = (file) => {
    const t = file.type || '';
    if (t.startsWith('image/')) return 'image';
    if (t.startsWith('video/')) return 'video';
    if (t.includes('pdf')) return 'pdf';
    if (t.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    const files = [...fileList].slice(0, 5 - pendingAttachments.length);
    files.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        pushToast({ name: 'Too large', avatar: user?.avatar, message: 'Files must be under 8 MB', accent: '#ed4956' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const kind = kindOfFile(file);
        setPendingAttachments((prev) => [
          ...prev,
          { kind, url: reader.result, name: file.name, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && pendingAttachments.length === 0) return;
    try {
      const payload = { text: text.trim() };
      if (pendingAttachments.length) {
        payload.attachments = pendingAttachments.map((a) => ({
          kind: a.kind,
          url: a.url,
          name: a.name,
          size: a.size,
        }));
      }
      const { message } = await api.sendMessage(uid, payload);
      setMessages((prev) => [...prev, message]);
      setText('');
      setPendingAttachments([]);
      pushToast({
        name: 'You',
        avatar: user?.avatar,
        message: 'Message sent',
        accent: C.blue,
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {}
  };

  const openSharedPost = async (postId) => {
    setViewingPost({ id: postId, post: null });
    try {
      const data = await api.getPost(postId);
      setViewingPost({ id: postId, post: data.post });
    } catch {
      setViewingPost(null);
      pushToast({ name: 'Post', avatar: user?.avatar, message: 'This post is no longer available', accent: '#ed4956' });
    }
  };

  let prevSender = null;
  const rendered = [];
  displayMessages.forEach((msg, i) => {
    const day = formatDay(msg.createdAt);
    const prevDay = i > 0 ? formatDay(displayMessages[i - 1].createdAt) : null;
    if (day !== prevDay) {
      rendered.push(
        <div key={`day-${i}`} className="ms-timeline"><span>{day}</span></div>
      );
    }
    rendered.push(
      <Bubble
        key={msg._id || i}
        msg={msg}
        isMine={msg.sender === user?.id || msg.sender?._id === user?.id}
        user={user}
        prevSender={prevSender}
        otherUserId={uid}
        onViewSharedPost={openSharedPost}
      />
    );
    prevSender = msg.sender === user?.id || msg.sender?._id === user?.id ? user?.id : msg.sender?._id || msg.sender;
  });

  return (
    <section className={`ms-col ms-thread ${force ? 'force' : ''}`}>
      <div className="ms-thread-head">
        <button className="ms-back-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <div className="ms-thread-user" onClick={onOpenProfile}>
          <Avatar src={otherUser?.avatar} name={otherUser?.name} size={46} online={otherUser?.isOnline} />
          <div className="ms-thread-meta">
            <span className="ms-thread-name">{otherUser?.name || 'David Brown'}</span>
            <span className="ms-thread-status">
              <i className="ms-status-dot" /> {otherUser?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="ms-thread-actions">
          <button className="ms-icon-btn"><Search size={18} /></button>
          <button className="ms-icon-btn"><Star size={18} /></button>
          <button className="ms-icon-btn"><Bell size={18} /></button>
          <button className="ms-icon-btn"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <div className="ms-thread-body">
        {loading && (
          <div className="ms-thread-loading">
            <div className="skeleton" style={{ width: 180, height: 40, borderRadius: 18 }} />
            <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 18, alignSelf: 'flex-end' }} />
          </div>
        )}
        {!loading && rendered}
        <div ref={bottomRef} />
      </div>

      <form className="ms-composer" onSubmit={handleSend}>
        {pendingAttachments.length > 0 && (
          <div className="ms-attach-previews">
            {pendingAttachments.map((a, i) => (
              <span key={i} className="ms-attach-preview">
                {a.kind === 'image' ? (
                  <img src={a.url} alt="" />
                ) : a.kind === 'video' ? (
                  <video src={a.url} muted playsInline preload="metadata" />
                ) : (
                  <span className="ms-attach-preview-file"><FileText size={18} /></span>
                )}
                <button
                  type="button"
                  className="ms-attach-remove"
                  onClick={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
                >
                  <XCircle size={16} />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.mp3,.wav"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="ms-composer-input-wrap">
          <button type="button" className="ms-composer-icon" onClick={() => cameraRef.current?.click()} title="Camera"><Camera size={19} /></button>
          <input
            placeholder="Write Something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="button" className="ms-composer-icon" onClick={() => fileRef.current?.click()} title="Attach"><Paperclip size={19} /></button>
          <button type="button" className="ms-composer-icon"><Mic size={19} /></button>
          <button type="button" className="ms-composer-icon"><Smile size={19} /></button>
        </div>
        <button type="submit" className="ms-send-btn" disabled={!text.trim() && pendingAttachments.length === 0}>
          <Send size={20} color="#fff" />
        </button>
      </form>

      {viewingPost && (
        <div className="ms-shared-overlay" onClick={() => setViewingPost(null)}>
          <div className="ms-shared-inner" onClick={(e) => e.stopPropagation()}>
            {viewingPost.post ? (
              <PostCard post={viewingPost.post} />
            ) : (
              <div className="ms-shared-loading">
                <div className="skeleton" style={{ height: 340, borderRadius: 18 }} />
              </div>
            )}
            <button className="ms-shared-close" onClick={() => setViewingPost(null)}><X size={20} /></button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------- RIGHT PANEL ---------------------------------- */

const attachments = [
  { icon: FileText, label: 'PDF', color: '#F46A6A', bg: '#FEF0F0' },
  { icon: Film, label: 'VIDEO', color: '#7B61FF', bg: '#F1EDFF' },
  { icon: Music, label: 'MP3', color: '#4F8EF7', bg: '#EAF1FF' },
  { icon: ImageIcon, label: 'IMAGE', color: '#32D74B', bg: '#EBFAEE' },
];

function ProfilePanel({ otherUser, onClose, onBackToList }) {
  const name = otherUser?.name || 'Dianne Jhonson';
  const sub = otherUser?.bio || 'Junior Developer';

  return (
    <aside className="ms-col ms-profile-panel">
      <div className="ms-search-wrap">
        <Search size={17} className="ms-search-icon" />
        <input placeholder="Search Here..." />
      </div>

      <div className="ms-pp-center">
        <Avatar src={otherUser?.avatar} name={name} size={96} online={otherUser?.isOnline} />
        <h3 className="ms-pp-name">{name}</h3>
        <span className="ms-pp-sub">{sub}</span>
        <div className="ms-pp-actions">
          <button className="ms-pp-action-btn" title="Chat"><Send size={22} color="#fff" /></button>
          <button className="ms-pp-action-btn" title="Video Call"><Video size={22} color="#fff" /></button>
        </div>
        <div className="ms-pp-quick">
          <button className="ms-pp-quick-btn"><Users size={15} /> View Friends</button>
          <button className="ms-pp-quick-btn"><Star size={15} /> Add to Favorites</button>
        </div>
      </div>

      <div className="ms-divider" />

      <div className="ms-pp-section">
        <h4 className="ms-pp-section-title">Attachments</h4>
        <div className="ms-attach-grid">
          {attachments.map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="ms-attach-card">
              <span className="ms-attach-icon" style={{ background: bg, color }}>
                <Icon size={20} />
              </span>
              <span className="ms-attach-label">{label}</span>
            </div>
          ))}
        </div>
        <button className="ms-view-all-btn" onClick={onBackToList}>
          View All <ChevronRight size={15} />
        </button>
      </div>

      <button className="ms-pp-close" onClick={onClose} title="Close panel">
        <ArrowLeft size={18} />
      </button>
    </aside>
  );
}

/* ---------------------------------- PAGE ---------------------------------- */

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileView, setMobileView] = useState('list');

  const pendingOpen = location.state?.openUser || null;

  useEffect(() => {
    if (pendingOpen) {
      navigate('/messages', { replace: true, state: null });
      setSelectedUser(pendingOpen);
      setShowProfile(false);
      setMobileView('chat');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.getConversations().then(({ conversations }) => setConversations(conversations)).catch(() => {});
    api.getConnections().then(({ connections }) => setConnections(connections)).catch(() => {});
  }, []);

  const chatEntries = useMemo(() => {
    const inConv = new Set(
      conversations
        .map((c) => String(c.otherUser?._id || c.otherUser?.id))
        .filter(Boolean)
    );
    const entries = [...conversations];
    connections
      .filter((conn) => {
        const id = String(conn._id || conn.id);
        return id && !inConv.has(id);
      })
      .forEach((conn) => {
        entries.push({ otherUser: conn, lastMessage: null, unread: 0 });
      });
    return entries;
  }, [conversations, connections]);

  const handleSelect = (u) => {
    setSelectedUser(u);
    setShowProfile(false);
    setMobileView('chat');
  };

  const handleBack = () => {
    if (window.history.state?.messagesChat) {
      window.history.back();
    } else {
      setSelectedUser(null);
      setShowProfile(false);
      setMobileView('list');
    }
  };

  useEffect(() => {
    if (mobileView !== 'chat' || !selectedUser) return;
    window.history.pushState({ messagesChat: true }, '');
    const onPop = () => {
      setSelectedUser(null);
      setShowProfile(false);
      setMobileView('list');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [mobileView, selectedUser]);

  return (
    <div className="ms-app">
      <ChatSidebar
        user={user}
        conversations={chatEntries}
        connections={connections}
        selectedId={selectedUser?.id || selectedUser?._id}
        onSelect={handleSelect}
        onNew={() => setMobileView('list')}
        force={mobileView === 'list'}
      />

      {selectedUser ? (
        <ChatThread
          user={user}
          otherUser={selectedUser}
          force={mobileView === 'chat'}
          onBack={handleBack}
          onOpenProfile={() => setShowProfile((s) => !s)}
        />
      ) : (
        <section className="ms-col ms-thread ms-thread-empty">
          <div className="ms-empty-state">
            <span className="ms-empty-icon"><Send size={26} /></span>
            <h3>Your Messages</h3>
            <p>Pick a friend below to start chatting — no conversation yet? Just tap them.</p>
          </div>
        </section>
      )}

      {showProfile && (
        <ProfilePanel
          otherUser={selectedUser}
          onClose={() => setShowProfile(false)}
          onBackToList={handleBack}
        />
      )}

      <style>{`
        /* ---------- BASE ---------- */
        .ms-app {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr) 360px;
          gap: 20px;
          height: calc(100vh - 48px);
          font-family: 'Manrope', -apple-system, 'Inter', sans-serif;
          color: ${C.ink};
        }
        .ms-col {
          background: ${C.card};
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .ms-avatar {
          position: relative;
          display: inline-flex;
          flex-shrink: 0;
          border-radius: 50%;
        }
        .ms-avatar img { display: block; object-fit: cover; }
        .ms-online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          background: ${C.success};
          border: 2.5px solid ${C.card};
          border-radius: 50%;
        }
        .ms-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: ${C.sub};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .ms-icon-btn:hover { background: ${C.blueSoft}; color: ${C.blue}; }

        /* ---------- SIDEBAR ---------- */
        .ms-sidebar { display: flex; flex-direction: column; padding: 20px 14px 14px; }
        .ms-profile-card { padding: 6px 8px 14px; }
        .ms-profile-row { display: flex; align-items: center; gap: 12px; }
        .ms-profile-text { flex: 1; min-width: 0; }
        .ms-profile-name { display: block; font-weight: 700; font-size: 15px; color: ${C.blue}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ms-profile-sub { display: block; font-size: 12.5px; color: ${C.sub}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .ms-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: ${C.bg};
          border-radius: 50px;
          padding: 11px 18px;
          margin-bottom: 16px;
        }
        .ms-search-icon { color: ${C.sub}; flex-shrink: 0; }
        .ms-search-wrap input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          color: ${C.ink};
          font-family: inherit;
        }
        .ms-search-wrap input::placeholder { color: ${C.sub}; }

        .ms-circles-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: ${C.sub};
          padding: 4px 8px;
        }
        .ms-circles-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 12px 8px 16px;
          scrollbar-width: none;
          border-top: 1px solid grey;
          border-bottom: 1px solid grey;
        }
        .ms-circles-row::-webkit-scrollbar { display: none; }
        .ms-circle, .ms-circle-add {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          border: none;
          background: none;
          flex-shrink: 0;
          width: 56px;
        }
        .ms-circle span { font-size: 11px; color: ${C.sub}; font-weight: 600; max-width: 56px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ms-circle-add {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: ${C.blueSoft};
          color: ${C.blue};
          justify-content: center;
          margin-top: 4px;
        }

        .ms-list-head { padding: 6px 8px 10px; }
        .ms-list-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: ${C.sub};
        }

        .ms-conv-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 2px;
        }
        .ms-conv {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-top: 0;
          background: transparent;
          border-radius: 20px;
          text-align: left;
          width: 100%;
          transition: background 0.15s ease;
        }
        .ms-conv:hover { background: ${C.bg}; }
        .ms-conv.active { background: ${C.blueSoft}; }
        .ms-conv-mid { flex: 1; min-width: 0; }
        .ms-conv-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .ms-conv-name { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ms-conv-time { font-size: 11px; color: ${C.sub}; flex-shrink: 0; }
        .ms-conv-bot { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
        .ms-conv-preview {
          flex: 1;
          font-size: 12.5px;
          color: ${C.sub};
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ms-tick { color: ${C.blue}; flex-shrink: 0; }
        .ms-tick-sent { color: rgba(255,255,255,0.65); flex-shrink: 0; }
        .ms-tick-delivered { color: rgba(255,255,255,0.65); flex-shrink: 0; }
        .ms-tick-seen { color: #7fd8ff; flex-shrink: 0; }
        .ms-unread {
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: ${C.blue};
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ms-empty-list { text-align: center; padding: 30px 10px; color: ${C.sub}; }
        .ms-empty-list p { margin: 0 0 4px; font-weight: 700; color: ${C.ink}; }
        .ms-empty-list span { font-size: 12.5px; }

        /* ---------- THREAD ---------- */
        .ms-thread { display: flex; flex-direction: column; }
        .ms-thread-head {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 22px;
          border-bottom: 1px solid ${C.line};
        }
        .ms-thread-user { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; }
        .ms-thread-meta { display: flex; flex-direction: column; }
        .ms-thread-name { font-weight: 700; font-size: 15px; }
        .ms-thread-status { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: ${C.sub}; margin-top: 1px; }
        .ms-status-dot { width: 8px; height: 8px; border-radius: 50%; background: ${C.success}; display: inline-block; }
        .ms-thread-actions { display: flex; gap: 4px; }
        .ms-back-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: ${C.bg};
          color: ${C.ink};
          display: none;
          align-items: center;
          justify-content: center;
        }

        .ms-thread-body {
          flex: 1;
          overflow-y: auto;
          padding: 26px 28px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ms-thread-loading { display: flex; flex-direction: column; gap: 12px; }

        .ms-timeline {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 18px 0;
          color: ${C.sub};
        }
        .ms-timeline::before, .ms-timeline::after {
          content: '';
          flex: 1;
          height: 1px;
          background: ${C.line};
        }
        .ms-timeline span { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }

        .ms-bubble-row { display: flex; align-items: flex-end; gap: 8px; max-width: 78%; }
        .ms-bubble-row.mine { align-self: flex-end; flex-direction: row-reverse; }
        .ms-bubble-row.theirs { align-self: flex-start; }
        .ms-bubble-avatar-slot { width: 28px; flex-shrink: 0; }
        .ms-bubble-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
        .ms-bubble {
          padding: 11px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          min-width: 60px;
        }
        .ms-bubble.mine {
          background: ${C.blue};
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .ms-bubble.theirs {
          background: ${C.blueSoft};
          color: ${C.ink};
          border-bottom-left-radius: 4px;
        }
        .ms-bubble.pdf { padding: 10px; }
        .ms-bubble-text { display: block; white-space: pre-wrap; word-break: break-word; }
        .ms-bubble-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          font-size: 10.5px;
          opacity: 0.7;
          margin-top: 4px;
        }
        .ms-seen { opacity: 1; }
        .ms-pdf-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: ${C.bg};
          border-radius: 14px;
          padding: 10px 12px;
          margin-bottom: 6px;
        }
        .ms-pdf-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #FEF0F0;
          color: #F46A6A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ms-pdf-meta { display: flex; flex-direction: column; }
        .ms-pdf-meta strong { font-size: 13px; font-weight: 700; }
        .ms-pdf-meta small { font-size: 11.5px; opacity: 0.7; }

        .ms-share-card {
          display: flex;
          align-items: stretch;
          gap: 10px;
          background: ${C.bg};
          border-radius: 14px;
          padding: 8px;
          margin-bottom: 8px;
          border: none;
          cursor: pointer;
          text-align: left;
          min-width: 220px;
          max-width: 300px;
        }
        .ms-share-card:hover { opacity: 0.92; }
        .ms-share-thumb {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          background: #000;
        }
        .ms-share-noimg {
          width: 64px;
          height: 64px;
          border-radius: 10px;
          background: #e4ecff;
          color: ${C.blue};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ms-share-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ms-share-body strong {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: ${C.ink};
        }
        .ms-share-author { font-size: 12px; font-weight: 600; color: ${C.blue}; }
        .ms-share-caption {
          font-size: 11.5px;
          color: ${C.sub};
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .ms-bubble.mine .ms-share-card { background: rgba(255,255,255,0.16); }
        .ms-bubble.mine .ms-share-body strong { color: #fff; }
        .ms-bubble.mine .ms-share-author { color: #d9ecff; }
        .ms-bubble.mine .ms-share-caption { color: rgba(255,255,255,0.85); }

        .ms-attach-msg { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }
        .ms-attach-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: ${C.bg};
          border-radius: 12px;
          padding: 6px;
          text-decoration: none;
          color: ${C.ink};
        }
        .ms-bubble.mine .ms-attach-item { background: rgba(255,255,255,0.16); color: #fff; }
        .ms-attach-img { width: 180px; max-height: 220px; border-radius: 10px; object-fit: cover; display: block; }
        .ms-attach-file-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #FEF0F0;
          color: #F46A6A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ms-attach-file-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .ms-attach-file-meta strong { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ms-attach-file-meta small { font-size: 11px; opacity: 0.7; }
        .ms-attach-dl { color: ${C.sub}; flex-shrink: 0; opacity: 0.8; }

        .ms-attach-previews {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 0 2px 4px;
          width: 100%;
        }
        .ms-attach-preview {
          position: relative;
          flex-shrink: 0;
          width: 64px;
          height: 64px;
        }
        .ms-attach-preview img, .ms-attach-preview video {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          object-fit: cover;
        }
        .ms-attach-preview-file {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          background: ${C.blueSoft};
          color: ${C.blue};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ms-attach-remove {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: #fff;
          color: #d1453b;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
        }

        .ms-shared-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 120;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .ms-shared-inner {
          position: relative;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 24px;
          padding: 14px;
        }
        .ms-shared-loading { min-height: 300px; display: flex; align-items: center; }
        .ms-shared-close {
          position: absolute;
          top: 22px;
          right: 22px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.55);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
        }

        .ms-composer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          border-top: 1px solid ${C.line};
        }
        .ms-composer-input-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${C.bg};
          border-radius: 50px;
          padding: 6px 10px 6px 18px;
        }
        .ms-composer-input-wrap input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 14px;
          padding: 10px 4px;
          color: ${C.ink};
          font-family: inherit;
        }
        .ms-composer-input-wrap input::placeholder { color: ${C.sub}; }
        .ms-composer-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: ${C.sub};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .ms-composer-icon:hover { background: #fff; color: ${C.blue}; }
        .ms-send-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: ${C.blue};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(79, 142, 247, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          flex-shrink: 0;
        }
        .ms-send-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(79, 142, 247, 0.45); }
        .ms-send-btn:active { transform: scale(0.96); }
        .ms-send-btn:disabled { opacity: 0.4; transform: none; box-shadow: none; }

        .ms-thread-empty { align-items: center; justify-content: center; }
        .ms-empty-state { text-align: center; padding: 40px; }
        .ms-empty-icon {
          width: 70px;
          height: 70px;
          border-radius: 24px;
          background: ${C.blueSoft};
          color: ${C.blue};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .ms-empty-state h3 { margin: 0 0 6px; font-size: 18px; font-weight: 700; }
        .ms-empty-state p { margin: 0; color: ${C.sub}; font-size: 14px; }

        /* ---------- RIGHT PANEL ---------- */
        .ms-profile-panel { position: relative; display: flex; flex-direction: column; padding: 20px 18px; overflow-y: auto; }
        .ms-pp-center { text-align: center; padding: 8px 0 20px; }
        .ms-pp-center .ms-avatar { display: inline-flex; }
        .ms-pp-name { margin: 14px 0 2px; font-size: 19px; font-weight: 700; }
        .ms-pp-sub { font-size: 13.5px; color: ${C.sub}; }
        .ms-pp-actions { display: flex; justify-content: center; gap: 14px; margin: 20px 0 18px; }
        .ms-pp-action-btn {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          border: none;
          background: ${C.blue};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(79, 142, 247, 0.35);
          transition: transform 0.15s ease;
        }
        .ms-pp-action-btn:hover { transform: translateY(-2px); }
        .ms-pp-quick { display: flex; gap: 10px; justify-content: center; }
        .ms-pp-quick-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 20px;
          border: 1px solid ${C.line};
          background: ${C.card};
          font-size: 12.5px;
          font-weight: 600;
          color: ${C.ink};
          transition: all 0.15s ease;
        }
        .ms-pp-quick-btn:hover { border-color: ${C.blue}; color: ${C.blue}; }
        .ms-divider { height: 1px; background: ${C.line}; margin: 6px 0 18px; }
        .ms-pp-section { flex: 1; }
        .ms-pp-section-title { margin: 0 0 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${C.sub}; }
        .ms-attach-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ms-attach-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 18px 10px;
          border-radius: 20px;
          border: 1px solid ${C.line};
          background: ${C.card};
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .ms-attach-card:hover { border-color: ${C.blue}; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(79,142,247,0.12); }
        .ms-attach-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ms-attach-label { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; color: ${C.ink}; }
        .ms-view-all-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          margin-top: 14px;
          border-radius: 20px;
          border: 1px solid ${C.line};
          background: ${C.card};
          font-size: 13px;
          font-weight: 700;
          color: ${C.blue};
          transition: all 0.15s ease;
        }
        .ms-view-all-btn:hover { border-color: ${C.blue}; background: ${C.blueSoft}; }
        .ms-pp-close {
          position: absolute;
          top: 18px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: ${C.bg};
          color: ${C.sub};
          display: none;
          align-items: center;
          justify-content: center;
        }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 1100px) {
          .ms-app { grid-template-columns: 300px minmax(0, 1fr); }
          .ms-profile-panel {
            position: fixed;
            top: 24px;
            right: 24px;
            bottom: 24px;
            width: 360px;
            z-index: 60;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          }
          .ms-pp-close { display: flex; }
        }
        @media (max-width: 860px) {
          .ms-app { grid-template-columns: 1fr; }
          .ms-sidebar { display: none; }
          .ms-sidebar.force { display: flex; }
          .ms-thread { display: none; }
          .ms-thread.force { display: flex; }
        }
      `}</style>
    </div>
  );
}
