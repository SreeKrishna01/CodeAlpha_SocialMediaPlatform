import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, BadgeCheck, Play, Pause } from 'lucide-react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import CommentSheet from '../components/CommentSheet.jsx';
import AutoPlayVideo from '../components/AutoPlayVideo.jsx';
import ShareSheet from '../components/ShareSheet.jsx';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

function ReelCard({ post, isActive, saved = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.some((l) => l._id === user?.id || l === user?.id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const tapTimer = useRef(null);

  const handleCommentsUpdate = (updated) => setComments(updated);

  const handleSave = async () => {
    if (!user) return;
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const { saved: serverSaved } = await api.toggleSavePost(post._id);
      setIsSaved(serverSaved);
    } catch {
      setIsSaved(prev);
    }
  };

  const handleLike = async () => {
    if (!user || busy) return;
    setBusy(true);
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => (prev ? c - 1 : c + 1));
    try {
      const { liked: sl, likesCount: sc } = await api.likePost(post._id);
      setLiked(sl);
      setLikesCount(sc);
    } catch { setLiked(prev); setLikesCount((c) => (prev ? c + 1 : c - 1)); }
    setBusy(false);
  };

  const triggerBurst = () => {
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 800);
  };

  const handleMediaTap = () => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      handleLike();
      triggerBurst();
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      setPausedByUser((p) => !p);
    }, 260);
  };

  const isVideo =
    /\.(mp4|webm|mov|m4v|mkv|avi|3gp|ogv)$/i.test(post.images?.[0] || '') ||
    (post.images?.[0] || '').startsWith('data:video/');

  return (
    <div className={`reel-card ${isActive ? 'active' : ''}`}>
      {post.images?.[0] && (
        <div className="reel-media" onClick={handleMediaTap}>
          {isVideo ? (
            <AutoPlayVideo src={post.images[0]} loop adjust={post.adjusts?.[0] || null} pausedByUser={pausedByUser} />
          ) : (
            <img src={post.images[0]} alt="" />
          )}
          <div className="reel-gradient" />
          {isVideo && (
            <button
              className={`reel-play-btn ${pausedByUser ? 'visible' : ''}`}
              onClick={(e) => { e.stopPropagation(); setPausedByUser((p) => !p); }}
              title={pausedByUser ? 'Play' : 'Pause'}
            >
              {pausedByUser ? <Play size={26} fill="#fff" /> : <Pause size={26} fill="#fff" />}
            </button>
          )}
          {heartBurst && (
            <div className="reel-heart-burst">
              <Heart size={90} fill="#ff3b5c" color="#ff3b5c" />
            </div>
          )}
        </div>
      )}

      <div className="reel-sidebar">
        <button className={`reel-action ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <Heart size={26} fill={liked ? '#ff3b5c' : 'none'} color={liked ? '#ff3b5c' : '#fff'} />
          <span>{likesCount}</span>
        </button>
        <button className="reel-action" onClick={() => setShowComments(true)}>
          <MessageCircle size={26} color="#fff" />
          <span>{comments.length}</span>
        </button>
        <button className="reel-action" onClick={() => setShowShare(true)}>
          <Send size={24} color="#fff" />
          <span>{post.shares || 0}</span>
        </button>
        <button className={`reel-action ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
          <Bookmark size={24} color="#fff" fill={isSaved ? '#fff' : 'none'} />
        </button>
      </div>

      <div className="reel-bottom">
        <div className="reel-author">
           <div onClick={() => navigate(`/profile/${post.author?.username}`)}>
             <img src={post.author?.avatar} alt="" className="reel-author-img" />
           </div>
          <span className="reel-author-name"  onClick={() => navigate(`/profile/${post.author?.username}`)}>
            {post.author?.name}
            {post.author?.verified && <BadgeCheck size={14} fill="#3897f0" color="#fff" />}
          </span>
          <button className="reel-follow-btn">Follow</button>
        </div>
        {post.caption && <p className="reel-caption">{post.caption}</p>}
        {post.location && <span className="reel-location">📍 {post.location}</span>}
      </div>

      {showComments && (
        <div className="reel-comments-overlay" onClick={() => setShowComments(false)}>
          <div className="reel-comments-sheet" onClick={(e) => e.stopPropagation()}>
            <CommentSheet
              post={{ ...post, comments }}
              onClose={() => setShowComments(false)}
              onCommentsChange={handleCommentsUpdate}
            />
          </div>
        </div>
      )}

      {showShare && (
        <ShareSheet post={post} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const containerRef = useRef();

  useEffect(() => {
    api.fetchFeed(1, 'for-you').then(({ posts }) => {
      setPosts(posts);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.getSavedPosts().then(({ savedIds }) => setSavedIds(new Set(savedIds))).catch(() => {});
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    setActiveIndex(index);
  }, []);

  if (loading) {
    return (
      <div className="explore-loading">
        <div className="skeleton" style={{ height: '80vh', borderRadius: 26 }} />
      </div>
    );
  }

  return (
    <div className="explore-page" ref={containerRef} onScroll={handleScroll}>
      
      <div className="reels-container">
        {posts.map((post, i) => (
          <ReelCard key={post._id} post={post} isActive={i === activeIndex} saved={savedIds.has(post._id)} />
        ))}
      </div>

      <style>{`
       .explore-page {
          height: 100vh;
          height: 100dvh;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          position: relative;
          margin: -16px -24px;
        }
        @media (max-width: 900px) {
          .explore-page {
            margin: -12px -12px calc(-90px - env(safe-area-inset-bottom, 0px));
          }
        }
        .explore-page::-webkit-scrollbar { display: none; }
        
       
        .reel-counter { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; }
        .reels-container { display: flex; flex-direction: column; }
        .reel-card {
          scroll-snap-align: start;
          height: calc(100vh - 48px);
          position: relative;
          overflow: hidden;
          background: #000;
        }
        .reel-media { width: 100%; height: 100%; }
        .reel-media img { width: 100%; height: 100%; object-fit: cover; }
        .reel-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          pointer-events: none;
        }
        .reel-media { cursor: pointer; }
        .reel-play-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 6;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.45);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: auto;
        }
        .reel-play-btn.visible { opacity: 1; }
        .reel-heart-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 8;
          pointer-events: none;
          animation: reel-heart-pop 0.8s ease-out forwards;
        }
        @keyframes reel-heart-pop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
        .reel-sidebar {
          position: absolute;
          right: 14px;
          bottom: 160px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          z-index: 10;
        }
        .reel-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .reel-action.liked { color: #ff3b5c; }
        .reel-bottom {
          position: absolute;
          bottom: 24px;
          left: 16px;
          right: 70px;
          z-index: 10;
        }
        .reel-author {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .reel-author-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #fff;
          object-fit: cover;
        }
        .reel-author-name {
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .reel-follow-btn {
          padding: 5px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.15);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(4px);
        }
        .reel-caption { color: #fff; font-size: 13.5px; margin: 6px 0 4px; line-height: 1.4; }
        .reel-location { color: rgba(255,255,255,0.7); font-size: 12px; }
        .reel-comments-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 20;
          display: flex;
          align-items: flex-end;
        }
        .reel-comments-sheet {
          width: 100%;
          max-height: 60vh;
        }
        .explore-loading { padding: 20px 0; }
      `}</style>
    </div>
  );
}
