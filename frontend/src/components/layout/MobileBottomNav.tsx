import React from 'react';
import { Search, Calendar as CalendarIcon, MessageSquare, Info } from 'lucide-react';
import { TabName } from '../../types';

interface MobileBottomNavProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  showAIChat: boolean;
  setShowAIChat: (show: boolean) => void;
}

const MobileBottomNav = ({ activeTab, setActiveTab, showAIChat, setShowAIChat }: MobileBottomNavProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-slate-200 flex justify-around items-center z-[999] pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <button
        onClick={() => {
          setActiveTab('search');
          setShowAIChat(false);
        }}
        className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'search' && !showAIChat ? 'text-ucsc-blue' : 'text-slate-400'}`}
      >
        <Search className={`w-6 h-6 ${activeTab === 'search' && !showAIChat ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold">Search</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('schedule');
          setShowAIChat(false);
        }}
        className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'schedule' && !showAIChat ? 'text-ucsc-blue' : 'text-slate-400'}`}
      >
        <CalendarIcon className={`w-6 h-6 ${activeTab === 'schedule' && !showAIChat ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold">Schedule</span>
      </button>

      <button
        onClick={() => {
          setShowAIChat(true);
        }}
        className={`flex flex-col items-center gap-1 p-2 w-16 ${showAIChat ? 'text-ucsc-blue' : 'text-slate-400'}`}
      >
        <MessageSquare className={`w-6 h-6 ${showAIChat ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold whitespace-nowrap">Sammy AI</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('about');
          setShowAIChat(false);
        }}
        className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'about' && !showAIChat ? 'text-ucsc-blue' : 'text-slate-400'}`}
      >
        <Info className={`w-6 h-6 ${activeTab === 'about' && !showAIChat ? 'stroke-[3px]' : ''}`} />
        <span className="text-[10px] font-bold">About</span>
      </button>
    </div>
  );
};

export default MobileBottomNav;
