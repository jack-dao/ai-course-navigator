import React from 'react';
import { X, Star, MessageSquare, Flame, ThumbsUp, TrendingUp, Calendar } from 'lucide-react';

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
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {professor.name.replace(/,/g, ', ')}
            </h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[3px] mt-1">Professor Insights</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900" />
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Quality', val: `${professor.avgRating} / 5`, icon: <Star className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
              { label: 'Difficulty', val: `${professor.avgDifficulty} / 5`, icon: <Flame className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-50' },
              { label: 'Retake', val: `${professor.wouldTakeAgain}%`, icon: <ThumbsUp className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
              { label: 'Total', val: professor.numRatings, icon: <TrendingUp className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-50' }
            ].map((stat, i) => (
              <div key={i} className={`${stat.bg} p-6 rounded-[24px] border border-white shadow-sm flex flex-col items-center text-center`}>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                  {stat.icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className="text-xl font-black text-slate-900">{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Student Feedback</h3>
            </div>

            {professor.reviews?.length > 0 ? (
              professor.reviews.map((rev, i) => (
                <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:shadow-lg transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg">
                        {rev.course}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <Calendar className="w-3 h-3" />
                        {new Date(rev.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase">
                      Grade: {rev.grade || 'N/A'}
                    </div>
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-6 text-lg">
                    "{rev.comment}"
                  </p>
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