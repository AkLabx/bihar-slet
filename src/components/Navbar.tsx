import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { Category } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BookOpen, Award, BookmarkCheck, Sun, Moon, Sparkles, GraduationCap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { language, theme, toggleTheme, category, setCategory, bookmarks } = useQuizStore();

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
                {language === 'english' ? 'Bihar SLET 2026' : 'बिहार SLET 2026'}
              </span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block font-medium">
                {language === 'english' ? 'School Librarian Eligibility Portal' : 'विद्यालय पुस्तकालयाध्यक्ष पात्रता परीक्षा पोर्टल'}
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
              <span>{language === 'english' ? 'Syllabus' : 'पाठ्यक्रम (Syllabus)'}</span>
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
              <span>{language === 'english' ? 'Grand Mock (150 Qs)' : 'ग्रैंड मॉक (150 प्रश्न)'}</span>
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
              <span>{language === 'english' ? `Bookmarks (${bookmarks.length})` : `बुकमार्क (${bookmarks.length})`}</span>
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
                {Object.entries(CATEGORY_CUTOFFS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {language === 'english'
                      ? `${key} (${val.label_en}) - ${val.minPercent}% / ${val.minMarks} Marks`
                      : `${key} (${val.label_hi.split(' ')[0]}) - ${val.minPercent}% / ${val.minMarks} अंक`}
                  </option>
                ))}
              </select>
            </div>

            {/* Centralized Language Switcher */}
            <LanguageSwitcher size="sm" />

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
      
      {/* Cutoff Indicator Bar - Compact on Mobile */}
      <div className="bg-amber-50/70 dark:bg-slate-800/60 border-t border-amber-200/50 dark:border-slate-800 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] flex justify-between items-center text-amber-900 dark:text-amber-200">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">
            {language === 'english' ? 'Passing Cutoff Criteria: ' : 'उत्तीर्णांक मानदंड: '}
          </span>
          <span className="sm:hidden text-gray-500 dark:text-gray-400">
            {language === 'english' ? 'Cutoff: ' : 'कटऑफ: '}
          </span>
          {/* Mobile category picker */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="sm:hidden font-bold bg-transparent text-amber-900 dark:text-amber-200 underline cursor-pointer text-[11px] focus:outline-none"
            aria-label="Reservation Category"
          >
            {Object.entries(CATEGORY_CUTOFFS).map(([key, val]) => (
              <option key={key} value={key} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                {key} ({val.minPercent}%)
              </option>
            ))}
          </select>
          <strong className="hidden sm:inline">
            {language === 'english' ? currentCutoff.label_en : currentCutoff.label_hi}
          </strong>
        </span>
        <span className="font-bold bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 text-[10px] sm:text-[11px] shrink-0">
          <span className="hidden sm:inline">
            {language === 'english'
              ? `Min ${currentCutoff.minPercent}% (${currentCutoff.minMarks}/150 Marks)`
              : `न्यूनतम ${currentCutoff.minPercent}% (${currentCutoff.minMarks}/150 अंक)`}
          </span>
          <span className="sm:hidden">
            {currentCutoff.minPercent}% ({currentCutoff.minMarks}/150)
          </span>
        </span>
      </div>
    </header>
  );
};
