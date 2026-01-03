import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Star, MapPin, ChevronDown, RotateCcw, User, Hash, Lock, BookOpen, GraduationCap, Monitor, AlertCircle, Hourglass } from 'lucide-react';

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor, isAiActive }) => {
  const [selectedSubSections, setSelectedSubSections] = useState({});
  const [errors, setErrors] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const { geCode, prerequisites, career, grading } = course;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    const map = {
      'CC': 'Cross-Cultural Analysis', 
      'ER': 'Ethnicity and Race', 
      'IM': 'Interpreting Arts and Media',
      'MF': 'Mathematical and Formal Reasoning', 
      'SI': 'Scientific Inquiry', 
      'SR': 'Statistical Reasoning',
      'TA': 'Textual Analysis', 
      'PE-E': 'Environmental Awareness', 
      'PE-H': 'Human Behavior', 
      'PE-T': 'Technology and Society',
      'PR-E': 'Collaborative Endeavor', 
      'PR-C': 'Creative Process', 
      'PR-S': 'Service Learning',
      'C': 'Composition', 
      'DC': 'Disciplinary Communication'
    };
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

  // Helper handles abbreviations
  const formatMetaValue = (type, value) => {
      if (!value) return '---';
      if (type === 'Career') {
          return value === 'Undergraduate' ? 'Undergrad' : value;
      }
      if (type === 'Grading') {
          return value === 'Student Option' ? 'Option' : value;
      }
      return value;
  };

  return (
    <div className={`bg-white rounded-[20px] border border-slate-200 shadow-sm hover:shadow-md transition-all mb-6 overflow-visible group/card ${isAiActive ? 'p-0' : ''}`}>
      
      {/* HEADER */}
      <div className={`${isAiActive ? 'px-4 py-4' : 'px-6 py-5'} bg-white rounded-t-[20px] border-t border-l border-r border-slate-200 border-b border-b-slate-100`}>
        <div className="flex justify-between items-start mb-3">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-[800] text-[#003C6C] tracking-tight">{course.code}</h3>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md uppercase tracking-wide">
                        {course.credits} Units
                    </span>
                </div>
                <p className="text-slate-600 font-bold text-base">{course.name}</p>
            </div>
            
            {geCode && (
                <div className="flex flex-col items-end justify-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">General Education</span>
                    <div className="px-3 py-1.5 rounded-xl bg-[#003C6C]/5 border border-[#003C6C]/10 flex items-center gap-2">
                        <span className="text-sm font-bold text-[#003C6C]">{getGEMapping(geCode)} ({geCode})</span>
                    </div>
                </div>
            )}
        </div>
        
        {prerequisites && (
            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                    <span className="font-bold text-slate-700">Prerequisite:</span> {prerequisites.replace(/^Prerequisite\(s\):/i, '').trim()}
                </span>
            </div>
        )}
      </div>

      {/* SECTIONS */}
      <div className="divide-y divide-slate-200 border-l border-r border-b border-slate-200 rounded-b-[20px]">
        {course.sections?.map((section, index) => {
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
          const isLast = index === course.sections.length - 1;

          return (
            <div key={section.id} className={`${isAiActive ? 'p-4' : 'p-6'} hover:bg-slate-50/50 transition-colors ${isLast ? 'rounded-b-[20px]' : ''}`}>
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* LEFT: Metadata */}
                <div className={`flex-[2] min-w-0 flex flex-col md:flex-row ${isAiActive ? 'gap-4' : 'gap-6'}`}>
                    
                    {/* Instructor */}
                    <div className={`shrink-0 ${isAiActive ? 'w-40' : 'md:w-48'}`}>
                        <p className="text-[10px] font-bold text-[#003C6C] mb-1">Instructor</p>
                        <button onClick={() => onShowProfessor(section.instructor, ratingData)} className="flex items-start gap-2 group/prof text-left cursor-pointer w-full">
                            <div className="w-10 h-10 rounded-full bg-[#003C6C]/5 flex items-center justify-center text-[#003C6C] shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="block font-bold text-slate-900 group-hover/prof:text-[#003C6C] group-hover/prof:underline decoration-2 underline-offset-2 transition-colors leading-tight">
                                    {formatInstructor(section.instructor)}
                                </span>
                                {ratingData ? (
                                    // FIXED: Stack vertically if AI is active, horizontal otherwise
                                    <div className={`${isAiActive ? 'flex flex-col items-start gap-0.5' : 'flex items-center gap-2'} mt-0.5`}>
                                        <div className="flex">{renderStars(ratingData.avgRating)}</div>
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

                    {/* Metadata Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-2">
                        <div>
                            <p className="text-[10px] font-bold text-[#003C6C] mb-0.5">Class Number</p>
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 min-w-0">
                                <Hash className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                <span className="truncate">{section.classNumber || '---'}</span>
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-[10px] font-bold text-[#003C6C] mb-0.5">Instruction</p>
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 min-w-0">
                                <Monitor className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                <span className="truncate">{section.instructionMode || 'In Person'}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-[#003C6C] mb-0.5">Career</p>
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 min-w-0">
                                <GraduationCap className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                <span className="truncate">{formatMetaValue('Career', career || 'Undergraduate')}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-[#003C6C] mb-0.5">Grading</p>
                            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 min-w-0">
                                <BookOpen className="w-3.5 h-3.5 text-[#003C6C] shrink-0" />
                                <span className="truncate">{formatMetaValue('Grading', grading ? 'Student Option' : 'Letter')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Schedule */}
                <div className="flex-1 flex flex-col justify-center border-l border-slate-100 pl-6 border-dashed">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">{expandDays(section.days)}</p>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{formatTime(section.startTime)} - {formatTime(section.endTime)}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-slate-600">
                                <MapPin className="w-3 h-3" />
                                {formatLocation(section.location)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 w-full max-w-[15rem]">
                        <div className="flex justify-between items-end">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'text-rose-600' : isWaitlist ? 'text-orange-600' : 'text-[#003C6C]'}`}>
                                {section.status || 'Open'}
                            </span>
                            <div className="flex items-baseline gap-1 text-right leading-none">
                                <span className="text-xs font-black text-slate-700">{enrolled}/{capacity}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</span>
                            </div>
                        </div>
                        
                        <div className="h-2 w-full bg-slate-200 border border-slate-300 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${isClosed ? 'bg-rose-500' : isWaitlist ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${fillPercentage}%` }} 
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Actions */}
                <div className="w-full lg:w-72 flex flex-col gap-2 justify-center">
                    {hasDiscussions && (
                        <div className="relative" ref={openDropdownId === section.id ? dropdownRef : null}>
                            <button 
                                onClick={() => toggleDropdown(section.id)} 
                                className={`w-full flex items-center justify-between text-xs font-bold border rounded-xl px-3 py-4 transition-all cursor-pointer ${
                                    hasError ? 'border-rose-300 bg-rose-50 text-rose-600' : 'bg-white border-slate-200 text-slate-600 hover:border-[#003C6C] hover:text-[#003C6C]'
                                }`}
                            >
                                <span className="truncate">
                                    {/* FIX: Now shows Start - End time */}
                                    {selectedSub ? `${expandDays(selectedSub.days)} ${formatTime(selectedSub.startTime)} - ${formatTime(selectedSub.endTime)}` : "Select Discussion"}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdownId === section.id ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {openDropdownId === section.id && (
                                <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
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
                                                <div className="flex-1">
                                                    <span className="font-black text-slate-800 block">{expandDays(sub.days)}</span>
                                                    <span className="text-[10px] font-bold text-black block mt-0.5">
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
                    
                    {/* BUTTON STATE: Closed vs Waitlist vs Open */}
                    <button 
                        onClick={() => handleAddClick(section)} 
                        className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                            isClosed 
                                ? 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md' // Solid Red for Closed
                                : isWaitlist 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md' // Solid Orange for Waitlist
                                    : 'bg-[#003C6C] text-white hover:bg-[#002a4d] hover:shadow-md' // Standard Blue for Open
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
        })}
      </div>
    </div>
  );
};

export default CourseCard;