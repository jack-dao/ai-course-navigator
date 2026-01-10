import React from 'react';
import { Shield, Info, Database, Github, AlertTriangle, Users, Cpu, RefreshCw, Star } from 'lucide-react';

const AboutTab = ({ onOpenPrivacy }) => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white p-8 md:p-12 flex flex-col">
      <div className="max-w-3xl mx-auto space-y-12 pb-10 flex-1">        
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black text-[#003C6C] tracking-tight">
            AI Slug Navigator
          </h1>
          <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            The smartest way for UC Santa Cruz students to search classes, check ratings, and build schedules.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-[#003C6C] font-bold text-sm">
            <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Built for UCSC Students</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
                <RefreshCw className="w-5 h-5" />
                <span>Catalog Updates Nightly</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#FDC700] text-[#003C6C] rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#003C6C]">How Sammy AI Works</h2>
          </div>
          
          <p className="text-slate-700 font-medium leading-relaxed mb-6">
            Sammy acts as your personal academic assistant. It scans the entire UCSC catalog to find classes that fit your needs, checks for time conflicts with your current schedule, and pulls in <strong>RateMyProfessors</strong> data to help you find the best instructors.
          </p>
          
          <div className="flex gap-3 p-4 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-[#FDC700] shrink-0" />
            <p>
              <strong>Heads up:</strong> Course availability is updated nightly. Additionally, Sammy is an AI and can occasionally make mistakes. Always verify the live status and details in MyUCSC before enrolling.
            </p>
          </div>
        </div>

        <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Cpu className="w-5 h-5 text-slate-400" />
                Under the Hood
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { name: 'React + Vite', desc: 'Frontend' },
                    { name: 'Node.js', desc: 'Backend' },
                    { name: 'Supabase', desc: 'Database & Auth' },
                    { name: 'Gemini AI', desc: 'Intelligence' }
                ].map((tech, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col items-center text-center">
                        <span className="font-bold text-slate-800 text-sm">{tech.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{tech.desc}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl border border-slate-200 hover:border-emerald-200 transition-colors bg-white">
            <div className="mb-4 text-emerald-600">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 mb-3">Data & Privacy</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We use <strong>Supabase</strong> (Google Login) to securely authenticate you. We only store your saved schedules so you can access them later. We <strong>do not</strong> sell your data or access your personal UCSC accounts.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 hover:border-blue-200 transition-colors bg-white">
            <div className="mb-4 text-blue-600">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 mb-3">Source & Disclaimer</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Course data comes from publicly available UCSC schedule listings. Professor ratings are sourced from <strong>RateMyProfessors</strong>. This application is not affiliated with, endorsed by, or connected to the University of California, Santa Cruz.
            </p>
          </div>
        </div>

        <div className="pt-6 text-center">
          <a 
            href="https://github.com/jack-dao/ai-course-navigator" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-xl"
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
          </a>
        </div>

      </div>

      <div className="border-t border-slate-100 pt-8 mt-4 flex flex-col items-center justify-center gap-3 text-xs font-bold text-slate-400">
         <span>© 2026 Jack Dao. All rights reserved.</span>
         <button 
            onClick={onOpenPrivacy} 
            className="hover:text-[#003C6C] transition-colors cursor-pointer hover:underline"
         >
            Privacy Policy
         </button>
      </div>

    </div>
  );
};

export default AboutTab;