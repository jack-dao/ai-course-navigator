import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, CheckCircle, Search, Filter, BookOpen } from 'lucide-react';

import Header from '../components/Header'; 
import FilterSidebar from '../components/FilterSidebar';
import CustomDropdown from '../components/CustomDropdown';
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';
import ProfessorModal from '../components/ProfessorModal';
// ✅ IMPORT
import AboutTab from '../components/AboutTab';

import { useCourseFilters } from '../hooks/useCourseFilters';
import { useSchedule } from '../hooks/useSchedule';

const HomePage = ({ user, session }) => {
  const UCSC_SCHOOL = { id: 'ucsc', name: 'UC Santa Cruz', shortName: 'UCSC', term: 'Winter 2026', status: 'active' };
  
  // --- PERSISTENT STATE ---
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'search';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [showFilters, setShowFilters] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Data State (Instant Load)
  const [availableCourses, setAvailableCourses] = useState(() => {
      try {
          const cached = localStorage.getItem('cachedCourses');
          return cached ? JSON.parse(cached) : [];
      } catch (e) { return []; }
  });

  const [professorRatings, setProfessorRatings] = useState(() => {
      try {
          const cached = localStorage.getItem('cachedRatings');
          return cached ? JSON.parse(cached) : {};
      } catch (e) { return {}; }
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

  // Background Fetch
  useEffect(() => {
    const fetchData = async () => {
        try {
            const cRes = await fetch('http://localhost:3000/api/courses');
            if (cRes.ok) {
                const courses = await cRes.json();
                setAvailableCourses(courses);
                localStorage.setItem('cachedCourses', JSON.stringify(courses));
            }
            const rRes = await fetch('http://localhost:3000/api/ratings');
            if (rRes.ok) {
                const ratings = await rRes.json();
                setProfessorRatings(ratings);
                localStorage.setItem('cachedRatings', JSON.stringify(ratings));
            }
        } catch (e) { console.error(e); }
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
    if (existingIndex === -1) {
        if (totalUnits + courseUnits > MAX_UNITS) {
            showNotification(`Cannot add ${course.code}. Exceeds ${MAX_UNITS} unit limit.`, 'error');
            return;
        }
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
      const response = await fetch('http://localhost:3000/api/schedules', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, 
          body: JSON.stringify(payload) 
      });
      if (response.ok) showNotification("Schedule saved successfully!", 'success');
      else showNotification("Failed to save schedule", 'error');
    } catch (err) { showNotification("Server error", 'error'); }
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
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
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
    } catch (err) {
      setChatMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: "Sorry, I lost connection to the server. 🧠🚫" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE);
  const currentCourses = processedCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans selection:bg-[#FDC700] selection:text-white relative">
      
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        showAuthModal={showAuthModal}
        onLoginClick={() => setShowAuthModal(true)}
        showAIChat={showAIChat}
        onToggleChat={() => setShowAIChat(!showAIChat)}
        selectedSchool={UCSC_SCHOOL}
      />

      <div className="flex flex-row w-full min-h-[calc(100vh-80px)]">
        
        <div className="flex flex-1 min-w-0 transition-all duration-300">
            {activeTab === 'search' && (
              <>
                {showFilters && (
                    <FilterSidebar 
                        filters={filters}
                        setFilters={setFilters}
                        onReset={resetFilters}
                        activeTab={activeTab}
                    />
                )}
                <main className="flex-1 min-w-0 bg-white relative z-0">
                    <div className="px-8 py-6 border-b border-slate-100 bg-white sticky top-[80px] z-30">
                        <div className="flex gap-4 mb-4">
                            <button 
                                onClick={() => setShowFilters(!showFilters)} 
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center ${showFilters ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 text-[#003C6C] hover:border-[#003C6C]'}`}
                                title={showFilters ? "Hide Filters" : "Show Filters"}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003C6C] w-5 h-5 transition-colors" />
                                <input type="text" placeholder="Search courses and instructors..." className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003C6C] outline-none text-sm font-bold shadow-inner text-slate-700 placeholder:text-slate-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="relative w-64">
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
                    <div className="p-8 grid grid-cols-1 gap-6">
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
                        <div className="flex justify-between items-center mt-12 mb-8 px-8 border-t border-slate-200 pt-8">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-default' : 'hover:border-[#003C6C] hover:text-[#003C6C] cursor-pointer'}`}>Prev</button>
                            <span className="font-bold text-slate-500 text-sm">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-default' : 'hover:border-[#003C6C] hover:text-[#003C6C] cursor-pointer'}`}>Next</button>
                        </div>
                    )}
                </main>
              </>
            )}

            {activeTab === 'schedule' && (
                <div className="flex flex-1 h-[calc(100vh-80px)]">
                    <div className="w-[400px] shrink-0 border-r border-slate-100 flex flex-col z-10 bg-white">
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="pb-4 mb-4 border-b border-slate-100 flex justify-center">
                                <h3 className="font-bold text-[#003C6C] text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5"/> My Schedule
                                </h3>
                            </div>
                            <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />
                        </div>
                        <div className="p-6 border-t border-slate-100 shrink-0 bg-white">
                            <button onClick={handleSaveSchedule} className="w-full py-4 bg-[#003C6C] text-white font-bold rounded-2xl hover:bg-[#002a4d] shadow-xl transition-all cursor-pointer active:scale-95 text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Schedule</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <CalendarView selectedCourses={selectedCourses} />
                    </div>
                </div>
            )}

            {/* ✅ NEW: ABOUT TAB */}
            {activeTab === 'about' && (
                <AboutTab />
            )}
        </div>

        {showAIChat && (
            <div className="w-[400px] bg-white border-l border-[#FDC700] shadow-xl shrink-0 h-[calc(100vh-80px)] sticky top-[80px] z-50">
                 <div className="w-full h-full">
                    <ChatSidebar 
                        isOpen={true} 
                        onClose={() => setShowAIChat(false)} 
                        messages={chatMessages} 
                        onSendMessage={handleSendMessage} 
                        schoolName={UCSC_SCHOOL.shortName} 
                        isLoading={isChatLoading}
                    />
                 </div>
            </div>
        )}

      </div>
      
      {notification && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border animate-in slide-in-from-bottom-10 ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-[#003C6C] border-[#FDC700]'}`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5 text-[#FDC700]"/>}
              <span className="font-bold text-xs tracking-tight">{notification.message}</span>
          </div>
      )}

      <ProfessorModal professor={selectedProfessor} isOpen={isProfModalOpen} onClose={() => setIsProfModalOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={() => setShowAuthModal(false)} selectedSchool={UCSC_SCHOOL} />
    </div>
  );
};

export default HomePage;