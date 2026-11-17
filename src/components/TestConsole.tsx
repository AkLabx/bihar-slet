import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Question, QuizMode } from '../types';
import { useQuizStore, CATEGORY_CUTOFFS } from '../store/useQuizStore';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  saveActiveSession,
  getActiveSession,
  clearActiveSession,
  ActiveTestSession,
} from '../services/db';
import {
  playOptionClickSound,
  playNavSound,
  playSuccessChime,
  playIncorrectChime,
  playTimerWarning,
  isSoundMuted,
  setSoundMuted,
} from '../services/sound';
import { triggerHaptic } from '../services/haptics';
import {
  Clock,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  X,
  LogOut,
  AlertTriangle,
  Zap,
  FileCheck,
} from 'lucide-react';

export interface TestConsoleProps {
  title: string;
  subtitle?: string;
  sessionId: string; // e.g. 'subunit_1.1' or 'grand_mock'
  questions: Question[];
  mode?: QuizMode;
  totalDurationSeconds?: number;
  sections?: { id: string; name: string; startIdx: number; endIdx: number }[];
  onComplete: (result: {
    score: number;
    total: number;
    percentage: number;
    selectedAnswers: Record<number, number>;
    mode: QuizMode;
  }) => void;
  onExit: () => void;
}

export const TestConsole: React.FC<TestConsoleProps> = ({
  title,
  subtitle,
  sessionId,
  questions,
  mode: initialMode = 'exam',
  totalDurationSeconds = 20 * 60,
  sections,
  onComplete,
  onExit,
}) => {
  const { language, isBookmarked, toggleBookmark } = useQuizStore();

  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<number, boolean>>({ 0: true });
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(isSoundMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false); // Mobile drawer

  // Dialogs
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [modeSwitchCandidate, setModeSwitchCandidate] = useState<QuizMode | null>(null);
  const [resumePromptSession, setResumePromptSession] = useState<ActiveTestSession | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const questionScrollRef = useRef<HTMLDivElement>(null);
  const warned5MinRef = useRef(false);
  const warned1MinRef = useRef(false);

  // Isolate active sessions by mode to ensure 100% context separation
  const activeSessionKey = `${sessionId}_${mode}`;

  // Check for existing unfinished session in IndexedDB on mount or mode change
  useEffect(() => {
    let isMounted = true;
    getActiveSession(activeSessionKey).then((saved) => {
      if (!isMounted || !saved) return;
      const hasAnswers = Object.keys(saved.selectedAnswers || {}).length > 0;
      const hasTime = saved.timeLeft > 0 && saved.timeLeft < totalDurationSeconds;
      if (hasAnswers || hasTime) {
        setResumePromptSession(saved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeSessionKey, totalDurationSeconds]);

  // Handle restoring saved session
  const handleResumeSession = (saved: ActiveTestSession) => {
    setSelectedAnswers(saved.selectedAnswers || {});
    setMarkedForReview(saved.markedForReview || {});
    setVisitedQuestions(saved.visitedQuestions || { 0: true });
    setCurrentIdx(Math.min(saved.currentIdx || 0, questions.length - 1));
    setTimeLeft(saved.timeLeft || totalDurationSeconds);
    setResumePromptSession(null);
  };

  const handleDiscardSavedSession = () => {
    clearActiveSession(activeSessionKey);
    setResumePromptSession(null);
  };

  // Fullscreen sync
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Sound mute toggle
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
  };

  // Timer countdown (only runs when in 'exam' mode)
  useEffect(() => {
    if (mode !== 'exam' || isPaused || timeLeft <= 0 || Boolean(resumePromptSession)) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }

        // Sound alert warnings at 5 mins and 1 min
        if (prev === 300 && !warned5MinRef.current) {
          warned5MinRef.current = true;
          playTimerWarning();
          triggerHaptic('warning');
        } else if (prev === 60 && !warned1MinRef.current) {
          warned1MinRef.current = true;
          playTimerWarning();
          triggerHaptic('warning');
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isPaused, timeLeft, resumePromptSession]);

  // Sync state to IndexedDB under the isolated mode session key
  useEffect(() => {
    if (resumePromptSession) return;
    const sessionData: ActiveTestSession = {
      sessionId: activeSessionKey,
      type: sessionId.startsWith('subunit') ? 'subunit' : 'grand-mock',
      mode,
      currentIdx,
      selectedAnswers,
      markedForReview,
      visitedQuestions,
      timeLeft,
      isPaused,
      totalQuestions: questions.length,
      updatedAt: Date.now(),
    };
    saveActiveSession(sessionData);
  }, [activeSessionKey, sessionId, mode, currentIdx, selectedAnswers, markedForReview, visitedQuestions, timeLeft, isPaused, questions.length, resumePromptSession]);

  // Mark question visited whenever currentIdx changes
  useEffect(() => {
    setVisitedQuestions((prev) => (prev[currentIdx] ? prev : { ...prev, [currentIdx]: true }));
    questionScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIdx]);

  // Current Question
  const currentQ = questions[currentIdx] || questions[0];
  const userSelected = selectedAnswers[currentIdx];
  const isAnswered = userSelected !== undefined;
  const isMarked = Boolean(markedForReview[currentIdx]);

  // Robust Mode Switcher with zero context mixing
  const handleRequestModeSwitch = (newMode: QuizMode) => {
    if (newMode === mode) return;

    const hasAnswers = Object.keys(selectedAnswers).length > 0;
    if (hasAnswers) {
      setModeSwitchCandidate(newMode);
    } else {
      executeModeSwitch(newMode);
    }
  };

  const executeModeSwitch = async (newMode: QuizMode) => {
    // 1. Save current session before switching
    const currentSession: ActiveTestSession = {
      sessionId: activeSessionKey,
      type: sessionId.startsWith('subunit') ? 'subunit' : 'grand-mock',
      mode,
      currentIdx,
      selectedAnswers,
      markedForReview,
      visitedQuestions,
      timeLeft,
      isPaused,
      totalQuestions: questions.length,
      updatedAt: Date.now(),
    };
    await saveActiveSession(currentSession);

    // 2. Switch mode and reset timers
    setMode(newMode);
    setModeSwitchCandidate(null);
    warned5MinRef.current = false;
    warned1MinRef.current = false;

    // 3. Load isolated session for target mode
    const newSessionKey = `${sessionId}_${newMode}`;
    const targetSession = await getActiveSession(newSessionKey);
    if (targetSession) {
      setSelectedAnswers(targetSession.selectedAnswers || {});
      setMarkedForReview(targetSession.markedForReview || {});
      setVisitedQuestions(targetSession.visitedQuestions || { 0: true });
      setCurrentIdx(Math.min(targetSession.currentIdx || 0, questions.length - 1));
      setTimeLeft(targetSession.timeLeft || totalDurationSeconds);
    } else {
      setSelectedAnswers({});
      setMarkedForReview({});
      setVisitedQuestions({ 0: true });
      setCurrentIdx(0);
      setTimeLeft(totalDurationSeconds);
    }
  };

  // Handle Option Click
  const handleSelectOption = (optIdx: number) => {
    if (isPaused) return;

    playOptionClickSound();

    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));

    if (mode === 'practice') {
      // Instant Answers Mode: validate with audio/haptics immediately
      if (optIdx === currentQ.correct) {
        playSuccessChime();
        triggerHaptic('success');
      } else {
        playIncorrectChime();
        triggerHaptic('warning');
      }
    } else {
      // Answer on Submission Mode: neutral feedback only, zero spoilers
      triggerHaptic('light');
    }
  };

  // Clear Response for current question
  const handleClearResponse = () => {
    if (!isAnswered || isPaused) return;
    playNavSound();
    triggerHaptic('medium');
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentIdx];
      return copy;
    });
  };

  // Toggle Mark for Review
  const handleToggleMarkReview = () => {
    if (isPaused) return;
    playNavSound();
    triggerHaptic('medium');
    setMarkedForReview((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }));
  };

  // Navigation
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      playNavSound();
      triggerHaptic('light');
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      playNavSound();
      triggerHaptic('light');
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    playNavSound();
    triggerHaptic('light');
    setCurrentIdx(idx);
    setIsPaletteOpen(false);
  };

  // Pause & Resume
  const handlePause = () => {
    setIsPaused(true);
    setShowPauseModal(true);
    triggerHaptic('warning');
  };

  const handleResume = () => {
    setIsPaused(false);
    setShowPauseModal(false);
    triggerHaptic('medium');
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setShowSubmitModal(false);
    await clearActiveSession(activeSessionKey);

    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        score++;
      }
    });

    const percentage = (score / questions.length) * 100;
    playSuccessChime();
    triggerHaptic('success');

    onComplete({
      score,
      total: questions.length,
      percentage,
      selectedAnswers,
      mode,
    });
  };

  // Time formatter
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Palette Counts
  const counts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let markedOnly = 0;
    let markedAndAnswered = 0;
    let notVisited = 0;
    let correctPractice = 0;
    let wrongPractice = 0;

    questions.forEach((q, idx) => {
      const isAns = selectedAnswers[idx] !== undefined;
      const isRev = Boolean(markedForReview[idx]);
      const isVis = Boolean(visitedQuestions[idx]);

      if (isAns) {
        if (selectedAnswers[idx] === q.correct) correctPractice++;
        else wrongPractice++;
      }

      if (isAns && isRev) markedAndAnswered++;
      else if (isRev) markedOnly++;
      else if (isAns) answered++;
      else if (isVis) notAnswered++;
      else notVisited++;
    });

    return {
      answered,
      notAnswered,
      markedOnly,
      markedAndAnswered,
      notVisited,
      correctPractice,
      wrongPractice,
      totalAnswered: answered + markedAndAnswered,
    };
  }, [questions, selectedAnswers, markedForReview, visitedQuestions]);

  // Section detector for multi-section tests (e.g., Grand Mock)
  const currentSection = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    return sections.find((s) => currentIdx >= s.startIdx && currentIdx <= s.endIdx) || sections[0];
  }, [sections, currentIdx]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col h-[100dvh] w-full overflow-hidden select-none font-sans text-gray-900 dark:text-gray-100"
    >
      {/* 1. TOP CONSOLE BAR - STICKY & IMMERSIVE */}
      <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-2.5 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-30 gap-2">
        
        {/* Left: Exit + Title + Section */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setShowExitModal(true)}
            className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Exit test console"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-extrabold text-xs sm:text-base text-gray-900 dark:text-white truncate">
                {title}
              </h2>
              {currentSection && (
                <span className="hidden md:inline-flex bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                  {currentSection.name}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Mode Selector + Timer Countdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Robust Mode Selector Pill */}
          <div
            role="group"
            aria-label="Test Mode Selection"
            className="inline-flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-2xs shrink-0"
          >
            <button
              onClick={() => handleRequestModeSwitch('practice')}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'practice'
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Instant Answers: Immediate validation and explanation per question"
            >
              <Zap className="w-3 h-3 text-yellow-300 shrink-0" />
              <span className="hidden sm:inline">{language === 'english' ? 'Instant Answers' : 'त्वरित उत्तर'}</span>
              <span className="sm:hidden">{language === 'english' ? 'Instant' : 'त्वरित'}</span>
            </button>

            <button
              onClick={() => handleRequestModeSwitch('exam')}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'exam'
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Answer on Submission: Official CBT mode. Explanations shown only on final submission."
            >
              <FileCheck className="w-3 h-3 text-blue-200 shrink-0" />
              <span className="hidden sm:inline">{language === 'english' ? 'On Submission' : 'सबमिशन पर'}</span>
              <span className="sm:hidden">{language === 'english' ? 'Exam' : 'परीक्षा'}</span>
            </button>
          </div>

          {/* Timer Display (Exam Mode) */}
          {mode === 'exam' && (
            <div
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-mono font-bold text-xs sm:text-sm border shadow-2xs transition-colors shrink-0 ${
                timeLeft < 180
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-600 border-red-300 dark:border-red-900 animate-pulse'
                  : timeLeft < 600
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 border-amber-300 dark:border-amber-900'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Pause / Resume Button (Exam Mode) */}
          {mode === 'exam' && (
            <button
              onClick={handlePause}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer shrink-0"
              title="Pause Test"
            >
              <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
          )}
        </div>

        {/* Right: Audio Toggle, Language, Fullscreen, Palette Drawer (Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Sound Effect Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher size="sm" showIcon={false} />

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Question Palette Drawer Trigger (Mobile/Tablet) */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
            title="Open Question Palette"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{counts.totalAnswered}/{questions.length}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONSOLE BODY - LOCKED VIEWPORT WITH INDEPENDENT SCROLL */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* LEFT / CENTER: QUESTION SOLVER PANE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
          
          {/* Subheader: Question Metadata & Bookmarking */}
          <div className="h-11 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-gray-50/70 dark:bg-slate-900/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px] sm:text-xs">
                {language === 'english' ? `Q ${currentIdx + 1} of ${questions.length}` : `प्रश्न ${currentIdx + 1} / ${questions.length}`}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
                {mode === 'practice'
                  ? (language === 'english' ? 'Instant Practice Mode' : 'त्वरित अभ्यास मोड')
                  : (language === 'english' ? 'Marks: +1.00, -0.00' : 'अंक: +1.00, -0.00')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mark for Review Button */}
              <button
                onClick={handleToggleMarkReview}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  isMarked
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  {isMarked
                    ? (language === 'english' ? 'Marked' : 'चिह्नित है')
                    : (language === 'english' ? 'Mark for Review' : 'समीक्षा')}
                </span>
              </button>

              {/* Bookmark Toggle */}
              <button
                onClick={() => toggleBookmark(currentQ.globalId)}
                className="p-1 rounded-md text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                title="Bookmark Question"
              >
                {isBookmarked(currentQ.globalId) ? (
                  <BookmarkCheck className="w-4 h-4 text-amber-500" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* SCROLLABLE QUESTION CONTENT - Pure Scrollable Element */}
          <div
            ref={questionScrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-5 sm:space-y-6 overscroll-contain"
          >
            {/* Question Stem */}
            <div className="space-y-2">
              {(language === 'bilingual' || language === 'hindi') && (
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                  {currentQ.q_hi}
                </h3>
              )}
              {(language === 'bilingual' || language === 'english') && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                  {currentQ.q_en}
                </p>
              )}
            </div>

            {/* MCQ Options with 44px Touch Targets */}
            <div className="space-y-2.5 sm:space-y-3">
              {currentQ.options_hi.map((optHi, optIdx) => {
                const optEn = currentQ.options_en[optIdx] || optHi;
                const isSelected = userSelected === optIdx;
                const isCorrect = optIdx === currentQ.correct;

                let optClass = "border-gray-200 dark:border-slate-800 hover:border-amber-400 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200";

                if (mode === 'practice' && isAnswered) {
                  // Instant Answers Mode: Green for correct, Red for chosen wrong option
                  if (isCorrect) {
                    optClass = "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500";
                  } else if (isSelected && !isCorrect) {
                    optClass = "border-red-500 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-500";
                  } else {
                    optClass = "opacity-50 border-gray-200 dark:border-slate-800";
                  }
                } else if (isSelected) {
                  // Answer on Submission Mode: neutral highlight only, zero correctness leaks
                  optClass = "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-500";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-3 sm:p-4 min-h-[44px] rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optClass}`}
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

            {/* Instant Analytical Explanation (ONLY in Instant Answers Practice Mode) */}
            {mode === 'practice' && isAnswered && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs animate-in fade-in duration-200">
                {/* Result header */}
                <div className="flex items-center gap-1.5 font-bold">
                  {userSelected === currentQ.correct ? (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {language === 'english' ? 'Correct Answer!' : 'सही उत्तर!'}
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <X className="w-4 h-4 text-red-500 shrink-0" />
                      {language === 'english'
                        ? `Incorrect. Correct Option: (${['A', 'B', 'C', 'D'][currentQ.correct]})`
                        : `गलत उत्तर। सही विकल्प: (${['A', 'B', 'C', 'D'][currentQ.correct]})`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {language === 'english'
                      ? `Explanation: Option (${['A', 'B', 'C', 'D'][currentQ.correct]}) ${currentQ.options_en[currentQ.correct] || currentQ.options_hi[currentQ.correct]}`
                      : `विश्लेषण: विकल्प (${['A', 'B', 'C', 'D'][currentQ.correct]}) ${currentQ.options_hi[currentQ.correct]}`}
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
          </div>

          {/* 3. STICKY BOTTOM ACTION BAR */}
          <footer className="h-14 sm:h-16 border-t border-gray-200 dark:border-slate-800 px-3 sm:px-6 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-lg z-30">
            {/* Left: Clear Response & Mark for Review */}
            <div className="flex items-center gap-2">
              <button
                disabled={!isAnswered}
                onClick={handleClearResponse}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              >
                <span className="hidden sm:inline">{language === 'english' ? 'Clear Response' : 'उत्तर हटाएं'}</span>
                <span className="sm:hidden">{language === 'english' ? 'Clear' : 'हटाएं'}</span>
              </button>

              <button
                onClick={handleToggleMarkReview}
                className={`hidden xs:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isMarked
                    ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isMarked ? (language === 'english' ? 'Unmark Review' : 'चिह्नित हटाएं') : (language === 'english' ? 'Mark for Review' : 'समीक्षा')}
                </span>
                <span className="sm:hidden">
                  {isMarked ? 'Unmark' : 'Review'}
                </span>
              </button>
            </div>

            {/* Right: Previous, Next / Save & Next, Submit */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{language === 'english' ? 'Previous' : 'पिछला'}</span>
                <span className="sm:hidden">{language === 'english' ? 'Prev' : 'पिछला'}</span>
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{language === 'english' ? 'Submit Test' : 'सबमिट करें'}</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs text-xs transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">{language === 'english' ? 'Save & Next' : 'अगला'}</span>
                  <span className="sm:hidden">{language === 'english' ? 'Next' : 'अगला'}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          </footer>

        </div>

        {/* RIGHT: QUESTION PALETTE SIDEBAR (Desktop >= 1024px) */}
        <aside className="hidden lg:flex w-72 xl:w-80 border-l border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/80 flex-col h-full overflow-hidden shrink-0">
          <PaletteContent
            questions={questions}
            currentIdx={currentIdx}
            selectedAnswers={selectedAnswers}
            markedForReview={markedForReview}
            visitedQuestions={visitedQuestions}
            counts={counts}
            sections={sections}
            onSelectQuestion={handleJumpToQuestion}
            onSubmitClick={() => setShowSubmitModal(true)}
            language={language}
            mode={mode}
          />
        </aside>

      </div>

      {/* MOBILE DRAWER / OFF-CANVAS PALETTE (< 1024px) */}
      {isPaletteOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs transition-all">
          <div
            className="w-full max-h-[80vh] bg-white dark:bg-slate-900 rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Drawer Header */}
            <div className="h-12 border-b border-gray-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
              <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-amber-500" />
                {language === 'english' ? 'Question Palette' : 'प्रश्न पैलेट'}
                <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                  ({mode === 'practice' ? 'Instant Answers' : 'On Submission'})
                </span>
              </span>
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              <PaletteContent
                questions={questions}
                currentIdx={currentIdx}
                selectedAnswers={selectedAnswers}
                markedForReview={markedForReview}
                visitedQuestions={visitedQuestions}
                counts={counts}
                sections={sections}
                onSelectQuestion={handleJumpToQuestion}
                onSubmitClick={() => {
                  setIsPaletteOpen(false);
                  setShowSubmitModal(true);
                }}
                language={language}
                mode={mode}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. DIALOG: MODE SWITCH CONFIRMATION (Robust Context Isolation) */}
      {modeSwitchCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-switch-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>

            <h3 id="mode-switch-title" className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {language === 'english' ? 'Switch Test Mode?' : 'टेस्ट मोड बदलें?'}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {language === 'english'
                ? `Your current progress will be preserved in IndexedDB. You are switching to ${
                    modeSwitchCandidate === 'practice' ? '⚡ Instant Answers' : '📝 Answer on Submission'
                  } mode.`
                : `आपकी वर्तमान प्रगति सुरक्षित कर दी जाएगी। आप ${
                    modeSwitchCandidate === 'practice' ? '⚡ त्वरित उत्तर' : '📝 सबमिशन पर उत्तर'
                  } मोड में जा रहे हैं। दोनों मोड के उत्तर अलग-अलग रहेंगे।`}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setModeSwitchCandidate(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {language === 'english' ? 'Cancel' : 'रद्द करें'}
              </button>

              <button
                autoFocus
                onClick={() => executeModeSwitch(modeSwitchCandidate)}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {language === 'english' ? 'Switch Mode' : 'मोड बदलें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DIALOG: PAUSE MODAL */}
      {showPauseModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <Pause className="w-7 h-7" />
            </div>

            <h3 id="pause-dialog-title" className="text-xl font-extrabold text-gray-900 dark:text-white">
              {language === 'english' ? 'Test Paused' : 'परीक्षा रोक दी गई है'}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'english'
                ? `Time remaining: ${formatTime(timeLeft)} • Answered: ${counts.totalAnswered} / ${questions.length}`
                : `शेष समय: ${formatTime(timeLeft)} • कुल उत्तर दिए: ${counts.totalAnswered} / ${questions.length}`}
            </p>

            <div className="pt-2 space-y-2">
              <button
                autoFocus
                onClick={handleResume}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs text-xs transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {language === 'english' ? 'Resume Test' : 'परीक्षा जारी रखें'}
              </button>

              <button
                onClick={() => {
                  setShowPauseModal(false);
                  onExit();
                }}
                className="w-full py-2 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'english' ? 'Save & Exit' : 'सुरक्षित कर बाहर जाएं'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DIALOG: SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl">
            <h3 id="submit-dialog-title" className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white text-center">
              {language === 'english' ? 'Confirm Test Submission' : 'टेस्ट सबमिशन की पुष्टि करें'}
            </h3>

            {/* CBT Submission Summary Matrix */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{counts.totalAnswered}</span>
                <p className="text-[11px] text-emerald-600">{language === 'english' ? 'Answered' : 'उत्तर दिए'}</p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-center">
                <span className="text-xl font-extrabold text-red-600 dark:text-red-400">{questions.length - counts.totalAnswered}</span>
                <p className="text-[11px] text-red-600">{language === 'english' ? 'Unanswered' : 'अनुत्तरित'}</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 text-center">
                <span className="text-xl font-extrabold text-purple-700 dark:text-purple-400">{counts.markedOnly + counts.markedAndAnswered}</span>
                <p className="text-[11px] text-purple-600">{language === 'english' ? 'Marked for Review' : 'समीक्षा हेतु'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-center">
                <span className="text-xl font-extrabold text-gray-700 dark:text-gray-300">
                  {mode === 'exam' ? formatTime(timeLeft) : 'Practice'}
                </span>
                <p className="text-[11px] text-gray-500">
                  {mode === 'exam' ? (language === 'english' ? 'Time Remaining' : 'शेष समय') : 'मोड'}
                </p>
              </div>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {language === 'english'
                ? 'Are you sure you want to finish the test? Complete solutions & performance report will be generated.'
                : 'क्या आप निश्चित रूप से टेस्ट सबमिट करना चाहते हैं? इसके बाद सम्पूर्ण व्याख्या सहित रिपोर्ट प्रदर्शित होगी।'}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'english' ? 'Return to Test' : 'वापस टेस्ट पर'}
              </button>

              <button
                autoFocus
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {language === 'english' ? 'Yes, Submit' : 'हाँ, सबमिट करें'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DIALOG: EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {language === 'english' ? 'Exit Test Console?' : 'क्या आप परीक्षा से बाहर जाना चाहते हैं?'}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'english'
                ? 'Your current progress is saved in IndexedDB and you can resume anytime.'
                : 'आपकी वर्तमान प्रगति IndexedDB में सुरक्षित है। आप इसे बाद में कभी भी पुनः जारी रख सकते हैं।'}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold"
              >
                {language === 'english' ? 'Stay' : 'रहें'}
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  onExit();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {language === 'english' ? 'Exit' : 'बाहर जाएं'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DIALOG: RESUME IN-PROGRESS PROMPT MODAL */}
      {resumePromptSession && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
              <RotateCcw className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {language === 'english' ? 'Resume In-Progress Session?' : 'अधूरी परीक्षा पुनः जारी रखें?'}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              {language === 'english'
                ? `An active ${mode === 'practice' ? 'Instant Answers' : 'On Submission'} session was found with ${
                    Object.keys(resumePromptSession.selectedAnswers || {}).length
                  } answered questions and ${formatTime(resumePromptSession.timeLeft)} remaining.`
                : `आपकी पिछली परीक्षा का सत्र सुरक्षित है (${
                    Object.keys(resumePromptSession.selectedAnswers || {}).length
                  } प्रश्न हल किए गए, ${formatTime(resumePromptSession.timeLeft)} शेष)।`}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleDiscardSavedSession}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                {language === 'english' ? 'Start Fresh' : 'नया प्रारंभ करें'}
              </button>

              <button
                autoFocus
                onClick={() => handleResumeSession(resumePromptSession)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs"
              >
                {language === 'english' ? 'Resume Session' : 'जारी रखें'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/**
 * Question Palette Sub-component
 */
interface PaletteContentProps {
  questions: Question[];
  currentIdx: number;
  selectedAnswers: Record<number, number>;
  markedForReview: Record<number, boolean>;
  visitedQuestions: Record<number, boolean>;
  counts: any;
  sections?: { id: string; name: string; startIdx: number; endIdx: number }[];
  onSelectQuestion: (idx: number) => void;
  onSubmitClick: () => void;
  language: string;
  mode: QuizMode;
}

const PaletteContent: React.FC<PaletteContentProps> = ({
  questions,
  currentIdx,
  selectedAnswers,
  markedForReview,
  visitedQuestions,
  counts,
  onSelectQuestion,
  onSubmitClick,
  language,
  mode,
}) => {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Legend */}
      <div className="space-y-1.5 text-[11px] pb-2 border-b border-gray-200 dark:border-slate-800">
        <h4 className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
          {language === 'english' ? 'Legend' : 'संकेतक (Legend)'}
        </h4>

        {mode === 'practice' ? (
          /* Legend in Instant Answers Practice Mode */
          <div className="grid grid-cols-2 gap-1.5 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.correctPractice}
              </span>
              <span className="truncate">{language === 'english' ? 'Correct' : 'सही उत्तर'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.wrongPractice}
              </span>
              <span className="truncate">{language === 'english' ? 'Incorrect' : 'गलत उत्तर'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.markedOnly}
              </span>
              <span className="truncate">{language === 'english' ? 'Marked' : 'समीक्षा हेतु'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {questions.length - counts.totalAnswered}
              </span>
              <span className="truncate">{language === 'english' ? 'Unanswered' : 'अनुत्तरित'}</span>
            </div>
          </div>
        ) : (
          /* Legend in Answer on Submission Exam Mode */
          <div className="grid grid-cols-2 gap-1.5 text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.answered}
              </span>
              <span className="truncate">{language === 'english' ? 'Answered' : 'उत्तर दिए'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.notAnswered}
              </span>
              <span className="truncate">{language === 'english' ? 'Not Answered' : 'अनुत्तरित'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.markedOnly}
              </span>
              <span className="truncate">{language === 'english' ? 'Marked' : 'समीक्षा हेतु'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                {counts.notVisited}
              </span>
              <span className="truncate">{language === 'english' ? 'Not Visited' : 'अनदेखे'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Question Number Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
          {questions.map((q, idx) => {
            const isAns = selectedAnswers[idx] !== undefined;
            const isRev = Boolean(markedForReview[idx]);
            const isVis = Boolean(visitedQuestions[idx]);
            const isCurrent = idx === currentIdx;

            let btnClass = "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-transparent";

            if (mode === 'practice' && isAns) {
              // Instant Answers: show immediate green / red status in palette
              if (selectedAnswers[idx] === q.correct) {
                btnClass = "bg-emerald-600 text-white font-bold";
              } else {
                btnClass = "bg-red-500 text-white font-bold";
              }
            } else {
              // Answer on Submission: standard CBT palette (zero correctness leaks)
              if (isAns && isRev) {
                btnClass = "bg-purple-600 text-white ring-2 ring-emerald-400";
              } else if (isRev) {
                btnClass = "bg-purple-600 text-white rounded-full";
              } else if (isAns) {
                btnClass = "bg-emerald-600 text-white";
              } else if (isVis) {
                btnClass = "bg-red-500 text-white";
              }
            }

            if (isCurrent) {
              btnClass += " ring-2 ring-amber-400 font-black scale-105";
            }

            return (
              <button
                key={idx}
                onClick={() => onSelectQuestion(idx)}
                className={`h-8 sm:h-8.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Palette Footer Submit */}
      <div className="pt-2 border-t border-gray-200 dark:border-slate-800">
        <button
          onClick={onSubmitClick}
          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{language === 'english' ? 'Submit Entire Test' : 'संपूर्ण टेस्ट सबमिट करें'}</span>
        </button>
      </div>
    </div>
  );
};
