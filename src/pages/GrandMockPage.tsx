import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import allQuestions from '../data/questions/all_questions.json';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { Question } from '../types';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ArrowLeft, Clock, Award, CheckCircle2, ChevronLeft, ChevronRight, Eye, Bookmark, BookmarkCheck, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

export const GrandMockPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, category, isBookmarked, toggleBookmark } = useQuizStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(150 * 60); // 150 minutes (2h 30m)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'bookmarked'>('all');

  // Select 150 questions: 100 from Part 1 (Units 1-6) and 50 from Part 2 (Units 7-10)
  const examQuestions: Question[] = useMemo(() => {
    const part1 = (allQuestions as Question[]).filter(q => q.unitNum <= 6);
    const part2 = (allQuestions as Question[]).filter(q => q.unitNum >= 7);

    // Deterministic selection to ensure consistent questions per candidate
    // Sample 100 questions from part 1 (which has 295 total)
    const selectedPart1: Question[] = [];
    const step1 = part1.length / 100;
    for (let i = 0; i < 100; i++) {
      selectedPart1.push(part1[Math.floor(i * step1)]);
    }

    // Sample 50 questions from part 2 (which has 150 total)
    const selectedPart2: Question[] = [];
    const step2 = part2.length / 50;
    for (let i = 0; i < 50; i++) {
      selectedPart2.push(part2[Math.floor(i * step2)]);
    }

    return [...selectedPart1, ...selectedPart2];
  }, []);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSubmitted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const currentQ = examQuestions[currentIdx];
  const userSelected = selectedAnswers[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: optIdx });
  };

  const handleToggleReview = () => {
    setMarkedForReview({ ...markedForReview, [currentIdx]: !markedForReview[currentIdx] });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setMarkedForReview({});
    setIsSubmitted(false);
    setCurrentIdx(0);
    setTimeLeft(150 * 60);
  };

  // Score statistics
  let part1Score = 0;
  let part2Score = 0;
  let totalScore = 0;

  examQuestions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correct) {
      totalScore++;
      if (idx < 100) part1Score++;
      else part2Score++;
    }
  });

  const percentage = (totalScore / 150) * 100;
  const currentCutoff = CATEGORY_CUTOFFS[category];
  const isQualified = percentage >= currentCutoff.minPercent;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-slate-800 pb-2.5 sm:pb-3">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">
            {language === 'english' ? 'Back to Syllabus' : 'मुख्य पृष्ठ (Back)'}
          </span>
          <span className="sm:hidden">
            {language === 'english' ? 'Back' : 'मुख्य'}
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher size="sm" />
          {!isSubmitted && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-mono font-bold text-xs sm:text-sm bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Banner - Compact on mobile */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="bg-white/20 px-2 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">
            {language === 'english' ? 'Bihar SLET 2026 Full Mock Exam' : 'बिहार SLET 2026 संपूर्ण मॉक परीक्षा'}
          </span>
          <h1 className="text-lg sm:text-2xl font-extrabold mt-1 leading-snug">
            {language === 'english' ? 'Grand Mock Test (150 MCQs)' : 'ग्रैंड मॉक टेस्ट (150 प्रश्न)'}
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            <span className="hidden sm:inline">
              {language === 'english'
                ? 'Part-1: 100 Questions (Library Science) + Part-2: 50 Questions (General Studies & Reasoning) • Duration: 150 Mins'
                : 'भाग-1: 100 प्रश्न (पुस्तकालय विज्ञान) + भाग-2: 50 प्रश्न (सामान्य ज्ञान एवं तार्किक क्षमता) • समय: 150 मिनट'}
            </span>
            <span className="sm:hidden">
              {language === 'english'
                ? '150 Questions • 150 Mins (100 Part-1 + 50 Part-2)'
                : '150 प्रश्न • 150 मिनट (भाग-1: 100 + भाग-2: 50)'}
            </span>
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <p className="text-[11px] sm:text-xs text-amber-200">
            {language === 'english' ? 'Cutoff Benchmark:' : 'उत्तीर्णांक मानक:'}
          </p>
          <p className="text-xs sm:text-sm font-bold bg-white/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg mt-0.5 border border-white/20 inline-block">
            {language === 'english' ? currentCutoff.label_en : currentCutoff.label_hi}: {currentCutoff.minPercent}% ({currentCutoff.minMarks} {language === 'english' ? 'Marks' : 'अंक'})
          </p>
        </div>
      </div>

      {/* Scorecard Display if submitted */}
      {isSubmitted ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              isQualified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <Award className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {isQualified
                ? (language === 'english' ? 'Congratulations! You have Qualified Bihar SLET 2026! 🎉' : 'बधाई! आपने बिहार SLET 2026 अर्हता प्राप्त कर ली है! 🎉')
                : (language === 'english' ? 'Keep Practicing! More preparation needed 📚' : 'अभ्यास जारी रखें! और मेहनत की आवश्यकता है 📚')}
            </h2>

            <div className="flex justify-center items-baseline gap-2">
              <span className="text-5xl font-black text-amber-600 dark:text-amber-400">{totalScore}</span>
              <span className="text-gray-400 text-2xl font-bold">/ 150</span>
              <span className="text-base font-semibold text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
            </div>

            {/* Detailed Subject-wise Marks Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2 text-left">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900">
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                  {language === 'english' ? 'Part-1: Library Science (100 Marks)' : 'भाग-1: पुस्तकालय विज्ञान (100 अंक)'}
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">{part1Score} / 100</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'english' ? 'Accuracy:' : 'सटीकता:'} {((part1Score / 100) * 100).toFixed(1)}%
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-900">
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                  {language === 'english' ? 'Part-2: GK & Reasoning (50 Marks)' : 'भाग-2: सामान्य ज्ञान व रीजनिंग (50 अंक)'}
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200 mt-1">{part2Score} / 50</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'english' ? 'Accuracy:' : 'सटीकता:'} {((part2Score / 50) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Official BSEB Qualification Verdict */}
            <div className={`p-4 rounded-xl max-w-xl mx-auto text-sm font-medium ${
              isQualified
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300'
            }`}>
              <p>
                <strong>{language === 'english' ? currentCutoff.label_en : currentCutoff.label_hi}</strong>
                {language === 'english'
                  ? ` Required Qualifying Marks: `
                  : ` के अनुसार आवश्यक न्यूनतम उत्तीर्णांक: `}
                <strong>{currentCutoff.minPercent}% ({currentCutoff.minMarks} {language === 'english' ? 'Marks' : 'अंक'})</strong>
              </p>
              <p className="font-bold text-base mt-1.5">
                {isQualified
                  ? (language === 'english'
                      ? `✅ Result: QUALIFIED — ${(totalScore - currentCutoff.minMarks).toFixed(1)} marks above cutoff!`
                      : `✅ परिणाम: सफल / उत्तीर्ण (QUALIFIED) — ${(totalScore - currentCutoff.minMarks).toFixed(1)} अंक अधिक!`)
                  : (language === 'english'
                      ? `⚠️ Result: NOT QUALIFIED — ${(currentCutoff.minMarks - totalScore).toFixed(1)} marks below cutoff.`
                      : `⚠️ परिणाम: असफल (NOT QUALIFIED) — कटऑफ से ${(currentCutoff.minMarks - totalScore).toFixed(1)} अंक कम।`)}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <button
                onClick={handleRetake}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs"
              >
                <RotateCcw className="w-4 h-4" /> {language === 'english' ? 'Retake Grand Mock Test' : 'पुनः ग्रैंड टेस्ट दें'}
              </button>
              <button
                onClick={() => setReviewFilter(reviewFilter === 'wrong' ? 'all' : 'wrong')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold rounded-xl text-xs"
              >
                {reviewFilter === 'wrong'
                  ? (language === 'english' ? 'View All 150 Questions' : 'सभी 150 प्रश्न देखें')
                  : (language === 'english' ? `View Only Incorrect Answers (${150 - totalScore})` : `केवल गलत उत्तर देखें (${150 - totalScore})`)}
              </button>
            </div>
          </div>

          {/* Solutions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'english' ? 'Question-wise Solutions & Analysis (150 Questions)' : 'प्रश्नवार उत्तर विश्लेषण (150 प्रश्न)'}
            </h3>
            
            {examQuestions.map((q, idx) => {
              const sel = selectedAnswers[idx];
              const isCorrect = sel === q.correct;
              const isWrong = sel !== undefined && !isCorrect;

              if (reviewFilter === 'wrong' && !isWrong) return null;

              return (
                <div
                  key={q.globalId}
                  className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-3 shadow-xs ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/60'
                      : isWrong
                      ? 'border-red-200 dark:border-red-900/60'
                      : 'border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                        {language === 'english'
                          ? `Question ${idx + 1} (${idx < 100 ? 'Part-1 LIS' : 'Part-2 GK'})`
                          : `प्रश्न ${idx + 1} (${idx < 100 ? 'भाग-1 LIS' : 'भाग-2 GK'})`}
                      </span>
                      <span className="text-gray-500">{language === 'english' ? q.unitTitle_en : q.unitTitle_hi}</span>
                    </div>
                    <button
                      onClick={() => toggleBookmark(q.globalId)}
                      className="text-gray-400 hover:text-amber-500"
                    >
                      {isBookmarked(q.globalId) ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
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

                  {/* Options List */}
                  <div className="space-y-1.5 pt-1">
                    {q.options_hi.map((optHi, optIdx) => {
                      const optEn = q.options_en[optIdx] || optHi;
                      const isOptionCorrect = optIdx === q.correct;
                      const isOptionSelected = optIdx === sel;

                      let optClass = "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 text-gray-700 dark:text-gray-300";
                      if (isOptionCorrect) {
                        optClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold";
                      } else if (isOptionSelected && !isOptionCorrect) {
                        optClass = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200";
                      }

                      return (
                        <div key={optIdx} className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${optClass}`}>
                          <span className="font-mono font-bold shrink-0">{['(A)', '(B)', '(C)', '(D)'][optIdx]}</span>
                          <div className="space-y-0.5">
                            {(language === 'bilingual' || language === 'hindi') && <div>{optHi}</div>}
                            {(language === 'bilingual' || language === 'english') && (
                              <div className="text-[11px] opacity-80">{optEn}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/50 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <p className="font-bold text-amber-800 dark:text-amber-300">
                      {language === 'english' ? 'Explanation:' : 'विश्लेषण (Explanation):'}
                    </p>
                    {(language === 'bilingual' || language === 'hindi') && (
                      <p className="leading-relaxed">{q.exp_hi}</p>
                    )}
                    {(language === 'bilingual' || language === 'english') && (
                      <p className={`italic text-gray-600 dark:text-gray-400 ${language === 'bilingual' ? 'pt-1 border-t border-amber-200/50 dark:border-amber-900/50' : ''}`}>
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
        /* Question Solver */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5 sm:pb-3 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs">
                  {language === 'english' ? `Q ${currentIdx + 1} / 150` : `प्रश्न ${currentIdx + 1} / 150`}
                </span>
                <span className="text-gray-500 font-medium hidden sm:inline text-xs">
                  {currentIdx < 100
                    ? (language === 'english' ? 'Part-1: Library Science' : 'भाग-1: पुस्तकालय विज्ञान')
                    : (language === 'english' ? 'Part-2: General Knowledge & Reasoning' : 'भाग-2: सामान्य ज्ञान व रीजनिंग')}
                </span>
              </div>

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
                  {isBookmarked(currentQ.globalId) ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Question Text in Solver */}
            <div className="space-y-1.5 sm:space-y-2">
              {(language === 'bilingual' || language === 'hindi') && (
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                  {currentQ.q_hi}
                </h3>
              )}
              {(language === 'bilingual' || language === 'english') && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed">
                  {currentQ.q_en}
                </p>
              )}
            </div>

            {/* Options in Solver - Min 44px tap targets */}
            <div className="space-y-2.5 sm:space-y-3">
              {currentQ.options_hi.map((optHi, optIdx) => {
                const optEn = currentQ.options_en[optIdx] || optHi;
                const isSelected = userSelected === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-3 sm:p-4 min-h-[44px] rounded-xl border transition-all flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500'
                        : 'border-gray-200 dark:border-slate-800 hover:border-amber-300 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <span className="font-mono font-bold text-xs sm:text-sm shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mt-0.5">
                      {['A', 'B', 'C', 'D'][optIdx]}
                    </span>
                    <div className="space-y-0.5">
                      {(language === 'bilingual' || language === 'hindi') && (
                        <div className="text-xs sm:text-sm font-semibold leading-snug">{optHi}</div>
                      )}
                      {(language === 'bilingual' || language === 'english') && (
                        <div className="text-[11px] opacity-75 leading-snug">{optEn}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons - Compact on Mobile */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3 sm:pt-4">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{language === 'english' ? 'Previous' : 'पिछला'}</span>
                <span className="sm:hidden">{language === 'english' ? 'Prev' : 'पिछला'}</span>
              </button>

              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {language === 'english' ? 'Submit Test (150 Questions)' : 'टेस्ट सबमिट करें (150 प्रश्न)'}
                </span>
                <span className="sm:hidden">
                  {language === 'english' ? 'Submit' : 'सबमिट करें'}
                </span>
              </button>

              <button
                disabled={currentIdx === examQuestions.length - 1}
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs text-xs disabled:opacity-30 cursor-pointer"
              >
                <span className="hidden sm:inline">{language === 'english' ? 'Next' : 'अगला'}</span>
                <span className="sm:hidden">{language === 'english' ? 'Next' : 'अगला'}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>

          {/* Palette - Responsive grid */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[11px] sm:text-xs">
                {language === 'english' ? '150 Question Palette' : '150 प्रश्न पैलेट'}
              </h4>
              <span className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {Object.keys(selectedAnswers).length} / 150 {language === 'english' ? 'solved' : 'हल किए गए'}
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5 max-h-56 overflow-y-auto p-1">
              {examQuestions.map((_, idx) => {
                const isAns = selectedAnswers[idx] !== undefined;
                const isRev = markedForReview[idx];
                const isCurrent = idx === currentIdx;

                let btnClass = "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300";
                if (isCurrent) btnClass = "ring-2 ring-amber-500 font-bold bg-amber-100 text-amber-800";
                if (isAns) btnClass += " bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold";
                if (isRev) btnClass += " ring-2 ring-purple-500 text-purple-700";

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-7 sm:h-7 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${btnClass}`}
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
