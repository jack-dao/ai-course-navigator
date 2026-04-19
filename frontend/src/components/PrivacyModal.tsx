import React, { useEffect } from 'react';
import { X, Shield, Lock, Eye, Server, Github } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal = ({ isOpen, onClose }: PrivacyModalProps) => {
  
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Privacy Policy</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors group cursor-pointer"
          >
            <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white space-y-8">
            
            <section className="space-y-3">
                <h3 className="text-lg font-bold text-[#003C6C] flex items-center gap-2">
                    <Eye className="w-5 h-5" /> 1. Information We Collect
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed ml-7">
                    When you sign in with Google, we collect your <strong>email address</strong> and <strong>name</strong> solely for authentication purposes. We also store the <strong>schedules</strong> you voluntarily create and save within the application.
                </p>
            </section>

            <section className="space-y-3">
                <h3 className="text-lg font-bold text-[#003C6C] flex items-center gap-2">
                    <Server className="w-5 h-5" /> 2. How We Use Your Data
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed ml-7">
                    Your data is used strictly to:
                </p>
                <ul className="list-disc ml-12 text-sm text-slate-600 space-y-1">
                    <li>Allow you to log in and access your saved account.</li>
                    <li>Persist your course schedules across different devices.</li>
                    <li>Verify your identity to prevent unauthorized access.</li>
                </ul>
            </section>

            <section className="space-y-3">
                <h3 className="text-lg font-bold text-[#003C6C] flex items-center gap-2">
                    <Lock className="w-5 h-5" /> 3. Data Security & Sharing
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed ml-7">
                    We <strong>do not sell</strong> your personal data to advertisers or third parties. 
                    Course data is retrieved from public university listings. Professor ratings are sourced from RateMyProfessors for informational purposes only.
                </p>
            </section>

            <div className="pt-8 mt-8 border-t border-slate-100 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Last Updated: January 2026
                </p>
                <a 
                    href="https://github.com/jack-dao/ai-course-navigator/issues" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                >
                    <Github className="w-4 h-4" />
                    Report an Issue on GitHub
                </a>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;