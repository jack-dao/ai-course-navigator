import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, LogOut, User, Search, CalendarDays, Info, ChevronDown } from 'lucide-react';
import { supabase } from '../../supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { TabName } from '../../types';
import { getUserDisplayName, getUserInitial } from '../../utils/auth';

import compassLogo from '../../assets/logo-compass.png';
import sammyChat from '../../assets/sammy-chat.png';

interface HeaderProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  user: SupabaseUser | null;
  showAuthModal?: boolean;
  onLoginClick: () => void;
  showAIChat: boolean;
  onToggleChat: () => void;
  selectedTerm: string;
  setSelectedTerm: (term: string) => void;
  availableTerms?: string[];
}

const Header = ({
  activeTab,
  setActiveTab,
  user,
  onLoginClick,
  showAIChat,
  onToggleChat,
  selectedTerm,
  setSelectedTerm,
  availableTerms = [],
}: HeaderProps) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [showTermDropdown, setShowTermDropdown] = useState(false);
  const termDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (termDropdownRef.current && !termDropdownRef.current.contains(event.target as Node)) {
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

  const terms = availableTerms.length > 0 ? availableTerms : ['2026 Winter Quarter'];

  return (
    <header className="bg-ucsc-blue border-b border-ucsc-gold sticky top-0 z-[60] shadow-xl shrink-0 h-[70px] md:h-[80px] overflow-visible select-none">
      <div className="w-full h-full px-4 md:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* LEFT: Logo & Term Selector */}
        <div className="flex items-center gap-1 min-w-0 shrink-0">
          <img
            src={compassLogo}
            alt="AI Slug Navigator"
            className="h-[50px] md:h-[90px] w-auto object-contain drop-shadow-md -my-3 relative z-10 top-[2px] -mr-3 md:-mr-6 shrink-0"
          />

          <div className="leading-none -ml-1 flex flex-col justify-center">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-none whitespace-nowrap">
              AI Slug Navigator
            </h1>
            <div className="mt-1 flex items-center gap-2 text-[10px] md:text-[11px] font-extrabold text-blue-100">
              <span className="inline-flex items-center gap-1.5 shrink-0 hidden xl:inline-flex">
                <GraduationCap className="w-3 h-3 md:w-3.5 md:h-3.5 text-ucsc-gold" />
                <span className="whitespace-nowrap">UC Santa Cruz</span>
              </span>
              <span className="h-3 w-px bg-white/25 shrink-0 hidden xl:block" />

              <div className="relative" ref={termDropdownRef}>
                <button
                  onClick={() => setShowTermDropdown(!showTermDropdown)}
                  aria-expanded={showTermDropdown}
                  aria-haspopup="listbox"
                  aria-label={`Select term, current: ${selectedTerm}`}
                  className="tracking-wide text-blue-50/95 leading-tight hover:text-white transition-colors cursor-pointer flex items-center gap-1 group whitespace-nowrap"
                >
                  {selectedTerm}
                  <ChevronDown className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-50 transition-opacity" />
                </button>

                {showTermDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-100 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                    {terms.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setSelectedTerm(term);
                          setShowTermDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-all cursor-pointer ${
                          selectedTerm === term
                            ? 'text-ucsc-blue bg-blue-50'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

        {/* CENTER: Tabs - "Hybrid" Mode */}
        <nav aria-label="Main navigation" className="hidden md:flex justify-center flex-1 min-w-0 px-4">
          <div
            className="flex bg-ucsc-blue-dark/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg overflow-hidden shrink-0"
            role="tablist"
          >
            {(['search', 'schedule', 'about'] as const).map((tab) => {
              const Icon = tab === 'search' ? Search : tab === 'schedule' ? CalendarDays : Info;

              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 lg:px-6 xl:px-8 py-2.5 text-sm font-bold transition-all duration-200 rounded-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-white text-ucsc-blue shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-white/5'
                  }`}
                  title={tab === 'schedule' ? 'My Schedule' : tab === 'about' ? 'About' : 'Search'}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab ? 'stroke-[3px]' : ''}`} />
                  <span className="hidden xl:inline">
                    {tab === 'schedule' ? 'My Schedule' : tab === 'about' ? 'About' : 'Search'}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3 justify-end shrink-0 ml-auto">
          <button
            onClick={onToggleChat}
            aria-label={showAIChat ? 'Hide Sammy AI assistant' : 'Open Sammy AI assistant'}
            className={`hidden md:flex h-10 lg:h-11 items-center gap-2 lg:gap-3 pl-3 pr-5 rounded-full transition-all cursor-pointer border group overflow-visible whitespace-nowrap active:scale-95 shadow-md hover:shadow-lg ${
              showAIChat
                ? 'bg-white text-ucsc-blue border-white ring-2 ring-white/50'
                : 'bg-ucsc-gold text-ucsc-blue border-ucsc-gold hover:bg-[#eec00e] hover:border-[#eec00e]'
            }`}
          >
            <span className="relative w-7 h-7 lg:w-8 lg:h-8 shrink-0 overflow-visible">
              <img
                src={sammyChat}
                alt="Sammy"
                className="absolute inset-0 w-full h-full object-contain drop-shadow-sm scale-[2.5] lg:scale-[2.8] -translate-y-[2px] transition-transform group-hover:scale-[3.0] group-hover:-translate-y-[3px]"
              />
            </span>
            <span className="text-xs lg:text-sm font-bold leading-none hidden xl:inline">
              {showAIChat ? 'Hide Assistant' : 'Ask Sammy AI'}
            </span>
            <span className="text-xs lg:text-sm font-bold leading-none xl:hidden">
              {showAIChat ? 'Hide' : 'AI Help'}
            </span>
          </button>

          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-expanded={showProfileDropdown}
                className="w-9 h-9 md:w-10 md:h-10 bg-white/10 text-white font-black rounded-full flex items-center justify-center shadow-lg border border-white/20 hover:bg-white/20 hover:border-white/40 cursor-pointer hover:scale-105 transition-all"
                aria-label="Profile menu"
              >
                {getUserInitial(user)}
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-8 animate-in zoom-in-95 z-[60]">
                  <div className="mb-4 pb-4 border-b border-slate-100 text-center">
                    <p className="font-bold text-slate-800">{getUserDisplayName(user)}</p>
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
              aria-label="Log in"
              className="px-4 lg:px-5 py-2.5 bg-white/10 border border-white/10 text-white font-bold rounded-full text-xs md:text-sm hover:bg-white/20 hover:border-white/30 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex items-center gap-2 backdrop-blur-sm"
            >
              <User className="w-4 h-4" aria-hidden="true" /> <span className="hidden lg:inline">Log in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
