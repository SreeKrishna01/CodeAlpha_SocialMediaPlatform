import React, { useRef, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import StoryViewer from './StoryViewer.jsx';
import { isVideoFile, prepareVideoFile, blobToDataUrl } from '../utils/media.js';

export default function StoriesBar({ stories = [], loading, onCreateStory, onDeleteStory }) {
  const { user } = useAuth();
  const fileRef = useRef();
  const [viewerAuthorId, setViewerAuthorId] = useState(null);
  const [viewedIds, setViewedIds] = useState(() => new Set());
  const [myStory, setMyStory] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const myStories = stories.filter(
    (s) => (s.author?._id === user?.id || s.author === user?.id)
  );

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError('');
    try {
      let mediaData;
      let mediaType;
      if (isVideoFile(file)) {
        setUploading(true);
        mediaData = await prepareVideoFile(file);
        mediaType = 'video';
        setUploading(false);
      } else {
        mediaData = await blobToDataUrl(file);
        mediaType = 'image';
      }

      if (onCreateStory) {
        const created = await onCreateStory(mediaData, mediaType);
        if (created) setMyStory((prev) => [created, ...(prev || [])]);
      }
    } catch (err) {
      setUploading(false);
      setError(err?.message || 'Could not upload this story.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const allStories = Array.from(
    new Map(
      [...(myStory || []), ...stories].map((s) => [s._id, s])
    ).values()
  );

  const ownStory = myStories[0] || (myStory && myStory[0]);
  const ownViewed =
    ownStory &&
    (viewedIds.has(ownStory._id) ||
      ownStory.viewedBy?.some((id) => String(id) === String(user?.id)));

  const openStory = (story) => {
    const authorId = story.author?._id || story.author;
    setViewerAuthorId(authorId);
  };

  const handleViewed = (storyId) => {
    setViewedIds((prev) => new Set(prev).add(storyId));
  };

  const handleDeleteStory = (storyId) => {
    setMyStory((prev) => (prev || []).filter((s) => s._id !== storyId));
    onDeleteStory?.(storyId);
    setViewerAuthorId(null);
  };

  return (
    <div className="stories-bar">
      {myStories.length > 0 ? (
        <button className="story-item your-story" onClick={() => openStory(myStories[0])}>
          <span className={`story-ring has-story ${ownViewed ? 'viewed' : ''}`}>
            <img src={user?.avatar} alt="" />
          </span>
          <span className="story-name">Your story</span>
        </button>
      ) : (
        <button className="story-item your-story" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <span className="story-ring your-story-ring">
            <span className="add-story-btn">{uploading ? <Loader2 size={18} color="#fff" className="spin" /> : <Plus size={20} color="#fff" strokeWidth={2.5} />}</span>
          </span>
          <span className="story-name">{uploading ? 'Compressing…' : 'Your story'}</span>
        </button>
      )}

      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="story-item">
            <span className="story-ring skeleton" style={{ width: 66, height: 66, borderRadius: '50%' }} />
            <span className="skeleton" style={{ width: 44, height: 10, marginTop: 8 }} />
          </div>
        ))}

      {!loading &&
        allStories.map((story) => {
          const viewed =
            viewedIds.has(story._id) ||
            story.viewedBy?.some((id) => String(id) === String(user?.id));
          return (
            <button key={story._id} className="story-item" onClick={() => openStory(story)}>
              <span className={`story-ring has-story ${viewed ? 'viewed' : ''}`}>
                <img src={story.author?.avatar} alt={story.author?.name} />
              </span>
              <span className="story-name">
                {story.author?.name?.split(' ')[0]}
                <span className="dot-online" />
              </span>
            </button>
          );
        })}

      <input ref={fileRef} type="file" accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi" hidden onChange={handleFile} />

      {error && <div className="story-error">{error}</div>}

      {viewerAuthorId && (
        <StoryViewer
          stories={allStories}
          initialAuthorId={viewerAuthorId}
          onClose={() => setViewerAuthorId(null)}
          onViewed={handleViewed}
          onDeleteStory={handleDeleteStory}
        />
      )}
    </div>
  );
}
