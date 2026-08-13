import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, MapPin, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import * as api from '../api';
import MediaEditor from '../components/MediaEditor.jsx';
import { isVideoFile, prepareVideoFile, blobToDataUrl } from '../utils/media.js';

export default function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [ratios, setRatios] = useState([]);
  const [adjusts, setAdjusts] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [queue, setQueue] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [compressName, setCompressName] = useState('');

  useEffect(() => {
    if (editIndex == null && queue.length > 0) {
      setEditIndex(0);
    }
  }, [queue, editIndex]);

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    for (const file of files) {
      if (images.length + queue.length >= 4) break;

      try {
        let data;
        let isVideo;

        if (isVideoFile(file)) {
          setCompressing(true);
          setCompressName(file.name);
          setCompressProgress(0);

          data = await prepareVideoFile(file, {
            onProgress: setCompressProgress,
          });

          isVideo = true;
        } else {
          data = await blobToDataUrl(file);
          isVideo = false;
        }

        setQueue((prev) => [
          ...prev,
          {
            data,
            isVideo,
          },
        ]);

        setError('');
      } catch (err) {
        setError(err?.message || 'Could not read this file.');
      }
    }

    setCompressing(false);
  };

  const handleEditorConfirm = (res) => {
    setImages((prev) => [...prev, res.data]);
    setRatios((prev) => [...prev, res.ratio]);
    setAdjusts((prev) => [...prev, res.adjust]);
    setMediaTypes((prev) => [
      ...prev,
      res.isVideo ? 'video' : 'image',
    ]);

    setQueue((prev) => prev.slice(1));
    setEditIndex(null);
  };

  const handleEditorCancel = () => {
    setQueue((prev) => prev.slice(1));
    setEditIndex(null);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setRatios((prev) => prev.filter((_, i) => i !== index));
    setAdjusts((prev) => prev.filter((_, i) => i !== index));
    setMediaTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (images.length === 0 && !caption.trim()) return;

    setBusy(true);
    setError('');

    try {
      await api.createPost({
        caption: caption.trim(),
        images,
        ratios,
        adjusts,
        mediaTypes,
        location: location.trim(),
      });

      // Post uploaded successfully
      navigate('/');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to create post'
      );
    } finally {
      setBusy(false);
    }
  };

  const current =
    editIndex != null ? queue[editIndex] : null;

  return (
    <div className="create-page">
      <div className="create-topbar">
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>

        <h2>New Post</h2>

        <button
          className="post-btn"
          onClick={handlePost}
          disabled={
            busy ||
            (images.length === 0 && !caption.trim())
          }
        >
          {busy ? '...' : <Send size={18} />}
        </button>
      </div>

      <div className="create-user-row">
        <img
          src={user?.avatar}
          alt=""
          className="create-avatar"
        />

        <span className="create-username">
          {user?.username}
        </span>
      </div>

      {compressing && (
        <div className="create-compress">
          <Loader2 size={22} className="spin" />

          <span>
            Reading video…{' '}
            {Math.round(compressProgress * 100)}%
          </span>

          <small>{compressName}</small>
        </div>
      )}

      {images.length > 0 && (
        <div className="create-preview-grid">
          {images.map((img, i) => (
            <div
              key={i}
              className="preview-item"
            >
              {mediaTypes[i] === 'video' ? (
                <video
                  src={img}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="preview-video"
                />
              ) : (
                <img
                  src={img}
                  alt=""
                />
              )}

              <span className="preview-ratio">
                {ratios[i]}
              </span>

              <button
                className="remove-img"
                onClick={() => removeImage(i)}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {images.length + queue.length < 4 && (
            <button
              className="add-more-btn"
              onClick={() => fileRef.current?.click()}
            >
              <Video size={24} />
              Add more
            </button>
          )}
        </div>
      )}

      {images.length === 0 && queue.length === 0 && (
        <div
          className="create-upload-area"
          onClick={() => fileRef.current?.click()}
        >
          <div className="upload-icon">
            <Video
              size={40}
              strokeWidth={1.5}
            />
          </div>

          <p>Tap to add photos or videos</p>

          <span>
            Up to 4 media · videos max 2 minutes
          </span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi"
        multiple
        hidden
        onChange={handleFile}
      />

      <div className="create-form">
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) =>
            setCaption(e.target.value)
          }
          maxLength={2200}
          rows={4}
        />

        <div className="caption-count">
          {caption.length}/2200
        </div>

        <div className="location-input">
          <MapPin size={16} />

          <input
            placeholder="Add location"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
          />
        </div>
      </div>

      {error && (
        <p className="create-error">
          {error}
        </p>
      )}

      {current && (
        <MediaEditor
          media={current}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}

      <style>{`
        .create-page {
          animation: floatIn 0.35s ease;
          max-width: 500px;
          margin: 0 auto;
        }

        .create-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .create-topbar h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 20px;
        }

        .back-btn,
        .post-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-btn {
          background: var(--surface);
          box-shadow: var(--shadow-card);
          color: var(--ink);
        }

        .post-btn {
          background: var(--gradient-warm);
          color: #fff;
          font-weight: 700;
        }

        .post-btn:disabled {
          opacity: 0.4;
        }

        .create-user-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .create-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
        }

        .create-username {
          font-weight: 700;
          font-size: 14px;
        }

        .create-upload-area {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          margin-bottom: 16px;
          border: 2px dashed var(--border);
        }

        .upload-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--accent-purple-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          color: var(--accent-purple);
        }

        .create-upload-area p {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
        }

        .create-upload-area span {
          font-size: 13px;
          color: var(--ink-faint);
        }

        .create-compress {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 16px 18px;
          margin-bottom: 16px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
        }

        .create-compress small {
          color: var(--ink-faint);
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spin {
          animation: spin 1s linear infinite;
          color: var(--accent-purple);
        }

        .create-preview-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(120px, 1fr)
          );
          gap: 10px;
          margin-bottom: 16px;
        }

        .preview-item {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 1;
        }

        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-item .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-ratio {
          position: absolute;
          left: 6px;
          bottom: 6px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 8px;
        }

        .remove-img {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-more-btn {
          aspect-ratio: 1;
          border-radius: 14px;
          border: 2px dashed var(--border);
          background: var(--surface-soft);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: var(--ink-faint);
          font-weight: 600;
        }

        .create-form {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 18px;
        }

        .create-form textarea {
          width: 100%;
          border: none;
          outline: none;
          font-size: 15px;
          resize: none;
          background: transparent;
          color: var(--ink);
          min-height: 100px;
        }

        .caption-count {
          text-align: right;
          font-size: 12px;
          color: var(--ink-faint);
          margin-bottom: 12px;
        }

        .location-input {
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid var(--border);
          padding-top: 12px;
          color: var(--ink-faint);
        }

        .location-input input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
        }

        .create-error {
          color: #d1453b;
          font-size: 13px;
          margin: 12px 0 0;
        }
      `}</style>
    </div>
  );
}
