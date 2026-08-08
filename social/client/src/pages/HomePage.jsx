import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import StoriesBar from '../components/StoriesBar.jsx';
import FeedTabs from '../components/FeedTabs.jsx';
import PostCard from '../components/PostCard.jsx';
import SuggestionCard from '../components/SuggestionCard.jsx';
import * as api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [tab, setTab] = useState('for-you');
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const loadPosts = (pageNum, tabKey) => {
    return api.fetchFeed(pageNum, tabKey, user?.id).then(({ posts: newPosts, hasMore: more }) => {
      if (pageNum === 1) {
        setPosts(shuffle(newPosts));
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(more);
    });
  };

  useEffect(() => {
    api.fetchStories().then(({ stories }) => { setStories(stories); setLoadingStories(false); }).catch(() => setLoadingStories(false));
    loadPosts(1, tab).then(() => setLoadingPosts(false)).catch((err) => {
      setError(err?.response?.status ? 'Could not load the feed.' : 'Cannot reach the server.');
      setLoadingPosts(false);
    });
    api.getSuggestions().then(({ suggestions }) => setSuggestions(suggestions)).catch(() => {});
    api.getSavedPosts().then(({ savedIds }) => setSavedIds(new Set(savedIds))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingPosts(true);
    setPage(1);
    loadPosts(1, tab).then(() => setLoadingPosts(false)).catch(() => setLoadingPosts(false));
  }, [tab]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    loadPosts(next, tab).then(() => { setPage(next); setLoadingMore(false); }).catch(() => setLoadingMore(false));
  };

  const handleStoryCreate = async (mediaData, mediaType) => {
    try {
      const { story } = await api.createStory({ image: mediaData, mediaType });
      setStories((prev) => [story, ...prev]);
      return story;
    } catch {
      return null;
    }
  };

  const handleStoryDelete = (storyId) => {
    setStories((prev) => prev.filter((s) => s._id !== storyId));
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <div>
      <TopBar />
      <StoriesBar stories={stories} loading={loadingStories} onCreateStory={handleStoryCreate} onDeleteStory={handleStoryDelete} />
      <FeedTabs active={tab} onChange={setTab} />

      {error && <div className="feed-error">{error}</div>}

      {tab === 'for-you' && suggestions.length > 0 && (
        <div className="suggestions-section">
          <div className="suggestions-header">
            <h3>Suggested for you</h3>
          </div>
          <div className="suggestions-scroll">
            {suggestions.map((s) => (
              <SuggestionCard key={s._id} suggestion={s} />
            ))}
          </div>
        </div>
      )}

      {loadingPosts && Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 380, marginBottom: 18, borderRadius: 26 }} />
      ))}

      {!loadingPosts && posts.map((post, i) => (
        <React.Fragment key={post._id}>
          <PostCard
            post={post}
            saved={savedIds.has(post._id)}
            onSavedChange={(id, isSaved) =>
              setSavedIds((prev) => {
                const next = new Set(prev);
                if (isSaved) next.add(id); else next.delete(id);
                return next;
              })
            }
            onDelete={() => handlePostDelete(post._id)}
          />
          {i === 2 && tab === 'for-you' && (
            <div className="suggestions-inline">
              <h4>People you may know</h4>
              {suggestions.slice(0, 3).map((s) => (
                <SuggestionCard key={s._id} suggestion={s} inline />
              ))}
            </div>
          )}
        </React.Fragment>
      ))}

      {!loadingPosts && posts.length === 0 && !error && (
        <p className="empty-feed">
          {tab === 'following' ? 'Follow someone to see their posts here!' : 'No posts yet. Create the first post!'}
        </p>
      )}

      {hasMore && !loadingPosts && posts.length > 0 && (
        <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}

      <style>{`
        .feed-error {
          background: #fff1ee;
          color: #b8442c;
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 13.5px;
          margin-bottom: 18px;
        }
        .empty-feed {
          text-align: center;
          color: var(--ink-faint);
          font-size: 14px;
          padding: 40px 0;
        }
        .suggestions-section {
          margin-bottom: 6px;
        }
        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .suggestions-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }
        .suggestions-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .suggestions-scroll::-webkit-scrollbar { display: none; }
        .suggestions-inline {
          background: #E1FDB47A;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 13px;
          margin-bottom: 6px;
        }
        .suggestions-inline h4 {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 700;
        }
        .load-more-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 16px;
          background: var(--surface);
          box-shadow: var(--shadow-card);
          font-weight: 700;
          font-size: 14px;
          color: var(--accent-purple);
          margin-top: 8px;
        }
        .load-more-btn:disabled { opacity: 0.5; }
      `}</style>
    </div>
  );
}
