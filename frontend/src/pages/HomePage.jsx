import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, ChevronDown, GraduationCap, BookOpen, Save, CheckCircle, AlertCircle, LogOut, LogIn, Loader, ArrowLeft, Star, MessageSquare, Flame, ThumbsUp, TrendingUp, X } from 'lucide-react';

// COMPONENTS
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';

/**
 * PROFESSOR MODAL COMPONENT
 * Keeping reviews in a modal prevents the user from losing their search context.
 */
const ProfessorModal = ({ professor, isOpen, onClose }) => {
  if (!isOpen || !professor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{professor.name.replace(/,/g, ', ')}</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[3px] mt-1">Professor Analytics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Quality', val: `${professor.avgRating}/5`, icon: <Star className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
              { label: 'Difficulty', val: `${professor.avgDifficulty}/5`, icon: <Flame className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50' },
              { label: 'Retake', val: `${professor.wouldTakeAgain}%`, icon: <ThumbsUp className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
              { label: 'Ratings', val: professor.numRatings, icon: <TrendingUp className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-50' }
            ].map((s, i) => (
              <div key={i} className={`${s.bg} p-6 rounded-[24px] border border-white shadow-sm flex flex-col items-center text-center`}>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">{s.icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                <p className="text-xl font-black text-slate-900">{s.val}</p>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-indigo-600" /> Recent Student Feedback
            </h3>
            {professor.reviews?.map((rev, i) => (
              <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase">{rev.course}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">{new Date(rev.date).toLocaleDateString()}</span>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-tighter">Grade: {rev.grade || 'N/A'}</span>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-6 text-lg">"{rev.comment}"</p>
              </div>
            ))}
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

  // --- HELPER: RESTORE DATA ---
  const restoreScheduleFromData = (savedCourses, allCourses) => {
      if (!savedCourses || !Array.isArray(savedCourses)) return [];
      if (!allCourses || allCourses.length === 0) return [];
      return savedCourses.map(savedItem => {
          const courseCode = typeof savedItem === 'string' ? savedItem : savedItem.code;
          const originalCourse = allCourses.find(c => c.code === courseCode);
          if (!originalCourse) return null;
          let restoredSection = null;
          if (typeof savedItem === 'object' && savedItem.sectionCode && originalCourse.sections) {
              restoredSection = originalCourse.sections.find(s => String(s.sectionCode) === String(savedItem.sectionCode));
          }
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

  // --- HANDLERS ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const parseDays = (dayStr) => { if (!dayStr || dayStr === 'TBA') return []; return dayStr.match(/(M|Tu|W|Th|F)/g) || []; };
  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === 'TBA') return 0;
    const [time, modifier] = timeStr.split(/(AM|PM)/);
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const checkConflict = (newSection, existingSection) => {
      if (!newSection || !existingSection) return false;
      const days1 = parseDays(newSection.days); const days2 = parseDays(existingSection.days);
      const sharedDays = days1.filter(day => days2.includes(day));
      if (sharedDays.length === 0) return false;
      const start1 = parseTime(newSection.startTime); const end1 = parseTime(newSection.endTime);
      const start2 = parseTime(existingSection.startTime); const end2 = parseTime(existingSection.endTime);
      return (start1 < end2 && end1 > start2);
  };

  const addCourse = (course, section) => {
    const existing = selectedCourses.find(c => c.code === course.code);
    const hasConflictWith = (targetSection, courseToIgnoreCode = null) => {
        for (const other of selectedCourses) {
            if (other.code === courseToIgnoreCode) continue; 
            if (checkConflict(targetSection, other.selectedSection)) return other;
            if (other.selectedSection?.selectedLab && checkConflict(targetSection, other.selectedSection.selectedLab)) return other;
            if (targetSection.selectedLab && checkConflict(targetSection.selectedLab, other.selectedSection)) return other;
            if (targetSection.selectedLab && other.selectedSection?.selectedLab && checkConflict(targetSection.selectedLab, other.selectedSection.selectedLab)) return other;
        }
        return null;
    };
    let conflict = hasConflictWith(section, existing ? course.code : null);
    if (!conflict && section.selectedLab) conflict = hasConflictWith(section.selectedLab, existing ? course.code : null);
    if (conflict) { showNotification(`Time Conflict with ${conflict.code}!`, 'error'); return; }
    if (existing) {
        setSelectedCourses(selectedCourses.map(c => c.code === course.code ? { ...course, selectedSection: section } : c));
        showNotification(`Updated section for ${course.code}`, 'success');
    } else {
        setSelectedCourses([...selectedCourses, { ...course, selectedSection: section }]);
        showNotification(`Added ${course.code} to schedule`, 'success');
    }
  };

  const removeCourse = (courseCode) => { setSelectedCourses(selectedCourses.filter(c => c.code !== courseCode)); showNotification(`Removed ${courseCode}`, 'success'); };

  const handleLoginSuccess = async (userData, token) => {
      setUser(userData); localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userData));
      setShowAuthModal(false); showNotification(`Welcome back, ${userData.name}!`, 'success');
      try {
        const response = await fetch('http://localhost:3000/api/schedules', { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
           const data = await response.json();
           if (data.courses) setSelectedCourses(restoreScheduleFromData(data.courses, availableCourses));
        }
      } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.clear(); setUser(null); setSelectedCourses([]); showNotification("Logged out successfully", 'success'); };

  const handleSaveSchedule = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) { showNotification("Please log in to save!", 'error'); setShowAuthModal(true); return; }
    try {
      const payload = {
        name: `My ${selectedSchool.term} Schedule`, 
        courses: selectedCourses.map(course => ({
            code: course.code,
            sectionCode: course.selectedSection ? course.selectedSection.sectionCode : null,
            labCode: course.selectedSection?.selectedLab ? course.selectedSection.selectedLab.sectionCode : null
        }))
      };
      const response = await fetch('http://localhost:3000/api/schedules', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (response.status === 401 || response.status === 403) { setShowAuthModal(true); setUser(null); return; }
      if (response.ok) showNotification("Schedule saved!", 'success');
    } catch (err) { showNotification("Server error", 'error'); }
  };

  const viewProfessorDetails = (name, stats) => { if (!stats) return; setSelectedProfessor({ name, ...stats }); setIsProfModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* NOTIFICATIONS */}
      {notification && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border animate-in slide-in-from-bottom-5 ${
              notification.type === 'error' ? 'bg-white border-red-200 text-red-600' : 'bg-white border-emerald-200 text-emerald-600'
          }`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
              <span className="font-black uppercase tracking-tight text-sm">{notification.message}</span>
          </div>
      )}

      {/* HEADER: Modern Blur Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-[18px] shadow-2xl shadow-indigo-200 flex items-center justify-center transform hover:rotate-6 transition-transform cursor-pointer">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">AI Navigator</h1>
                <div className="relative">
                    <button onClick={() => setShowSchoolSelector(!showSchoolSelector)} className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[2px] hover:text-indigo-700 transition-colors">
                        <GraduationCap className="w-4 h-4" /> {selectedSchool.name} • {selectedSchool.term} <ChevronDown className="w-3 h-3" />
                    </button>
                    {showSchoolSelector && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border z-20 overflow-hidden">
                            {SCHOOLS.map(school => (
                                <button key={school.id} onClick={() => { setSelectedSchool(school); setShowSchoolSelector(false); }} className="w-full text-left px-4 py-3 border-b hover:bg-gray-50">
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
              <button onClick={() => setShowAIChat(!showAIChat)} className="px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95">
                <BookOpen className="w-4 h-4 text-indigo-400" /> AI Assistant
              </button>
              {user ? (
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">{user.name?.[0]}</div>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px]">Log In</button>
              )}
            </div>
        </div>
      </header>

      {/* CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-8 py-8 flex gap-8">
        <div className="flex-1 bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden flex flex-col min-h-[800px]">
            {/* TABS */}
            <nav className="flex px-10 pt-6 bg-slate-50/50 border-b border-slate-100">
              {['search', 'schedule'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-10 py-5 text-xs font-black uppercase tracking-[3px] transition-all border-b-[6px] ${activeTab === tab ? 'text-indigo-600 border-indigo-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}
                >
                  {tab === 'schedule' ? 'My Schedule' : tab}
                  {tab === 'schedule' && selectedCourses.length > 0 && <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-3">{selectedCourses.length}</span>}
                </button>
              ))}
            </nav>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center"><Loader className="w-10 h-10 animate-spin text-indigo-600 mb-4" /><p className="font-black text-slate-400 uppercase tracking-widest text-sm">Loading Navigator...</p></div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'search' && (
                <div className="p-10">
                    <div className="relative mb-12 max-w-4xl group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 w-7 h-7 transition-colors" />
                        <input type="text" placeholder="Search Courses, Professors, or Codes..." className="w-full pl-16 pr-8 py-7 bg-slate-50 border-2 border-slate-100 rounded-[30px] focus:bg-white focus:border-indigo-500 outline-none transition-all text-xl font-bold shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                        {currentCourses.length === 0 ? (
                          <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No classes found.</div>
                        ) : (
                          currentCourses.map(course => (
                            <CourseCard key={course.id} course={course} professorRatings={professorRatings} onAdd={addCourse} onShowProfessor={viewProfessorDetails} />
                          ))
                        )}
                    </div>
                    {processedCourses.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-3 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
                        <span className="font-black text-slate-400 text-xs uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-6 py-3 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
                    </div>
                    )}
                </div>
                )}
                
                {activeTab === 'schedule' && (
                <div className="flex flex-col lg:flex-row gap-8 h-full p-10 flex-1">
                    <div className="w-full lg:w-[35%] flex flex-col h-[calc(100vh-320px)]">
                        <div className="bg-slate-50 rounded-[30px] p-6 border-2 border-slate-100 flex-1 flex flex-col overflow-hidden">
                            <h3 className="font-black text-slate-700 mb-6 flex items-center gap-3 uppercase tracking-widest text-xs"><BookOpen className="w-5 h-5 text-indigo-600"/> Current Classes</h3>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedCourses.length === 0 ? <div className="text-center text-slate-400 py-20 font-bold uppercase tracking-widest text-xs">No classes added yet.</div> : <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />}
                            </div>
                            <div className="pt-6 mt-6 border-t border-slate-200"><button onClick={handleSaveSchedule} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all"><Save className="w-5 h-5" /> Save Changes</button></div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[65%] bg-white border border-slate-200 rounded-[30px] shadow-2xl overflow-hidden h-[calc(100vh-320px)]"><CalendarView selectedCourses={selectedCourses} /></div>
                </div>
                )}
                </div>
            )}
        </div>
        <ChatSidebar isOpen={showAIChat} onClose={() => setShowAIChat(false)} messages={chatMessages} onSendMessage={(text) => setChatMessages([...chatMessages, {role: 'user', text}, {role: 'assistant', text: 'How can I help you today?'}])} schoolName={selectedSchool.shortName} />
      </div>
      
      {/* MODALS */}
      <ProfessorModal professor={selectedProfessor} isOpen={isProfModalOpen} onClose={() => setIsProfModalOpen(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} selectedSchool={selectedSchool} />
    </div>
  );
};

export default HomePage;