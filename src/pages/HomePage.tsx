import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import manifest from '../data/manifest.json';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { UnitMeta } from '../types';
import { BookOpen, HelpCircle, CheckCircle2, Award, Clock, ArrowRight, ShieldCheck, Flame, BookmarkCheck, BarChart3 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { quizHistory, category, bookmarks, language } = useQuizStore();
  const [filterPart, setFilterPart] = useState<'all' | 1 | 2>('all');

  const currentCutoff = CATEGORY_CUTOFFS[category];
  const units = manifest as UnitMeta[];

  // Calculate overall stats
  const totalSubunits = units.reduce((acc, u) => acc + u.subUnits.length, 0);
  const attemptedSubunits = Object.keys(quizHistory).length;
  
  let totalScore = 0;
  let totalPossible = 0;
  Object.values(quizHistory).forEach(rec => {
    totalScore += rec.score;
    totalPossible += rec.total;
  });

  const overallPercent = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
  const isQualified = overallPercent >= currentCutoff.minPercent;

  const filteredUnits = units.filter(u => {
    if (filterPart === 'all') return true;
    return u.part === filterPart;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Flame className="w-3.5 h-3.5 text-yellow-300" />
            <span>
              {language === 'english'
                ? 'Bihar State School Librarian Eligibility Test 2026 (Bihar SLET)'
                : 'बिहार राज्य विद्यालय पुस्तकालयाध्यक्ष पात्रता परीक्षा 2026 (Bihar SLET)'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {language === 'english'
              ? 'Complete 150-Mark Syllabus Study Material & Bilingual Test Portal'
              : 'संपूर्ण 150 अंक पाठ्यक्रम अध्ययन सामग्री एवं द्विभाषी टेस्ट पोर्टल'}
          </h1>

          <p className="text-amber-100 text-sm sm:text-base leading-relaxed max-w-3xl">
            {language === 'english' ? (
              <>
                Based on the latest syllabus of Bihar School Examination Board (BSEB) & Education Dept —{' '}
                <strong>10 Comprehensive Units, 30 Sub-units, and 445 Authentic Exam-level MCQs</strong> with detailed bilingual explanations.
              </>
            ) : (
              <>
                बिहार विद्यालय परीक्षा समिति (BSEB) एवं शिक्षा विभाग के नवीनतम पाठ्यक्रम पर आधारित —{' '}
                <strong>10 विस्तृत इकाइयां, 30 उप-इकाइयां, एवं 445 प्रामाणिक परीक्षा-स्तरीय बहुविकल्पीय प्रश्न</strong> विस्तृत व्याख्या सहित।
              </>
            )}
          </p>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/grand-mock"
              className="inline-flex items-center gap-2 bg-white text-orange-700 hover:bg-amber-50 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-102 text-sm"
            >
              <Award className="w-4 h-4 text-orange-600" />
              <span>{language === 'english' ? 'Grand Mock Test (150 Qs)' : 'ग्रैंड मॉक टेस्ट (150 प्रश्न)'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/bookmarks"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5 rounded-xl backdrop-blur-md transition-all text-sm border border-white/20"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{language === 'english' ? `Saved Questions (${bookmarks.length})` : `सहेजे गए प्रश्न (${bookmarks.length})`}</span>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-16 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </section>

      {/* Overview Analytics Card */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Questions Badge */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {language === 'english' ? 'Total Study Material' : 'कुल अध्ययन सामग्री'}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'english' ? '10 Units (30 Notes)' : '10 इकाइयां (30 नोट्स)'}
            </p>
            <p className="text-[11px] text-gray-400">100% {language === 'english' ? 'Bilingual (HI & EN)' : 'द्विभाषी (HI & EN)'}</p>
          </div>
        </div>

        {/* MCQs Bank */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {language === 'english' ? 'Question Bank' : 'कुल प्रश्न बैंक'}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'english' ? '445 Practice MCQs' : '445 अभ्यास प्रश्न'}
            </p>
            <p className="text-[11px] text-gray-400">
              {language === 'english' ? 'Detailed Explanations' : 'विस्तृत व्याख्या सहित'}
            </p>
          </div>
        </div>

        {/* Attempted Status */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {language === 'english' ? 'Completed Tests' : 'हल किए गए टेस्ट'}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {attemptedSubunits} / {totalSubunits} {language === 'english' ? 'Sub-units' : 'सब-यूनिट'}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {totalPossible > 0
                ? `${totalScore}/${totalPossible} ${language === 'english' ? 'Marks' : 'अंक'} (${overallPercent.toFixed(1)}%)`
                : (language === 'english' ? 'Not Started' : 'प्रारंभ नहीं हुआ')}
            </p>
          </div>
        </div>

        {/* Category Target */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {language === 'english' ? currentCutoff.label_en : currentCutoff.label_hi}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'english' ? 'Target:' : 'लक्ष्य:'} {currentCutoff.minPercent}%
            </p>
            <p className={`text-[11px] font-bold ${isQualified ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalPossible > 0
                ? (isQualified
                    ? (language === 'english' ? '✅ Cutoff Passed' : '✅ कटऑफ उत्तीर्ण')
                    : (language === 'english' ? '⚠️ More Practice Needed' : '⚠️ और अभ्यास आवश्यक'))
                : (language === 'english' ? `Pass Mark: ${currentCutoff.minMarks}/150` : `उत्तीर्णांक: ${currentCutoff.minMarks}/150`)}
            </p>
          </div>
        </div>

      </section>

      {/* Syllabus Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'english' ? 'Subject-wise Study & Test Modules' : 'विषयवार अध्ययन एवं टेस्ट मॉड्यूल'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'english'
              ? 'Read study notes for each sub-unit and attempt practice or exam mode tests.'
              : 'प्रत्येक सब-यूनिट के अध्ययन नोट्स पढ़ें एवं संबंधित अभ्यास/परीक्षा मोड टेस्ट दें।'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setFilterPart('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterPart === 'all'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {language === 'english' ? 'All (150 Marks)' : 'संपूर्ण (150 अंक)'}
          </button>
          <button
            onClick={() => setFilterPart(1)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterPart === 1
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {language === 'english' ? 'Part-1: Library Science (100 Marks)' : 'भाग-1: पुस्तकालय विज्ञान (100 अंक)'}
          </button>
          <button
            onClick={() => setFilterPart(2)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterPart === 2
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {language === 'english' ? 'Part-2: General Studies (50 Marks)' : 'भाग-2: सामान्य ज्ञान (50 अंक)'}
          </button>
        </div>
      </div>

      {/* Units Grid */}
      <div className="space-y-6">
        {filteredUnits.map((unit) => {
          const unitQuestionsTotal = unit.subUnits.reduce((acc, sub) => acc + sub.questionsCount, 0);

          return (
            <div
              key={unit.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-amber-300 dark:hover:border-amber-800/60"
            >
              {/* Unit Header */}
              <div className="bg-gradient-to-r from-gray-50 to-amber-50/40 dark:from-slate-800/60 dark:to-slate-800/30 p-5 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                      {language === 'english' ? `Unit ${unit.num}` : `इकाई ${unit.num}`}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {unit.part === 1
                        ? (language === 'english' ? 'Part-1 (Library Science)' : 'भाग-1 (पुस्तकालय विज्ञान)')
                        : (language === 'english' ? 'Part-2 (General Studies & Reasoning)' : 'भाग-2 (सामान्य ज्ञान व अभियोग्यता)')}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {language === 'english' ? unit.title_en : unit.title_hi}
                  </h3>
                  {language === 'bilingual' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unit.title_en}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <span className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                    {unit.subUnits.length} {language === 'english' ? 'Sub-units' : 'उप-इकाइयां'}
                  </span>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 px-2.5 py-1 rounded-lg">
                    {unitQuestionsTotal} MCQs
                  </span>
                </div>
              </div>

              {/* SubUnits List */}
              <div className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {unit.subUnits.map((sub) => {
                  const history = quizHistory[sub.subUnitNum];
                  const hasAttempted = Boolean(history);

                  return (
                    <div
                      key={sub.subUnitNum}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                            {sub.subUnitNum}
                          </span>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            {language === 'english' ? sub.title_en : sub.title_hi}
                          </h4>
                        </div>
                        {language === 'bilingual' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                            {sub.title_en}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 ml-8 pt-1">
                          <span>{sub.questionsCount} {language === 'english' ? 'MCQs' : 'बहुविकल्पीय प्रश्न'}</span>
                          {hasAttempted && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              {language === 'english' ? 'Score: ' : 'स्कोर: '}{history.score}/{history.total} ({history.percentage.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 sm:self-center shrink-0">
                        <Link
                          to={`/study/${sub.subUnitNum}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>{language === 'english' ? 'Notes' : 'नोट्स (Notes)'}</span>
                        </Link>

                        <Link
                          to={`/quiz/${sub.subUnitNum}`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>
                            {hasAttempted
                              ? (language === 'english' ? 'Retake Test' : 'पुनः टेस्ट दें')
                              : (language === 'english' ? 'Start Test' : 'टेस्ट शुरू करें')}
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
