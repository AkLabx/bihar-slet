import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import allQuestions from '../data/questions/all_questions.json';
import { useQuizStore } from '../store/useQuizStore';
import { Question } from '../types';
import { ArrowLeft, BookmarkCheck, Trash2, Sparkles, HelpCircle } from 'lucide-react';

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const { bookmarks, toggleBookmark, language } = useQuizStore();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  // Filter all questions to only those in bookmarks
  const bookmarkedQuestions: Question[] = (allQuestions as Question[]).filter(q =>
    bookmarks.includes(q.globalId)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'english' ? 'Back to Syllabus' : 'मुख्य पृष्ठ (Back)'}</span>
        </button>

        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md">
          {language === 'english' ? `Total Bookmarks: ${bookmarkedQuestions.length}` : `कुल बुकमार्क: ${bookmarkedQuestions.length}`}
        </span>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-slate-800/80 dark:to-slate-900 border border-amber-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <BookmarkCheck className="w-5 h-5 text-amber-600" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            {language === 'english' ? 'Saved Questions (Bookmarked Revision Hub)' : 'सहेजे गए प्रश्न (Bookmarked Revision Hub)'}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {language === 'english'
            ? 'Revise difficult or important questions here with complete solutions and analysis.'
            : 'कठिन या महत्वपूर्ण प्रश्नों को यहां एक स्थान पर दोहराएं और उनके द्विभाषी विश्लेषण को समझें।'}
        </p>
      </div>

      {bookmarkedQuestions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 space-y-4 shadow-xs">
          <BookmarkCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {language === 'english' ? 'No Bookmarks Found' : 'कोई बुकमार्क नहीं मिला'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {language === 'english'
              ? 'Click the bookmark icon on any question while practicing or taking mock exams to save it here.'
              : 'क्विज़ या टेस्ट हल करते समय किसी भी प्रश्न के ऊपरी कोने पर दिए गए बुकमार्क आइकन पर क्लिक कर उसे यहां जोड़ें।'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600"
          >
            <HelpCircle className="w-4 h-4" /> {language === 'english' ? 'Start Solving Questions' : 'प्रश्न हल करना शुरू करें'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedQuestions.map((q, idx) => {
            const userChoice = selectedAnswers[q.globalId];
            const isAnswered = userChoice !== undefined;

            return (
              <div
                key={q.globalId}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                      {language === 'english' ? `Bookmark #${idx + 1}` : `बुकमार्क #${idx + 1}`}
                    </span>
                    <span className="text-gray-500">
                      {language === 'english'
                        ? `${q.unitTitle_en} • ${q.subUnitTitle_en}`
                        : `${q.unitTitle_hi} • ${q.subUnitTitle_hi}`}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleBookmark(q.globalId)}
                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'english' ? 'Remove' : 'हटाएं'}</span>
                  </button>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  {(language === 'bilingual' || language === 'hindi') && (
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-relaxed">{q.q_hi}</h3>
                  )}
                  {(language === 'bilingual' || language === 'english') && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">{q.q_en}</p>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {q.options_hi.map((optHi, optIdx) => {
                    const optEn = q.options_en[optIdx] || optHi;
                    const isSelected = userChoice === optIdx;
                    const isCorrect = optIdx === q.correct;

                    let optClass = "border-gray-200 dark:border-slate-800 hover:border-amber-400 bg-gray-50/50 dark:bg-slate-800/40 text-gray-800 dark:text-gray-200";

                    if (isAnswered) {
                      if (isCorrect) {
                        optClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold";
                      } else if (isSelected && !isCorrect) {
                        optClass = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200";
                      } else {
                        optClass = "opacity-50 border-gray-200 dark:border-slate-800";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.globalId]: optIdx })}
                        className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-all ${optClass}`}
                      >
                        <span className="font-mono font-bold shrink-0">{['A', 'B', 'C', 'D'][optIdx]}</span>
                        <div className="space-y-0.5">
                          {(language === 'bilingual' || language === 'hindi') && <div>{optHi}</div>}
                          {(language === 'bilingual' || language === 'english') && (
                            <div className="text-[11px] opacity-75">{optEn}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {isAnswered && (
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 space-y-1.5 text-xs">
                    <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === 'english' ? 'Analytical Explanation:' : 'विस्तृत विश्लेषण (Explanation):'}</span>
                    </p>
                    {(language === 'bilingual' || language === 'hindi') && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{q.exp_hi}</p>
                    )}
                    {(language === 'bilingual' || language === 'english') && (
                      <p className={`text-gray-500 dark:text-gray-400 italic ${language === 'bilingual' ? 'pt-1 border-t border-amber-200/40' : ''}`}>
                        {q.exp_en}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
