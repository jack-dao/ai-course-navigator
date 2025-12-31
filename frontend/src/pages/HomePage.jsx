import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Calendar, GraduationCap, BookOpen, Save, CheckCircle, 
  AlertCircle, LogOut, Bot, Sparkles, Filter, X, ChevronDown, 
  ChevronUp, Check, Star, RotateCcw, MessageSquare, Tag, Flame, 
  ThumbsUp, TrendingUp 
} from 'lucide-react';

// COMPONENTS
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';

// --- INTERNAL PROFESSOR MODAL ---
const ProfessorModal = ({ professor, isOpen, onClose }) => {
  if (!isOpen || !professor) return null;
  const reviews = professor.reviews || [];
  const hasReviews = reviews.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-4xl font-serif font-bold text-[#003C6C] tracking-tight">{professor.name.replace(/,/g, ', ')}</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className="bg-[#FDC700] text-[#003C6C] text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">Instructor</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">Analytics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X className="w-8 h-8 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Quality', val: `${professor.avgRating || '?'}/5`, icon: <Star className="w-6 h-6 text-[#FDC700]" />, bg: 'bg-[#003C6C]' },
              { label: 'Difficulty', val: `${professor.avgDifficulty || '?'}/5`, icon: <Flame className="w-6 h-6 text-rose-400" />, bg: 'bg-slate-800' },
              { label: 'Retake', val: `${professor.wouldTakeAgain || '0'}%`, icon: <ThumbsUp className="w-6 h-6 text-emerald-400" />, bg: 'bg-slate-800' },
              { label: 'Ratings', val: professor.numRatings || '0', icon: <TrendingUp className="w-6 h-6 text-slate-500" />, bg: 'bg-white border-2 border-slate-100', text: 'text-slate-900' }
            ].map((s, i) => (
              <div key={i} className={`${s.bg} p-8 rounded-[28px] shadow-sm flex flex-col items-center text-center transition-transform hover:scale-105`}>
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner mb-4">{s.icon}</div>
                <p className={`text-xs font-black tracking-widest mb-1 ${s.text ? 'text-slate-400' : 'text-white/60'}`}>{s.label}</p>
                <p className={`text-3xl font-black ${s.text || 'text-white'}`}>{s.val}</p>
              </div>
            ))}
          </div>
          <div className="space-y-8">
            <h3 className="text-xl font-black text-[#003C6C] tracking-widest flex items-center gap-3 mb-8 px-2"><MessageSquare className="w-6 h-6 text-[#003C6C]" /> Recent student feedback</h3>
            {hasReviews ? (
              reviews.map((rev, i) => (
                <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 hover:shadow-lg transition-all group relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-2 bg-slate-100 group-hover:bg-[#FDC700] transition-colors" />
                  <div className="flex items-center justify-between mb-6 pl-4">
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-1.5 bg-[#003C6C] text-white text-xs font-black rounded-lg shadow-sm">{rev.course || 'General'}</span>
                      <span className="text-sm font-bold text-slate-400 tracking-widest flex items-center gap-2"><Calendar className="w-4 h-4" />{rev.date ? new Date(rev.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {rev.grade && <span className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-100 text-xs font-black rounded-lg shadow-sm tracking-tighter">Grade: {rev.grade}</span>}
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed italic pl-4 text-xl mb-4">"{rev.comment}"</p>
                  {rev.tags && rev.tags.length > 0 && (
                     <div className="flex flex-wrap gap-2 pl-4 pt-4 border-t border-slate-100">
                        {rev.tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200"><Tag className="w-3 h-3" /> {tag}</span>
                        ))}
                     </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[32px] border-4 border-dashed border-slate-200">
                 <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold tracking-[6px] text-lg">No professor reviews available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- FILTER SECTION ---
const FilterSection = ({ title, children, isOpen = true }) => {
  const [open, setOpen] = useState(isOpen);
  return (
    <div className="border-b border-slate-100 py-5 last:border-0">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center justify-between w-full mb-3 group cursor-pointer outline-none"
      >
        <h4 className="font-black text-[11px] text-[#003C6C] uppercase tracking-[2px] group-hover:text-[#FDC700] transition-colors">{title}</h4>
        {open ? <ChevronUp className="w-3 h-3 text-slate-300" /> : <ChevronDown className="w-3 h-3 text-slate-300" />}
      </button>
      {open && <div className="space-y-3 animate-in slide-in-from-top-1">{children}</div>}
    </div>
  );
};

const HomePage = () => {
  // --- CONFIGURATION ---
  const UCSC_SCHOOL = { id: 'ucsc', name: 'UC Santa Cruz', shortName: 'UCSC', term: 'Winter 2026', status: 'active' };
  const selectedSchool = UCSC_SCHOOL;

  const [activeTab, setActiveTab] = useState('search');
  const [notification, setNotification] = useState(null); 
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // FILTERS
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ openOnly: false, minRating: 0, minUnits: [], days: [], department: 'All Departments' });

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        } catch (e) { console.error("Ratings Error:", e); }

        if (token) {
          try {
            const schedResponse = await fetch('http://localhost:3000/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } });
            if (schedResponse.ok) {
              const schedData = await schedResponse.json();
              if (schedData.courses) setSelectedCourses(restoreScheduleFromData(schedData.courses, courseData));
            }
          } catch (schedErr) { console.error("Schedule Error:", schedErr); }
        }
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    initData();
  }, []); 

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filters]);

  const toggleDay = (day) => { setFilters(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day] })); };
  const toggleUnit = (u) => { setFilters(prev => ({ ...prev, minUnits: prev.minUnits.includes(u) ? prev.minUnits.filter(x => x !== u) : [...prev.minUnits, u] })); };
  const resetFilters = () => { setFilters({ openOnly: false, minRating: 0, minUnits: [], days: [], department: 'All Departments' }); setSearchQuery(''); };

  const processedCourses = useMemo(() => {
    const pisaSort = (a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    let results = [...availableCourses].sort(pisaSort);

    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        results = results.map(course => {
          let score = 0;
          if (course.code.toLowerCase() === lowerQuery) score += 1000;
          else if (course.code.toLowerCase().includes(lowerQuery)) score += 100;
          const instructorMatch = (course.sections || []).some(sec => (sec.instructor || "").toLowerCase().includes(lowerQuery));
          if (instructorMatch) score += 80;
          if (course.name.toLowerCase().includes(lowerQuery)) score += 10;
          return { course, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || pisaSort(a.course, b.course)).map(item => item.course);
    }

    if (filters.openOnly) results = results.filter(course => course.sections?.some(sec => sec.status !== 'Closed' && sec.status !== 'Wait List'));
    if (filters.minRating > 0) results = results.filter(course => course.sections?.some(sec => { const stats = professorRatings[sec.instructor]; return stats && stats.avgRating >= filters.minRating; }));
    if (filters.minUnits.length > 0) results = results.filter(course => filters.minUnits.includes(parseInt(course.credits)));

    return results;
  }, [availableCourses, searchQuery, filters, professorRatings]);

  const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE);
  const currentCourses = processedCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const showNotification = (message, type = 'success') => {
    setNotification(null);
    setTimeout(() => { setNotification({ message, type }); }, 10);
    setTimeout(() => { setNotification(prev => (prev?.message === message ? null : prev)); }, 3000);
  };

  const addCourse = (course, section) => {
    // Conflict logic simplified for brevity
    const existingIndex = selectedCourses.findIndex(c => c.code === course.code);
    const isUpdate = existingIndex !== -1;
    const newSchedule = isUpdate 
        ? selectedCourses.map(c => c.code === course.code ? { ...course, selectedSection: section } : c)
        : [...selectedCourses, { ...course, selectedSection: section }];
    setSelectedCourses(newSchedule);
    if (isUpdate) showNotification(`Updated ${course.code}`, 'success');
    else showNotification(`Added ${course.code}`, 'success');
  };

  const removeCourse = (courseCode) => { setSelectedCourses(selectedCourses.filter(c => c.code !== courseCode)); showNotification(`Removed ${courseCode}`, 'info'); };

  const handleLoginSuccess = async (userData, token) => {
      setUser(userData); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userData));
      setShowAuthModal(false); showNotification(`Welcome back, ${userData.name}!`);
  };
  const handleLogout = () => { localStorage.clear(); setUser(null); setSelectedCourses([]); setShowProfileDropdown(false); showNotification("Logged out"); };
  
  const handleSaveSchedule = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) { showNotification("Please log in to save", 'error'); setShowAuthModal(true); return; }
    showNotification("Schedule saved! 🐌", 'success');
    try {
      const payload = { name: `My Schedule`, courses: selectedCourses.map(c => ({ code: c.code, sectionCode: c.selectedSection?.sectionCode })) };
      await fetch('http://localhost:3000/api/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
    } catch (err) { showNotification("Server error", 'error'); }
  };

  const viewProfessorDetails = (name, stats) => {
    const fullStats = professorRatings[name] || {};
    setSelectedProfessor({ name, ...fullStats, reviews: fullStats.reviews || [] });
    setIsProfModalOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#003C6C] selection:text-white">
      
      {/* NOTIFICATIONS */}
      {notification && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border animate-in slide-in-from-bottom-10 ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-[#003C6C] border-[#FDC700]'}`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5 text-[#FDC700]"/>}
              <span className="font-bold text-xs tracking-tight">{notification.message}</span>
          </div>
      )}

      <ProfessorModal professor={selectedProfessor} isOpen={isProfModalOpen} onClose={() => setIsProfModalOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} selectedSchool={selectedSchool} />

      {/* HEADER */}
      <header className="bg-[#003C6C] border-b border-[#FDC700] sticky top-0 z-40 shadow-xl shrink-0">
        <div className="w-full px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-[18px] shadow-2xl flex items-center justify-center border-4 border-[#FDC700]"><span className="text-2xl">🐌</span></div>
              <div>
                <h1 className="text-3xl font-serif font-medium text-white tracking-tight flex items-center gap-2">AI Slug Navigator</h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-100 mt-1"><GraduationCap className="w-4 h-4 text-[#FDC700]" /> {selectedSchool.term}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-[#002a4d] rounded-xl p-1">
                  {['search', 'schedule'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wider ${activeTab === tab ? 'bg-white text-[#003C6C] shadow-sm' : 'text-blue-200 hover:text-white'}`}>{tab === 'schedule' ? 'My Schedule' : 'Search'}</button>
                  ))}
              </div>
              <div className="w-px h-8 bg-blue-800/50 mx-2" />
              <button 
                onClick={() => setShowAIChat(!showAIChat)} 
                className={`px-6 py-2.5 text-[11px] font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-lg border-2 border-[#FDC700] bg-[#FDC700] text-[#003C6C] hover:bg-[#eec00e] active:shadow-inner active:translate-y-0.5`}
              >
                <Bot className="w-5 h-5" /> {showAIChat ? 'Hide Assistant' : 'Ask Sammy AI'}
              </button>
              {user ? (
                <div className="relative" ref={profileDropdownRef}>
                    <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="w-10 h-10 bg-[#FDC700] text-[#003C6C] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-105 transition-transform">{user.name?.[0]}</button>
                    {showProfileDropdown && (
                      <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-8 animate-in zoom-in-95 z-[60]">
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

      {/* DASHBOARD CONTENT - FLEX LAYOUT */}
      <div className="flex flex-1 overflow-hidden h-full">
        
        {/* MAIN CONTENT COLUMN */}
        <main className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300">
            {activeTab === 'search' && (
              <div className="flex h-full">
                {/* 1. SIDEBAR FILTERS (Fixed Width 280px) */}
                <div className="w-[280px] shrink-0 border-r border-slate-200 bg-white p-6 overflow-y-auto custom-scrollbar flex flex-col gap-2 z-10 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><Filter className="w-4 h-4 text-[#003C6C]" /> Filters</h3>
                    <button onClick={resetFilters} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
                  </div>

                  <FilterSection title="Department">
                      <div className="relative">
                        <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:border-[#003C6C] appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                            <option>All Departments</option>
                            <option>Computer Science (CSE)</option>
                            <option>Mathematics (AM)</option>
                            <option>Psychology (PSYC)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                  </FilterSection>

                  <FilterSection title="Units">
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${filters.minUnits.length === 0 ? 'bg-[#003C6C] border-[#003C6C]' : 'border-slate-300 bg-white group-hover:border-[#003C6C]'}`}>{filters.minUnits.length === 0 && <Check className="w-3 h-3 text-white" />}</div>
                            <span className="text-xs font-bold text-slate-600">All Units</span>
                            <input type="checkbox" className="hidden" checked={filters.minUnits.length === 0} onChange={() => setFilters({...filters, minUnits: []})} />
                        </label>
                        {[2, 5].map(u => (
                          <label key={u} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${filters.minUnits.includes(u) ? 'bg-[#003C6C] border-[#003C6C]' : 'border-slate-300 bg-white group-hover:border-[#003C6C]'}`}>{filters.minUnits.includes(u) && <Check className="w-3 h-3 text-white" />}</div>
                              <input type="checkbox" className="hidden" checked={filters.minUnits.includes(u)} onChange={() => toggleUnit(u)} />
                              <span className="text-xs font-bold text-slate-600">{u} Units</span>
                          </label>
                        ))}
                      </div>
                  </FilterSection>

                  <FilterSection title="Days">
                      <div className="flex justify-between gap-1">
                        {['M', 'Tu', 'W', 'Th', 'F'].map(day => (
                            <button key={day} onClick={() => toggleDay(day)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border-2 shadow-sm ${filters.days.includes(day) ? 'bg-[#003C6C] text-white border-[#003C6C] shadow-md scale-105' : 'bg-white text-slate-400 border-slate-200 hover:border-[#FDC700] hover:text-[#003C6C]'}`}>{day}</button>
                        ))}
                      </div>
                  </FilterSection>

                  <FilterSection title="Time Range">
                      <div className="px-2 py-2">
                        <div className="h-1.5 bg-slate-100 rounded-full mb-6 relative mt-2 border border-slate-200">
                            <div className="absolute left-0 w-full h-full bg-[#FDC700] rounded-full opacity-50" />
                            <div className="absolute left-0 w-4 h-4 bg-[#003C6C] rounded-full border-2 border-white shadow-md -translate-y-[5px] cursor-grab" />
                            <div className="absolute right-0 w-4 h-4 bg-[#003C6C] rounded-full border-2 border-white shadow-md -translate-y-[5px] cursor-grab" />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span>8:00 AM</span><span>10:00 PM</span></div>
                      </div>
                  </FilterSection>

                  <FilterSection title="Availability">
                      <label className="flex items-center gap-3 cursor-pointer group p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:border-[#FDC700] transition-all">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${filters.openOnly ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white group-hover:border-emerald-400'}`}>{filters.openOnly && <Check className="w-3.5 h-3.5 text-white" />}</div>
                        <input type="checkbox" className="hidden" checked={filters.openOnly} onChange={() => setFilters({...filters, openOnly: !filters.openOnly})} />
                        <span className="text-xs font-bold text-slate-700">Open Classes Only</span>
                      </label>
                  </FilterSection>

                  <FilterSection title="Instructor Rating">
                      <div className="px-2 py-2">
                        <input type="range" min="0" max="5" step="0.5" value={filters.minRating} onChange={(e) => setFilters({...filters, minRating: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#003C6C]" />
                        <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-500">
                            <span className="opacity-50">Any</span>
                            <div className="flex items-center gap-1 text-[#003C6C]"><span className="text-lg font-black">{filters.minRating}+</span><Star className="w-3 h-3 fill-[#FDC700] text-[#FDC700]" /></div>
                            <span className="opacity-50">5.0</span>
                        </div>
                      </div>
                  </FilterSection>
                </div>

                {/* 2. RESULTS AREA (Flexible Width) */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
                    {/* SEARCH HEADER */}
                    <div className="px-8 py-6 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#003C6C] w-5 h-5 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search courses and instructors..." 
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#003C6C] outline-none transition-all text-sm font-bold shadow-inner placeholder:text-slate-400 text-slate-700" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                            </div>
                            <div className="relative w-64">
                                <select className="w-full h-full px-5 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-500 hover:border-[#003C6C] cursor-pointer outline-none appearance-none transition-colors">
                                    <option>Sort by: Best Match</option>
                                    <option>Sort by: Rating (High to Low)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{processedCourses.length} Results Found</span>
                        </div>
                    </div>

                    {/* SCROLLABLE RESULTS */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
                            {currentCourses.length === 0 ? (
                                <div className="text-center py-32 text-slate-300 font-bold flex flex-col items-center">
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6"><Search className="w-10 h-10 text-slate-300" /></div>
                                    <p className="tracking-wider text-sm">No classes found matching your criteria.</p>
                                </div>
                            ) : (
                                currentCourses.map(course => (
                                    <CourseCard 
                                        key={course.id} 
                                        course={course} 
                                        professorRatings={professorRatings} 
                                        onAdd={addCourse} 
                                        onShowProfessor={viewProfessorDetails} 
                                    />
                                ))
                            )}
                        </div>
                        {processedCourses.length > ITEMS_PER_PAGE && (
                            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200 max-w-5xl mx-auto">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-3 border-2 border-slate-200 bg-white rounded-xl font-bold text-xs text-slate-600 hover:border-[#003C6C] hover:text-[#003C6C] disabled:opacity-50 transition-all uppercase tracking-wider">Prev</button>
                                <span className="font-black text-slate-400 text-xs tracking-widest">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-6 py-3 border-2 border-slate-200 bg-white rounded-xl font-bold text-xs text-slate-600 hover:border-[#003C6C] hover:text-[#003C6C] disabled:opacity-50 transition-all uppercase tracking-wider">Next</button>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}
            
            {activeTab === 'schedule' && (
            <div className="flex flex-col lg:grid lg:grid-cols-[450px_1fr] gap-0 h-full">
                <div className="bg-white p-8 border-r border-slate-200 flex-1 flex flex-col h-full overflow-hidden relative z-10">
                    <h3 className="font-bold text-[#003C6C] mb-6 text-sm flex items-center gap-3 shrink-0 uppercase tracking-widest border-b border-slate-100 pb-4"><BookOpen className="w-5 h-5"/> My Schedule</h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedCourses.length === 0 ? (
                            <div className="text-center py-20 text-slate-300">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                                <p className="font-bold text-xs tracking-wide">Your schedule is empty.</p>
                            </div>
                        ) : <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />}
                    </div>
                    <div className="pt-6 border-t border-slate-100 shrink-0">
                      <button onClick={handleSaveSchedule} className="w-full py-4 bg-[#003C6C] text-white font-bold rounded-2xl hover:bg-[#002a4d] shadow-xl transition-all cursor-pointer active:scale-95 text-xs uppercase tracking-[2px] flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Schedule</button>
                    </div>
                </div>
                <div className="bg-white shadow-inner overflow-hidden h-full relative z-0">
                    <CalendarView selectedCourses={selectedCourses} />
                </div>
            </div>
            )}
        </main>

        {/* 3. CHAT SIDEBAR (RIGHT) - SLIDES IN */}
        <div className={`border-l border-slate-200 bg-white transition-all duration-300 ease-in-out overflow-hidden flex flex-col shadow-2xl z-30 ${showAIChat ? 'w-[400px] opacity-100' : 'w-0 opacity-0'}`}>
            <div className="h-full w-[400px]"> 
                <ChatSidebar isOpen={true} onClose={() => setShowAIChat(false)} messages={chatMessages} onSendMessage={(text) => setChatMessages([...chatMessages, {role: 'user', text}, {role: 'assistant', text: 'How can I help?'}])} schoolName={selectedSchool.shortName} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;