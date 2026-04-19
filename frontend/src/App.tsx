import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import HomePage from './pages/HomePage';
import type { User, Session } from '@supabase/supabase-js';
import type { TabName } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setSession(session);
      } else {
        setUser(null);
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderPage = (defaultTab: TabName, openChat = false) => (
    <HomePage user={user} session={session} defaultTab={defaultTab} openChat={openChat} />
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/search" element={renderPage('search')} />
        <Route path="/schedule" element={renderPage('schedule')} />
        <Route path="/about" element={renderPage('about')} />
        <Route path="/chat" element={renderPage('search', true)} />
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
