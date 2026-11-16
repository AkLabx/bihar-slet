import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { StudyPage } from './pages/StudyPage';
import { QuizPage } from './pages/QuizPage';
import { GrandMockPage } from './pages/GrandMockPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { useQuizStore } from './store/useQuizStore';

export const App: React.FC = () => {
  const { theme } = useQuizStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
        <Navbar />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/study/:subUnitNum" element={<StudyPage />} />
            <Route path="/quiz/:subUnitNum" element={<QuizPage />} />
            <Route path="/grand-mock" element={<GrandMockPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            बिहार राज्य विद्यालय पुस्तकालयाध्यक्ष पात्रता परीक्षा 2026 (Bihar SLET / LET)
          </p>
          <p>
            150 अंक पूर्ण पाठ्यक्रम: 10 इकाइयां • 30 उप-इकाइयां • 445 परीक्षा-स्तरीय द्विभाषी प्रश्न
          </p>
          <p className="text-[11px] text-gray-400">
            Open Source Education Initiative • Hosted on GitHub Pages via <a href="https://github.com/AkLabx/bihar-slet" target="_blank" rel="noreferrer" className="underline hover:text-amber-500">AkLabx/bihar-slet</a>
          </p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
