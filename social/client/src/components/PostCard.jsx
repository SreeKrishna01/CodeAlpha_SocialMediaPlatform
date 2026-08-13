import React, { useState } from 'react';
import { BadgeCheck, MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Trash2 } from 'lucide-react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import CommentSheet from './CommentSheet.jsx';
import AutoPlayVideo from './AutoPlayVideo.jsx';
import ShareSheet from './ShareSheet.jsx';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
}

function isVideoUrl(url) {
  return (
    typeof url === 'string' &&
    (url.startsWith('data:video/') ||
      /\.(mp4|webm|mov|m4v|mkv|avi|3gp|ogv)$/i.test(url))
  );
}

export default function PostCard({ post, onDelete, saved = false, onSavedChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.some((l) => l._id === user?.id || l === user?.id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [isSaved, setIsSaved] = useState(saved);
  const [showComments, setShowComments] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isOwn = post.author?._id === user?.id || post.author?.id === user?.id;

  const handleCommentsUpdate = (updated) => setComments(updated);

  const handleLike = async () => {
    if (!user || busy) return;
    setBusy(true);
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikesCount((c) => (prevLiked ? c - 1 : c + 1));
    try {
      const { liked: serverLiked, likesCount: serverCount } = await api.likePost(post._id);
      setLiked(serverLiked);
      setLikesCount(serverCount);
    } catch {
      setLiked(prevLiked);
      setLikesCount((c) => (prevLiked ? c + 1 : c - 1));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deletePost(post._id);
      setDeleted(true);
      onDelete?.();
    } catch {}
    setShowMenu(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const { saved: serverSaved } = await api.toggleSavePost(post._id);
      setIsSaved(serverSaved);
      onSavedChange?.(post._id, serverSaved);
    } catch {
      setIsSaved(prev);
    }
  };

  if (deleted) return null;

  const images = post.images?.length ? post.images : [];
  const RATIO_CSS = { '9:16': '9 / 16', '4:5': '4 / 5', '1:1': '1 / 1' };

  return (
    <article className="post-card">
      <div className="post-head"  onClick={() => navigate(`/profile/${post.author?.username}`)}>
        <div className="post-author">
          <img className="author-avatar" src={post.author?.avatar} alt={post.author?.name} />
          <div>
            <p className="author-name">
              {post.author?.name}
              {post.author?.verified && <BadgeCheck size={15} fill="#3897f0" color="#fff" />}
            </p>
            <p className="post-meta">
              {timeAgo(post.createdAt)}{post.location ? ` · ${post.location}` : ''}
            </p>
          </div>
        </div>
        <div className="post-menu-wrap">
          <button className="icon-plain" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="post-menu">
              {isOwn && (
                <button className="menu-item danger" onClick={handleDelete}>
                  <Trash2 size={15} /> Delete
                </button>
              )}
              {!isOwn && (
                <button className="menu-item" onClick={() => setShowMenu(false)}>Report</button>
              )}
              <button className="menu-item" onClick={() => setShowMenu(false)}>Copy link</button>
              <button className="menu-item" onClick={() => setShowMenu(false)}>Share to...</button>
            </div>
          )}
        </div>
      </div>

      {post.caption && <p className="post-caption">{post.caption}</p>}

      {images.length > 0 && (() => {
  const isVideo = isVideoUrl(images[imgIndex]);
  const mediaRatio =
    post.ratios?.[imgIndex] || (isVideo ? '9:16' : '1:1');
  const adjust = post.adjusts?.[imgIndex] || null;

  return (
    <div
      className={`post-media ${
        mediaRatio === '9:16' ? 'post-media--reel' : ''
      }`}
      style={{
        aspectRatio: RATIO_CSS[mediaRatio] || '1 / 1',
      }}
    >
      {isVideo ? (
        <AutoPlayVideo
          src={images[imgIndex]}
          controls
          className="post-video"
          adjust={adjust}
        />
      ) : (
        <img
          src={images[imgIndex]}
          alt=""
          onError={(e) => {
            console.error('IMAGE LOAD FAILED:', images[imgIndex]);
          }}
        />
      )}

      {images.length > 1 && (
        <div className="media-nav">
          {images.map((_, i) => (
            <span
              key={i}
              className={`media-dot ${
                i === imgIndex ? 'active' : ''
              }`}
              onClick={() => setImgIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
})()}

      <div className="post-actions">
        <div className="actions-left">
          <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={22} fill={liked ? '#ff3b5c' : 'none'} color={liked ? '#ff3b5c' : 'currentColor'} strokeWidth={2} />
            <span>{formatCount(likesCount)}</span>
          </button>
          <button className="action-btn" onClick={() => setShowComments(true)}>
            <MessageCircle size={21} />
            <span>{formatCount(comments.length)}</span>
          </button>
          <button
            className="action-btn"
            onClick={() => setShowShare(true)}
          >
            <Send size={20} />
            <span>{formatCount(post.shares || 0)}</span>
          </button>
        </div>
        <button className={`icon-plain ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
          <Bookmark size={20} fill={isSaved ? '#16141f' : 'none'} />
        </button>
      </div>

      {comments.length > 0 && (
        <button className="liked-by" onClick={() => setShowComments(true)}>
          <span className="mini-avatars">
            {comments.slice(0, 3).map((c, i) => (
              <img key={i} src={c.author?.avatar} alt="" style={{ zIndex: 3 - i }} />
            ))}
          </span>
          View all {formatCount(comments.length)} comments
        </button>
      )}

      {showComments && (
        <CommentSheet
          post={{ ...post, comments }}
          onClose={() => setShowComments(false)}
          onCommentsChange={handleCommentsUpdate}
        />
      )}

      {showShare && (
        <ShareSheet post={post} onClose={() => setShowShare(false)} />
      )}

      <style>{`
        .post-card {
          background: var(--surface);
          border-radius: 2%;
          box-shadow: var(--shadow-card);
          padding: 14px;
          margin-bottom: 6px;
          animation: floatIn 0.35s ease;
        }
        .post-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .post-author { display: flex; align-items: center; gap: 10px; }
        .author-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--accent-purple-soft);
        }
        .author-name {
          margin: 0;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .post-meta { margin: 1px 0 0; font-size: 12.5px; color: var(--ink-faint); }
        .icon-plain {
          background: none;
          border: none;
          color: var(--ink-faint);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .post-menu-wrap { position: relative; }
        .post-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--surface);
          border-radius: 14px;
          box-shadow: var(--shadow-soft);
          min-width: 160px;
          z-index: 30;
          padding: 6px;
          animation: floatIn 0.2s ease;
        }
        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: none;
          font-size: 13.5px;
          border-radius: 10px;
          text-align: left;
          color: var(--ink);
        }
        .menu-item:hover { background: var(--surface-soft); }
        .menu-item.danger { color: #d1453b; }
        .post-caption { margin: 0 0 12px; font-size: 14.5px; line-height: 1.5; }
        .post-media {
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
          background: var(--surface-soft);
        }
        .post-media--reel {
          background: #000;
          margin-left: auto;
          margin-right: auto;
          max-width: min(100%, 46vh);
        }
        .post-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .post-media .post-video { width: 100%; height: 100%; object-fit: cover; display: block; background: #000; }
        .media-nav {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 5px;
        }
        .media-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
        }
        .media-dot.active { background: #fff; transform: scale(1.2); }
        .post-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 4px;
        }
        .actions-left { display: flex; gap: 20px; }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--ink-soft);
          font-size: 13.5px;
          font-weight: 700;
        }
        .action-btn.liked { color: #ff3b5c; }
        .liked-by {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          font-size: 13px;
          color: var(--ink-soft);
          background: none;
          border: none;
          padding: 0;
        }
        .liked-by strong { color: var(--ink); font-weight: 700; }
        .mini-avatars { display: flex; }
        .mini-avatars img {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #fff;
          margin-left: -8px;
          object-fit: cover;
        }
        .mini-avatars img:first-child { margin-left: 0; }
      `}</style>
    </article>
  );
}
