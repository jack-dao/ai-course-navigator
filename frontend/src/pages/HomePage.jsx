import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Calendar, ChevronDown, GraduationCap, BookOpen, Save, CheckCircle, AlertCircle, LogOut, LogIn, Loader, ArrowLeft, Star, MessageSquare, Flame, ThumbsUp, TrendingUp, X, Sparkles, User } from 'lucide-react';

// COMPONENTS
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';

/**
 * PROFESSOR MODAL COMPONENT
 * Refined with larger text, gray review boxes, and high-contrast stat cards.
 */
const ProfessorModal = ({ professor, isOpen, onClose }) => {
  if (!isOpen || !professor) return null;

  const hasReviews = professor.reviews && professor.reviews.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{professor.name.replace(/,/g, ', ')}</h2>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[3px] mt-1">Professor Analytics</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X className="w-8 h-8 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Quality', val: `${professor.avgRating || '?'}/5`, icon: <Star className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-100 border-emerald-200' },
              { label: 'Difficulty', val: `${professor.avgDifficulty || '?'}/5`, icon: <Flame className="w-6 h-6 text-rose-600" />, bg: 'bg-rose-100 border-rose-200' },
              { label: 'Retake', val: `${professor.wouldTakeAgain || '0'}%`, icon: <ThumbsUp className="w-6 h-6 text-indigo-600" />, bg: 'bg-indigo-100 border-indigo-200' },
              { label: 'Ratings', val: professor.numRatings || '0', icon: <TrendingUp className="w-6 h-6 text-slate-500" />, bg: 'bg-slate-100 border-slate-200' }
            ].map((s, i) => (
              <div key={i} className={`${s.bg} p-8 rounded-[28px] border-2 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-105`}>
                <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm mb-4">{s.icon}</div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{s.label}</p>
                <p className="text-3xl font-black text-slate-900">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-8 px-2">
              <MessageSquare className="w-6 h-6 text-indigo-600" /> Recent Student Feedback
            </h3>
            {hasReviews ? (
              professor.reviews?.map((rev, i) => (
                <div key={i} className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <span className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-lg shadow-sm uppercase">{rev.course}</span>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{new Date(rev.date).toLocaleDateString()}</span>
                    </div>
                    <span className="px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-lg shadow-md uppercase tracking-tighter shadow-md">Grade: {rev.grade || 'N/A'}</span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed italic border-l-[8px] border-indigo-200 pl-8 text-2xl">"{rev.comment}"</p>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-50 rounded-[32px] border-4 border-dashed border-slate-200">
                 <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-[6px] text-lg">No professor reviews available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  // --- CONFIGURATION ---
  const SCHOOLS = [
    { id: 'ucsc', name: 'UC Santa Cruz', shortName: 'UCSC', term: 'Winter 2026', status: 'active' },
    { id: 'sjsu', name: 'San Jose State', shortName: 'SJSU', term: 'Spring 2026', status: 'inactive' }
  ];

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('search');
  const [notification, setNotification] = useState(null); 
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedSchool, setSelectedSchool] = useState(SCHOOLS[0]);
  const [showSchoolSelector, setShowSchoolSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20; 

  const [availableCourses, setAvailableCourses] = useState([]);
  const [professorRatings, setProfessorRatings] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  
  // MODAL STATE
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
      } catch (err) { setError(err.message); setLoading(false); }
    };
    initData();
  }, [selectedSchool]);

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
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const isOverlapping = (s1, s2) => {
    if (!s1 || !s2) return false;
    const d1 = parseDays(s1.days);
    const d2 = parseDays(s2.days);
    if (!d1.some(day => d2.includes(day))) return false;
    const start1 = parseTime(s1.startTime);
    const end1 = parseTime(s1.endTime);
    const start2 = parseTime(s2.startTime);
    const end2 = parseTime(s2.endTime);
    return (start1 < end2 && end1 > start2);
  };

  // --- HANDLERS ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addCourse = (course, section) => {
    // Collect potential conflict items from the NEW selection (Lecture and optional Lab)
    const newItems = [section, section.selectedLab].filter(Boolean);
    
    // Iterate existing courses and check for overlaps
    for (const existing of selectedCourses) {
      if (existing.code === course.code) continue; // Allow replacement of existing section for same course

      const existingItems = [existing.selectedSection, existing.selectedSection?.selectedLab].filter(Boolean);
      
      for (const newItem of newItems) {
        for (const oldItem of existingItems) {
          if (isOverlapping(newItem, oldItem)) {
            showNotification(`Time Conflict with ${existing.code}!`, 'error');
            return;
          }
        }
      }
    }

    setSelectedCourses([...selectedCourses.filter(c => c.code !== course.code), { ...course, selectedSection: section }]);
    showNotification(`Added ${course.code} to schedule`, 'success');
  };

  const removeCourse = (courseCode) => { setSelectedCourses(selectedCourses.filter(c => c.code !== courseCode)); showNotification(`Removed ${courseCode}`); };

  const handleLoginSuccess = async (userData, token) => {
      setUser(userData); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userData));
      setShowAuthModal(false); showNotification(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => { localStorage.clear(); setUser(null); setSelectedCourses([]); setShowProfileDropdown(false); showNotification("Logged out successfully"); };

  const handleSaveSchedule = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) { showNotification("Please log in to save!", 'error'); setShowAuthModal(true); return; }
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
      if (response.ok) showNotification("Schedule saved!");
    } catch (err) { showNotification("Server error", 'error'); }
  };

  const viewProfessorDetails = (name, stats) => {
    const professorData = stats ? { name, ...stats } : { name, reviews: [], avgRating: '?', avgDifficulty: '?', wouldTakeAgain: '0', numRatings: '0' };
    setSelectedProfessor(professorData);
    setIsProfModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* NOTIFICATIONS: SQUIRCLE UI */}
      {notification && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl bg-slate-900 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom-10`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400"/> : <CheckCircle className="w-5 h-5 text-emerald-400"/>}
              <span className="font-bold text-xs tracking-tight">{notification.message}</span>
          </div>
      )}

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-all px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-[18px] shadow-2xl flex items-center justify-center cursor-pointer transform hover:rotate-6 transition-transform">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">AI Course Navigator</h1>
              <div className="relative">
                  <button onClick={() => setShowSchoolSelector(!showSchoolSelector)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                      <GraduationCap className="w-4 h-4" /> {selectedSchool.name} • {selectedSchool.term} <ChevronDown className="w-3 h-3" />
                  </button>
                  {showSchoolSelector && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border z-20 overflow-hidden">
                          {SCHOOLS.map(school => (
                              <button key={school.id} onClick={() => { setSelectedSchool(school); setSelectedCourses([]); setShowSchoolSelector(false); }} className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 cursor-pointer">
                                  <div className="font-bold text-gray-800">{school.name}</div>
                                  <div className="text-xs text-gray-500">{school.term}</div>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI ASSISTANT: MESSAGE ICON & SQUIRCLE UI */}
            <button onClick={() => setShowAIChat(true)} className="px-6 py-2.5 bg-indigo-600 text-white text-[11px] font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 cursor-pointer">
              <MessageSquare className="w-4 h-4 text-white fill-current" /> AI Assistant
            </button>
            {user ? (
              <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="w-10 h-10 bg-indigo-600 text-white font-bold rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all uppercase cursor-pointer border-2 border-white">
                    {user.name?.[0]}
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 p-8 animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-black mb-4 uppercase">{user.name?.[0]}</div>
                            <h4 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">{user.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Student account</p>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-[11px] hover:bg-rose-600 hover:text-white transition-all cursor-pointer"><LogOut className="w-4 h-4" /> Log Out</button>
                    </div>
                  )}
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-6 py-2.5 bg-white border-2 border-slate-100 text-slate-900 font-bold rounded-xl text-[11px] hover:border-slate-900 transition-all cursor-pointer">Log in</button>
            )}
          </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8 flex gap-8">
        <div className="flex-1 bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
            <nav className="flex px-10 pt-6 bg-slate-50/50 border-b border-slate-100">
              {['search', 'schedule'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-10 py-5 text-[13px] font-bold transition-all border-b-[6px] cursor-pointer ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}
                >
                  {tab === 'schedule' ? 'My Schedule' : 'Search'}
                </button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'search' && (
                <div className="p-10">
                    <div className="relative mb-12 w-full group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 w-6 h-6 transition-colors" />
                        <input type="text" placeholder="Search courses and instructors" className="w-full pl-14 pr-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[20px] focus:bg-white focus:border-indigo-600 outline-none transition-all text-lg font-bold shadow-inner placeholder:text-slate-300" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {currentCourses.length === 0 ? <div className="text-center py-20 text-slate-400 font-bold">No classes found.</div> : currentCourses.map(course => <CourseCard key={course.id} course={course} professorRatings={professorRatings} onAdd={addCourse} onShowProfessor={viewProfessorDetails} />)}
                    </div>
                    {/* PAGINATION: SENTENCE CASE */}
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
                <div className="flex flex-col lg:grid lg:grid-cols-[450px_1fr] gap-8 h-[850px] p-8">
                    <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 flex-1 flex flex-col overflow-hidden shadow-inner">
                        <h3 className="font-bold text-slate-400 mb-6 text-sm italic"><BookOpen className="w-5 h-5 text-indigo-600"/> My Schedule</h3>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {selectedCourses.length === 0 ? <p className="text-slate-300 py-20 text-center font-bold text-sm">Schedule is empty</p> : <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />}
                        </div>
                        <div className="pt-6 border-t border-slate-200">
                            <button onClick={handleSaveSchedule} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl transition-all cursor-pointer active:scale-95 text-xs italic">
                                <Save className="w-4 h-4 inline mr-2" /> Save schedule
                            </button>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden h-full"><CalendarView selectedCourses={selectedCourses} /></div>
                </div>
                )}
            </div>
        </div>
        <ChatSidebar isOpen={showAIChat} onClose={() => setShowAIChat(false)} messages={chatMessages} onSendMessage={(text) => setChatMessages([...chatMessages, {role: 'user', text}, {role: 'assistant', text: 'How can I help?'}])} schoolName={selectedSchool.shortName} />
      </div>
      
      <ProfessorModal professor={selectedProfessor} isOpen={isProfModalOpen} onClose={() => setIsProfModalOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} selectedSchool={selectedSchool} />
    </div>
  );
};

export default HomePage;