import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Volume2, VolumeX, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Send } from 'lucide-react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const IMAGE_DURATION = 5000;

export default function StoryViewer({ stories = [], initialAuthorId, onClose, onViewed, onDeleteStory }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const grouped = useMemo(() => {
    const map = new Map();
    stories.forEach((s) => {
      const key = s.author?._id || s.author;
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return Array.from(map.entries()).map(([authorId, sts]) => ({
      authorId,
      author: sts[0].author,
      stories: sts,
    }));
  }, [stories]);

  const [authorIdx, setAuthorIdx] = useState(
    Math.max(0, grouped.findIndex((g) => g.authorId === initialAuthorId))
  );
  const [storyIdx, setStoryIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const touchRef = useRef(null);

  const group = grouped[authorIdx];
  const story = group?.stories[storyIdx];
  const isOwnStory =
    story && String(story.author?._id || story.author) === String(user?.id);

  const markViewed = useCallback((s) => {
    if (s && s._id) {
      api.viewStory(s._id).catch(() => {});
      onViewed?.(s._id);
    }
  }, [onViewed]);

  const goTo = useCallback((nextAuthor, nextStory) => {
    setAuthorIdx(nextAuthor);
    setStoryIdx(nextStory);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) {
      goTo(authorIdx, storyIdx + 1);
    } else if (authorIdx < grouped.length - 1) {
      goTo(authorIdx + 1, 0);
    } else {
      onClose();
    }
  }, [group, grouped.length, authorIdx, storyIdx, goTo, onClose]);

  const prev = useCallback(() => {
    if (!group) return;
    if (storyIdx > 0) {
      goTo(authorIdx, storyIdx - 1);
    } else if (authorIdx > 0) {
      const prevGroup = grouped[authorIdx - 1];
      goTo(authorIdx - 1, prevGroup.stories.length - 1);
    }
  }, [group, grouped, authorIdx, storyIdx, goTo]);

useEffect(() => {
  if (!story) return;
  markViewed(story);
  setProgress(0);

  if (story.mediaType === 'video') {
    return;
  }

  clearInterval(timerRef.current);
  timerRef.current = setInterval(() => {
    if (paused) return;
      setProgress((p) => {
        const nextP = p + 100;
        if (nextP >= IMAGE_DURATION) {
          clearInterval(timerRef.current);
          setTimeout(next, 300);
          return IMAGE_DURATION;
        }
        return nextP;
      });
    }, IMAGE_DURATION / 100);

    return () => clearInterval(timerRef.current);
  }, [story, storyIdx, paused, next, markViewed]);

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    next();
  };

  const handleVideoTime = () => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const handleHoldDown = () => setPaused(true);
  const handleHoldUp = () => setPaused(false);

  const handleTouchStart = (e) => {
    handleHoldDown();
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e) => {
    handleHoldUp();
    const s = touchRef.current;
    touchRef.current = null;
    if (!s || !e.changedTouches[0]) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  const handleReplySend = async () => {
    const text = replyText.trim();
    const author = story?.author;
    if (!text || !author) return;
    const authorId = author._id || author;
    try {
      await api.sendMessage(authorId, { text });
    } catch {}
    navigate('/messages', {
      state: {
        openUser: {
          _id: authorId,
          id: authorId,
          name: author.name,
          username: author.username,
          avatar: author.avatar,
          isOnline: author.isOnline,
        },
      },
    });
    onClose();
  };

  const handleDeleteStory = async () => {
    if (!story || !isOwnStory) return;
    setShowMenu(false);
    try {
      await api.deleteStory(story._id);
      onDeleteStory?.(story._id);
    } catch {}
  };

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.25) {
      prev();
    } else if (x > rect.width * 0.75) {
      next();
    } else {
      setPaused((p) => !p);
    }
  };

  if (!group || !story) return null;

  const isVideo = story.mediaType === 'video';

  return (
    <div className="story-viewer" onClick={onClose}>
      <div className="sv-stage" onClick={(e) => e.stopPropagation()}>
        <div
          className="sv-media"
          onClick={handleTap}
          onMouseDown={handleHoldDown}
          onMouseUp={handleHoldUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
  <video
    ref={videoRef}
    src={story.image}
    autoPlay
    playsInline
    muted={muted}
    onEnded={handleVideoEnded}
    onTimeUpdate={handleVideoTime}
    onClick={(e) => e.stopPropagation()}
  />
) : (
  <img src={story.image} alt="" />
)}
          <div className="sv-shade" />
        </div>

        <div className="sv-nav-arrow sv-prev" onClick={prev}>
          <ChevronLeft size={22} />
        </div>
        <div className="sv-nav-arrow sv-next" onClick={next}>
          <ChevronRight size={22} />
        </div>

  <div className="sv-header">
  <div className="sv-progress-row">
            {group.stories.map((s, i) => (
              <span key={s._id} className="sv-progress-track">
                <span
                  className="sv-progress-fill"
                  style={{
                    width:
                      i < storyIdx
                        ? '100%'
                        : i === storyIdx
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </span>
            ))}
          </div>
          <div className="sv-user-row">
            <img src={story.author?.avatar} alt="" className="sv-avatar" />
            <div className="sv-user-info">
              <span className="sv-name">{story.author?.name}</span>
              <span className="sv-time">Just now</span>
            </div>
            {isVideo && (
              <button className="sv-sound-btn" onClick={() => setMuted((m) => !m)}>
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
            <div className="sv-menu-wrap">
              <button className="sv-sound-btn" onClick={() => setShowMenu((s) => !s)}>
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <div className="sv-menu">
                  {isOwnStory && (
                    <button className="sv-menu-item danger" onClick={handleDeleteStory}>
                      <Trash2 size={15} /> Delete story
                    </button>
                  )}
                  {!isOwnStory && (
                    <button className="sv-menu-item" onClick={() => setShowMenu(false)}>Report</button>
                  )}
                </div>
              )}
            </div>
            <button className="sv-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="sv-reply-row">
          <input
            placeholder={`Reply to ${story.author?.name?.split(' ')[0]}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReplySend();
            }}
          />
          <button className="sv-reply-send" onClick={handleReplySend} disabled={!replyText.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .story-viewer {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: floatIn 0.2s ease;
        }
        .sv-stage {
          position: relative;
          width: min(100vw, 430px);
          height: 100%;
          max-height: 100vh;
          background: #000;
          overflow: hidden;
        }
        .sv-media {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }
        .sv-media img, .sv-media video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .sv-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0,0,0,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.4));
          pointer-events: none;
        }
        .sv-nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
        }
        .sv-prev { left: 8px; }
        .sv-next { right: 8px; }
       .sv-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 12px 0;
  z-index: 10;
}
        .sv-progress-row {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }
       .sv-progress-track {
  flex: 1;
  height: 3px;
  border-radius: 3px;
  background: rgba(255,255,255,0.4);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
        .sv-progress-fill {
          display: block;
          height: 100%;
          background: #fff;
          transition: width 0.1s linear;
        }
        .sv-user-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }
        .sv-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #fff;
        }
        .sv-user-info { display: flex; flex-direction: column; flex: 1; }
        .sv-name { font-weight: 700; font-size: 14px; }
        .sv-time { font-size: 11.5px; color: rgba(255,255,255,0.7); }
        .sv-sound-btn, .sv-close-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sv-menu-wrap { position: relative; }
        .sv-menu {
          position: absolute;
          top: 42px;
          right: 0;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          padding: 6px;
          min-width: 150px;
          z-index: 20;
          animation: floatIn 0.15s ease;
        }
        .sv-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: #202124;
          text-align: left;
        }
        .sv-menu-item:hover { background: #f2f2f7; }
        .sv-menu-item.danger { color: #d1453b; }
        .sv-reply-row {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 8px;
          padding: 12px;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(6px);
          z-index: 10;
        }
        .sv-reply-row input {
          flex: 1;
          padding: 10px 16px;
          border-radius: 22px;
          border: none;
          background: rgba(255,255,255,0.15);
          color: #fff;
          font-size: 14px;
          outline: none;
        }
        .sv-reply-row input::placeholder { color: rgba(255,255,255,0.6); }
        .sv-reply-send {
          padding: 10px 16px;
          border-radius: 22px;
          border: none;
          background: #fff;
          color: #000;
          font-weight: 700;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sv-reply-send:disabled { opacity: 0.45; }
        @media (max-width: 700px) {
          .sv-nav-arrow { display: none; }
        }
      `}</style>
    </div>
  );
}
