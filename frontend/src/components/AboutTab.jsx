import React from 'react';
import { Shield, Info, Database, Github, AlertTriangle, Users } from 'lucide-react';

const AboutTab = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white p-8 md:p-12">
      <div className="max-w-3xl mx-auto space-y-12 pb-20">
        
        {/* 1. VALUE PROP & TARGET AUDIENCE */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black text-[#003C6C] tracking-tight">
            AI Slug Navigator
          </h1>
          <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            AI Slug Navigator helps UC Santa Cruz students search classes and build schedules faster.
          </p>
          
          {/* ✅ UPDATED: No pill, no date, dark blue text */}
          <div className="flex items-center justify-center gap-2 text-[#003C6C] font-bold text-lg">
            <Users className="w-5 h-5" />
            <span>Built for UCSC Students</span>
          </div>
        </div>

        {/* 2. WHAT SAMMY DOES */}
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#FDC700] text-[#003C6C] rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#003C6C]">What Sammy AI Does</h2>
          </div>
          <p className="text-slate-700 font-medium leading-relaxed mb-6">
            Sammy can suggest schedules, find GEs that fit your gaps, and explain prerequisites. It uses a smart search (RAG) to find relevant classes from the catalog.
          </p>
          
          <div className="flex gap-3 p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-[#FDC700] shrink-0" />
            <p>
              <strong>Disclaimer:</strong> Sammy is an AI assistant. While helpful, it can make mistakes. Always verify course details in the official UCSC portal before enrolling.
            </p>
          </div>
        </div>

        {/* 3. DATA & PRIVACY */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-slate-200 hover:border-[#003C6C] transition-colors">
            <div className="mb-4 text-emerald-600">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Data & Privacy</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We use <strong>Supabase</strong> (Google Login) to securely authenticate you. We only store your saved schedules so you can access them later. We <strong>do not</strong> sell your data or access your personal UCSC accounts.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 hover:border-[#003C6C] transition-colors">
            <div className="mb-4 text-blue-600">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Source & Disclaimer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Course data comes from publicly available UCSC schedule listings. This application is <strong>not affiliated</strong> with, endorsed by, or connected to the University of California, Santa Cruz.
            </p>
          </div>
        </div>

        {/* 4. CONTACT */}
        <div className="border-t border-slate-100 pt-8 text-center">
          <a 
            href="https://github.com/jack-dao" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
          <p className="mt-4 text-xs text-slate-400">
            Feedback? Open an issue on GitHub.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AboutTab;