import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, CheckCircle, Search, Filter, BookOpen, MessageSquare, Calendar as CalendarIcon, Info, Loader2, RefreshCw } from 'lucide-react';
import { get, set } from 'idb-keyval';

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
  
  const sortTerms = (terms) => {
    const seasons = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4 };
    return terms.sort((a, b) => {
      const partsA = a.split(' ');
      const partsB = b.split(' ');
      const yearA = parseInt(partsA[0]);
      const seasonA = partsA[1];
      const yearB = parseInt(partsB[0]);
      const seasonB = partsB[1];

      if (yearA !== yearB) return yearB - yearA; 
      return (seasons[seasonB] || 0) - (seasons[seasonA] || 0);
    });
  };

  const formatTermForDb = (term) => term; 

  const [availableTerms, setAvailableTerms] = useState(() => {
    try {
        const saved = localStorage.getItem('cachedTerms');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [selectedTerm, setSelectedTerm] = useState(() => {
      return localStorage.getItem('lastSelectedTerm') || (availableTerms.length > 0 ? availableTerms[0] : '');
  });

  useEffect(() => {
      if (selectedTerm) localStorage.setItem('lastSelectedTerm', selectedTerm);
  }, [selectedTerm]);

  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'search';
  });

  const [mobileScheduleView, setMobileScheduleView] = useState('list');

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [showFilters, setShowFilters] = useState(() => {
      if (typeof window !== 'undefined') {
          return window.innerWidth >= 768; 
      }
      return false;
  });
  
  const [showAIChat, setShowAIChat] = useState(() => {
    try {
      return localStorage.getItem('showAIChat') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('showAIChat', showAIChat);
  }, [showAIChat]);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const [availableCourses, setAvailableCourses] = useState([]);
  const [professorRatings, setProfessorRatings] = useState({});

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
    const scrollContainer = document.getElementById('search-results-container');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    sessionStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const handleScrollLock = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && (showAIChat || (showFilters && activeTab === 'search'))) {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
      }
    };

    handleScrollLock();
    window.addEventListener('resize', handleScrollLock);
    return () => {
        window.removeEventListener('resize', handleScrollLock);
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

  const { selectedCourses, setSelectedCourses, checkForConflicts, totalUnits } = useSchedule(user, session, availableCourses, selectedTerm);
  const MAX_UNITS = 22;

  useEffect(() => {
    const fetchMetadata = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');
            const [infoRes, termsRes] = await Promise.all([
                fetch(`${apiBase}/api/courses/info`),
                fetch(`${apiBase}/api/courses/terms`)
            ]);

            if (infoRes.ok) setUcscSchool(await infoRes.json());
            
            if (termsRes.ok) {
                const dbTerms = await termsRes.json();
                if (dbTerms.length > 0) {
                    const sorted = sortTerms(dbTerms);
                    setAvailableTerms(sorted);
                    localStorage.setItem('cachedTerms', JSON.stringify(sorted));
                    
                    if (!selectedTerm) {
                        setSelectedTerm(sorted[0]);
                    }
                }
            }
        } catch (e) {
            console.error("Metadata Load Error:", e);
        }
    };
    fetchMetadata();
  }, []); 

  useEffect(() => {
    let isActive = true; 

    const fetchCourses = async () => {
        if (!selectedTerm) return;

        const dbTerm = formatTermForDb(selectedTerm);
        const cacheKeyCourses = `courses_${dbTerm}`;
        const cacheKeyRatings = `ratings`; 

        try {
            const cachedCourses = await get(cacheKeyCourses);
            const cachedRatings = await get(cacheKeyRatings);
            
            if (isActive && cachedCourses && cachedCourses.length > 0) {
                setAvailableCourses(cachedCourses);
                if (cachedRatings) setProfessorRatings(cachedRatings);
                setIsCoursesLoading(false);
                setIsBackgroundFetching(true); 
            } else if (isActive) {
                setIsCoursesLoading(true);
            }
        } catch (e) {
            console.warn("Cache read failed", e);
            if (isActive) setIsCoursesLoading(true);
        }

        try {
            const apiBase = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

            const [cRes, rRes] = await Promise.all([
                fetch(`${apiBase}/api/courses?term=${encodeURIComponent(dbTerm)}`),
                fetch(`${apiBase}/api/ratings`)
            ]);

            if (isActive && cRes.ok) {
                const courses = await cRes.json();
                setAvailableCourses(courses);
                set(cacheKeyCourses, courses).catch(err => console.warn('Cache failed', err));
            }
            if (isActive && rRes.ok) {
                const ratings = await rRes.json();
                setProfessorRatings(ratings);
                set(cacheKeyRatings, ratings).catch(err => console.warn('Cache failed', err));
            }
        } catch (e) { 
            console.error("Network Load Error:", e); 
        } finally {
            if (isActive) {
                setIsCoursesLoading(false);
                setIsBackgroundFetching(false);
            }
        }
    };

    fetchCourses();

    return () => {
        isActive = false;
    };
  }, [selectedTerm]);

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
          name: selectedTerm, 
          courses: selectedCourses.map(course => ({ 
              code: course.code, 
              sectionCode: course.selectedSection?.sectionCode || '', 
              labCode: course.selectedSection?.selectedLab?.sectionCode || ''
          })) 
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/schedules`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, 
          body: JSON.stringify(payload) 
      });
      
      if (response.ok) {
          showNotification("Schedule saved successfully!", 'success');
      } else if (response.status === 401) {
          showNotification("Session expired. Please log in again.", 'error');
          setShowAuthModal(true);
      } else {
          console.error("Save response error:", response.status, await response.text());
          showNotification("Failed to save schedule", 'error');
      }
    } catch (e) { 
        console.error("Save exception:", e);
        showNotification("Server error", 'error'); 
    } 
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
    setChatMessages(prev => [...prev, { role: 'assistant', text: "Sammy is thinking... " }]);

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
    <div className="h-[100dvh] w-full max-w-[100vw] bg-white flex flex-col font-sans relative overflow-hidden">
      
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-slate-200 h-[70px] md:h-[80px]">
        <Header 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={user}
            showAuthModal={showAuthModal}
            onLoginClick={() => setShowAuthModal(true)}
            showAIChat={showAIChat}
            onToggleChat={() => setShowAIChat(!showAIChat)}
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            availableTerms={availableTerms}
        />
      </div>

      <div className="flex flex-row w-full h-full pt-[70px] md:pt-[80px] pb-[80px] md:pb-0 relative">
        
        {showFilters && activeTab === 'search' && (
            <div className="hidden md:block w-72 shrink-0 border-r border-slate-100 bg-white h-full overflow-y-auto z-20 custom-scrollbar">
                <FilterSidebar 
                    filters={filters}
                    setFilters={setFilters}
                    onReset={resetFilters}
                    activeTab={activeTab}
                />
            </div>
        )}

        <div className="flex flex-col flex-1 min-w-0 relative h-full overflow-hidden">
            
            {activeTab === 'search' && (
              <>
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
                
                <div className="px-4 md:px-8 py-6 border-b border-slate-100 bg-white z-30 shadow-sm shrink-0">
                    <div className="flex flex-row gap-3 md:gap-4 mb-4">
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`px-4 py-3 md:py-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 gap-2 group ${showFilters ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-200 text-[#003C6C] hover:border-[#003C6C]'}`}
                        >
                            <Filter className="w-5 h-5" />
                            <span className="font-bold text-sm">Filters</span>
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
                    
                    {/* ⚡️ UPDATE INDICATOR */}
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800">{processedCourses.length} Results</span>
                        {isBackgroundFetching && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin"/> Updating...
                            </span>
                        )}
                    </div>
                </div>

                <main id="search-results-container" className="flex-1 overflow-y-auto custom-scrollbar bg-white relative z-0">
                    {/* ⚡️ Only show full blocking loader if we have NO data */}
                    {isCoursesLoading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#FDC700]" />
                            <p className="font-bold text-sm">Loading {selectedTerm}...</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 md:p-8 grid grid-cols-1 gap-6">
                                {currentCourses.length > 0 ? (
                                    currentCourses.map(course => (
                                        <CourseCard 
                                            key={course.id} 
                                            course={course} 
                                            professorRatings={professorRatings} 
                                            onAdd={addCourse} 
                                            onShowProfessor={viewProfessorDetails} 
                                            sortOption={filters.sort} 
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-1 flex flex-col items-center justify-center py-20 text-slate-400">
                                        <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="font-bold">No courses found for {selectedTerm}</p>
                                    </div>
                                )}
                            </div>
                            {processedCourses.length > ITEMS_PER_PAGE && (
                                <div className="flex justify-between items-center mt-12 mb-8 px-4 md:px-8 border-t border-slate-200 pt-8">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-4 md:px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === 1 ? 'opacity-50 cursor-default' : 'hover:border-[#003C6C] hover:text-[#003C6C] cursor-pointer'}`}>Prev</button>
                                    <span className="font-bold text-slate-500 text-sm">Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`px-4 md:px-6 py-2 border border-slate-200 bg-white rounded-lg font-bold text-sm text-slate-700 transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-default' : 'hover:border-[#003C6C] hover:text-[#003C6C] cursor-pointer'}`}>Next</button>
                                </div>
                            )}
                        </>
                    )}
                </main>
              </>
            )}

            {activeTab === 'schedule' && (
                <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
                    
                    <div className="md:hidden px-4 py-3 bg-white border-b border-slate-100 shrink-0 sticky top-0 z-30">
                        <div className="flex p-1 bg-slate-100 rounded-xl">
                            <button
                                onClick={() => setMobileScheduleView('list')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                    mobileScheduleView === 'list'
                                        ? 'bg-white text-[#003C6C] shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                List View
                            </button>
                            <button
                                onClick={() => setMobileScheduleView('calendar')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                    mobileScheduleView === 'calendar'
                                        ? 'bg-white text-[#003C6C] shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Calendar View
                            </button>
                        </div>
                    </div>

                    <div className={`${
                        mobileScheduleView === 'list' ? 'flex' : 'hidden'
                    } md:flex w-full md:w-[400px] shrink-0 border-b md:border-r border-slate-100 flex-col z-10 bg-white h-full md:max-h-full overflow-hidden`}>
                        <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="pb-4 mb-4 border-b border-slate-100 flex justify-center">
                                <h3 className="font-bold text-[#003C6C] text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5"/> My Schedule
                                </h3>
                            </div>
                            <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />
                        </div>
                        <div className="p-4 md:p-6 border-t border-slate-100 shrink-0 bg-white pb-24 md:pb-6 flex flex-col gap-2">
                            <button onClick={handleSaveSchedule} className="w-full py-4 bg-[#003C6C] text-white font-bold rounded-2xl hover:bg-[#002a4d] shadow-xl transition-all cursor-pointer active:scale-95 text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Schedule</button>
                            
                            {notification && (
                                <div className={`md:hidden w-fit mx-auto mt-4 px-8 py-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-[#003C6C] border-[#FDC700]'}`}>
                                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5 text-[#FDC700]"/>}
                                    <span className="font-bold text-xs tracking-tight">{notification.message}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`${
                        mobileScheduleView === 'calendar' ? 'flex' : 'hidden'
                    } md:flex flex-1 overflow-hidden relative h-full`}>
                        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                             <div className="w-full h-full min-w-0">
                                <CalendarView selectedCourses={selectedCourses} />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'about' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AboutTab onOpenPrivacy={() => setShowPrivacy(true)} />
                </div>
            )}
        </div>

        {showAIChat && (
            <div className="fixed inset-0 z-50 bg-white border-l border-[#FDC700] shadow-xl shrink-0 flex flex-col md:relative md:h-full md:w-[400px] md:bottom-auto pt-[70px] pb-[80px] md:pt-0 md:pb-0">
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

          <button 
             onClick={() => { setShowAIChat(true); }} 
             className={`flex flex-col items-center gap-1 p-2 w-16 ${showAIChat ? 'text-[#003C6C]' : 'text-slate-400'}`}
          >
              <MessageSquare className={`w-6 h-6 ${showAIChat ? 'stroke-[3px]' : ''}`} />
              <span className="text-[10px] font-bold whitespace-nowrap">Sammy AI</span>
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
          <div className={`${activeTab === 'schedule' ? 'hidden md:flex' : 'flex'} fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-8 py-4 rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] items-center gap-4 border animate-in slide-in-from-bottom-10 ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-[#003C6C] border-[#FDC700]'}`}>
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