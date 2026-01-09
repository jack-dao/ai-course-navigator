import React, { useEffect } from 'react';
import { X, Star, MessageSquare, Flame, ThumbsUp, TrendingUp, Calendar, Tag, ExternalLink } from 'lucide-react';

const ProfessorModal = ({ professor, isOpen, onClose }) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !professor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-[#003C6C] tracking-tight">
              {professor.name.replace(/,/g, ', ')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
                 <span className="bg-slate-100 text-slate-600 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                    Instructor
                </span>
                {professor.department && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">
                        {professor.department}
                    </span>
                )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {professor.rmpLink && (
                <a 
                  href={professor.rmpLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  // Changed to Blue-50 background + Blue-700 text so it pops
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all flex items-center gap-2 group font-bold"
                  title="View full profile on RateMyProfessors"
                >
                    <span className="text-xs hidden sm:block">View on RMP</span>
                    <ExternalLink className="w-4 h-4 text-blue-500 group-hover:text-blue-700 transition-colors" />
                </a>
            )}

            <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors group cursor-pointer"
            >
                <X className="w-8 h-8 text-slate-300 group-hover:text-[#003C6C] transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Quality', val: `${professor.avgRating || '?'} / 5`, icon: <Star className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50', text: 'text-indigo-900' },
              { label: 'Difficulty', val: `${professor.avgDifficulty || '?'} / 5`, icon: <Flame className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50', text: 'text-rose-900' },
              { label: 'Retake', val: `${professor.wouldTakeAgain || '0'}%`, icon: <ThumbsUp className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50', text: 'text-emerald-900' },
              { label: 'Total', val: professor.numRatings || '0', icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', text: 'text-blue-900' }
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-5 rounded-[24px] border border-transparent hover:border-black/5 transition-all flex flex-col items-center text-center gap-1`}>
                <div className="p-2.5 bg-white rounded-2xl shadow-sm mb-1">
                  {stat.icon}
                </div>
                <p className={`text-xl font-black ${stat.text}`}>{stat.val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Student Feedback</h3>
            </div>

            {professor.reviews?.length > 0 ? (
              professor.reviews.map((rev, i) => (
                <div key={i} className="bg-slate-50 p-8 rounded-[28px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-wide rounded-lg shadow-sm">
                            {rev.course || 'General'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(rev.date).toLocaleDateString()}
                        </div>
                    </div>
                    {rev.grade && (
                        <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase rounded-lg">
                            Grade: {rev.grade}
                        </span>
                    )}
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed text-sm mb-6 pl-1">
                    "{rev.comment}"
                  </p>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/50">
                      {rev.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold uppercase rounded-md shadow-sm group-hover:border-[#003C6C]/20 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No written reviews available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorModal;