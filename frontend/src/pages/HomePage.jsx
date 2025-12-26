import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, ChevronDown, GraduationCap, BookOpen, Save, CheckCircle, AlertCircle, LogOut, LogIn, Loader } from 'lucide-react';

// COMPONENTS
import CourseCard from '../components/CourseCard';
import ChatSidebar from '../components/ChatSidebar';
import AuthModal from '../components/AuthModal';
import CalendarView from '../components/CalendarView';
import ScheduleList from '../components/ScheduleList';

const HomePage = () => {
  // --- CONFIGURATION ---
  const SCHOOLS = [
    {
      id: 'ucsc',
      name: 'UC Santa Cruz',
      shortName: 'UCSC',
      term: 'Winter 2026',
      status: 'active'
    }
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [showProfessorModal, setShowProfessorModal] = useState(null);

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
              restoredSection = originalCourse.sections.find(s => 
                  String(s.sectionCode) === String(savedItem.sectionCode)
              );
          }

          if (restoredSection && savedItem.labCode && restoredSection.subSections) {
             const restoredLab = restoredSection.subSections.find(lab => 
                 String(lab.sectionCode) === String(savedItem.labCode)
             );
             if (restoredLab) {
                 restoredSection = { ...restoredSection, selectedLab: restoredLab };
             }
          }

          return { ...originalCourse, selectedSection: restoredSection };
      }).filter(Boolean); 
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }

      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/courses');
        if (!response.ok) throw new Error('Failed to connect to server');
        const courseData = await response.json();
        setAvailableCourses(courseData);

        if (token) {
          try {
            const schedResponse = await fetch('http://localhost:3000/api/schedules', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (schedResponse.status === 401 || schedResponse.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                showNotification("Session expired. Please log in again.", "error");
            } else if (schedResponse.ok) {
              const schedData = await schedResponse.json();
              if (schedData.courses) {
                const restoredCourses = restoreScheduleFromData(schedData.courses, courseData);
                setSelectedCourses(restoredCourses);
              }
            }
          } catch (schedErr) {
            console.error("Failed to auto-load schedule:", schedErr);
          }
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    initData();
  }, [selectedSchool]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- SEARCH RANKING LOGIC (The Weighted Solution) ---
  const processedCourses = useMemo(() => {
    if (!searchQuery) {
      return [...availableCourses].sort((a, b) => a.code.localeCompare(b.code));
    }

    const lowerQuery = searchQuery.toLowerCase();

    const scored = availableCourses.map(course => {
      let score = 0;

      // 1. Exact Code Match (Priority 1)
      if (course.code.toLowerCase() === lowerQuery) score += 1000;
      
      // 2. Partial Code Match (Priority 2)
      else if (course.code.toLowerCase().includes(lowerQuery)) score += 100;

      // 3. Instructor Match (Priority 3)
      const instructorMatch = (course.sections || []).some(sec => 
        (sec.instructor || "").toLowerCase().includes(lowerQuery)
      );
      if (instructorMatch) score += 80;

      // 4. Course Title Match (Priority 4 - Natural History "NatH" matches here)
      if (course.name.toLowerCase().includes(lowerQuery)) score += 10;

      return { course, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score; // Sort by relevance
        return a.course.code.localeCompare(b.course.code); // Tie-breaker: alphabetical
      })
      .map(item => item.course);
  }, [availableCourses, searchQuery]);

  const totalPages = Math.ceil(processedCourses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCourses = processedCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // --- HELPERS & HANDLERS ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const parseDays = (dayStr) => {
    if (!dayStr || dayStr === 'TBA') return [];
    return dayStr.match(/(M|Tu|W|Th|F)/g) || [];
  };

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
      const days1 = parseDays(newSection.days);
      const days2 = parseDays(existingSection.days);
      const sharedDays = days1.filter(day => days2.includes(day));
      if (sharedDays.length === 0) return false;
      const start1 = parseTime(newSection.startTime);
      const end1 = parseTime(newSection.endTime);
      const start2 = parseTime(existingSection.startTime);
      const end2 = parseTime(existingSection.endTime);
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

    if (conflict) {
        showNotification(`Time Conflict with ${conflict.code}!`, 'error');
        return; 
    }

    if (existing) {
        setSelectedCourses(selectedCourses.map(c => c.code === course.code ? { ...course, selectedSection: section } : c));
        showNotification(`Updated section for ${course.code}`, 'success');
    } else {
        setSelectedCourses([...selectedCourses, { ...course, selectedSection: section }]);
        showNotification(`Added ${course.code} to schedule`, 'success');
    }
  };

  const removeCourse = (courseCode) => {
    setSelectedCourses(selectedCourses.filter(c => c.code !== courseCode));
    showNotification(`Removed ${courseCode}`, 'success');
  };

  const handleLoginSuccess = async (userData, token) => {
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setShowAuthModal(false);
      showNotification(`Welcome back, ${userData.name}!`, 'success');

      try {
        const response = await fetch('http://localhost:3000/api/schedules', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
           const data = await response.json();
           if (data.courses) {
               const restored = restoreScheduleFromData(data.courses, availableCourses);
               setSelectedCourses(restored);
               showNotification('Schedule restored from cloud!', 'success');
           }
        }
      } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSelectedCourses([]); 
    showNotification("Logged out successfully", 'success');
  };

  const handleSaveSchedule = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) {
      showNotification("Please log in to save!", 'error');
      setShowAuthModal(true); 
      return;
    }

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.status === 401 || response.status === 403) {
          showNotification("Session expired. Please log in again.", 'error');
          setShowAuthModal(true);
          setUser(null);
          return;
      }

      if (response.ok) showNotification("Schedule saved!", 'success');
    } catch (err) { showNotification("Server error", 'error'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* NOTIFICATIONS */}
      {notification && (
          <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300 ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
          }`}>
              {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
              <span className="font-medium">{notification.message}</span>
          </div>
      )}

      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Course Navigator</h1>
                <div className="relative">
                    <button onClick={() => setShowSchoolSelector(!showSchoolSelector)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                        <GraduationCap className="w-4 h-4" /> {selectedSchool.name} • {selectedSchool.term} <ChevronDown className="w-4 h-4" />
                    </button>
                    {showSchoolSelector && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-20 overflow-hidden">
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

            <div className="flex items-center gap-3">
              <button onClick={() => setShowAIChat(!showAIChat)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md hover:brightness-110">
                <BookOpen className="w-4 h-4" /> AI Assistant
              </button>
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{user.name?.[0]}</div>
                        <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><LogOut className="w-5 h-5" /></button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">Log In</button>
              )}
            </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 mb-6 min-h-[600px] flex flex-col">
            <div className="flex border-b">
              {['search', 'schedule'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 font-medium capitalize ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  {tab === 'schedule' ? 'My Schedule' : tab}
                  {tab === 'schedule' && selectedCourses.length > 0 && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">{selectedCourses.length}</span>}
                </button>
              ))}
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-blue-600"><Loader className="w-12 h-12 animate-spin mb-4" /><p>Loading...</p></div>
            ) : (
                <>
                {activeTab === 'search' && (
                <div className="p-6">
                    <div className="mb-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Search courses or professors..." className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="space-y-4">
                        {currentCourses.length === 0 ? <p className="text-center text-gray-500 py-8">No results.</p> : currentCourses.map(course => <CourseCard key={course.id} course={course} professorRatings={{}} onAdd={addCourse} />)}
                    </div>
                    {processedCourses.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-between items-center mt-8 pt-4 border-t">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded disabled:opacity-50">Prev</button>
                        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
                    </div>
                    )}
                </div>
                )}
                {activeTab === 'schedule' && (
                <div className="flex flex-col lg:flex-row gap-6 h-full p-6 flex-1">
                    <div className="w-full lg:w-[35%] flex flex-col h-[calc(100vh-290px)]">
                        <div className="bg-gray-50 rounded-lg p-4 border flex-1 flex flex-col overflow-hidden">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Current Classes</h3>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedCourses.length === 0 ? <div className="text-center text-gray-400 py-10 text-sm">No classes added yet.</div> : <ScheduleList selectedCourses={selectedCourses} onRemove={removeCourse} />}
                            </div>
                            <div className="pt-4 mt-4 border-t"><button onClick={handleSaveSchedule} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Save Changes</button></div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[65%] bg-white border rounded-lg shadow-sm overflow-hidden h-[calc(100vh-290px)]"><CalendarView selectedCourses={selectedCourses} /></div>
                </div>
                )}
                </>
            )}
        </div>
        <ChatSidebar isOpen={showAIChat} onClose={() => setShowAIChat(false)} messages={chatMessages} onSendMessage={(text) => setChatMessages([...chatMessages, {role: 'user', text}, {role: 'assistant', text: 'How can I help you today?'}])} schoolName={selectedSchool.shortName} />
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLoginSuccess={handleLoginSuccess} selectedSchool={selectedSchool} />
    </div>
  );
};

export default HomePage;