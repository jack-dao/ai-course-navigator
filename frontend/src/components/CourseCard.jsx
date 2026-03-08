import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Plus, Star, MapPin, ChevronDown, RotateCcw, User, Hash, Lock, BookOpen, GraduationCap, Monitor, AlertCircle, Loader2, ChevronRight } from 'lucide-react';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />
);

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor, sortOption, filters }) => {
  const [selectedSubSections, setSelectedSubSections] = useState({});
  const [errors, setErrors] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [descriptionText, setDescriptionText] = useState(course.description || null);
  const [prereqText, setPrereqText] = useState(course.prerequisites || null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { geCode, career, grading } = course;

  const handleToggleDetails = async () => {
    if (showDetails) {
        setShowDetails(false);
        return;
    }
    setShowDetails(true);
    if (descriptionText) return; 

    setIsLoadingDetails(true);
    try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const [res] = await Promise.all([
            fetch(`${apiBase}/api/courses/${course.id}/description`),
            new Promise(r => setTimeout(r, 300)) 
        ]);
        
        if (res.ok) {
            const data = await res.json();
            setDescriptionText(data.description || "No description available.");
            setPrereqText(data.prerequisites || null);
        } else {
            setDescriptionText("Could not load details.");
        }
    } catch (e) {
        console.error("Failed to load description", e);
        setDescriptionText("Failed to load details.");
    } finally {
        setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseTime = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)(AM|PM)/);
    if (!match) return null;
    let [_, h, m, period] = match;
    h = parseInt(h);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h + (parseInt(m) / 60);
  };

  const sortedSections = useMemo(() => {
    let sections = [...(course.sections || [])];

    if (filters) {
        if (filters.minRating > 0) {
            sections = sections.filter(s => {
                const stats = professorRatings?.[s.instructor];
                return stats && stats.avgRating >= filters.minRating;
            });
        }
        if (filters.openOnly) {
            sections = sections.filter(s => s.status !== 'Closed' && s.status !== 'Wait List');
        }
        if (filters.days && filters.days.length > 0) {
            sections = sections.filter(s => {
                const sDays = s.days || "";
                return filters.days.some(day => sDays.includes(day));
            });
        }
        if (filters.timeRange && (filters.timeRange[0] > 7 || filters.timeRange[1] < 23)) {
             sections = sections.filter(s => {
                const start = parseTime(s.startTime);
                const end = parseTime(s.endTime);
                if (start === null || end === null) return false;
                return start >= filters.timeRange[0] && end <= filters.timeRange[1];
             });
        }
    }

    if (sortOption === 'Rating') {
        sections.sort((a, b) => {
            const ratingA = professorRatings?.[a.instructor]?.avgRating || -1;
            const ratingB = professorRatings?.[b.instructor]?.avgRating || -1;
            return ratingB - ratingA; 
        });
    } else if (sortOption === 'Difficulty') {
        sections.sort((a, b) => {
            const diffA = professorRatings?.[a.instructor]?.avgDifficulty || 10;
            const diffB = professorRatings?.[b.instructor]?.avgDifficulty || 10;
            return diffA - diffB;
        });
    }
    return sections;
  }, [course.sections, professorRatings, sortOption, filters]);

  const formatTime = (time) => time ? time.replace(/^0/, '') : '';
  const formatInstructor = (name) => name ? name.replace(/,/g, ', ') : 'Staff';
  const formatLocation = (loc) => loc ? loc.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'TBA';

  const expandDays = (daysStr) => {
    if (!daysStr || daysStr === 'TBA') return 'TBA';
    const map = { M: 'Monday', Tu: 'Tuesday', W: 'Wednesday', Th: 'Thursday', F: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
    const matches = daysStr.match(/Tu|Th|Sa|Su|M|W|F/g);
    if (!matches) return daysStr;
    return matches.map(d => map[d]).join(', ');
  };

  const getGEMapping = (code) => {
    const map = { 'CC': 'Cross-Cultural Analysis', 'ER': 'Ethnicity and Race', 'IM': 'Interpreting Arts and Media', 'MF': 'Mathematical and Formal Reasoning', 'SI': 'Scientific Inquiry', 'SR': 'Statistical Reasoning', 'TA': 'Textual Analysis', 'PE-E': 'Environmental Awareness', 'PE-H': 'Human Behavior', 'PE-T': 'Technology and Society', 'PR-E': 'Collaborative Endeavor', 'PR-C': 'Creative Process', 'PR-S': 'Service Learning', 'C': 'Composition', 'DC': 'Disciplinary Communication' };
    return map[code] || code;
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="relative">
          <Star className="w-3 h-3 text-slate-200" />
          <div className="absolute top-0 left-0 overflow-hidden h-full" style={{ width: `${Math.min(Math.max((rating - i) * 100, 0), 100)}%` }}>
            <Star className="w-3 h-3 fill-current text-[#FDC700]" />
          </div>
        </div>
      ))}
    </div>
  );

  const toggleDropdown = (sectionId) => setOpenDropdownId(openDropdownId === sectionId ? null : sectionId);

  const handleSelectDiscussion = (sectionId, subId) => {
    setSelectedSubSections(prev => {
      const newState = { ...prev };
      if (subId === null) delete newState[sectionId];
      else newState[sectionId] = subId;
      return newState;
    });
    setErrors(prev => ({ ...prev, [sectionId]: false }));
    setOpenDropdownId(null);
  };

  const handleAddClick = (section) => {
    const hasDiscussions = section.subSections?.length > 0;
    if (hasDiscussions) {
      const selectedId = selectedSubSections[section.id];
      if (!selectedId) {
        setErrors(prev => ({ ...prev, [section.id]: true }));
        return;
      }
      const discussion = section.subSections.find(s => String(s.id) === String(selectedId));
      onAdd(course, { ...section, selectedLab: discussion });
    } else {
      onAdd(course, section);
    }
  };

  const formatMetaValue = (type, value) => {
      if (!value) return '---';
      if (type === 'Career') return value === 'Undergraduate' ? 'Undergrad' : value;
      return value;
  };

  return (
    <div 
        className={`bg-white rounded-[20px] border border-slate-200 shadow-sm hover:shadow-md transition-all mb-6 group/card w-full ${
            openDropdownId ? 'z-20 relative' : 'relative'
        }`}
    >
      <div className="px-6 py-5 bg-white rounded-t-[20px] border-t border-l border-r border-slate-200 border-b border-b-slate-100">
        <div className="flex justify-between items-start mb-3 flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-2xl font-[800] text-[#003C6C] tracking-tight whitespace-nowrap">{course.code}</h3>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md uppercase tracking-wide shrink-0">
                        {course.credits} Units
                    </span>
                </div>
                <p className="text-slate-600 font-bold text-base leading-tight break-words">{course.name}</p>
            </div>
            
            {geCode && (
                <div className="flex flex-col sm:items-end justify-center sm:ml-auto shrink-0 mt-2 sm:mt-0 max-w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">General Education</span>
                    <div className="px-3 py-1.5 rounded-xl bg-[#003C6C]/5 border border-[#003C6C]/10 flex items-center gap-2 max-w-full">
                        <span className="text-sm font-bold text-[#003C6C] break-words whitespace-normal">{getGEMapping(geCode)} ({geCode})</span>
                    </div>
                </div>
            )}
        </div>
        
        <div className="mt-4">
             <button 
                onClick={handleToggleDetails}
                className="group flex items-center gap-2 text-sm font-bold text-[#003C6C] hover:text-blue-600 transition-colors outline-none select-none cursor-pointer w-full text-left"
             >
                <div className={`p-1 rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors duration-200 ${showDetails ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                </div>
                <span>{showDetails ? "Hide Course Details" : "Show Description & Prerequisites"}</span>
             </button>

             <div className={`grid transition-all duration-300 ease-in-out ${showDetails ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/60 text-sm space-y-5">
                        {isLoadingDetails ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-11/12" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                                <div className="pt-2 space-y-2 border-t border-slate-100">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ) : (
                            <>
                                 <div className="flex gap-3 items-start">
                                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 shrink-0 text-[#003C6C]">
                                          <BookOpen className="w-4 h-4" />
                                      </div>
                                      <div className="space-y-1">
                                          <span className="text-sm font-bold text-[#003C6C] mb-0.5 block">Description</span>
                                          <div className="text-slate-700 font-medium leading-relaxed break-words whitespace-normal">
                                              {descriptionText}
                                          </div>
                                      </div>
                                  </div>

                                  {prereqText && (
                                      <div className="flex gap-3 items-start pt-4 border-t border-slate-200/60">
                                          <div className="p-1.5 bg-white rounded-lg border border-slate-100 shrink-0 text-[#003C6C]">
                                              <Lock className="w-4 h-4" />
                                          </div>
                                          <div className="space-y-1">
                                              <span className="text-sm font-bold text-[#003C6C] mb-0.5 block">Prerequisites</span>
                                              <div className="text-slate-700 font-medium leading-relaxed break-words whitespace-normal">
                                                  {prereqText.replace(/^Prerequisite\(s\):/i, '').trim()}
                                              </div>
                                          </div>
                                      </div>
                                  )}
                            </>
                        )}
                    </div>
                </div>
             </div>
        </div>
      </div>

      <div className="divide-y divide-slate-200 border-l border-r border-b border-slate-200 rounded-b-[20px]">
        {sortedSections.length > 0 ? (
            sortedSections.map((section, index) => {
            const hasDiscussions = section.subSections?.length > 0;
            const ratingData = professorRatings?.[section.instructor];
            const selectedSubId = selectedSubSections[section.id];
            const selectedSub = section.subSections?.find(s => s.id === selectedSubId);
            const hasError = errors[section.id];

            const capacity = section.capacity || 1;
            const enrolled = section.enrolled || 0;
            const fillPercentage = Math.min((enrolled / capacity) * 100, 100);
            const isClosed = section.status === 'Closed';
            const isWaitlist = section.status?.includes('Wait');
            const isLast = index === sortedSections.length - 1;

            return (
                <div key={section.id} className={`p-6 hover:bg-slate-50/50 transition-colors ${isLast ? 'rounded-b-[20px]' : ''}`}>
                
                <div className="flex flex-wrap gap-6">
                    
                    <div className="flex-[1_1_100%] md:flex-[1_0_300px] flex flex-col gap-4 min-w-0 md:min-w-[300px]">
                        <div className="w-full shrink-0">
                            <p className="text-[10px] font-bold text-[#003C6C] mb-1 uppercase tracking-wider">Instructor</p>
                            <button onClick={() => onShowProfessor(section.instructor, ratingData)} className="flex items-start gap-2 group/prof text-left cursor-pointer w-full min-w-0">
                                <div className="w-10 h-10 rounded-full bg-[#003C6C]/5 flex items-center justify-center text-[#003C6C] shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block font-bold text-slate-900 group-hover/prof:text-[#003C6C] group-hover/prof:underline decoration-2 underline-offset-2 transition-colors leading-tight truncate">
                                        {formatInstructor(section.instructor)}
                                    </span>
                                    {ratingData ? (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex shrink-0">{renderStars(ratingData.avgRating)}</div>
                                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                                {ratingData.avgRating} ({ratingData.numRatings})
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-slate-400">No ratings</span>
                                    )}
                                </div>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-3 sm:gap-x-6">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-[#003C6C] mb-0.5 whitespace-nowrap">Class Number</p>
                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                                    <Hash className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                    <span className="truncate">{section.classNumber || '---'}</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-[#003C6C] mb-0.5 whitespace-nowrap">Instruction</p>
                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                                    <Monitor className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                    <span className="truncate">{section.instructionMode || 'In Person'}</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-[#003C6C] mb-0.5 whitespace-nowrap">Career</p>
                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                                    <GraduationCap className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                    <span className="truncate">{formatMetaValue('Career', career || 'Undergraduate')}</span>
                                </div>
                            </div>
                            <div className="min-w-0 pr-2">
                                <p className="text-[10px] font-bold text-[#003C6C] mb-0.5 whitespace-nowrap">Grading</p>
                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                                    <BookOpen className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                    <span className="whitespace-normal break-words">{formatMetaValue('Grading', grading ? 'Student Option' : 'Letter')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-[1_0_200px] flex flex-col justify-center min-w-[200px] pt-4 border-t border-dashed border-slate-200 md:border-t-0 md:pt-0 md:border-l md:pl-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 text-sm truncate">{expandDays(section.days)}</p>
                                <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">{formatTime(section.startTime)} - {formatTime(section.endTime)}</p>
                                <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-slate-600 min-w-0">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="leading-tight truncate">{formatLocation(section.location)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-1.5 w-full">
                            <div className="flex justify-between items-end">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'text-rose-600' : isWaitlist ? 'text-orange-600' : 'text-[#003C6C]'}`}>
                                    {section.status || 'Open'}
                                </span>
                                <div className="flex items-baseline gap-1 text-right leading-none">
                                    <span className="text-xs font-black text-slate-700">{enrolled}/{capacity}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</span>
                                </div>
                            </div>
                            
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${isClosed ? 'bg-rose-500' : isWaitlist ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${fillPercentage}%` }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-[1_0_220px] flex flex-col gap-2 justify-center min-w-[220px] 2xl:border-l 2xl:pl-6 border-slate-200 border-dashed">
                        {hasDiscussions && (
                            <div className={`relative ${openDropdownId === section.id ? 'z-50' : 'z-0'}`} ref={openDropdownId === section.id ? dropdownRef : null}>
                                <button 
                                    onClick={() => toggleDropdown(section.id)} 
                                    className={`w-full flex items-center justify-between text-xs font-bold border rounded-xl px-3 py-4 transition-all cursor-pointer ${
                                        hasError ? 'border-rose-300 bg-rose-50 text-rose-600' : 'bg-white border-slate-200 text-slate-600 hover:border-[#003C6C] hover:text-[#003C6C]'
                                    }`}
                                >
                                    <span className="truncate">
                                        {selectedSub ? `${expandDays(selectedSub.days)} ${formatTime(selectedSub.startTime)} - ${formatTime(selectedSub.endTime)}` : "Select Discussion"}
                                    </span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdownId === section.id ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {openDropdownId === section.id && (
                                    <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar p-1">
                                            {selectedSubId && (
                                                <button onClick={() => handleSelectDiscussion(section.id, null)} className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg mb-1 flex items-center gap-2 cursor-pointer">
                                                    <RotateCcw className="w-3 h-3" /> Clear Selection
                                                </button>
                                            )}
                                            {section.subSections.map((sub) => (
                                                <button 
                                                    key={sub.id} 
                                                    onClick={() => handleSelectDiscussion(section.id, sub.id)} 
                                                    className={`w-full text-left px-3 py-3 text-xs mb-0.5 flex items-center gap-3 border-b border-slate-50 last:border-0 rounded-lg group transition-colors cursor-pointer ${
                                                        selectedSubId === sub.id 
                                                            ? 'bg-blue-50 text-[#003C6C]' 
                                                            : 'hover:bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-black text-slate-800 block truncate">{expandDays(sub.days)}</span>
                                                        <span className="text-[10px] font-bold text-black block mt-0.5 truncate">
                                                            {formatTime(sub.startTime)} - {formatTime(sub.endTime)} | {formatLocation(sub.location)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[10px] font-black text-slate-900 block">{sub.enrolled}/{sub.capacity}</span>
                                                        <span className="uppercase text-slate-400 font-bold tracking-wider text-[9px] block">
                                                            {sub.enrolled >= sub.capacity ? 'Full' : 'Open'}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <button 
                            onClick={() => handleAddClick(section)} 
                            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                                isClosed 
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md'
                                    : isWaitlist 
                                        ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md'
                                        : 'bg-[#003C6C] text-white hover:bg-[#002a4d] hover:shadow-md'
                            }`}
                        >
                            {isClosed ? (
                                <>
                                    <AlertCircle className="w-4 h-4" /> 
                                    Closed (Add Anyway)
                                </>
                            ) : isWaitlist ? (
                                <>
                                    <AlertCircle className="w-4 h-4" /> 
                                    Waitlist (Add Anyway)
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" /> 
                                    Add Class
                                </>
                            )}
                        </button>
                    </div>
                </div>
                </div>
            );
            })
        ) : (
            <div className="p-6 text-center text-slate-400 text-xs italic">
                No sections match your specific filters.
            </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;