import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <img
            className="auth-logo"
            src="https://yt3.googleusercontent.com/ytc/AIdro_nC2ZJ937Vbv94eqVs_1k-jncgK8cAl1NR_Td2Anc6Kqg=s900-c-k-c0x00ffffff-no-rj"
            alt="Kek Start"
          />
        </div>
        <h1>Kek Start</h1>
        <p className="auth-tagline">Welcome to Kek Start !!</p>

        <div className="auth-toggle">
          <button className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setError(''); }}>Log in</button>
          <button className={mode === 'register' ? 'is-active' : ''} onClick={() => { setMode('register'); setError(''); }}>Sign up</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <input placeholder="Full name" value={form.name} onChange={update('name')} required />
              <input placeholder="Username" value={form.username} onChange={update('username')} required />
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={update('email')} required />
          <input type="password" placeholder="Password" value={form.password} onChange={update('password')} required minLength={6} />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="submit-btn" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

       
      </div>

      <style>{`
        .auth-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-image:
            radial-gradient(circle at 30% 20%, rgba(63, 63, 63, 0.1), transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(61, 61, 61, 0.1), transparent 50%);
        }
        .auth-card {
          width: 100%;
          max-width: 380px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-soft);
          padding: 34px 28px;
          text-align: center;
          animation: floatIn 0.4s ease;
        }
        .auth-brand {
          display: inline-block;
          margin-bottom: 12px;
          transform: scale(1.8);
        }
        .auth-logo {
          width: 40px;
          height: 40px;
          border-radius: 50px;
          border: 1px solid grey;
          object-fit: cover;
          box-shadow: 0 12px 40px rgba(139, 107, 255, 0.3);
        }
        .auth-card h1 {
          font-family: var(--font-display);
          font-size: 28px;
          margin: 0 0 4px;
          color: #000;
        }
        .auth-tagline { color: var(--ink-soft); font-size: 13.5px; margin: 0 0 22px; }
        .auth-toggle {
          display: flex;
          background: var(--surface-soft);
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 20px;
        }
        .auth-toggle button {
          flex: 1;
          border: none;
          background: none;
          padding: 10px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13.5px;
          color: var(--ink-soft);
          transition: all 0.2s ease;
        }
        .auth-toggle button.is-active { background: #16141f; color: #fff; }
        .auth-form { display: flex; flex-direction: column; gap: 12px; }
        .auth-form input {
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 13px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .auth-form input:focus { border-color: var(--accent-purple); }
        .auth-error { color: #d1453b; font-size: 12.5px; margin: 0; text-align: left; }
        .submit-btn {
          background:#999999;
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 13px;
          font-weight: 700;
          font-size: 14.5px;
          margin-top: 4px;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .submit-btn:hover{
        background:black;}
        .submit-btn:disabled { opacity: 0.6; }
        .submit-btn:active { transform: scale(0.98); }
        
      `}</style>
    </div>
  );
}
