import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, LogOut, User, Search, CalendarDays, Info, ChevronDown } from 'lucide-react';
import { supabase } from '../supabase';

import compassLogo from '../assets/logo-compass.png';
import sammyChat from '../assets/sammy-chat.png';

const Header = ({
  activeTab,
  setActiveTab,
  user,
  onLoginClick,
  showAIChat,
  onToggleChat,
  selectedSchool,
  selectedTerm,
  setSelectedTerm
}) => {
  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  // ⚡️ NEW: Term dropdown state
  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const termDropdownRef = useRef(null);

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Profile Dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      // Close Term Dropdown
      if (termDropdownRef.current && !termDropdownRef.current.contains(event.target)) {
        setShowTermDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const terms = ['Winter 2026', 'Spring 2026'];

  return (
    <header className="bg-[#003C6C] border-b border-[#FDC700] sticky top-0 z-[60] shadow-xl shrink-0 h-[70px] md:h-[80px] overflow-visible select-none">
      <div className="w-full h-full px-4 md:px-8 flex items-center justify-between">
        
        {/* LEFT: Logo Area */}
        <div className="flex items-center gap-1 min-w-0 shrink">
          <img
            src={compassLogo}
            alt="AI Slug Navigator"
            className="h-[60px] md:h-[104px] w-auto object-contain drop-shadow-md -my-3 relative z-10 top-[2px] -mr-4 md:-mr-7 shrink-0"
          />

          <div className="leading-none -ml-1 flex flex-col justify-center">
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-none whitespace-nowrap">
              AI Slug Navigator
            </h1>
            <div className="mt-1 flex items-center gap-2 text-[10px] md:text-[11px] font-extrabold text-blue-100">
              <span className="inline-flex items-center gap-1.5 shrink-0">
                <GraduationCap className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#FDC700]" />
                <span className="hidden md:inline">UC Santa Cruz</span>
                <span className="md:hidden">UCSC</span>
              </span>
              <span className="h-3 w-px bg-white/25 shrink-0" />
              
              {/* ⚡️ REVERTED STYLE: Looks like text, acts like a dropdown */}
              <div className="relative" ref={termDropdownRef}>
                <button 
                  onClick={() => setShowTermDropdown(!showTermDropdown)}
                  className="tracking-wide text-blue-50/95 leading-tight hover:text-white transition-colors cursor-pointer flex items-center gap-1 group"
                >
                  {selectedTerm}
                  {/* Subtle chevron that only appears on hover to hint it's clickable */}
                  <ChevronDown className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-50 transition-opacity" />
                </button>

                {showTermDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-36 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-100 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                    {terms.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setSelectedTerm(term);
                          setShowTermDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-all ${
                          selectedTerm === term 
                            ? 'text-[#003C6C] bg-blue-50' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                         {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* CENTER: Tabs (HIDDEN ON MOBILE) */}
        <div className="hidden md:flex justify-center absolute left-1/2 -translate-x-1/2">
          <div className="flex bg-[#002a4d]/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg overflow-hidden">
            {['search', 'schedule', 'about'].map((tab) => {
              const Icon = tab === 'search' ? Search 
                         : tab === 'schedule' ? CalendarDays 
                         : Info;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-2.5 text-sm font-bold transition-all duration-200 rounded-none cursor-pointer flex items-center gap-2 ${
                    activeTab === tab
                      ? 'bg-white text-[#003C6C] shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeTab === tab ? 'stroke-[3px]' : ''}`} />
                  {tab === 'schedule' ? 'My Schedule' : tab === 'about' ? 'About' : 'Search'}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 md:gap-4 justify-end shrink-0">
          <button
            onClick={onToggleChat}
            className="hidden md:flex h-12 items-center gap-3 pl-3 pr-5 rounded-xl transition-all cursor-pointer shadow-lg border-2 border-[#FDC700] bg-[#FDC700] text-[#003C6C] hover:bg-[#eec00e] active:translate-y-0.5 group overflow-visible"
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
                className="w-8 h-8 md:w-10 md:h-10 bg-[#FDC700] text-[#003C6C] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform"
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
              className="px-4 md:px-6 py-2 md:py-2.5 bg-[#FDC700] text-[#003C6C] font-bold rounded-xl text-xs md:text-sm hover:bg-[#eec00e] transition-all cursor-pointer border-2 border-[#FDC700] flex items-center gap-2 shadow-lg active:shadow-inner active:translate-y-0.5"
            >
              <User className="w-4 h-4" /> <span className="hidden md:inline">Log in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;