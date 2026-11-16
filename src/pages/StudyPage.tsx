import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import manifest from '../data/manifest.json';
import { useQuizStore } from '../store/useQuizStore';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ArrowLeft, HelpCircle, BookOpen, Share2, Printer } from 'lucide-react';
import { UnitMeta } from '../types';

// Eagerly import all markdown notes as raw text via Vite
const rawNotes = import.meta.glob('../data/notes/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const StudyPage: React.FC = () => {
  const { subUnitNum } = useParams<{ subUnitNum: string }>();
  const navigate = useNavigate();
  const { language } = useQuizStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [subUnitNum]);

  // Find metadata
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

  // Lookup note content
  const noteKey = `../data/notes/${subUnitNum}.md`;
  const noteContent = rawNotes[noteKey] || '';

  if (!currentSubUnit) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">उप-इकाई नहीं मिली</h2>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg">
          <ArrowLeft className="w-4 h-4" /> मुख्य पृष्ठ पर लौटें
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'english' ? 'All Units (Back to Syllabus)' : 'सभी इकाइयां (Back to Syllabus)'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'english' ? 'Print' : 'प्रिंट (Print)'}</span>
          </button>

          <Link
            to={`/quiz/${subUnitNum}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {language === 'english'
                ? `Take Test (${currentSubUnit.questionsCount} MCQs)`
                : `इस यूनिट का टेस्ट दें (${currentSubUnit.questionsCount} MCQs)`}
            </span>
          </Link>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-slate-800/80 dark:to-slate-900 border border-amber-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md">
            {language === 'english'
              ? `Unit ${currentUnit?.num} • Sub-Unit ${currentSubUnit.subUnitNum}`
              : `इकाई ${currentUnit?.num} • उप-इकाई ${currentSubUnit.subUnitNum}`}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'english' ? currentUnit?.title_en : currentUnit?.title_hi}
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          {language === 'english' ? currentSubUnit.title_en : currentSubUnit.title_hi}
        </h1>
        {language === 'bilingual' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
            {currentSubUnit.title_en}
          </p>
        )}
        {language === 'english' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {currentSubUnit.title_hi}
          </p>
        )}
      </div>

      {/* Study Note Body */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs">
        {noteContent ? (
          <MarkdownRenderer content={noteContent} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            {language === 'english' ? 'Unable to load study notes.' : 'नोट्स लोड करने में असमर्थ।'}
          </div>
        )}
      </div>

      {/* Bottom CTA Card */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white text-center space-y-3 shadow-lg">
        <h3 className="text-lg font-bold">
          {language === 'english'
            ? 'Finished studying? Test your knowledge now!'
            : 'अध्ययन पूरा किया? अब अपनी तैयारी की जांच करें!'}
        </h3>
        <p className="text-amber-100 text-xs sm:text-sm max-w-lg mx-auto">
          {language === 'english'
            ? `Attempt all ${currentSubUnit.questionsCount} authentic bilingual MCQs in practice or exam mode.`
            : `इस उप-इकाई से संबंधित ${currentSubUnit.questionsCount} प्रामाणिक द्विभाषी प्रश्नों का अभ्यास या परीक्षा मोड में टेस्ट दें।`}
        </p>
        <Link
          to={`/quiz/${subUnitNum}`}
          className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-amber-50 font-bold px-6 py-2.5 rounded-xl shadow-md transition-transform hover:scale-105 text-sm"
        >
          <HelpCircle className="w-4 h-4" />
          <span>
            {language === 'english'
              ? `Start Test (${currentSubUnit.questionsCount} MCQs)`
              : `टेस्ट प्रारंभ करें (${currentSubUnit.questionsCount} MCQs)`}
          </span>
        </Link>
      </div>

    </div>
  );
};
