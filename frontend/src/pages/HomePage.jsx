import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, CheckCircle, Search, Filter, BookOpen, MessageSquare, Calendar as CalendarIcon, Info } from 'lucide-react';

import Header from '../components/Header'; 
import FilterSidebar from '../components/FilterSidebar';
import CustomDropdown from '../components/CustomDropdown';
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';
import ProfessorModal from '../components/ProfessorModal';
import PrivacyModal from '../components/PrivacyModal'; 
import AboutTab from '../components/AboutTab';

import { useCourseFilters } from '../hooks/useCourseFilters';
import { useSchedule } from '../hooks/useSchedule';

const HomePage = ({ user, session }) => {
  const [ucscSchool, setUcscSchool] = useState({ 
    id: 'ucsc', 
    name: 'UC Santa Cruz', 
    shortName: 'UCSC', 
    term: 'Loading...', 
    status: 'active' 
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'search';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [showFilters, setShowFilters] = useState(() => window.innerWidth >= 768);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const [availableCourses, setAvailableCourses] = useState(() => {
      try {
          const cached = localStorage.getItem('cachedCourses');
          return cached ? JSON.parse(cached) : [];
      } catch { return []; } 
  });

  const [professorRatings, setProfessorRatings] = useState(() => {
      try {
          const cached = localStorage.getItem('cachedRatings');
          return cached ? JSON.parse(cached) : {};
      } catch { return {}; } 
  });

  const [notification, setNotification] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(sessionStorage.getItem('currentPage')) || 1;
  });
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    window.scrollTo(0, 0);
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  // Lock body scroll logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        if (showAIChat || (showFilters && activeTab === 'search')) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
      } else {
        setShowFilters(true);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
    
    if (window.innerWidth < 768 && (showAIChat || (showFilters && activeTab === 'search'))) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    };
  }, [showAIChat, showFilters, activeTab]);

  const { 
      filters, setFilters, searchQuery, setSearchQuery, resetFilters, processedCourses 
  } = useCourseFilters(availableCourses, professorRatings);
  
  const prevSearchRef = useRef(searchQuery);
  const prevFiltersRef = useRef(JSON.stringify(filters));

  useEffect(() => {
    const filtersStr = JSON.stringify(filters);
    if (prevSearchRef.current !== searchQuery || prevFiltersRef.current !== filtersStr) {
      setCurrentPage(1);
      prevSearchRef.current = searchQuery;
      prevFiltersRef.current = filtersStr;
    }
  }, [searchQuery, filters]);

  const { selectedCourses, setSelectedCourses, checkForConflicts, totalUnits } = useSchedule(user, session, availableCourses);
  const MAX_UNITS = 22;

  useEffect(() => {
    const fetchData = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const [infoRes, cRes, rRes] = await Promise.all([
                fetch(`${apiBase}/api/courses/info`),
                fetch(`${apiBase}/api/courses`),
                fetch(`${apiBase}/api/ratings`)
            ]);

            if (infoRes.ok) setUcscSchool(await infoRes.json());
            if (cRes.ok) {
                const courses = await cRes.json();
                setAvailableCourses(courses);
                try { localStorage.setItem('cachedCourses', JSON.stringify(courses)); } catch {}
            }
            if (rRes.ok) {
                const ratings = await rRes.json();
                setProfessorRatings(ratings);
                try { localStorage.setItem('cachedRatings', JSON.stringify(ratings)); } catch {}
            }
        } catch (e) { console.error("Network error:", e); }
    };
    fetchData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification(null);
    setTimeout(() => { setNotification({ message, type }); }, 10);
    setTimeout(() => { setNotification(prev => (prev?.message === message ? null : prev)); }, 3000);
  };

  const addCourse = (course, section) => {
    const conflictingCourse = checkForConflicts(section, selectedCourses, course.code);
    if (conflictingCourse) {
        showNotification(`Time conflict with ${conflictingCourse}`, 'error');
        return;
    }
    const courseUnits = parseInt(course.credits || 0);
    const existingIndex = selectedCourses.findIndex(c => c.code === course.code);
    if (existingIndex === -1 && totalUnits + courseUnits > MAX_UNITS) {
        showNotification(`Cannot add ${course.code}. Exceeds ${MAX_UNITS} unit limit.`, 'error');
        return;
    }
    const isUpdate = existingIndex !== -1;
    const newSchedule = isUpdate 
        ? selectedCourses.map(c => c.code === course.code ? { ...course, selectedSection: section } : c)
        : [...selectedCourses, { ...course, selectedSection: section }];
    setSelectedCourses(newSchedule);
    showNotification(isUpdate ? `Updated ${course.code}` : `Added ${course.code}`, 'success');
  };

  const removeCourse = (courseCode) => { 
      setSelectedCourses(prev => prev.filter(c => c.code !== courseCode)); 
      showNotification(`Removed ${courseCode}`, 'info'); 
  };

  const handleSaveSchedule = async () => {
    if (!user || !session) { 
        showNotification("Please log in to save", 'error'); 
        setShowAuthModal(true); 
        return; 
    }
    showNotification("Saving schedule...", 'info');
    try {
      const payload = { 
          name: `My Schedule`, 
          courses: selectedCourses.map(course => ({ 
              code: course.code, 
              sectionCode: course.selectedSection?.sectionCode,
              labCode: course.selectedSection?.selectedLab?.sectionCode
          })) 
      };
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/schedules`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, 
          body: JSON.stringify(payload) 
      });
      if (response.ok) showNotification("Schedule saved successfully!", 'success');
      else showNotification("Failed to save schedule", 'error');
    } catch { showNotification("Server error", 'error'); } 
  };

  const viewProfessorDetails = (name) => {
    const fullStats = professorRatings[name] || {};
    setSelectedProfessor({ name, ...fullStats, reviews: fullStats.reviews || [] });
    setIsProfModalOpen(true);
  };

  const handleSendMessage = async (text) => {
    setIsChatLoading(true);
    const newMessages = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMessages);
    setChatMessages(prev => [...prev, { role: 'assistant', text: "Thinking... 🐌" }]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextCourses: availableCourses,
          userSchedule: selectedCourses.map(c => ({ 
              code: c.code, 
              name: c.name,
              days: c.selectedSection?.days,
              times: c.selectedSection ? `${c.selectedSection.startTime}-${c.selectedSection.endTime}` : 'TBA'
          }))
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: data.reply }]);
    } catch { 
      setChatMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: "Sorry, I lost connection to the server. 🧠🚫" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE);
  const currentCourses = processedCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans relative">
      
      {/* ⚡️ FIX: Fixed Header with 70px height for mobile */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-slate-200 h-[70px] md:h-[80px]">
        <Header 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            showAuthModal={showAuthModal}
            onLoginClick={() => setShowAuthModal(true)}
            showAIChat={showAIChat}
            onToggleChat={() => setShowAIChat(!showAIChat)}
            selectedSchool={ucscSchool} 
        />
      </div>

      {/* ⚡️ FIX: pt-[70px] for mobile content spacing */}
      <div className="flex flex-row w-full min-h-screen pt-[70px] md:pt-[80px] pb-[80px] md:pb-0 relative">
        <div className="flex flex-1 min-w-0 transition-all duration-300 relative">
            
            {activeTab === 'search' && (
              <>
                {/* ⚡️ FIX: Mobile Filter Modal 
                    - pt-[70px] matches header height exactly.
                */}
                {showFilters && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in slide-in-from-bottom-5 overflow-hidden pt-[70px] pb-[80px]">
                        <div className="flex-1 overflow-y-auto">
                            <FilterSidebar 
                                filters={filters}
                                setFilters={setFilters}
                                onReset={resetFilters}
                                activeTab={activeTab}
                                onClose={() => setShowFilters(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Desktop Filter Sidebar */}
                {showFilters && (
                    <div className="hidden md:block h-full">
                        <FilterSidebar 
                            filters={filters}
                            setFilters={setFilters}
                            onReset={resetFilters}
                            activeTab={activeTab}
                        />
                    </div>
                )}
                
                <main className="flex-1 min-w-0 bg-white relative z-0">
                    <div className="px-4 md:px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-30 transition-all duration-200 shadow-sm">
                        <div className="flex flex-row gap-3 md:gap-4 mb-4">
                            <button 
                                onClick={() => setShowFilters(!showFilters)} 
                                className={`p-3 md:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 ${showFilters ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 text-[#003C6C] hover:border-[#003C6C]'}`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>

                            <div className="relative flex-1 group min-w-0">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003C6C] w-5 h-5 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search courses..." 
                                    className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003C6C] outline-none text-sm font-bold shadow-inner text-slate-700 placeholder:text-slate-400" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                            </div>
                            
                            <div className="relative w-64 hidden md:block">
                                <CustomDropdown 
                                    prefix="Sort by: "
                                    value={filters.sort}
                                    options={['Best Match', 'Rating', 'Difficulty']}
                                    onChange={(val) => setFilters({...filters, sort: val})}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between"><span className="font-bold text-sm text-slate-800">{processedCourses.length} Results</span></div>
                    </div>

                    <div className="p-4 md:p-8 grid grid-cols-1 gap-6">
                        {currentCourses.map(course => (
                            <CourseCard 
                                key={course.id} 
                                course={course} 
                                professorRatings={professorRatings} 
                                onAdd={addCourse} 
                                onShowProfessor={viewProfessorDetails} 
                                sortOption={filters.sort} 
                            />
                        ))}
                    </div>
                    {processedCourses.length > ITEMS_PER_PAGE && (
                        <div className="flex justify-between items-center mt-12 mb-8 px-4 md:px-8 border-t border-slate-200 pt-8">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-4 md:px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-default' : 'hover:border-[#003C6C] hover:text-[#003C6C] cursor-pointer'}`}>Prev</button>
                            <span className="font-bold text-slate-500 text-sm">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-4 md:px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-default' : 'hover:border-[#003C6C] hover:text-[#003C6C] cursor-pointer'}`}>Next</button>
                        </div>
                    )}
                </main>
              </>
            )}

            {activeTab === 'schedule' && (
                <div className="flex flex-col md:flex-row flex-1 h-full">
                    <div className="w-full md:w-[400px] shrink-0 border-b md:border-r border-slate-100 flex flex-col z-10 bg-white max-h-[35vh] md:max-h-full overflow-y-auto custom-scrollbar">
                        <div className="p-4 md:p-6 flex-1">
                            <div className="pb-4 mb-4 border-b border-slate-100 flex justify-center">
                                <h3 className="font-bold text-[#003C6C] text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5"/> My Schedule
                                </h3>
                            </div>
                            <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />
                        </div>
                        <div className="p-4 md:p-6 border-t border-slate-100 shrink-0 bg-white">
                            <button onClick={handleSaveSchedule} className="w-full py-4 bg-[#003C6C] text-white font-bold rounded-2xl hover:bg-[#002a4d] shadow-xl transition-all cursor-pointer active:scale-95 text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Schedule</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <div className="h-full w-full overflow-x-auto overflow-y-hidden">
                             <div className="min-w-[800px] h-full">
                                <CalendarView selectedCourses={selectedCourses} />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'about' && (
                <AboutTab onOpenPrivacy={() => setShowPrivacy(true)} />
            )}
        </div>

        {/* ⚡️ FIX: AI Chat Sidebar
           - pt-[70px]: Starts immediately below 70px header
        */}
        {showAIChat && (
            <div className="fixed inset-0 z-50 bg-white border-l border-[#FDC700] shadow-xl shrink-0 flex flex-col md:sticky md:top-[80px] md:h-[calc(100vh-80px)] md:w-[400px] md:bottom-auto pt-[70px] pb-[80px] md:pt-0 md:pb-0">
                 <div className="w-full h-full overflow-hidden">
                    <ChatSidebar 
                        isOpen={true} 
                        onClose={() => setShowAIChat(false)} 
                        messages={chatMessages} 
                        onSendMessage={handleSendMessage} 
                        schoolName={ucscSchool.shortName} 
                        isLoading={isChatLoading}
                    />
                 </div>
            </div>
        )}

      </div>
      
      {/* 📱 MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-slate-200 flex justify-around items-center z-[999] pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <button 
             onClick={() => { setActiveTab('search'); setShowAIChat(false); }} 
             className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'search' && !showAIChat ? 'text-[#003C6C]' : 'text-slate-400'}`}
          >
              <Search className={`w-6 h-6 ${activeTab === 'search' && !showAIChat ? 'stroke-[3px]' : ''}`} />
              <span className="text-[10px] font-bold">Search</span>
          </button>

          <button 
             onClick={() => { setActiveTab('schedule'); setShowAIChat(false); }} 
             className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'schedule' && !showAIChat ? 'text-[#003C6C]' : 'text-slate-400'}`}
          >
              <CalendarIcon className={`w-6 h-6 ${activeTab === 'schedule' && !showAIChat ? 'stroke-[3px]' : ''}`} />
              <span className="text-[10px] font-bold">Schedule</span>
          </button>

          {/* SAMMY BUTTON */}
          <button 
             onClick={() => { setShowAIChat(!showAIChat); }} 
             className="flex flex-col items-center gap-1 -mt-8 relative z-50"
          >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${showAIChat ? 'bg-[#003C6C] text-[#FDC700]' : 'bg-[#FDC700] text-[#003C6C]'}`}>
                  <MessageSquare className="w-7 h-7 fill-current" />
              </div>
              <span className={`text-[10px] font-bold ${showAIChat ? 'text-[#003C6C]' : 'text-slate-400'}`}>Sammy</span>
          </button>

          <button 
             onClick={() => { setActiveTab('about'); setShowAIChat(false); }} 
             className={`flex flex-col items-center gap-1 p-2 w-16 ${activeTab === 'about' && !showAIChat ? 'text-[#003C6C]' : 'text-slate-400'}`}
          >
              <Info className={`w-6 h-6 ${activeTab === 'about' && !showAIChat ? 'stroke-[3px]' : ''}`} />
              <span className="text-[10px] font-bold">About</span>
          </button>
      </div>

      {notification && (
          <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border animate-in slide-in-from-bottom-10 ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-[#003C6C] border-[#FDC700]'}`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5 text-[#FDC700]"/>}
              <span className="font-bold text-xs tracking-tight">{notification.message}</span>
          </div>
      )}

      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      
      <ProfessorModal professor={selectedProfessor} isOpen={isProfModalOpen} onClose={() => setIsProfModalOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setShowAuthModal(false)} selectedSchool={ucscSchool} /> 
    </div>
  );
};

export default HomePage;