import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import manifest from '../data/manifest.json';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { Question, QuizMode, UnitMeta } from '../types';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Bookmark, BookmarkCheck, RotateCcw, Award, ChevronLeft, ChevronRight, Eye, Sparkles, BookOpen } from 'lucide-react';

const questionModules = import.meta.glob('../data/questions/subunit_*_questions.json', { eager: true, import: 'default' }) as Record<string, Question[]>;

export const QuizPage: React.FC = () => {
  const { subUnitNum } = useParams<{ subUnitNum: string }>();
  const navigate = useNavigate();

  const { language, category, isBookmarked, toggleBookmark, recordQuizAttempt, quizHistory } = useQuizStore();

  const [mode, setMode] = useState<QuizMode>('practice');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({}); // qIndex -> optionIndex
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 mins for exam mode
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
    const found = u.subUnits.find(s => s.subUnitNum === subUnitNum);
    if (found) {
      currentUnit = u;
      currentSubUnit = found;
      break;
    }
  }

  // Timer for exam mode
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mode === 'exam' && !isSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, isSubmitted, timeLeft]);

  // Reset when subunit changes
  useEffect(() => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setMarkedForReview({});
    setIsSubmitted(false);
    setTimeLeft(20 * 60);
    window.scrollTo(0, 0);
  }, [subUnitNum]);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">प्रश्न उपलब्ध नहीं हैं</h2>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg">
          <ArrowLeft className="w-4 h-4" /> मुख्य पृष्ठ पर लौटें
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const userSelected = selectedAnswers[currentIdx];
  const isAnswered = userSelected !== undefined;

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: optIdx });
  };

  const handleToggleReview = () => {
    setMarkedForReview({ ...markedForReview, [currentIdx]: !markedForReview[currentIdx] });
  };

  const handleSubmit = () => {
    // Calculate score
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        score++;
      }
    });

    const record = {
      score,
      total: questions.length,
      percentage: (score / questions.length) * 100,
      mode,
      date: new Date().toISOString(),
      answers: {}
    };

    if (subUnitNum) {
      recordQuizAttempt(subUnitNum, record);
    }
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setMarkedForReview({});
    setIsSubmitted(false);
    setCurrentIdx(0);
    setTimeLeft(20 * 60);
  };

  // Stats calculation
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

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
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
          <span className="sm:hidden">
            {language === 'english' ? 'Back' : 'मुख्य'}
          </span>
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
            <span className="sm:hidden">
              {language === 'english' ? 'Notes' : 'नोट्स'}
            </span>
          </Link>
        </div>
      </div>

      {/* Subunit Quiz Title Card - Compact on mobile */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-slate-800/80 dark:to-slate-900 border border-amber-200/60 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded shrink-0">
              {language === 'english' ? `Unit ${subUnitNum}` : `उप-इकाई ${subUnitNum}`}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
              {language === 'english' ? currentUnit?.title_en : currentUnit?.title_hi}
            </span>
          </div>
          <h1 className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white leading-snug">
            {language === 'english' ? currentSubUnit?.title_en : currentSubUnit?.title_hi}
          </h1>
        </div>

        {/* Mode & Timer Indicators */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {mode === 'exam' && !isSubmitted && (
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-mono font-bold text-xs sm:text-sm shadow-2xs ${
              timeLeft < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar: Mode Switch & Language Switch - Compact on mobile */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-2 sm:p-3 flex items-center justify-between gap-2 shadow-2xs">
        
        {/* Mode Selector */}
        <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => { setMode('practice'); setIsSubmitted(false); }}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'practice'
                ? 'bg-amber-500 text-white shadow-2xs font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">
              {language === 'english' ? 'Practice Mode' : 'अभ्यास मोड (Practice)'}
            </span>
            <span className="sm:hidden">
              {language === 'english' ? 'Practice' : 'अभ्यास'}
            </span>
          </button>
          <button
            onClick={() => { setMode('exam'); setIsSubmitted(false); }}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all cursor-pointer ${
              mode === 'exam'
                ? 'bg-amber-500 text-white shadow-2xs font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">
              {language === 'english' ? 'Exam Mode (20 Min)' : 'परीक्षा मोड (20 Min Exam)'}
            </span>
            <span className="sm:hidden">
              {language === 'english' ? 'Exam (20m)' : 'परीक्षा (20m)'}
            </span>
          </button>
        </div>

        {/* Centralized Language Switcher */}
        <LanguageSwitcher size="sm" />

      </div>

      {/* SCORECARD DISPLAY (when submitted) */}
      {isSubmitted ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              isQualified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <Award className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {isQualified ? 'बधाई! आप उत्तीर्ण हैं 🎉' : 'अभ्यास जारी रखें! 📚'}
            </h2>

            <div className="flex justify-center items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-400">{correctCount}</span>
              <span className="text-gray-400 text-xl font-bold">/ {questions.length}</span>
              <span className="text-sm font-semibold text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
            </div>

            {/* Category Cutoff Verdict Banner */}
            <div className={`p-4 rounded-xl max-w-lg mx-auto text-xs sm:text-sm font-medium ${
              isQualified
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
            }`}>
              <p>
                <strong>{currentCutoff.label_hi}</strong> के लिए न्यूनतम उत्तीर्णांक: <strong>{currentCutoff.minPercent}%</strong>
              </p>
              <p className="mt-1 font-bold">
                {isQualified
                  ? `✅ आपने कटऑफ मानक से ${(percentage - currentCutoff.minPercent).toFixed(1)}% अधिक अंक प्राप्त किए!`
                  : `⚠️ कटऑफ प्राप्त करने हेतु ${(currentCutoff.minPercent - percentage).toFixed(1)}% अंकों की और आवश्यकता है।`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{correctCount}</p>
                <p className="text-[11px] text-emerald-600">सही (Correct)</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900 text-center">
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{wrongCount}</p>
                <p className="text-[11px] text-red-600">गलत (Wrong)</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{unattemptedCount}</p>
                <p className="text-[11px] text-gray-500">छोड़े गए</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> पुनः टेस्ट दें
              </button>
              <button
                onClick={() => setReviewFilter(reviewFilter === 'wrong' ? 'all' : 'wrong')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold rounded-xl text-xs transition-colors"
              >
                {reviewFilter === 'wrong' ? 'सभी प्रश्न देखें' : `केवल गलत प्रश्न देखें (${wrongCount})`}
              </button>
            </div>
          </div>

          {/* Full Solutions Review List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">विस्तृत व्याख्या सहित उत्तर समीक्षा</h3>
            
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
                      प्रश्न {idx + 1}
                    </span>
                    <button
                      onClick={() => toggleBookmark(q.globalId)}
                      className="text-gray-400 hover:text-amber-500"
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
                          <span className="font-mono font-bold shrink-0">
                            {['(A)', '(B)', '(C)', '(D)'][optIdx]}
                          </span>
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
      ) : (
        /* LIVE QUESTION SOLVER */
        <div className="space-y-6">
          
          {/* Question Card - Compact on Mobile */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-2xs">
            
            {/* Question Progress & Review Toggle */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5 sm:pb-3 text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs">
                {language === 'english' ? `Q ${currentIdx + 1} / ${questions.length}` : `प्रश्न ${currentIdx + 1} / ${questions.length}`}
              </span>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleToggleReview}
                  className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] sm:text-xs ${
                    markedForReview[currentIdx]
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {markedForReview[currentIdx] ? (
                      language === 'english' ? 'Marked' : 'चिह्नित है'
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          {language === 'english' ? 'Mark for Review' : 'समीक्षा हेतु चिह्नित'}
                        </span>
                        <span className="sm:hidden">
                          {language === 'english' ? 'Review' : 'समीक्षा'}
                        </span>
                      </>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => toggleBookmark(currentQ.globalId)}
                  className="p-1 rounded-md text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Bookmark question"
                >
                  {isBookmarked(currentQ.globalId) ? (
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-1.5 sm:space-y-2">
              {(language === 'bilingual' || language === 'hindi') && (
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                  {currentQ.q_hi}
                </h3>
              )}
              {(language === 'bilingual' || language === 'english') && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  {currentQ.q_en}
                </p>
              )}
            </div>

            {/* Options - Minimum 44px tap targets */}
            <div className="space-y-2.5 sm:space-y-3">
              {currentQ.options_hi.map((optHi, optIdx) => {
                const optEn = currentQ.options_en[optIdx] || optHi;
                const isSelected = userSelected === optIdx;
                const isCorrect = optIdx === currentQ.correct;

                let optClass = "border-gray-200 dark:border-slate-800 hover:border-amber-400 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200";

                // In Practice mode: give instant color feedback
                if (mode === 'practice' && isAnswered) {
                  if (isCorrect) {
                    optClass = "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500";
                  } else if (isSelected && !isCorrect) {
                    optClass = "border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-500";
                  } else {
                    optClass = "opacity-50 border-gray-200 dark:border-slate-800";
                  }
                } else if (isSelected) {
                  optClass = "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-3 sm:p-4 min-h-[44px] rounded-xl border transition-all flex items-start gap-2.5 sm:gap-3 cursor-pointer ${optClass}`}
                  >
                    <span className="font-mono font-bold text-xs sm:text-sm shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                      {['A', 'B', 'C', 'D'][optIdx]}
                    </span>
                    <div className="space-y-0.5">
                      {(language === 'bilingual' || language === 'hindi') && (
                        <div className="text-xs sm:text-sm font-semibold leading-snug">{optHi}</div>
                      )}
                      {(language === 'bilingual' || language === 'english') && (
                        <div className="text-[11px] sm:text-xs opacity-80 leading-snug">{optEn}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Instant Explanation in Practice Mode */}
            {mode === 'practice' && isAnswered && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5 sm:space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                  <span>
                    {language === 'english'
                      ? `Correct: Option (${['A', 'B', 'C', 'D'][currentQ.correct]}) ${currentQ.options_en[currentQ.correct] || currentQ.options_hi[currentQ.correct]}`
                      : `सही उत्तर: विकल्प (${['A', 'B', 'C', 'D'][currentQ.correct]}) ${currentQ.options_hi[currentQ.correct]}`}
                  </span>
                </div>
                {(language === 'bilingual' || language === 'hindi') && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px] sm:text-xs">{currentQ.exp_hi}</p>
                )}
                {(language === 'bilingual' || language === 'english') && (
                  <p className={`text-gray-500 dark:text-gray-400 italic text-[11px] sm:text-xs ${language === 'bilingual' ? 'pt-1 border-t border-amber-200/50 dark:border-amber-900/50' : ''}`}>
                    {currentQ.exp_en}
                  </p>
                )}
              </div>
            )}

            {/* Next / Previous / Submit Navigation - Compact on Mobile */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3 sm:pt-4">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {language === 'english' ? 'Previous' : 'पिछला (Prev)'}
                </span>
                <span className="sm:hidden">
                  {language === 'english' ? 'Prev' : 'पिछला'}
                </span>
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {language === 'english' ? 'Submit' : 'सबमिट करें'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs text-xs transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">
                    {language === 'english' ? 'Next' : 'अगला (Next)'}
                  </span>
                  <span className="sm:hidden">
                    {language === 'english' ? 'Next' : 'अगला'}
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>

          </div>

          {/* Question Palette Grid - Compact on Mobile */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[11px] sm:text-xs">
                {language === 'english' ? 'Question Palette' : 'प्रश्न पैलेट'}
              </h4>
              <span className="text-[11px] text-gray-400">
                {selectedAnswers ? Object.keys(selectedAnswers).length : 0}/{questions.length} {language === 'english' ? 'answered' : 'उत्तर दिए'}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
              {questions.map((_, idx) => {
                const isAns = selectedAnswers[idx] !== undefined;
                const isRev = markedForReview[idx];
                const isCurrent = idx === currentIdx;

                let btnClass = "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300";
                if (isCurrent) {
                  btnClass = "ring-2 ring-amber-500 font-bold bg-amber-50 text-amber-700";
                }
                if (isAns) {
                  btnClass += " bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold";
                }
                if (isRev) {
                  btnClass += " ring-2 ring-purple-500 text-purple-700";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-8 sm:h-9 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
