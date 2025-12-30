import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, Star, MapPin, ChevronDown, Check, RotateCcw, Info, User } from 'lucide-react';

const CourseCard = ({ course, onAdd, professorRatings, onShowProfessor }) => {
  const [selectedSubSections, setSelectedSubSections] = useState({});
  const [errors, setErrors] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

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

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="relative">
          <Star className="w-3.5 h-3.5 text-slate-200" />
          <div className="absolute top-0 left-0 overflow-hidden h-full" style={{ width: `${Math.min(Math.max((rating - i) * 100, 0), 100)}%` }}>
            <Star className="w-3.5 h-3.5 fill-current text-[#FDC700]" />
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

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all mb-6 overflow-visible group/card">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-[800] text-slate-900 tracking-tight uppercase">{course.code}</h3>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          <p className="text-slate-500 font-bold text-sm tracking-tight hidden sm:block">{course.name}</p>
        </div>
        <span className="px-4 py-1.5 bg-[#003C6C] text-white text-[10px] font-black uppercase rounded-lg shadow-sm">{course.credits} Units</span>
      </div>

      {/* GRID HEADERS */}
      <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1.2fr_180px] px-8 py-3 bg-white border-b border-slate-50 text-[11px] font-bold text-slate-400">
        <span>Instructor & Ratings</span>
        <span>Schedule & Location</span>
        <span>Availability</span>
        <span className="text-right pr-4">Action</span>
      </div>

      <div className="divide-y divide-slate-50">
        {course.sections?.map((section) => {
          const hasDiscussions = section.subSections?.length > 0;
          const ratingData = professorRatings?.[section.instructor];
          const selectedSubId = selectedSubSections[section.id];
          const selectedSub = section.subSections?.find(s => s.id === selectedSubId);
          const hasError = errors[section.id];

          const capacity = section.capacity || 1;
          const enrolled = section.enrolled || 0;
          const fillRatio = enrolled / capacity;
          const fillPercentage = Math.min(fillRatio * 100, 100);

          const isClosed = section.status === 'Closed' || fillRatio >= 1;
          const isWaitlist = section.status === 'Wait List';
          
          let barColor = 'bg-emerald-500';
          let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
          
          if (isClosed) {
            barColor = 'bg-rose-500';
            statusBadge = 'bg-rose-50 text-rose-700 border-rose-100';
          } else if (isWaitlist || fillRatio > 0.85) {
            barColor = 'bg-amber-500';
            statusBadge = 'bg-amber-50 text-amber-700 border-amber-100';
          }

          return (
            <div key={section.id} className="p-6 lg:px-8 hover:bg-slate-50/50 transition-colors group/row">
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1.2fr_180px] items-start lg:items-center gap-8">
                
                {/* INSTRUCTOR */}
                <div className="space-y-2">
                  <div className="flex flex-col items-start">
                    <button 
                      onClick={() => onShowProfessor(section.instructor, ratingData)}
                      className="group/prof flex items-center gap-2 text-lg font-[800] text-[#003C6C] cursor-pointer transition-all text-left leading-none tracking-tight hover:underline decoration-2 underline-offset-4 decoration-[#FDC700]"
                    >
                      {/* DARKER USER ICON */}
                      <User className="w-4 h-4 text-[#003C6C] transition-colors" />
                      {formatInstructor(section.instructor)}
                      {/* DARKER INFO ICON */}
                      <Info className="w-3 h-3 text-[#003C6C] opacity-0 group-hover/prof:opacity-100 transition-opacity" />
                    </button>
                  </div>
                  {ratingData ? (
                    <div className="flex items-center gap-3 bg-white w-fit px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                      {renderStars(ratingData.avgRating)}
                      <span className="text-xs font-bold text-slate-500">{ratingData.avgRating}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">No Ratings</span>
                  )}
                </div>

                {/* SCHEDULE */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {/* DARKER CLOCK ICON */}
                    <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 leading-tight">
                            {expandDays(section.days)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 mt-0.5">
                            {formatTime(section.startTime)}—{formatTime(section.endTime)}
                        </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {/* DARKER MAP ICON */}
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-xs font-bold text-slate-500 mt-0.5 leading-tight">
                        {formatLocation(section.location)}
                    </span>
                  </div>
                </div>

                {/* AVAILABILITY */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded border ${statusBadge}`}>
                      {section.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{enrolled}/{capacity}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${barColor}`} 
                      style={{ width: `${fillPercentage}%` }} 
                    />
                  </div>
                </div>

                {/* ACTION */}
                <div className="flex flex-col gap-2 relative">
                  {hasDiscussions && (
                    <div className="relative" ref={openDropdownId === section.id ? dropdownRef : null}>
                        <button
                          onClick={() => toggleDropdown(section.id)}
                          className={`w-full flex items-center justify-between text-xs font-bold border rounded-xl px-3 py-2.5 bg-white transition-all cursor-pointer ${
                            hasError ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600 hover:border-[#003C6C] hover:text-[#003C6C]'
                          }`}
                        >
                          <span className="truncate">
                            {selectedSub ? `${expandDays(selectedSub.days)} ${formatTime(selectedSub.startTime)}` : "Select Discussion..."}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdownId === section.id ? 'rotate-180' : ''}`} />
                        </button>

                        {/* DROPDOWN MENU */}
                        {openDropdownId === section.id && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                            <div className="p-1">
                              {selectedSubId && (
                                <>
                                  <button
                                    onClick={() => handleSelectDiscussion(section.id, null)}
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold mb-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer flex items-center gap-2"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Clear Selection
                                  </button>
                                  <div className="h-px bg-slate-100 my-1 mx-2" />
                                </>
                              )}
                              {section.subSections.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => handleSelectDiscussion(section.id, sub.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs mb-1 last:mb-0 flex items-center justify-between group cursor-pointer ${
                                    selectedSubId === sub.id ? 'bg-[#003C6C]/10 text-[#003C6C]' : 'hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-slate-800 group-hover:text-[#003C6C]">
                                      {expandDays(sub.days)}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium group-hover:text-[#003C6C]">
                                      {formatTime(sub.startTime)}–{formatTime(sub.endTime)}
                                    </span>
                                  </div>
                                  {selectedSubId === sub.id && <Check className="w-3 h-3 text-[#003C6C]" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                  
                  {/* ADD BUTTON - ALWAYS "Add Class" */}
                  <button
                    onClick={() => handleAddClick(section)}
                    className="w-full py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 bg-[#003C6C] text-white hover:bg-[#002a4d] shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Class
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