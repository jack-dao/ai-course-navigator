import React from 'react';
import type { SelectedCourse, SubSection, Section } from '../types';

interface ColorPalette {
  bg: string;
  border: string;
  text: string;
}

const COLOR_PALETTES: ColorPalette[] = [
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

function getCourseColor(courseCode: string): ColorPalette {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTES[Math.abs(hash) % COLOR_PALETTES.length];
}

function parseDays(dayStr: string | undefined): string[] {
  if (!dayStr || dayStr === 'TBA') return [];
  const days: string[] = [];
  if (dayStr.includes('M')) days.push('M');
  if (dayStr.includes('Tu')) days.push('Tu');
  if (dayStr.includes('W')) days.push('W');
  if (dayStr.includes('Th')) days.push('Th');
  if (dayStr.includes('F')) days.push('F');
  return days;
}

function parseTime(timeStr: string | undefined): number {
  if (!timeStr || timeStr === 'TBA') return 0;
  const match = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return 0;
  const [_, hoursStr, minutesStr, modifier] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatDisplayTime(timeStr: string | undefined): string {
  if (!timeStr || timeStr === 'TBA') return '';
  return timeStr.replace(/^0/, '').replace(/([AP]M)/i, '$1');
}

interface CalendarViewProps {
  selectedCourses: SelectedCourse[];
}

const CalendarView = ({ selectedCourses }: CalendarViewProps) => {
  const START_HOUR = 7;
  const END_HOUR = 23;
  const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
  const TOTAL_MINUTES = TOTAL_HOURS * 60;
  const START_MINUTE_OFFSET = START_HOUR * 60;

  const timeSlots: { label: string; index: number }[] = [];
  for (let i = 0; i < TOTAL_HOURS; i++) {
    const hour = START_HOUR + i;
    const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    timeSlots.push({ label, index: i });
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg w-full">
      <div className="flex border-b border-gray-200 bg-gray-50 h-8 md:h-10 shrink-0 z-20 relative">
        <div className="w-10 md:w-14 border-r bg-gray-50"></div>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
          <div
            key={day}
            className="flex-1 text-[10px] md:text-sm font-bold text-gray-700 flex items-center justify-center border-r last:border-r-0 bg-gray-50 truncate"
          >
            <span className="md:hidden">{day.charAt(0)}</span>
            <span className="hidden md:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="relative flex-1 w-full overflow-hidden">
        <div className="absolute inset-0 top-2 bottom-0">
          {timeSlots.map((slot) => (
            <div
              key={slot.index}
              className="absolute left-0 w-full border-t border-gray-100 flex items-start"
              style={{
                top: `${(slot.index / TOTAL_HOURS) * 100}%`,
                height: `${(1 / TOTAL_HOURS) * 100}%`,
              }}
            >
              <div className="w-10 md:w-14 text-[9px] md:text-[10px] text-gray-400 text-right pr-1 md:pr-2 -translate-y-1/2 bg-white select-none relative z-10 whitespace-nowrap">
                {slot.label}
              </div>

              {[1, 2, 3, 4, 5].map((col) => (
                <div key={col} className="h-full border-r border-gray-100 flex-1 last:border-r-0" />
              ))}
            </div>
          ))}

          <div className="absolute w-full border-t border-gray-100" style={{ top: '100%', left: 0 }}></div>

          <div className="absolute inset-0 left-10 md:left-14 right-0 top-0 bottom-0 grid grid-cols-5 pointer-events-none">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative h-full"></div>
            ))}

            <div className="absolute inset-0 pointer-events-auto">
              {selectedCourses.flatMap((course) => {
                const section = course.selectedSection;
                if (!section) return [];
                const blocks: React.ReactNode[] = [];
                const color = getCourseColor(course.code);

                const renderBlock = (item: SubSection | Section, type: string, uniqueKey: string) => {
                  const days = parseDays(item.days);
                  days.forEach((dayShort) => {
                    const dayIndex = { M: 0, Tu: 1, W: 2, Th: 3, F: 4 }[dayShort];
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
                          padding: '1px',
                          zIndex: 30,
                        }}
                      >
                        <div
                          className={`
                            w-full h-full rounded px-0.5 md:px-1.5 py-0.5 md:py-1 leading-tight border-l-2 md:border-l-4 shadow-sm
                            hover:scale-[1.02] hover:z-50 transition-all cursor-pointer overflow-hidden flex flex-col justify-start
                            ${color.bg} ${color.border} ${color.text}
                            ${type === 'LAB' ? 'border-dashed opacity-90' : ''}
                          `}
                        >
                          {/* Course Code */}
                          <div className="font-bold truncate text-[8px] md:text-[10px]">{course.code}</div>

                          {/* Time Range */}
                          <div className="truncate opacity-90 font-medium text-[7px] md:text-[9px]">
                            {formatDisplayTime(item.startTime)}-{formatDisplayTime(item.endTime)}
                          </div>

                          {/* Location - Prefix only for LAB/DISC */}
                          <div className="truncate opacity-75 mt-auto text-[7px] md:text-[9px]">
                            {type === 'LAB' && <span>DISC: </span>}
                            {item.location}
                          </div>
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
