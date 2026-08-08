import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function ProtectedShell({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <Sidebar />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashDone');
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splashDone', '1');
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<ProtectedShell><HomePage /></ProtectedShell>} />
      <Route path="/explore" element={<ProtectedShell><ExplorePage /></ProtectedShell>} />
      <Route path="/messages" element={<ProtectedShell><MessagesPage /></ProtectedShell>} />
      <Route path="/alerts" element={<ProtectedShell><NotificationsPage /></ProtectedShell>} />
      <Route path="/create" element={<ProtectedShell><CreatePage /></ProtectedShell>} />
      <Route path="/profile" element={<ProtectedShell><ProfilePage /></ProtectedShell>} />
      <Route path="/profile/:username" element={<ProtectedShell><ProfilePage /></ProtectedShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
