import { useState } from 'react';
import { Save, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import ScheduleList from './ScheduleList';
import CalendarView from './CalendarView';
import type { SelectedCourse, Notification } from '../../types';

interface ScheduleTabProps {
  selectedCourses: SelectedCourse[];
  onRemove: (courseCode: string) => void;
  onSave: () => void;
  notification: Notification | null;
}

const ScheduleTab = ({ selectedCourses, onRemove, onSave, notification }: ScheduleTabProps) => {
  const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list');

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
      <div className="md:hidden px-4 py-3 bg-white border-b border-slate-100 shrink-0 sticky top-0 z-30">
        <div className="flex p-1 bg-slate-100 rounded-xl" role="tablist">
          <button
            role="tab"
            aria-selected={mobileView === 'list'}
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              mobileView === 'list' ? 'bg-white text-ucsc-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            List View
          </button>
          <button
            role="tab"
            aria-selected={mobileView === 'calendar'}
            onClick={() => setMobileView('calendar')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              mobileView === 'calendar' ? 'bg-white text-ucsc-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      <div
        className={`${
          mobileView === 'list' ? 'flex' : 'hidden'
        } md:flex w-full md:w-[400px] shrink-0 border-b md:border-r border-slate-100 flex-col z-10 bg-white h-full md:max-h-full overflow-hidden`}
      >
        <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="pb-4 mb-4 border-b border-slate-100 flex justify-center">
            <h3 className="font-bold text-ucsc-blue text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> My Schedule
            </h3>
          </div>
          <ScheduleList selectedCourses={selectedCourses} onRemove={onRemove} />
        </div>
        <div className="p-4 md:p-6 border-t border-slate-100 shrink-0 bg-white pb-24 md:pb-6 flex flex-col gap-2">
          <button
            onClick={onSave}
            className="w-full py-4 bg-ucsc-blue text-white font-bold rounded-2xl hover:bg-ucsc-blue-dark shadow-xl transition-all cursor-pointer active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Schedule
          </button>

          {notification && (
            <div
              role="status"
              aria-live="polite"
              className={`md:hidden w-fit mx-auto mt-4 px-8 py-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${notification.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-ucsc-blue border-ucsc-gold'}`}
            >
              {notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-ucsc-gold" />
              )}
              <span className="font-bold text-xs tracking-tight">{notification.message}</span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`${mobileView === 'calendar' ? 'flex' : 'hidden'} md:flex flex-1 overflow-hidden relative h-full`}
      >
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
          <div className="w-full h-full min-w-0">
            <CalendarView selectedCourses={selectedCourses} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTab;
