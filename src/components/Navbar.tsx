import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { Category, Language } from '../types';
import { BookOpen, Award, BookmarkCheck, Sun, Moon, Sparkles, GraduationCap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage, theme, toggleTheme, category, setCategory, bookmarks } = useQuizStore();

  const currentCutoff = CATEGORY_CUTOFFS[category];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                बिहार SLET 2026
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block font-medium">
                School Librarian Eligibility Portal
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>पाठ्यक्रम (Syllabus)</span>
            </Link>

            <Link
              to="/grand-mock"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/grand-mock'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>ग्रैंड मॉक (150 प्रश्न)</span>
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase">Live</span>
            </Link>

            <Link
              to="/bookmarks"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/bookmarks'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>बुकमार्क ({bookmarks.length})</span>
            </Link>
          </nav>

          {/* Controls: Category, Language, Theme */}
          <div className="flex items-center gap-2">
            
            {/* Category Dropdown */}
            <div className="relative hidden sm:block">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="text-xs font-semibold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                title="Select reservation category for cutoff tracking"
              >
                <option value="UR">UR (सामान्य) - 50% / 75 अंक</option>
                <option value="BC">BC (पिछड़ा वर्ग) - 45.5% / 68.25 अंक</option>
                <option value="EBC">EBC (अत्यंत पिछड़ा) - 42.5% / 63.75 अंक</option>
                <option value="SC">SC (अनुसूचित जाति) - 40% / 60 अंक</option>
                <option value="ST">ST (अनुसूचित जनजाति) - 40% / 60 अंक</option>
                <option value="PwD">दिव्यांग (PwD) - 40% / 60 अंक</option>
                <option value="WOMEN">महिला (सभी वर्ग) - 40% / 60 अंक</option>
              </select>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 border border-gray-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setLanguage('bilingual')}
                className={`px-2 py-1 rounded-md transition-all ${
                  language === 'bilingual'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                द्विभाषी
              </button>
              <button
                onClick={() => setLanguage('hindi')}
                className={`px-2 py-1 rounded-md transition-all ${
                  language === 'hindi'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                हिं
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-2 py-1 rounded-md transition-all ${
                  language === 'english'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

        </div>
      </div>
      
      {/* Mobile Cutoff Indicator Bar */}
      <div className="bg-amber-50/70 dark:bg-slate-800/60 border-t border-amber-200/50 dark:border-slate-800 px-4 py-1.5 text-[11px] flex justify-between items-center text-amber-900 dark:text-amber-200">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>उत्तीर्णांक मानदंड: <strong>{currentCutoff.label_hi}</strong></span>
        </span>
        <span className="font-bold bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300">
          न्यूनतम {currentCutoff.minPercent}% ({currentCutoff.minMarks}/150 अंक)
        </span>
      </div>
    </header>
  );
};
