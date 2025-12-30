import React from 'react';
import { X, Star, MessageSquare, Flame, ThumbsUp, TrendingUp, Calendar, Tag } from 'lucide-react';

const ProfessorModal = ({ professor, isOpen, onClose }) => {
  if (!isOpen || !professor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Header - UCSC Themed */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-[#003C6C] tracking-tight">
              {professor.name.replace(/,/g, ', ')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
                 <span className="bg-[#FDC700] text-[#003C6C] text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                    Instructor
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Analytics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors group cursor-pointer"
          >
            <X className="w-8 h-8 text-slate-300 group-hover:text-[#003C6C] transition-colors" />
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Quality', val: `${professor.avgRating || '?'} / 5`, icon: <Star className="w-5 h-5 text-[#FDC700]" />, bg: 'bg-[#003C6C]' },
              { label: 'Difficulty', val: `${professor.avgDifficulty || '?'} / 5`, icon: <Flame className="w-5 h-5 text-rose-400" />, bg: 'bg-slate-800' },
              { label: 'Retake', val: `${professor.wouldTakeAgain || '0'}%`, icon: <ThumbsUp className="w-5 h-5 text-emerald-400" />, bg: 'bg-slate-800' },
              { label: 'Total', val: professor.numRatings || '0', icon: <TrendingUp className="w-5 h-5 text-slate-400" />, bg: 'bg-slate-100', text: 'text-slate-900' }
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-6 rounded-[24px] shadow-sm flex flex-col items-center text-center group hover:scale-105 transition-transform duration-300 border border-transparent hover:border-[#FDC700]/30`}>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner mb-3">
                  {stat.icon}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${stat.text ? 'text-slate-400' : 'text-white/60'}`}>{stat.label}</p>
                <p className={`text-xl font-black ${stat.text || 'text-white'}`}>{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
              <MessageSquare className="w-5 h-5 text-[#003C6C]" />
              <h3 className="text-sm font-black text-[#003C6C] uppercase tracking-widest">Recent Student Feedback</h3>
            </div>

            {professor.reviews?.length > 0 ? (
              professor.reviews.map((rev, i) => (
                <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-200 hover:border-[#003C6C]/20 hover:shadow-lg transition-all group relative overflow-hidden">
                  
                  {/* Decorative Side Bar */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-slate-100 group-hover:bg-[#FDC700] transition-colors" />

                  <div className="pl-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-[#003C6C] text-white text-xs font-black rounded-lg shadow-sm">
                            {rev.course}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                            <Calendar className="w-3 h-3" />
                            {new Date(rev.date).toLocaleDateString()}
                        </div>
                        </div>
                        {rev.grade && (
                        <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-600 uppercase border border-slate-100">
                            Grade: {rev.grade}
                        </div>
                        )}
                    </div>

                    <p className="text-slate-700 font-medium leading-relaxed italic text-lg mb-5">
                        "{rev.comment}"
                    </p>

                    {/* TAGS SECTION */}
                    {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                        {rev.tags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200 group-hover:bg-indigo-50 group-hover:text-[#003C6C] group-hover:border-indigo-100 transition-colors">
                            <Tag className="w-3 h-3 opacity-50" />
                            {tag}
                            </span>
                        ))}
                        </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[24px] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No detailed reviews found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModal;