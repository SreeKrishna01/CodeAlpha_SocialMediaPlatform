import React, { useRef, useState, useCallback } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';

const RATIO_DIMS = {
  'original': null,
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
};

const RATIO_ASPECT = {
  original: 'auto',
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '9:16': '9 / 16',
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function MediaEditor({ media, onConfirm, onCancel }) {
  const isVideo = media.isVideo;
  const [ratio, setRatio] = useState(isVideo ? '9:16' : 'original');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const ratios = isVideo ? ['9:16'] : ['original', '1:1', '4:5'];

  const setZoomAt = useCallback((nextZoom, cursorX, cursorY) => {
    const nz = clamp(nextZoom, 1, 4);
    setPan((p) => {
      if (nz === zoom) return p;
      const fx = cursorX != null ? cursorX * 2 - 1 : 0;
      const fy = cursorY != null ? cursorY * 2 - 1 : 0;
      const k = zoom / nz;
      return {
        x: clamp(fx + (p.x - fx) * k, -1, 1),
        y: clamp(fy + (p.y - fy) * k, -1, 1),
      };
    });
    setZoom(nz);
  }, [zoom]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (!dragRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPan: { ...pan },
        rect,
        points: {},
        startDist: null,
      };
    }
    dragRef.current.points[e.pointerId] = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const ids = Object.keys(d.points);
    if (e.pointerId in d.points) d.points[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (ids.length > 1) {
      const [a, b] = ids;
      const pa = d.points[a];
      const pb = d.points[b];
      const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      if (d.startDist == null) {
        d.startDist = dist;
      } else if (dist > 0) {
        const cx = (pa.x + pb.x) / 2;
        const cy = (pa.y + pb.y) / 2;
        setZoomAt(
          zoom * (dist / d.startDist),
          (cx - d.rect.left) / d.rect.width,
          (cy - d.rect.top) / d.rect.height
        );
        d.startDist = dist;
      }
      return;
    }
    if (zoom <= 1.001) return;
    const maxShiftX = (d.rect.width * (zoom - 1)) / 2;
    const maxShiftY = (d.rect.height * (zoom - 1)) / 2;
    if (maxShiftX <= 0 && maxShiftY <= 0) return;
    const nx = d.startPan.x + (e.clientX - d.startX) / (maxShiftX || 1);
    const ny = d.startPan.y + (e.clientY - d.startY) / (maxShiftY || 1);
    setPan({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) });
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (!d) return;
    delete d.points[e.pointerId];
    if (Object.keys(d.points).length === 0) dragRef.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = stageRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    setZoomAt(zoom * (e.deltaY < 0 ? 1.1 : 0.9), cx, cy);
  };

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
  if (isVideo) {
    onConfirm({
      data: media.data,
      ratio,
      adjust: { zoom, x: pan.x, y: pan.y },
      isVideo: true,
    });

    return;
  }

  const img = new Image();

  img.onload = () => {
    if (zoom === 1 && pan.x === 0 && pan.y === 0) {
      onConfirm({
        data: media.data,
        ratio,
        adjust: null,
        isVideo: false,
      });

      return;
    }

    const canvas = document.createElement('canvas');

    const scale = zoom;

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    const drawWidth = width / scale;
    const drawHeight = height / scale;

    const sx = (width - drawWidth) / 2 - pan.x * (width - drawWidth) / 2;
    const sy = (height - drawHeight) / 2 - pan.y * (height - drawHeight) / 2;

    ctx.drawImage(
      img,
      sx,
      sy,
      drawWidth,
      drawHeight,
      0,
      0,
      width,
      height
    );

    onConfirm({
      data: canvas.toDataURL('image/jpeg', 0.9),
      ratio,
      adjust: null,
      isVideo: false,
    });
  };

  img.src = media.data;
};
  
  const transform = `translate(${pan.x * 50 * (zoom - 1)}%, ${pan.y * 50 * (zoom - 1)}%) scale(${zoom})`;

  return (
    <div className="me-overlay">
      <div className="me-modal">
        <div className="me-header">
          <button className="me-header-btn" onClick={onCancel}><X size={20} /></button>
          <span className="me-title">{isVideo ? 'Adjust video' : 'Adjust photo'}</span>
          <button className="me-header-btn me-done" onClick={handleConfirm}><Check size={20} /></button>
        </div>

        <div className="me-ratio-row">
          {ratios.map((r) => (
            <button
              key={r}
              className={`me-ratio-btn ${ratio === r ? 'active' : ''} ${isVideo ? 'locked' : ''}`}
              onClick={() => !isVideo && setRatio(r)}
            >
              <span className="me-ratio-box" style={{ aspectRatio: RATIO_ASPECT[r] }} />
              {r}
            </button>
          ))}
          <span className="me-ratio-hint">{isVideo ? '9:16 locked for videos' : 'Crop to your post ratio'}</span>
        </div>

        <div
          className="me-stage"
          ref={stageRef}
           style={{
            aspectRatio:
                ratio === 'original'
                ? `${media.naturalWidth || 1} / ${media.naturalHeight || 1}`
            : RATIO_ASPECT[ratio],
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={handleWheel}
        >
          {isVideo ? (
            <video src={media.data} autoPlay loop playsInline muted style={{ transform }} />
          ) : (
            <img src={media.data} alt="" style={{ transform }} />
          )}
          <span className="me-stage-hint">Drag to move · pinch or scroll to zoom</span>
        </div>

        <div className="me-controls">
          <button className="me-reset-btn" onClick={reset} title="Reset"><RefreshCw size={16} /> Reset</button>
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoomAt(parseFloat(e.target.value))}
            className="me-slider"
          />
          <span className="me-zoom-label">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <style>{`
        .me-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 8, 20, 0.7);
          z-index: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        .me-modal {
          background: var(--surface);
          border-radius: 22px;
          width: min(480px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          padding: 16px;
          animation: floatIn 0.25s ease;
        }
        .me-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .me-title { font-weight: 800; font-size: 15px; }
        .me-header-btn {
          width: 38px; height: 38px; border-radius: 50%;
          border: none; background: var(--surface-soft);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink);
        }
        .me-header-btn.me-done { background: #16141f; color: #fff; }
        .me-ratio-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .me-ratio-btn {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          border: 2px solid var(--border); background: var(--surface);
          border-radius: 12px; padding: 7px 12px; font-size: 12px; font-weight: 700; color: var(--ink-soft);
        }
        .me-ratio-btn.active { border-color: var(--accent-purple); color: var(--accent-purple); }
        .me-ratio-btn.locked { opacity: 0.55; cursor: default; }
        .me-ratio-box { width: 26px; border-radius: 5px; background: currentColor; opacity: 0.9; display: block; }
        .me-ratio-hint { margin-left: auto; font-size: 11.5px; color: var(--ink-faint); }
        .me-stage {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: 16px;
          background: #000;
          touch-action: none;
          cursor: grab;
        }
        .me-stage:active { cursor: grabbing; }
        .me-stage img, .me-stage video {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: contain;
          transform-origin: center;
          pointer-events: none;
        }
        .me-stage-hint {
          position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
          color: rgba(255,255,255,0.75); font-size: 11px; background: rgba(0,0,0,0.45);
          padding: 4px 10px; border-radius: 12px; white-space: nowrap;
        }
        .me-controls { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
        .me-reset-btn {
          display: flex; align-items: center; gap: 5px;
          border: none; background: var(--surface-soft); color: var(--ink-soft);
          padding: 8px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;
        }
        .me-slider { flex: 1; accent-color: var(--accent-purple); }
        .me-zoom-label { font-size: 12px; font-weight: 700; color: var(--ink-soft); width: 44px; text-align: right; }
      `}</style>
    </div>
  );
}
