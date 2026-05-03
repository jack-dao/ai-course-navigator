import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';

import {
  Header,
  MobileBottomNav,
  FilterSidebar,
  ScheduleTab,
  SearchTab,
  AuthModal,
  ProfessorModal,
  PrivacyModal,
  AboutTab,
  Toast,
} from '../components';

const ChatSidebar = lazy(() => import('../components/chat/ChatSidebar'));
import { useCourseFilters, useSchedule, useNotification, useTerms, useCourses, useChat } from '../hooks';
import { authFetch } from '../utils/api';
import type { TabName, Course, Section, ProfessorModalData } from '../types';

const MAX_UNITS = 22;

interface HomePageProps {
  user: User | null;
  session: Session | null;
  defaultTab?: TabName;
  openChat?: boolean;
}

const HomePage = ({ user, session, openChat = false }: HomePageProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Data hooks ---
  const { ucscSchool, availableTerms, selectedTerm, setSelectedTerm } = useTerms();
  const { availableCourses, professorRatings, isCoursesLoading, isBackgroundFetching } = useCourses(selectedTerm);
  const { filters, setFilters, searchQuery, setSearchQuery, resetFilters, processedCourses } = useCourseFilters(
    availableCourses,
    professorRatings
  );
  const { selectedCourses, setSelectedCourses, checkForConflicts, totalUnits } = useSchedule(
    user,
    session,
    availableCourses,
    selectedTerm
  );
  const { chatMessages, isChatLoading, handleSendMessage } = useChat(selectedTerm, selectedCourses, session);
  const { notification, showNotification } = useNotification();

  // --- Routing ---
  const activeTab: TabName = (() => {
    const path = location.pathname;
    if (path === '/schedule') return 'schedule';
    if (path === '/about') return 'about';
    return 'search';
  })();

  const setActiveTab = (tab: TabName) => navigate(`/${tab}`);

  // --- UI state ---
  const [showFilters, setShowFilters] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [showAIChat, setShowAIChat] = useState(() => {
    if (openChat) return true;
    try {
      return localStorage.getItem('showAIChat') === 'true';
    } catch {
      return false;
    }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState<ProfessorModalData | null>(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Open chat when arriving at /chat
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (location.pathname === '/chat' && !showAIChat) {
      setShowAIChat(true);
    }
  }

  useEffect(() => {
    localStorage.setItem('showAIChat', String(showAIChat));
  }, [showAIChat]);

  useEffect(() => {
    const handleScrollLock = () => {
      const isMobile = window.innerWidth < 768;
      const isChatOverlay = window.innerWidth < 1280 && showAIChat;
      if ((isMobile && showFilters && activeTab === 'search') || isChatOverlay) {
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

  // --- Handlers ---
  const addCourse = useCallback(
    (course: Course, section: Section) => {
      const conflictingCourse = checkForConflicts(section, selectedCourses, course.code);
      if (conflictingCourse) {
        showNotification(`Time conflict with ${conflictingCourse}`, 'error');
        return;
      }
      const courseUnits = parseInt(String(course.credits || 0));
      const existingIndex = selectedCourses.findIndex((c) => c.code === course.code);
      if (existingIndex === -1 && totalUnits + courseUnits > MAX_UNITS) {
        showNotification(`Cannot add ${course.code}. Exceeds ${MAX_UNITS} unit limit.`, 'error');
        return;
      }
      const isUpdate = existingIndex !== -1;
      const newSchedule = isUpdate
        ? selectedCourses.map((c) => (c.code === course.code ? { ...course, selectedSection: section } : c))
        : [...selectedCourses, { ...course, selectedSection: section }];
      setSelectedCourses(newSchedule);
      showNotification(isUpdate ? `Updated ${course.code}` : `Added ${course.code}`, 'success');
    },
    [checkForConflicts, selectedCourses, totalUnits, showNotification, setSelectedCourses]
  );

  const removeCourse = useCallback(
    (courseCode: string) => {
      setSelectedCourses((prev) => prev.filter((c) => c.code !== courseCode));
      showNotification(`Removed ${courseCode}`, 'info');
    },
    [setSelectedCourses, showNotification]
  );

  const handleSaveSchedule = useCallback(async () => {
    if (!user || !session) {
      showNotification('Please log in to save', 'error');
      setShowAuthModal(true);
      return;
    }
    showNotification('Saving schedule...', 'info');
    try {
      const payload = {
        name: selectedTerm,
        courses: selectedCourses.map((course) => ({
          code: course.code,
          sectionCode: course.selectedSection?.sectionCode || '',
          labCode: course.selectedSection?.selectedLab?.sectionCode || '',
        })),
      };

      const response = await authFetch('/api/schedules', session, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showNotification('Schedule saved successfully!', 'success');
      } else if (response.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
        setShowAuthModal(true);
      } else {
        console.error('Save response error:', response.status);
        showNotification('Failed to save schedule', 'error');
      }
    } catch (e) {
      console.error('Save exception:', e);
      showNotification('Server error', 'error');
    }
  }, [user, session, selectedTerm, selectedCourses, showNotification]);

  const viewProfessorDetails = useCallback(
    (name: string) => {
      const fullStats = professorRatings[name];
      setSelectedProfessor({
        name,
        avgRating: fullStats?.avgRating,
        avgDifficulty: fullStats?.avgDifficulty,
        wouldTakeAgain: fullStats?.wouldTakeAgain,
        numRatings: fullStats?.numRatings,
        rmpLink: fullStats?.rmpLink,
        reviews: fullStats?.reviews || [],
      });
      setIsProfModalOpen(true);
    },
    [professorRatings]
  );

  const handleToggleChat = useCallback(() => {
    if (showAIChat) {
      setShowAIChat(false);
      if (location.pathname === '/chat') navigate(`/${activeTab}`);
    } else {
      setShowAIChat(true);
    }
  }, [showAIChat, location.pathname, activeTab, navigate]);

  return (
    <div className="h-[100dvh] w-full bg-white flex flex-col font-sans relative overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-[60] bg-white border-b border-slate-200 h-[70px] md:h-[80px]">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          showAuthModal={showAuthModal}
          onLoginClick={() => setShowAuthModal(true)}
          showAIChat={showAIChat}
          onToggleChat={handleToggleChat}
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
          availableTerms={availableTerms}
        />
      </div>

      <div className="flex flex-row w-full h-full pt-[70px] md:pt-[80px] pb-[80px] md:pb-0 relative">
        {showFilters && activeTab === 'search' && (
          <div
            className={`hidden md:block w-72 shrink-0 border-r border-slate-100 bg-white h-full overflow-y-auto z-20 custom-scrollbar ${showAIChat ? '2xl:block md:hidden' : ''}`}
          >
            <FilterSidebar filters={filters} setFilters={setFilters} onReset={resetFilters} activeTab={activeTab} />
          </div>
        )}

        <div className="flex flex-col flex-1 min-w-0 relative h-full overflow-hidden">
          {activeTab === 'search' && (
            <SearchTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              processedCourses={processedCourses}
              isCoursesLoading={isCoursesLoading}
              isBackgroundFetching={isBackgroundFetching}
              selectedTerm={selectedTerm}
              professorRatings={professorRatings}
              onAdd={addCourse}
              onShowProfessor={viewProfessorDetails}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleTab
              selectedCourses={selectedCourses}
              onRemove={removeCourse}
              onSave={handleSaveSchedule}
              notification={notification}
            />
          )}

          {activeTab === 'about' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AboutTab onOpenPrivacy={() => setShowPrivacy(true)} />
            </div>
          )}
        </div>

        {showAIChat && (
          <div className="fixed inset-0 z-50 bg-white border-l border-ucsc-gold shadow-xl shrink-0 flex flex-col xl:relative xl:h-full xl:w-[400px] xl:bottom-auto pt-[70px] pb-[80px] xl:pt-0 xl:pb-0">
            <div className="w-full h-full overflow-hidden">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-ucsc-gold" />
                  </div>
                }
              >
                <ChatSidebar
                  isOpen={true}
                  onClose={handleToggleChat}
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  schoolName={ucscSchool.shortName}
                  isLoading={isChatLoading}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showAIChat={showAIChat}
        setShowAIChat={(show: boolean) => {
          if (show) {
            navigate('/chat');
          } else {
            setShowAIChat(false);
            if (location.pathname === '/chat') navigate(`/${activeTab}`);
          }
        }}
      />

      {notification && (
        <Toast
          notification={notification}
          className={`${activeTab === 'schedule' ? 'hidden md:flex' : 'flex'} fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000]`}
        />
      )}

      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <ProfessorModal
        professor={selectedProfessor}
        isOpen={isProfModalOpen}
        onClose={() => setIsProfModalOpen(false)}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => setShowAuthModal(false)}
        selectedSchool={ucscSchool}
      />
    </div>
  );
};

export default HomePage;
