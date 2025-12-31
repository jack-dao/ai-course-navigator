import React from 'react';
import { X } from 'lucide-react';

const ScheduleList = ({ selectedCourses, onRemove }) => {
  const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.replace(/^0/, ''); 
  };

  const formatTimeRange = (section) => {
    if (!section || !section.startTime || !section.endTime) return '';
    if (section.time && !section.startTime) return section.time.replace(/0(\d:\d\d)/g, '$1');
    return `${formatTime(section.startTime)}-${formatTime(section.endTime)}`;
  };

  return (
    <div className="p-2">
      <h2 className="text-sm font-bold text-slate-700 mb-4">Selected ({totalCredits} units)</h2>
      
      {selectedCourses.length === 0 ? (
          <div className="text-slate-500 font-bold text-sm border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
            No courses added yet.
          </div>
      ) : (
          selectedCourses.map(course => (
          <div key={course.code} className="border border-slate-200 p-4 rounded-xl flex justify-between mb-3 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#003C6C] text-sm">{course.code}</h3>
                  <p className="text-xs font-bold text-slate-500">{course.name}</p>
                  
                  <p className="text-xs text-slate-700 mt-2 font-bold whitespace-nowrap">
                      {course.selectedSection ? 
                          `Section - ${course.selectedSection.sectionCode}: ${course.selectedSection.days} ${formatTimeRange(course.selectedSection)}` : 
                          'No section selected'}
                  </p>
                  
                  {course.selectedSection?.selectedLab && (
                      // FIX: Removed indent (ml/border/pl) and overflow hiding
                      <p className="text-xs text-slate-500 mt-1 font-medium whitespace-nowrap">
                          Discussion - {course.selectedSection.selectedLab.sectionCode}: {course.selectedSection.selectedLab.days} {formatTimeRange(course.selectedSection.selectedLab)}
                      </p>
                  )}
              </div>
              <button 
                onClick={() => onRemove(course.code)} 
                className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors h-8 w-8 flex items-center justify-center cursor-pointer shrink-0 ml-2"
              >
                  <X className="w-4 h-4" />
              </button>
          </div>
          ))
      )}
    </div>
  );
};

export default ScheduleList;