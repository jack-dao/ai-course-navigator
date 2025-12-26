import React from 'react';
import { Calendar } from 'lucide-react';

// --- CONFIG: EXPANDED COLOR PALETTES (12 Options) ---
const COLOR_PALETTES = [
  { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900' },
  { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-900' },
  { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-900' },
  { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-900' },
  { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-900' },
  { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-900' },
  { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-900' },
  { bg: 'bg-lime-100', border: 'border-lime-500', text: 'text-lime-900' },
  { bg: 'bg-fuchsia-100', border: 'border-fuchsia-500', text: 'text-fuchsia-900' },
  { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900' },
  { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-900' },
  { bg: 'bg-slate-100', border: 'border-slate-500', text: 'text-slate-900' },
];

function getCourseColor(courseCode) {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
}

function parseDays(dayStr) {
  if (!dayStr || dayStr === 'TBA') return [];
  const days = [];
  if (dayStr.includes('M')) days.push('M');
  if (dayStr.includes('Tu')) days.push('Tu');
  if (dayStr.includes('W')) days.push('W');
  if (dayStr.includes('Th')) days.push('Th');
  if (dayStr.includes('F')) days.push('F');
  return days;
}

function parseTime(timeStr) {
  if (!timeStr || timeStr === 'TBA') return 0;
  const match = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return 0;
  let [_, hours, minutes, modifier] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

const CalendarView = ({ selectedCourses }) => {
  // CONFIG: 7 AM to 11 PM
  const START_HOUR = 7; 
  const END_HOUR = 23; 
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;
  const START_MINUTE_OFFSET = START_HOUR * 60; 

  const timeSlots = [];
  for (let i = 0; i < TOTAL_HOURS; i++) {
    const hour = START_HOUR + i;
    const label = hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    timeSlots.push({ label, index: i });
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg">
      
      {/* HEADER */}
      <div className="flex border-b border-gray-200 bg-gray-50 h-10 shrink-0 z-20 relative">
        <div className="w-14 border-r bg-gray-50"></div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
          <div key={day} className="flex-1 text-sm font-bold text-gray-700 flex items-center justify-center border-r last:border-r-0 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* BODY */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* TIME SLOTS & GRID */}
        {/* Added extra padding bottom to ensure last hour has room */}
        <div className="absolute inset-0 top-3 bottom-0"> 
            {timeSlots.map((slot) => (
              <div 
                key={slot.index}
                // SWITCHED TO BORDER-TOP: This ensures the line is exactly at the start of the hour
                className="absolute left-0 w-full border-t border-gray-100 flex items-start"
                style={{ 
                  top: `${(slot.index / TOTAL_HOURS) * 100}%`, 
                  height: `${(1 / TOTAL_HOURS) * 100}%` 
                }}
              >
                {/* TIME LABEL ALIGNMENT FIX:
                   -translate-y-1/2 centers the text vertically on the parent's top edge.
                   Since we use border-t, the text is now perfectly bisected by the grid line.
                */}
                <div className="w-14 text-[10px] text-gray-400 text-right pr-2 -translate-y-1/2 bg-white select-none relative z-10">
                  {slot.label}
                </div>
                
                {/* Vertical Lines */}
                {[1, 2, 3, 4, 5].map(col => (
                   <div key={col} className="h-full border-r border-gray-100 flex-1 last:border-r-0" />
                ))}
              </div>
            ))}
            
            {/* Draw one final bottom line for the very end of the day */}
            <div className="absolute w-full border-t border-gray-100" style={{ top: '100%', left: 0 }}></div>

            {/* EMPTY STATE */}
            {selectedCourses.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                 <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Add courses to see your schedule</span>
                 </div>
              </div>
            )}

            {/* EVENTS OVERLAY */}
            <div className="absolute inset-0 left-14 right-0 top-0 bottom-0 grid grid-cols-5 pointer-events-none">
               {[1,2,3,4,5].forEach(i => <div key={i} className="relative h-full"></div>)}

               <div className="absolute inset-0 pointer-events-auto">
               {selectedCourses.flatMap(course => {
                  const section = course.selectedSection;
                  if (!section) return [];
                  const blocks = [];
                  const color = getCourseColor(course.code);

                  const renderBlock = (item, type, uniqueKey) => {
                    const days = parseDays(item.days);
                    days.forEach(dayShort => {
                      const dayIndex = { 'M': 0, 'Tu': 1, 'W': 2, 'Th': 3, 'F': 4 }[dayShort];
                      if (dayIndex === undefined) return;

                      const startMin = parseTime(item.startTime);
                      const endMin = parseTime(item.endTime);
                      
                      const topPercent = ((startMin - START_MINUTE_OFFSET) / TOTAL_MINUTES) * 100;
                      const heightPercent = ((endMin - startMin) / TOTAL_MINUTES) * 100;

                      blocks.push(
                        <div
                          key={uniqueKey + dayShort}
                          style={{
                            position: 'absolute',
                            top: `${topPercent}%`,
                            height: `${heightPercent}%`,
                            left: `${dayIndex * 20}%`, 
                            width: '20%',
                            padding: '2px',
                            zIndex: 30
                          }}
                        >
                          <div className={`
                            w-full h-full rounded px-1.5 py-1 text-[10px] leading-tight border-l-4 shadow-sm 
                            hover:scale-[1.02] hover:z-50 transition-all cursor-pointer overflow-hidden flex flex-col justify-start
                            ${color.bg} ${color.border} ${color.text}
                            ${type === 'LAB' ? 'border-dashed opacity-90' : ''}
                          `}>
                            <div className="font-bold truncate">{course.code} {type === 'LAB' && '(Lab)'}</div>
                            <div className="truncate opacity-90 font-medium">{item.startTime}</div>
                            <div className="truncate opacity-75 mt-auto">{item.location}</div>
                          </div>
                        </div>
                      );
                    });
                  };

                  renderBlock(section, 'LEC', `${course.code}-LEC`);
                  if (section.selectedLab) renderBlock(section.selectedLab, 'LAB', `${course.code}-LAB`);

                  return blocks;
               })}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;