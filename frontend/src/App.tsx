import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabase';
import { ErrorBoundary } from './components';
import type { User, Session } from '@supabase/supabase-js';
import type { TabName } from './types';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('./pages/HomePage'));

function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-ucsc-gold" />
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncSession = (nextSession: Session | null) => {
      if (!isMounted) return;
      setUser(nextSession?.user ?? null);
      setSession(nextSession);
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        syncSession(session);
      } catch (error) {
        console.error('Failed to initialize auth session:', error);
        syncSession(null);
      } finally {
        if (isMounted) setIsAuthReady(true);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
      if (isMounted) setIsAuthReady(true);
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const renderPage = (defaultTab: TabName, openChat = false) => (
    <HomePage user={user} session={session} defaultTab={defaultTab} openChat={openChat} />
  );

  return (
    <ErrorBoundary>
      {isAuthReady ? (
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/search" element={renderPage('search')} />
              <Route path="/schedule" element={renderPage('schedule')} />
              <Route path="/about" element={renderPage('about')} />
              <Route path="/chat" element={renderPage('search', true)} />
              <Route path="/" element={<Navigate to="/search" replace />} />
              <Route path="*" element={<Navigate to="/search" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      ) : (
        <LoadingFallback />
      )}
    </ErrorBoundary>
  );
}

export default App;
