import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import manifest from '../data/manifest.json';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { Question, QuizMode, UnitMeta } from '../types';
import { TestConsole } from '../components/TestConsole';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Award,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const questionModules = import.meta.glob('../data/questions/subunit_*_questions.json', { eager: true, import: 'default' }) as Record<string, Question[]>;

export const QuizPage: React.FC = () => {
  const { subUnitNum } = useParams<{ subUnitNum: string }>();
  const navigate = useNavigate();

  const { language, category, isBookmarked, toggleBookmark, recordQuizAttempt } = useQuizStore();

  const [mode, setMode] = useState<QuizMode>('exam');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'bookmarked'>('all');

  // Load questions for this subunit
  const formattedSubNum = subUnitNum ? subUnitNum.replace('.', '_') : '';
  const questionKey = `../data/questions/subunit_${formattedSubNum}_questions.json`;
  const questions: Question[] = questionModules[questionKey] || [];

  // Metadata
  const units = manifest as UnitMeta[];
  let currentUnit: UnitMeta | undefined;
  let currentSubUnit: any;
  for (const u of units) {
    const found = u.subUnits.find((s) => s.subUnitNum === subUnitNum);
    if (found) {
      currentUnit = u;
      currentSubUnit = found;
      break;
    }
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {language === 'english' ? 'Questions Not Available' : 'प्रश्न उपलब्ध नहीं हैं'}
        </h2>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg">
          <ArrowLeft className="w-4 h-4" /> {language === 'english' ? 'Back to Home' : 'मुख्य पृष्ठ पर लौटें'}
        </Link>
      </div>
    );
  }

  // Active Test Mode -> Render Dedicated Fullscreen CBT Interface
  if (!isSubmitted) {
    return (
      <TestConsole
        sessionId={`subunit_${subUnitNum}`}
        title={`${language === 'english' ? 'Unit ' + subUnitNum : 'उप-इकाई ' + subUnitNum}: ${
          language === 'english' ? currentSubUnit?.title_en : currentSubUnit?.title_hi
        }`}
        subtitle={language === 'english' ? currentUnit?.title_en : currentUnit?.title_hi}
        questions={questions}
        mode={mode}
        totalDurationSeconds={20 * 60}
        onComplete={(result) => {
          setSelectedAnswers(result.selectedAnswers);
          const record = {
            score: result.score,
            total: result.total,
            percentage: result.percentage,
            mode,
            date: new Date().toISOString(),
            answers: {},
          };
          if (subUnitNum) {
            recordQuizAttempt(subUnitNum, record);
          }
          setIsSubmitted(true);
          window.scrollTo(0, 0);
        }}
        onExit={() => navigate('/')}
      />
    );
  }

  // Submitted Mode -> Render Detailed Scorecard & Solutions Review
  let correctCount = 0;
  let wrongCount = 0;
  questions.forEach((q, idx) => {
    const sel = selectedAnswers[idx];
    if (sel !== undefined) {
      if (sel === q.correct) correctCount++;
      else wrongCount++;
    }
  });
  const unattemptedCount = questions.length - (correctCount + wrongCount);
  const percentage = (correctCount / questions.length) * 100;
  const currentCutoff = CATEGORY_CUTOFFS[category];
  const isQualified = percentage >= currentCutoff.minPercent;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-2">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-slate-800 pb-2.5 sm:pb-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">
            {language === 'english' ? 'Back to Syllabus' : 'मुख्य पृष्ठ (Back)'}
          </span>
          <span className="sm:hidden">{language === 'english' ? 'Back' : 'मुख्य'}</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/study/${subUnitNum}`}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="hidden sm:inline">
              {language === 'english' ? 'Read Study Notes' : 'अध्ययन नोट्स पढ़ें'}
            </span>
            <span className="sm:hidden">{language === 'english' ? 'Notes' : 'नोट्स'}</span>
          </Link>
          <LanguageSwitcher size="sm" />
        </div>
      </div>

      {/* SCORECARD DISPLAY */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              isQualified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {isQualified
              ? (language === 'english' ? 'Congratulations! You Qualified 🎉' : 'बधाई! आप उत्तीर्ण हैं 🎉')
              : (language === 'english' ? 'Keep Practicing! 📚' : 'अभ्यास जारी रखें! 📚')}
          </h2>

          <div className="flex justify-center items-baseline gap-2">
            <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-400">{correctCount}</span>
            <span className="text-gray-400 text-xl font-bold">/ {questions.length}</span>
            <span className="text-sm font-semibold text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
          </div>

          {/* Category Cutoff Verdict Banner */}
          <div
            className={`p-4 rounded-xl max-w-lg mx-auto text-xs sm:text-sm font-medium ${
              isQualified
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
            }`}
          >
            <p>
              <strong>{language === 'english' ? currentCutoff.label_en : currentCutoff.label_hi}</strong>{' '}
              {language === 'english' ? 'Cutoff Qualifying Minimum:' : 'के लिए न्यूनतम उत्तीर्णांक:'}{' '}
              <strong>{currentCutoff.minPercent}%</strong>
            </p>
            <p className="mt-1 font-bold">
              {isQualified
                ? (language === 'english'
                    ? `✅ You scored ${(percentage - currentCutoff.minPercent).toFixed(1)}% above cutoff criteria!`
                    : `✅ आपने कटऑफ मानक से ${(percentage - currentCutoff.minPercent).toFixed(1)}% अधिक अंक प्राप्त किए!`)
                : (language === 'english'
                    ? `⚠️ Need ${(currentCutoff.minPercent - percentage).toFixed(1)}% more marks to meet cutoff.`
                    : `⚠️ कटऑफ प्राप्त करने हेतु ${(currentCutoff.minPercent - percentage).toFixed(1)}% अंकों की और आवश्यकता है।`)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{correctCount}</p>
              <p className="text-[11px] text-emerald-600">{language === 'english' ? 'Correct' : 'सही'}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900 text-center">
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{wrongCount}</p>
              <p className="text-[11px] text-red-600">{language === 'english' ? 'Wrong' : 'गलत'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{unattemptedCount}</p>
              <p className="text-[11px] text-gray-500">{language === 'english' ? 'Skipped' : 'छोड़े गए'}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setSelectedAnswers({});
                setIsSubmitted(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> {language === 'english' ? 'Retake Test' : 'पुनः टेस्ट दें'}
            </button>
            <button
              onClick={() => setReviewFilter(reviewFilter === 'wrong' ? 'all' : 'wrong')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {reviewFilter === 'wrong'
                ? (language === 'english' ? 'View All Questions' : 'सभी प्रश्न देखें')
                : (language === 'english' ? `View Only Wrong (${wrongCount})` : `केवल गलत प्रश्न देखें (${wrongCount})`)}
            </button>
          </div>
        </div>

        {/* Full Solutions Review List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {language === 'english' ? 'Detailed Solutions & Analysis' : 'विस्तृत व्याख्या सहित उत्तर समीक्षा'}
          </h3>

          {questions.map((q, idx) => {
            const sel = selectedAnswers[idx];
            const isCorrect = sel === q.correct;
            const isWrong = sel !== undefined && !isCorrect;

            if (reviewFilter === 'wrong' && !isWrong) return null;

            return (
              <div
                key={q.globalId}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-4 shadow-xs ${
                  isCorrect
                    ? 'border-emerald-200 dark:border-emerald-900/60'
                    : isWrong
                    ? 'border-red-200 dark:border-red-900/60'
                    : 'border-gray-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-xs bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                    {language === 'english' ? `Question ${idx + 1}` : `प्रश्न ${idx + 1}`}
                  </span>
                  <button
                    onClick={() => toggleBookmark(q.globalId)}
                    className="text-gray-400 hover:text-amber-500 cursor-pointer"
                  >
                    {isBookmarked(q.globalId) ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Question Text */}
                <div className="space-y-1">
                  {(language === 'bilingual' || language === 'hindi') && (
                    <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{q.q_hi}</p>
                  )}
                  {(language === 'bilingual' || language === 'english') && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">{q.q_en}</p>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {q.options_hi.map((optHi, optIdx) => {
                    const optEn = q.options_en[optIdx] || optHi;
                    const isOptionCorrect = optIdx === q.correct;
                    const isOptionSelected = optIdx === sel;

                    let optClass = "border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-gray-700 dark:text-gray-300";
                    if (isOptionCorrect) {
                      optClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold";
                    } else if (isOptionSelected && !isOptionCorrect) {
                      optClass = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200";
                    }

                    return (
                      <div key={optIdx} className={`p-3 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 ${optClass}`}>
                        <span className="font-mono font-bold shrink-0">{['(A)', '(B)', '(C)', '(D)'][optIdx]}</span>
                        <div>
                          {(language === 'bilingual' || language === 'hindi') && <div>{optHi}</div>}
                          {(language === 'bilingual' || language === 'english') && <div className="text-[11px] opacity-80">{optEn}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5 text-xs">
                  <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'english' ? 'Analytical Explanation:' : 'विस्तृत विश्लेषण (Analytical Explanation):'}</span>
                  </p>
                  {(language === 'bilingual' || language === 'hindi') && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{q.exp_hi}</p>
                  )}
                  {(language === 'bilingual' || language === 'english') && (
                    <p className={`text-gray-500 dark:text-gray-400 italic ${language === 'bilingual' ? 'pt-1 border-t border-amber-200/40 dark:border-amber-900/40' : ''}`}>
                      {q.exp_en}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
