import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function AutoPlayVideo({ src, className = '', controls = false, loop = true, style, adjust, pausedByUser = false }) {
  const videoRef = useRef(null);
  const inViewRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const playIfNeeded = useCallback(() => {
    const v = videoRef.current;
    if (!v || !inViewRef.current) return;
    if (pausedByUser) {
      v.pause();
      return;
    }
    v.muted = muted;
    const p = v.play();
    if (p) {
      p.then(() => setBlocked(false)).catch((err) => {
        if (err?.name === 'NotAllowedError' && !muted) {
          setBlocked(true);
          setMuted(true);
        }
      });
    }
  }, [muted, pausedByUser]);

  useEffect(() => {
    playIfNeeded();
  }, [playIfNeeded]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (pausedByUser) v.pause();
    else if (inViewRef.current) playIfNeeded();
  }, [pausedByUser, playIfNeeded]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          inViewRef.current = en.isIntersecting;
          if (en.isIntersecting) playIfNeeded();
          else v.pause();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.pause();
    };
  }, [playIfNeeded]);

  useEffect(() => {
    const unlock = () => {
      if (!userMuted && muted) {
        setBlocked(false);
        setMuted(false);
      }
    };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, [userMuted, muted]);

  const toggleMute = (e) => {
    e.stopPropagation();
    setUserMuted(true);
    setBlocked(false);
    setMuted((m) => !m);
  };

  return (
    <div className={`autoplay-video ${className}`} style={style}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        loop={loop}
        controls={controls}
        preload="metadata"
        muted={muted}
        className="autoplay-video-el"
        style={adjust ? { transform: `translate(${adjust.x * 50 * (adjust.zoom - 1)}%, ${adjust.y * 50 * (adjust.zoom - 1)}%) scale(${adjust.zoom})`, transformOrigin: 'center' } : undefined}
      />
      <button className="autoplay-mute-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      {blocked && !userMuted && <span className="autoplay-hint">Tap for sound</span>}
      <style>{`
        .autoplay-video { position: relative; width: 100%; height: 100%; }
        .autoplay-video-el {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #000;
        }
        .autoplay-mute-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 5;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          background: rgba(0,0,0,0.45);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(2px);
        }
        .autoplay-mute-btn:hover { background: rgba(0,0,0,0.65); }
        .autoplay-hint {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          color: #fff;
          background: rgba(0,0,0,0.55);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          z-index: 5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
