import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    const t4 = setTimeout(() => onComplete(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${phase >= 3 ? 'splash-fade' : ''}`}>
      <div className="splash-content">
        <div className={`splash-logo ${phase >= 1 ? 'show' : ''}`}>
          <img
            className="splash-logo-img"
            src="https://i.pinimg.com/originals/8c/79/0e/8c790e231ba893b4408f79f8f5dc95a6.jpg"
            alt="Kek Start"
          />
        </div>
        <h1 className={`splash-title ${phase >= 1 ? 'show' : ''}`}>Kek Start</h1>
        <p className={`splash-subtitle ${phase >= 2 ? 'show' : ''}`}>Stories. Connections. Moments.</p>
      </div>
      <div className="splash-dots">
        <span className={`dot ${phase >= 1 ? 'active' : ''}`} />
        <span className={`dot ${phase >= 2 ? 'active' : ''}`} />
        <span className={`dot ${phase >= 3 ? 'active' : ''}`} />
      </div>
      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          background: var(--bg);
          background-image:
            radial-gradient(circle at 30% 20%, rgba(255, 95, 158, 0.15), transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(139, 107, 255, 0.15), transparent 50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .splash-fade {
          opacity: 0;
          transform: scale(1.05);
        }
        .splash-content {
          text-align: center;
        }
        .splash-logo {
          display: inline-block;
          width: 180px;
          height: 180px;
          border-radius: 32px;
          overflow: hidden;
          opacity: 0;
          transform: scale(0.5) rotate(-20deg);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          margin-bottom: 20px;
        }
        .splash-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.6);
          box-shadow: 0 16px 50px rgba(139, 107, 255, 0.35);
        }
        .splash-logo.show {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }
        .splash-title {
          font-family: var(--font-display);
          font-size: 52px;
          font-weight: 700;
          margin: 0;
          color: #000;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s ease;
        }
        .splash-title.show {
          opacity: 1;
          transform: translateY(0);
        }
        .splash-subtitle {
          font-size: 16px;
          color: var(--ink-soft);
          margin: 8px 0 0;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.5s ease;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .splash-subtitle.show {
          opacity: 1;
          transform: translateY(0);
        }
        .splash-dots {
          display: flex;
          gap: 8px;
          margin-top: 40px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border);
          transition: all 0.3s ease;
        }
        .dot.active {
          background: var(--accent-purple);
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
}
