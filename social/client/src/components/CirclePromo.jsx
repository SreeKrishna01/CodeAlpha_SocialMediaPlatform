import React from 'react';
import { Heart, Camera } from 'lucide-react';

export default function CirclePromo() {
  return (
    <div className="circle-promo">
      <div className="promo-text">
        <h3>Join a circle</h3>
        <p>Connect with people who share your vibe.</p>
        <button>Explore circles</button>
      </div>
      <div className="promo-avatars">
        <img className="pa pa-1" src="https://api.dicebear.com/7.x/avataaars/svg?seed=circle1" alt="" />
        <img className="pa pa-2" src="https://api.dicebear.com/7.x/avataaars/svg?seed=circle2" alt="" />
        <span className="pa-icon pa-heart"><Heart size={16} color="#fff" fill="#fff" /></span>
        <span className="pa-icon pa-camera"><Camera size={16} color="#fff" /></span>
        <span className="pa-disc" />
      </div>

      <style>{`
        .circle-promo {
          position: relative;
          overflow: hidden;
          background: var(--gradient-cool);
          border-radius: var(--radius-lg);
          padding: 26px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          min-height: 150px;
        }
        .promo-text h3 {
          margin: 0 0 6px;
          color: #fff;
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 600;
        }
        .promo-text p {
          margin: 0 0 16px;
          color: rgba(255,255,255,0.85);
          font-size: 13.5px;
          max-width: 220px;
        }
        .promo-text button {
          background: #16141f;
          color: #fff;
          border: none;
          padding: 11px 20px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
        }
        .promo-avatars { position: relative; width: 140px; height: 130px; flex-shrink: 0; }
        .pa {
          position: absolute;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid rgba(255,255,255,0.5);
        }
        .pa-1 { width: 62px; height: 62px; top: 6px; left: 0; }
        .pa-2 { width: 62px; height: 62px; bottom: 4px; right: 0; }
        .pa-icon {
          position: absolute;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #16141f;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pa-heart { top: 10px; right: 20px; }
        .pa-camera { bottom: 40px; left: 46px; }
        .pa-disc {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: conic-gradient(from 90deg, #ff9966, #ff5f9e, #8b6bff, #ff9966);
        }
      `}</style>
    </div>
  );
}
