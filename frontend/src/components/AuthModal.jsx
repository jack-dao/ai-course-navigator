import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader, AlertCircle, Chrome } from 'lucide-react'; 
import { supabase } from '../supabase';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin 
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      } else {
        result = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.name },
          },
        });
      }

      if (result.error) throw result.error;

      if (result.data.user) {
        const user = result.data.user;
        const session = result.data.session;
        
        const normalizedUser = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0]
        };

        onLoginSuccess(normalizedUser, session.access_token);
        onClose();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{isLogin ? 'Log In' : 'Sign Up'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2 transition-all mb-4 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
             <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Full Name" required className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input type="email" placeholder="Email" required className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input type="password" placeholder="Password" required className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 flex justify-center">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold hover:underline">
              {isLogin ? 'Need an account? Sign Up' : 'Have an account? Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;