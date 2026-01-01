import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Loader, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react'; 
import { supabase } from '../supabase';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // --- LOGIC FIX: Reset fields when switching modes or closing ---
  useEffect(() => {
    if (!isOpen) {
      // Reset everything when modal closes
      setFormData({ email: '', password: '', name: '' });
      setError('');
      setSuccessMsg('');
      setIsLogin(true);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset inputs and errors when switching between Login/Signup
    setError('');
    setSuccessMsg('');
    setFormData(prev => ({ ...prev, password: '', name: '' })); // Keep email for convenience? Or clear all: setFormData({ email: '', password: '', name: '' });
  }, [isLogin]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
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
    setSuccessMsg('');

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
          options: { data: { full_name: formData.name } },
        });
      }

      if (result.error) throw result.error;

      const user = result.data.user;
      const session = result.data.session;

      // Handle Success
      if (user && session) {
        const normalizedUser = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0]
        };
        onLoginSuccess(normalizedUser, session.access_token);
        onClose();
      } else if (user && !session) {
        setSuccessMsg("Account created! Check your email to confirm.");
        setIsLogin(true); // Auto-switch to login so they are ready
        setFormData({ email: '', password: '', name: '' }); // Clear fields
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* --- THE REVAMPED CARD --- */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px] animate-in zoom-in-95 duration-200">
        
        {/* LEFT SIDE: BRANDING (Hidden on mobile) */}
        <div className="hidden md:flex w-2/5 bg-gradient-to-br from-[#003C6C] to-[#005596] p-10 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm mb-6">
                    <span className="text-2xl">🐌</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Slug Navigator</h2>
                <p className="text-blue-100 font-medium text-sm leading-relaxed">
                    Build the perfect schedule in seconds. Join thousands of UCSC students planning smarter.
                </p>
            </div>

            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-white/80 text-sm font-bold">
                    <div className="w-8 h-8 rounded-full bg-[#FDC700] text-[#003C6C] flex items-center justify-center shadow-sm"><CheckCircle className="w-4 h-4" /></div>
                    <span>Course Validations</span>
                </div>
                <div className="flex items-center gap-3 text-white/80 text-sm font-bold">
                    <div className="w-8 h-8 rounded-full bg-[#FDC700] text-[#003C6C] flex items-center justify-center shadow-sm"><CheckCircle className="w-4 h-4" /></div>
                    <span>Schedule Analytics</span>
                </div>
                <div className="flex items-center gap-3 text-white/80 text-sm font-bold">
                    <div className="w-8 h-8 rounded-full bg-[#FDC700] text-[#003C6C] flex items-center justify-center shadow-sm"><CheckCircle className="w-4 h-4" /></div>
                    <span>AI Advisor Chat</span>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="flex-1 p-8 md:p-12 bg-white relative">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                <X className="w-6 h-6" />
            </button>

            <div className="max-w-sm mx-auto h-full flex flex-col justify-center">
                <div className="mb-8 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        {isLogin ? 'Welcome back!' : 'Create an account'}
                    </h3>
                    <p className="text-slate-500 text-sm">
                        {isLogin ? 'Please enter your details to sign in.' : 'Start planning your academic journey today.'}
                    </p>
                </div>

                {/* ERROR / SUCCESS ALERTS */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-rose-100 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl flex items-start gap-3 border border-emerald-100 animate-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    {successMsg}
                    </div>
                )}

                <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border-2 border-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:border-[#003C6C] hover:text-[#003C6C] flex items-center justify-center gap-3 transition-all mb-6 group"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider"><span className="px-4 bg-white text-slate-400">Or with email</span></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input type="text" placeholder="John Doe" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#003C6C] outline-none transition-all font-medium text-slate-800"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                    </div>
                    )}
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input type="email" placeholder="student@ucsc.edu" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#003C6C] outline-none transition-all font-medium text-slate-800"
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input type="password" placeholder="••••••••" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#003C6C] outline-none transition-all font-medium text-slate-800"
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#003C6C] text-white font-bold py-3.5 rounded-xl hover:bg-[#002a4d] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-[0.98] mt-2">
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : (
                        <>
                            {isLogin ? 'Log In' : 'Create Account'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => setIsLogin(!isLogin)} className="ml-1.5 text-[#003C6C] font-bold hover:underline">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;