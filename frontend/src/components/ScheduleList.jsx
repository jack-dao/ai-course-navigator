import React from 'react';
import { Trash2, MapPin, Clock } from 'lucide-react';

const ScheduleList = ({ selectedCourses, onRemove }) => {
    const totalUnits = selectedCourses.reduce((acc, c) => acc + (parseInt(c.credits) || 0), 0);
    const MAX_UNITS = 22;
    const progress = Math.min((totalUnits / MAX_UNITS) * 100, 100);

    const formatTime = (time) => time ? time.replace(/^0/, '') : '';

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Units</span>
                    <span className={`text-sm font-black ${totalUnits > 19 ? 'text-rose-600' : 'text-[#003C6C]'}`}>
                        {totalUnits} / {MAX_UNITS}
                    </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${totalUnits > 19 ? 'bg-rose-500' : 'bg-[#FDC700]'}`} 
                        style={{ width: `${progress}%` }} 
                    />
                </div>
            </div>

            {selectedCourses.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <p className="text-sm font-bold text-slate-600">
                        Add courses from Search to build your schedule.
                    </p>
                </div>
            ) : (
                selectedCourses.map((course) => (
                    <div key={course.code} className="bg-white border border-slate-200 rounded-xl p-4 group hover:border-[#003C6C] transition-colors relative shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-black text-[#003C6C] text-sm">{course.code}</h4>
                                <p className="text-xs font-bold text-slate-600 line-clamp-1">{course.name}</p>
                            </div>
                            <button onClick={() => onRemove(course.code)} className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {course.selectedSection && (
                                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-[#003C6C] uppercase tracking-wider text-[10px]">Lecture</span>
                                        <span className="font-mono text-slate-400 text-[10px]">{course.selectedSection.sectionCode}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="font-bold">
                                            {course.selectedSection.days} {formatTime(course.selectedSection.startTime)}-{formatTime(course.selectedSection.endTime)}
                                        </span>
                                    </div>
                                    {course.selectedSection.location && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span>{course.selectedSection.location}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {course.selectedSection?.selectedLab && (
                                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Discussion</span>
                                        <span className="font-mono text-slate-400 text-[10px]">{course.selectedSection.selectedLab.sectionCode}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="font-bold">
                                            {course.selectedSection.selectedLab.days} {formatTime(course.selectedSection.selectedLab.startTime)}-{formatTime(course.selectedSection.selectedLab.endTime)}
                                        </span>
                                    </div>
                                    {course.selectedSection.selectedLab.location && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span>{course.selectedSection.selectedLab.location}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                            <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-slate-500">
                                {course.credits} Units
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ScheduleList;