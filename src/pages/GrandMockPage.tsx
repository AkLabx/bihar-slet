import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import allQuestions from '../data/questions/all_questions.json';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { Question, QuizMode } from '../types';
import { TestConsole } from '../components/TestConsole';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  ArrowLeft,
  Award,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Zap,
  FileCheck,
} from 'lucide-react';

export const GrandMockPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, category, isBookmarked, toggleBookmark } = useQuizStore();

  const [mode, setMode] = useState<QuizMode>('exam');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'bookmarked'>('all');

  // Select 150 questions: 100 from Part 1 (Units 1-6) and 50 from Part 2 (Units 7-10)
  const examQuestions: Question[] = useMemo(() => {
    const part1 = (allQuestions as Question[]).filter((q) => q.unitNum <= 6);
    const part2 = (allQuestions as Question[]).filter((q) => q.unitNum >= 7);

    // Deterministic selection to ensure consistent questions per candidate
    const selectedPart1: Question[] = [];
    const step1 = part1.length / 100;
    for (let i = 0; i < 100; i++) {
      selectedPart1.push(part1[Math.floor(i * step1)]);
    }

    const selectedPart2: Question[] = [];
    const step2 = part2.length / 50;
    for (let i = 0; i < 50; i++) {
      selectedPart2.push(part2[Math.floor(i * step2)]);
    }

    return [...selectedPart1, ...selectedPart2];
  }, []);

  // Active Test Mode -> Render Dedicated Fullscreen CBT Interface
  if (!isSubmitted) {
    return (
      <TestConsole
        sessionId="grand_mock"
        title={language === 'english' ? 'Bihar SLET 2026 Grand Mock Exam' : 'बिहार SLET 2026 संपूर्ण ग्रैंड मॉक परीक्षा'}
        subtitle={
          language === 'english'
            ? '150 Questions • 150 Minutes • Official CBT Pattern'
            : '150 प्रश्न • 150 मिनट • आधिकारिक परीक्षा पैटर्न'
        }
        questions={examQuestions}
        mode={mode}
        totalDurationSeconds={150 * 60}
        sections={[
          {
            id: 'part1',
            name: language === 'english' ? 'Part-1: LIS (100 Qs)' : 'भाग-1: पुस्तकालय विज्ञान (100 प्रश्न)',
            startIdx: 0,
            endIdx: 99,
          },
          {
            id: 'part2',
            name: language === 'english' ? 'Part-2: GK & Reasoning (50 Qs)' : 'भाग-2: सामान्य ज्ञान व रीजनिंग (50 प्रश्न)',
            startIdx: 100,
            endIdx: 149,
          },
        ]}
        onComplete={(result) => {
          setSelectedAnswers(result.selectedAnswers);
          setMode(result.mode);
          setIsSubmitted(true);
          window.scrollTo(0, 0);
        }}
        onExit={() => navigate('/')}
      />
    );
  }

  // Submitted Score Statistics
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-2">
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
          <span className="sm:hidden">{language === 'english' ? 'Back' : 'मुख्य'}</span>
        </button>

        <LanguageSwitcher size="sm" />
      </div>

      {/* Scorecard Display if submitted */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-sm">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              isQualified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <Award className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
            {mode === 'practice' ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{language === 'english' ? 'Instant Answers Mode' : 'तुरंत उत्तर मोड (Instant)'}</span>
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>{language === 'english' ? 'Answer on Submission Mode' : 'अंतिम जमा पर उत्तर मोड (Exam)'}</span>
              </>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            {isQualified
              ? (language === 'english' ? 'Congratulations! You Qualified Bihar SLET 2026! 🎉' : 'बधाई! आपने बिहार SLET 2026 अर्हता प्राप्त कर ली है! 🎉')
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
          <div
            className={`p-4 rounded-xl max-w-xl mx-auto text-sm font-medium ${
              isQualified
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300'
            }`}
          >
            <p>
              <strong>{language === 'english' ? currentCutoff.label_en : currentCutoff.label_hi}</strong>
              {language === 'english' ? ' Required Qualifying Marks: ' : ' के अनुसार आवश्यक न्यूनतम उत्तीर्णांक: '}
              <strong>
                {currentCutoff.minPercent}% ({currentCutoff.minMarks} {language === 'english' ? 'Marks' : 'अंक'})
              </strong>
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
              onClick={() => {
                setSelectedAnswers({});
                setIsSubmitted(false);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> {language === 'english' ? 'Retake Grand Mock Test' : 'पुनः ग्रैंड टेस्ट दें'}
            </button>
            <button
              onClick={() => setReviewFilter(reviewFilter === 'wrong' ? 'all' : 'wrong')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold rounded-xl text-xs cursor-pointer"
            >
              {reviewFilter === 'wrong'
                ? (language === 'english' ? 'View All 150 Questions' : 'सभी 150 प्रश्न देखें')
                : (language === 'english'
                    ? `View Only Incorrect Answers (${150 - totalScore})`
                    : `केवल गलत उत्तर देखें (${150 - totalScore})`)}
            </button>
          </div>
        </div>

        {/* Solutions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {language === 'english'
              ? 'Question-wise Solutions & Analysis (150 Questions)'
              : 'प्रश्नवार उत्तर विश्लेषण (150 प्रश्न)'}
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

                {/* Options List */}
                <div className="space-y-1.5 pt-1">
                  {q.options_hi.map((optHi, optIdx) => {
                    const optEn = q.options_en[optIdx] || optHi;
                    const isOptionCorrect = optIdx === q.correct;
                    const isOptionSelected = optIdx === sel;

                    let optClass =
                      'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 text-gray-700 dark:text-gray-300';
                    if (isOptionCorrect) {
                      optClass =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isOptionSelected && !isOptionCorrect) {
                      optClass = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
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
                  {(language === 'bilingual' || language === 'hindi') && <p className="leading-relaxed">{q.exp_hi}</p>}
                  {(language === 'bilingual' || language === 'english') && (
                    <p
                      className={`italic text-gray-600 dark:text-gray-400 ${
                        language === 'bilingual' ? 'pt-1 border-t border-amber-200/50 dark:border-amber-900/50' : ''
                      }`}
                    >
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
