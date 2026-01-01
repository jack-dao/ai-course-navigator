import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabase'; 
import HomePage from './pages/HomePage';

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log("📢 App.jsx: Mounting and checking session...");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("📢 App.jsx: Initial Session Check result:", session);
      if (session) {
        setUser(session.user);
        setSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("📢 App.jsx: Auth Event:", _event, session);
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage user={user} session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;