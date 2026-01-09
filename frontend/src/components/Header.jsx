import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { supabase } from '../supabase';

// IMAGES
import compassLogo from '../assets/logo-compass.png';
import sammyChat from '../assets/sammy-chat.png';

const Header = ({
  activeTab,
  setActiveTab,
  user,
  onLoginClick,
  showAIChat,
  onToggleChat,
  selectedSchool
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="bg-[#003C6C] border-b border-[#FDC700] sticky top-0 z-[60] shadow-xl shrink-0 h-[80px]">
      <div className="w-full h-full px-8 grid grid-cols-[auto_1fr_auto] items-center gap-8">
        {/* LEFT: Logo Area */}
        <div className="flex items-center gap-1">
          <img
            src={compassLogo}
            alt="AI Slug Navigator"
            className="h-[104px] w-auto object-contain drop-shadow-md -my-3 relative z-10 top-[2px] -mr-7"
          />

          <div className="leading-none -ml-1">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
              AI Slug Navigator
            </h1>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-extrabold text-blue-100">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#FDC700]" />
                <span>UC Santa Cruz</span>
              </span>
              <span className="h-3 w-px bg-white/25" />
              <span className="tracking-wide text-blue-50/95">{selectedSchool.term}</span>
            </div>
          </div>
        </div>

        {/* CENTER: Tabs */}
        <div className="flex justify-center">
          <div className="flex bg-[#002a4d]/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg overflow-hidden">
            {/* ✅ UPDATED: Added 'about' tab */}
            {['search', 'schedule', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 text-sm font-bold transition-all duration-200 rounded-none cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-[#003C6C] shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* ✅ UPDATED: Label logic */}
                {tab === 'schedule' ? 'My Schedule' : tab === 'about' ? 'About' : 'Search'}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-4 justify-self-end">
          <button
            onClick={onToggleChat}
            className="h-12 flex items-center gap-3 pl-3 pr-5 rounded-xl transition-all cursor-pointer shadow-lg border-2 border-[#FDC700] bg-[#FDC700] text-[#003C6C] hover:bg-[#eec00e] active:translate-y-0.5 group overflow-visible"
          >
            <span className="relative w-8 h-8 shrink-0 overflow-visible">
              <img
                src={sammyChat}
                alt="Sammy"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-sm scale-[3.65] -translate-y-[1px] transition-transform group-hover:scale-[3.9]"
              />
            </span>
            <span className="text-sm font-bold leading-none">
              {showAIChat ? 'Hide Assistant' : 'Ask Sammy AI'}
            </span>
          </button>

          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 bg-[#FDC700] text-[#003C6C] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform"
              >
                {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-8 animate-in zoom-in-95 z-[60]">
                  <div className="mb-4 pb-4 border-b border-slate-100 text-center">
                    <p className="font-bold text-slate-800">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-[11px] hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-6 py-2.5 bg-[#FDC700] text-[#003C6C] font-bold rounded-xl text-sm hover:bg-[#eec00e] transition-all cursor-pointer border-2 border-[#FDC700] flex items-center gap-2 shadow-lg active:shadow-inner active:translate-y-0.5"
            >
              <User className="w-4 h-4" /> Log in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;