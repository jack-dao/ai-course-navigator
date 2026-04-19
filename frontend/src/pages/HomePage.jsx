import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Search, Filter, BookOpen, Loader2, RefreshCw, SlidersHorizontal } from 'lucide-react';

import Header from '../components/Header';
import FilterSidebar from '../components/FilterSidebar';
import CustomDropdown from '../components/CustomDropdown';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';
import ProfessorModal from '../components/ProfessorModal';
import PrivacyModal from '../components/PrivacyModal';
import AboutTab from '../components/AboutTab';
import CourseList from '../components/CourseList';
import MobileBottomNav from '../components/MobileBottomNav';

import { useCourseFilters } from '../hooks/useCourseFilters';
import { useSchedule } from '../hooks/useSchedule';
import { useNotification } from '../hooks/useNotification';
import { useTerms } from '../hooks/useTerms';
import { useCourses } from '../hooks/useCourses';
import { useChat } from '../hooks/useChat';
import { authFetch } from '../utils/api';

const HomePage = ({ user, session }) => {
  const { ucscSchool, availableTerms, selectedTerm, setSelectedTerm } = useTerms();
  const { availableCourses, professorRatings, isCoursesLoading, isBackgroundFetching } = useCourses(selectedTerm);
  const { filters, setFilters, searchQuery, setSearchQuery, resetFilters, processedCourses } = useCourseFilters(availableCourses, professorRatings);
  const { selectedCourses, setSelectedCourses, checkForConflicts, totalUnits } = useSchedule(user, session, availableCourses, selectedTerm);
  const { chatMessages, isChatLoading, handleSendMessage } = useChat(selectedTerm, selectedCourses);
  const { notification, showNotification } = useNotification();

  const MAX_UNITS = 22;
  const ITEMS_PER_PAGE = 20;

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'search');
  const [mobileScheduleView, setMobileScheduleView] = useState('list');
  const [showFilters, setShowFilters] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [showAIChat, setShowAIChat] = useState(() => {
    try { return localStorage.getItem('showAIChat') === 'true'; } catch { return false; }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => parseInt(sessionStorage.getItem('currentPage')) || 1);

  useEffect(() => { localStorage.setItem('activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('showAIChat', showAIChat); }, [showAIChat]);

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

  const [prevSearch, setPrevSearch] = useState(searchQuery);
  const [prevFiltersStr, setPrevFiltersStr] = useState(JSON.stringify(filters));

  const filtersStr = JSON.stringify(filters);
  if (prevSearch !== searchQuery || prevFiltersStr !== filtersStr) {
    setCurrentPage(1);
    setPrevSearch(searchQuery);
    setPrevFiltersStr(filtersStr);
  }

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

      const response = await authFetch('/api/schedules', session, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showNotification("Schedule saved successfully!", 'success');
      } else if (response.status === 401) {
        showNotification("Session expired. Please log in again.", 'error');
        setShowAuthModal(true);
      } else {
        console.error("Save response error:", response.status);
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
            <FilterSidebar filters={filters} setFilters={setFilters} onReset={resetFilters} activeTab={activeTab} />
          </div>
        )}

        <div className="flex flex-col flex-1 min-w-0 relative h-full overflow-hidden">

          {activeTab === 'search' && (
            <>
              {showFilters && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in slide-in-from-bottom-5 overflow-hidden pt-[70px] pb-[80px]">
                  <div className="flex-1 overflow-y-auto">
                    <FilterSidebar filters={filters} setFilters={setFilters} onReset={resetFilters} activeTab={activeTab} onClose={() => setShowFilters(false)} />
                  </div>
                </div>
              )}

              <div className="px-4 md:px-8 py-4 border-b border-slate-100 bg-white z-30 shadow-sm shrink-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`md:hidden p-2 rounded-xl border transition-all cursor-pointer ${showFilters ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'}`}
                    >
                      <Filter className="w-5 h-5 text-slate-600" />
                    </button>

                    <div className="relative flex-1 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003C6C] w-5 h-5 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search courses..."
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#003C6C] outline-none transition-all shadow-sm bg-slate-50/50 text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                          showFilters
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#003C6C] hover:text-[#003C6C]'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Filters</span>
                      </button>

                      <CustomDropdown
                        prefix="Sort: "
                        value={filters.sort}
                        options={['Best Match', 'Rating', 'Difficulty']}
                        onChange={(val) => setFilters({...filters, sort: val})}
                        triggerClassName="flex items-center justify-between gap-2 bg-white border border-slate-200 hover:border-[#003C6C] rounded-full px-4 py-3 text-xs font-bold text-slate-600 hover:text-[#003C6C] transition-all cursor-pointer whitespace-nowrap min-w-[140px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-400">{processedCourses.length} results found</span>
                      {isBackgroundFetching && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin"/>}
                    </div>
                    <div className="md:hidden">
                      <CustomDropdown
                        value={filters.sort}
                        options={['Best Match', 'Rating', 'Difficulty']}
                        onChange={(val) => setFilters({...filters, sort: val})}
                        triggerClassName="flex items-center gap-1 text-xs font-bold text-slate-500 bg-transparent border-none p-0 cursor-pointer"
                        prefix="Sort: "
                      />
                    </div>
                  </div>
                </div>
              </div>

              <main id="search-results-container" className="flex-1 overflow-y-auto custom-scrollbar bg-white relative z-0">
                {isCoursesLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#FDC700]" />
                    <p className="font-bold text-sm">Loading {selectedTerm}...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 md:p-8 grid grid-cols-1 gap-6">
                      <CourseList
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        processedCourses={currentCourses}
                        onAdd={addCourse}
                        filters={filters}
                        professorRatings={professorRatings}
                        onShowProfessor={viewProfessorDetails}
                        sortOption={filters.sort}
                      />
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
                      mobileScheduleView === 'list' ? 'bg-white text-[#003C6C] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setMobileScheduleView('calendar')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      mobileScheduleView === 'calendar' ? 'bg-white text-[#003C6C] shadow-sm' : 'text-slate-500 hover:text-slate-700'
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

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} showAIChat={showAIChat} setShowAIChat={setShowAIChat} />

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
