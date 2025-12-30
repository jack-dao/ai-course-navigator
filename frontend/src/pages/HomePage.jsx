import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Calendar, GraduationCap, BookOpen, Save, CheckCircle, AlertCircle, LogOut, MessageSquare, Bot, Sparkles, Filter, X } from 'lucide-react';

// COMPONENTS
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';
import ProfessorModal from '../components/ProfessorModal';

const HomePage = () => {
  // --- CONFIGURATION (UCSC ONLY) ---
  const UCSC_SCHOOL = { 
    id: 'ucsc', 
    name: 'UC Santa Cruz', 
    shortName: 'UCSC', 
    term: 'Winter 2026', 
    status: 'active' 
  };
  const selectedSchool = UCSC_SCHOOL;

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('search');
  const [notification, setNotification] = useState(null); 
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20; 

  const [availableCourses, setAvailableCourses] = useState([]);
  const [professorRatings, setProfessorRatings] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // CLICK OUTSIDE HANDLER
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HELPER: RESTORE DATA ---
  const restoreScheduleFromData = (savedCourses, allCourses) => {
      if (!savedCourses || !Array.isArray(savedCourses)) return [];
      if (!allCourses || allCourses.length === 0) return [];
      return savedCourses.map(savedItem => {
          const courseCode = typeof savedItem === 'string' ? savedItem : savedItem.code;
          const originalCourse = allCourses.find(c => c.code === courseCode);
          if (!originalCourse) return null;
          let restoredSection = originalCourse.sections?.find(s => String(s.sectionCode) === String(savedItem.sectionCode));
          if (restoredSection && savedItem.labCode && restoredSection.subSections) {
             const restoredLab = restoredSection.subSections.find(lab => String(lab.sectionCode) === String(savedItem.labCode));
             if (restoredLab) restoredSection = { ...restoredSection, selectedLab: restoredLab };
          }
          return { ...originalCourse, selectedSection: restoredSection };
      }).filter(Boolean); 
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) setUser(JSON.parse(storedUser));

      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/courses');
        if (!response.ok) throw new Error('Failed to connect to server');
        const courseData = await response.json();
        setAvailableCourses(courseData);

        try {
          const ratingsRes = await fetch('http://localhost:3000/api/ratings');
          if (ratingsRes.ok) setProfessorRatings(await ratingsRes.json());
        } catch (e) { console.error("Could not load professor ratings:", e); }

        if (token) {
          try {
            const schedResponse = await fetch('http://localhost:3000/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } });
            if (schedResponse.status === 401 || schedResponse.status === 403) {
                localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null);
                showNotification("Session expired. Please log in again.", "error");
            } else if (schedResponse.ok) {
              const schedData = await schedResponse.json();
              if (schedData.courses) setSelectedCourses(restoreScheduleFromData(schedData.courses, courseData));
            }
          } catch (schedErr) { console.error("Failed to auto-load schedule:", schedErr); }
        }
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    initData();
  }, []); 

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // --- SEARCH RANKING LOGIC ---
  const processedCourses = useMemo(() => {
    const pisaSort = (a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    if (!searchQuery) return [...availableCourses].sort(pisaSort);
    const lowerQuery = searchQuery.toLowerCase();
    const scored = availableCourses.map(course => {
      let score = 0;
      if (course.code.toLowerCase() === lowerQuery) score += 1000;
      else if (course.code.toLowerCase().includes(lowerQuery)) score += 100;
      const instructorMatch = (course.sections || []).some(sec => (sec.instructor || "").toLowerCase().includes(lowerQuery));
      if (instructorMatch) score += 80;
      if (course.name.toLowerCase().includes(lowerQuery)) score += 10;
      return { course, score };
    });
    return scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score || pisaSort(a.course, b.course)).map(item => item.course);
  }, [availableCourses, searchQuery]);

  const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE);
  const currentCourses = processedCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- CONFLICT PREVENTION HELPERS ---
  const parseDays = (daysStr) => {
    if (!daysStr || daysStr === 'TBA') return [];
    return daysStr.match(/(M|Tu|W|Th|F)/g) || [];
  };

  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === 'TBA') return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [_, hours, minutes, period] = match;
    hours = parseInt(hours); minutes = parseInt(minutes);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const isOverlapping = (s1, s2) => {
    if (!s1 || !s2) return false;
    const d1 = parseDays(s1.days); const d2 = parseDays(s2.days);
    if (!d1.some(day => d2.includes(day))) return false;
    const start1 = parseTime(s1.startTime); const end1 = parseTime(s1.endTime);
    const start2 = parseTime(s2.startTime); const end2 = parseTime(s2.endTime);
    return (start1 < end2 && end1 > start2);
  };

  // --- HANDLERS ---
  const showNotification = (message, type = 'success') => {
    setNotification(null);
    setTimeout(() => { setNotification({ message, type }); }, 10);
    setTimeout(() => { setNotification(prev => (prev?.message === message ? null : prev)); }, 3000);
  };

  const addCourse = (course, section) => {
    const newItems = [section, section.selectedLab].filter(Boolean);
    const existingIndex = selectedCourses.findIndex(c => c.code === course.code);
    const isUpdate = existingIndex !== -1;

    for (const existing of selectedCourses) {
      if (existing.code === course.code) continue; 
      const existingItems = [existing.selectedSection, existing.selectedSection?.selectedLab].filter(Boolean);
      for (const newItem of newItems) {
        for (const oldItem of existingItems) {
          if (isOverlapping(newItem, oldItem)) {
            showNotification(`Time conflict with ${existing.code}!`, 'error');
            return;
          }
        }
      }
    }

    const newSchedule = isUpdate 
        ? selectedCourses.map(c => c.code === course.code ? { ...course, selectedSection: section } : c)
        : [...selectedCourses, { ...course, selectedSection: section }];

    setSelectedCourses(newSchedule);

    if (isUpdate) showNotification(`Updated discussion for ${course.code}`, 'success');
    else showNotification(`Added ${course.code} to schedule`, 'success');
  };

  const removeCourse = (courseCode) => { setSelectedCourses(selectedCourses.filter(c => c.code !== courseCode)); showNotification(`Removed ${courseCode}`, 'info'); };

  const handleLoginSuccess = async (userData, token) => {
      setUser(userData); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userData));
      setShowAuthModal(false); showNotification(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => { localStorage.clear(); setUser(null); setSelectedCourses([]); setShowProfileDropdown(false); showNotification("Logged out successfully"); };

  const handleSaveSchedule = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) { showNotification("Please log in to save!", 'error'); setShowAuthModal(true); return; }
    
    // SAVE CONFIRMATION MESSAGE
    showNotification("Schedule saved successfully! 🐌", 'success');

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
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (response.ok) showNotification("Schedule saved successfully! 🐌", 'success');
    } catch (err) { showNotification("Server error, could not save", 'error'); }
  };

  const viewProfessorDetails = (name, stats) => {
    const professorData = stats ? { name, ...stats } : { name, reviews: [], avgRating: '?', avgDifficulty: '?', wouldTakeAgain: '0', numRatings: '0' };
    setSelectedProfessor(professorData);
    setIsProfModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative font-sans selection:bg-[#003C6C] selection:text-white flex flex-col">
      {/* NOTIFICATIONS */}
      {notification && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border animate-in slide-in-from-bottom-10 
            ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 
              'bg-[#003C6C] border-[#FDC700]'}`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-white"/> : <CheckCircle className="w-5 h-5 text-[#FDC700]"/>}
              <span className="font-bold text-xs tracking-tight">{notification.message}</span>
          </div>
      )}

      {/* HEADER */}
      <header className="bg-[#003C6C] border-b border-[#FDC700] sticky top-0 z-40 shadow-xl transition-all shrink-0">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-[18px] shadow-2xl flex items-center justify-center border-4 border-[#FDC700]">
                 <span className="text-2xl">🐌</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                  AI Slug Navigator
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-100 mt-1">
                    <GraduationCap className="w-4 h-4 text-[#FDC700]" /> {selectedSchool.term}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* AI ASSISTANT BUTTON - GOLD SQUIRCLE */}
              <button 
                onClick={() => setShowAIChat(true)} 
                className="px-6 py-2.5 bg-[#FDC700] hover:bg-[#eec00e] text-[#003C6C] text-[11px] font-black rounded-2xl shadow-[0_4px_0_#b88e00] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Bot className="w-5 h-5" /> Ask Sammy AI
              </button>

              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                    <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="w-10 h-10 bg-[#FDC700] text-[#003C6C] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                      {user.name?.[0]}
                    </button>
                    {showProfileDropdown && (
                      <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-8 animate-in zoom-in-95 z-[60]">
                          <div className="flex flex-col items-center text-center mb-6">
                              <div className="w-16 h-16 bg-[#003C6C] rounded-full flex items-center justify-center text-white text-3xl font-black mb-4 uppercase mx-auto">{user.name?.[0]}</div>
                              <h4 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">{user.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">Student account</p>
                          </div>
                          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-[11px] hover:bg-rose-600 hover:text-white transition-all cursor-pointer"><LogOut className="w-4 h-4" /> Log out</button>
                      </div>
                    )}
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="px-6 py-2.5 bg-white text-[#003C6C] font-black rounded-xl text-[11px] hover:bg-slate-50 transition-all cursor-pointer border-2 border-transparent hover:border-[#FDC700]">Log in</button>
              )}
            </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8 flex flex-col gap-8">
        
        {/* CONTENT ROW: COLUMNS */}
        <div className="flex gap-8 items-start">
            
            {/* LEFT COLUMN: TABS + WINDOW */}
            <div className="flex-1 flex flex-col gap-0 min-w-0">
                {/* TABS (INSIDE LEFT COLUMN) */}
                <nav className="flex gap-8 px-4 shrink-0 mb-4">
                  {['search', 'schedule'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)} 
                      className={`pb-4 text-[13px] font-bold transition-all border-b-[6px] cursor-pointer ${activeTab === tab ? 'text-[#003C6C] border-[#003C6C]' : 'text-slate-300 border-transparent hover:text-slate-400'}`}
                    >
                      {tab === 'schedule' ? 'My Schedule' : 'Search Classes'}
                    </button>
                  ))}
                </nav>

                {/* WHITE CONTENT WINDOW */}
                <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 flex flex-col min-h-[800px]">
                    <div className="flex-1">
                        {activeTab === 'search' && (
                        <div className="p-10">
                            <div className="relative mb-12 w-full group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#003C6C] w-6 h-6 transition-colors" />
                                <input type="text" placeholder="Search courses and instructors..." className="w-full pl-14 pr-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] focus:bg-white focus:border-[#003C6C] outline-none transition-all text-lg font-bold shadow-inner placeholder:text-slate-300 text-slate-700" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                {currentCourses.length === 0 ? <div className="text-center py-20 text-slate-400 font-bold">No classes found.</div> : currentCourses.map(course => <CourseCard key={course.id} course={course} professorRatings={professorRatings} onAdd={addCourse} onShowProfessor={viewProfessorDetails} />)}
                            </div>
                            {processedCourses.length > ITEMS_PER_PAGE && (
                            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-3 border-2 border-slate-100 rounded-2xl font-bold text-sm hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer">Prev</button>
                                <span className="font-bold text-slate-400 text-xs tracking-widest">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-6 py-3 border-2 border-slate-100 rounded-2xl font-bold text-sm hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer">Next</button>
                            </div>
                            )}
                        </div>
                        )}
                        
                        {activeTab === 'schedule' && (
                        <div className="flex flex-col lg:grid lg:grid-cols-[450px_1fr] gap-8 h-full p-8 min-h-[800px]">
                            <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 flex-1 flex flex-col shadow-inner">
                                <h3 className="font-bold text-slate-700 mb-6 text-sm flex items-center gap-3"><BookOpen className="w-5 h-5 text-[#003C6C]"/> My Schedule</h3>
                                <div className="flex-1 pr-2">
                                    {selectedCourses.length === 0 ? <p className="text-slate-300 py-20 text-center font-bold text-sm">Schedule is empty</p> : <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />}
                                </div>
                                <div className="pt-6 border-t border-slate-200">
                                  <button onClick={handleSaveSchedule} className="w-full py-4 bg-[#003C6C] text-white font-bold rounded-2xl hover:bg-[#002a4d] shadow-xl transition-all cursor-pointer active:scale-95 text-xs">
                                    <Save className="w-4 h-4 inline mr-2" /> Save Schedule
                                  </button>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden h-[800px] sticky top-8"><CalendarView selectedCourses={selectedCourses} /></div>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CHAT SIDEBAR - RIGHT COLUMN (Sticky + Top Padding) */}
            <div className="sticky top-8 pt-16"> {/* Matches tabs height approx */}
                <ChatSidebar isOpen={showAIChat} onClose={() => setShowAIChat(false)} messages={chatMessages} onSendMessage={(text) => setChatMessages([...chatMessages, {role: 'user', text}, {role: 'assistant', text: 'How can I help?'}])} schoolName={selectedSchool.shortName} />
            </div>
        </div>
      </main>
      
      <ProfessorModal professor={selectedProfessor} isOpen={isProfModalOpen} onClose={() => setIsProfModalOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} selectedSchool={selectedSchool} />
    </div>
  );
};

export default HomePage;