import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Shuffle,
  Volume2,
  X,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ALL_CHAPTERS, getChapterMeta } from '../data/demoVocab';
import { Translations } from '../i18n/translations';
import { speakGerman } from '../services/speechService';
import { NounPracticeEntry, PracticeSectionStats } from '../types';
import { FilterOption, PracticeToolbar } from './PracticeToolbar';
import { GermanText } from './GermanText';

interface ArticleTrainerViewProps {
  t: Translations;
  nouns: NounPracticeEntry[];
  stats: PracticeSectionStats;
  onRecordAttempt: (itemId: string, wasCorrect: boolean) => void;
}

const ARTICLES: Array<'der' | 'die' | 'das'> = ['der', 'die', 'das'];
const CORRECT_ADVANCE_MS = 1550;
const WRONG_ADVANCE_MS = 2650;

export function ArticleTrainerView({
  t,
  nouns,
  stats,
  onRecordAttempt,
}: ArticleTrainerViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'quiz' | 'browse'>('quiz');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [missedOnly, setMissedOnly] = useState(false);
  const [visibleBrowseCount, setVisibleBrowseCount] = useState(60);

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [chosenArticle, setChosenArticle] = useState<'der' | 'die' | 'das' | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  const levelOptions = useMemo<FilterOption[]>(() => {
    const levels = new Set<string>();
    nouns.forEach((n) => levels.add(n.level));
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'Custom'];
    return order
      .filter((lvl) => levels.has(lvl))
      .map((lvl) => ({ value: lvl, label: lvl }));
  }, [nouns]);

  const chapterOptions = useMemo<FilterOption[]>(() => {
    const present = new Set<string>();
    nouns.forEach((n) => {
      if (selectedLevel !== 'all' && n.level !== selectedLevel) return;
      if (n.chapter) present.add(n.chapter);
    });
    const opts: FilterOption[] = [];
    ALL_CHAPTERS.forEach((ch) => {
      if (present.has(ch.chapterKey)) {
        opts.push({ value: ch.chapterKey, label: ch.title });
      }
    });
    return opts;
  }, [nouns, selectedLevel]);

  useEffect(() => {
    if (selectedChapter !== 'all' && !chapterOptions.some((c) => c.value === selectedChapter)) {
      setSelectedChapter('all');
    }
  }, [selectedLevel, chapterOptions, selectedChapter]);

  const latestMissedIdsRef = useRef<string[]>(stats.missedIds);
  latestMissedIdsRef.current = stats.missedIds;

  const baseFilteredNouns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return nouns.filter((item) => {
      if (selectedLevel !== 'all' && item.level !== selectedLevel) return false;
      if (selectedChapter !== 'all' && item.chapter !== selectedChapter) return false;
      if (q) {
        const hay = `${item.german} ${item.noun} ${item.bangla} ${item.english} ${item.sourceLabel} ${item.level}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [nouns, selectedLevel, selectedChapter, searchQuery]);

  const filteredNouns = useMemo(() => {
    if (!missedOnly) return baseFilteredNouns;
    const missedSet = new Set(stats.missedIds);
    return baseFilteredNouns.filter((item) => missedSet.has(item.id));
  }, [baseFilteredNouns, missedOnly, stats.missedIds]);

  // Reset deduplicated queue whenever filters or missedOnly mode change (not when missedIds shrinks mid-answer)
  useEffect(() => {
    const missedSet = new Set(latestMissedIdsRef.current);
    const sourcePool = missedOnly
      ? baseFilteredNouns.filter((item) => missedSet.has(item.id))
      : baseFilteredNouns;

    const uniqueIds: string[] = [];
    const seenKeys = new Set<string>();
    for (const n of sourcePool) {
      const k = `${n.article}|${n.noun.toLowerCase().trim()}`;
      if (seenKeys.has(k)) continue;
      seenKeys.add(k);
      uniqueIds.push(n.id);
    }
    setQueueIds(uniqueIds);
    setCursor(0);
    setChosenArticle(null);
    setSessionCorrect(0);
    setSessionWrong(0);
    setVisibleBrowseCount(60);
  }, [baseFilteredNouns, missedOnly]);

  const currentNoun = useMemo(() => {
    const id = queueIds[cursor];
    if (!id) return null;
    return baseFilteredNouns.find((n) => n.id === id) || null;
  }, [queueIds, cursor, baseFilteredNouns]);

  const handleSelectArticle = useCallback(
    (ans: 'der' | 'die' | 'das') => {
      if (!currentNoun || chosenArticle !== null) return;
      setChosenArticle(ans);
      const isCorrect = ans === currentNoun.article;
      if (isCorrect) {
        setSessionCorrect((c) => c + 1);
      } else {
        setSessionWrong((w) => w + 1);
      }
      onRecordAttempt(currentNoun.id, isCorrect);
      speakGerman(`${currentNoun.article} ${currentNoun.noun}`);
    },
    [currentNoun, chosenArticle, onRecordAttempt]
  );

  const handleNext = useCallback(() => {
    setChosenArticle(null);
    setCursor((c) => c + 1);
  }, []);

  // Automatically advance after giving the user time to read the feedback
  useEffect(() => {
    if (activeSubTab !== 'quiz' || !autoAdvance || chosenArticle === null || !currentNoun) {
      return;
    }
    const isCorrect = chosenArticle === currentNoun.article;
    const delayMs = isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS;
    const timer = window.setTimeout(() => {
      handleNext();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [activeSubTab, autoAdvance, chosenArticle, currentNoun, handleNext]);

  const handleShuffle = () => {
    const next = [...queueIds];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setQueueIds(next);
    setCursor(0);
    setChosenArticle(null);
    setSessionCorrect(0);
    setSessionWrong(0);
  };

  const handleRestart = () => {
    if (missedOnly) {
      if (filteredNouns.length === 0) {
        setMissedOnly(false);
        return;
      }
      const uniqueIds: string[] = [];
      const seenKeys = new Set<string>();
      for (const n of filteredNouns) {
        const k = `${n.article}|${n.noun.toLowerCase().trim()}`;
        if (seenKeys.has(k)) continue;
        seenKeys.add(k);
        uniqueIds.push(n.id);
      }
      setQueueIds(uniqueIds);
    }
    setCursor(0);
    setChosenArticle(null);
    setSessionCorrect(0);
    setSessionWrong(0);
  };

  // Keyboard shortcuts: 1=der, 2=die, 3=das, Enter/Space=Next
  useEffect(() => {
    if (activeSubTab !== 'quiz' || !currentNoun) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (chosenArticle === null) {
        if (e.key === '1') handleSelectArticle('der');
        else if (e.key === '2') handleSelectArticle('die');
        else if (e.key === '3') handleSelectArticle('das');
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSubTab, currentNoun, chosenArticle, handleSelectArticle, handleNext]);

  const answeredInSession = chosenArticle !== null ? cursor + 1 : cursor;
  const progressPercent =
    queueIds.length > 0
      ? Math.min(100, Math.round((answeredInSession / queueIds.length) * 100))
      : 0;

  const isCurrentCorrect =
    chosenArticle !== null && currentNoun !== null && chosenArticle === currentNoun.article;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-5 max-w-5xl mx-auto">
        <PracticeToolbar
          t={t}
          title={t.practiceSections.articleTrainerTitle}
          subtitle={t.practiceSections.articleTrainerSub}
          stats={stats}
          totalPoolCount={filteredNouns.length}
          levelOptions={levelOptions}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          chapterOptions={chapterOptions}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeSubTab={activeSubTab}
          onChangeSubTab={setActiveSubTab}
        />

        {activeSubTab === 'browse' ? (
          <div className="space-y-4">
            {filteredNouns.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                {t.practiceSections.noItemsInScope}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredNouns.slice(0, visibleBrowseCount).map((item) => {
                    const chMeta = getChapterMeta(item.chapter);
                    return (
                      <article
                        key={item.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          <span className="truncate">
                            {chMeta ? chMeta.title : item.sourceLabel}
                            {item.section ? ` · ${item.section}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => speakGerman(`${item.article} ${item.noun}`)}
                            aria-label={t.common.listen}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-base font-bold">
                          <GermanText german={item.german} article={item.article} />
                        </div>
                        {item.bangla && (
                          <div lang="bn" className="text-sm font-bn text-slate-800 dark:text-slate-200">
                            {item.bangla}
                          </div>
                        )}
                        {item.english && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.english}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                {filteredNouns.length > visibleBrowseCount && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleBrowseCount((c) => c + 60)}
                      className="px-5 py-2.5 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      +60 ({visibleBrowseCount} / {filteredNouns.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* QUIZ VIEW */
          <div className="space-y-4">
            {/* Session Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMissedOnly(false)}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    !missedOnly
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t.practiceSections.allItemsBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setMissedOnly(true)}
                  disabled={stats.missedIds.length === 0}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer ${
                    missedOnly
                      ? 'bg-rose-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t.practiceSections.missedOnlyBtn} ({stats.missedIds.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoAdvance((v) => !v)}
                  aria-pressed={autoAdvance}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    autoAdvance
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autoAdvance ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400'
                    }`}
                  />
                  <span>Auto-next</span>
                </button>
                <button
                  type="button"
                  onClick={handleShuffle}
                  disabled={queueIds.length < 2}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>{t.practiceSections.shuffleBtn}</span>
                </button>
              </div>
            </div>

            {/* Session Progress Indicator */}
            {queueIds.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {Math.min(cursor + 1, queueIds.length)} / {queueIds.length}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      {sessionCorrect}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      {sessionWrong}
                    </span>
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                >
                  <motion.div
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            {queueIds.length === 0 ? (
              <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
                {t.practiceSections.noItemsInScope}
              </section>
            ) : !currentNoun ? (
              <motion.section
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
                className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-8 text-center space-y-4"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.study.sessionComplete}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.study.sessionCompleteSub}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-5 text-sm font-mono tabular-nums pt-1">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    {sessionCorrect}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <X className="w-4 h-4 stroke-[2.5]" />
                    {sessionWrong}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.practiceSections.resetSessionBtn}</span>
                </button>
              </motion.section>
            ) : (
              <AnimatePresence mode="wait">
                <motion.section
                  key={`${currentNoun.id}-${cursor}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 sm:p-8 space-y-6 transition-colors duration-400 ${
                    chosenArticle === null
                      ? 'border-slate-200 dark:border-slate-800'
                      : isCurrentCorrect
                        ? 'border-emerald-300 dark:border-emerald-800/80 shadow-sm'
                        : 'border-rose-300 dark:border-rose-800/80'
                  }`}
                >
                  {/* Top metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-mono tabular-nums truncate">
                      {getChapterMeta(currentNoun.chapter)?.title || currentNoun.sourceLabel}
                      {currentNoun.section ? ` · ${currentNoun.section}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakGerman(`${currentNoun.article} ${currentNoun.noun}`)}
                      disabled={chosenArticle === null}
                      title={
                        chosenArticle === null
                          ? t.practiceSections.chooseArticlePrompt
                          : t.common.listen
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 disabled:opacity-40 transition-opacity cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{t.common.listen}</span>
                    </button>
                  </div>

                  {/* Missing Article Noun Prompt */}
                  <div className="text-center py-3 sm:py-4 space-y-2.5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-bn">
                      {t.practiceSections.chooseArticlePrompt}
                    </p>

                    <div className="min-h-[48px] flex items-center justify-center text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {chosenArticle === null ? (
                        <span>
                          <span className="inline-block min-w-[3.2rem] border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 mr-2">
                            ___
                          </span>
                          <span>{currentNoun.noun}</span>
                        </span>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0.75, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                          className="inline-flex flex-wrap items-center justify-center gap-2"
                        >
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {currentNoun.article}
                          </span>
                          <span>{currentNoun.noun}</span>
                        </motion.div>
                      )}
                    </div>

                    {currentNoun.plural && (
                      <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {t.vocabulary.pluralLabel}: {currentNoun.plural}
                      </div>
                    )}

                    {(currentNoun.bangla || currentNoun.english) && (
                      <div className="pt-1 space-y-0.5">
                        {currentNoun.bangla && (
                          <div
                            lang="bn"
                            className="text-base font-medium font-bn text-slate-700 dark:text-slate-200"
                          >
                            {currentNoun.bangla}
                          </div>
                        )}
                        {currentNoun.english && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {currentNoun.english}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3 Article Options: der / die / das */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 max-w-xl mx-auto">
                    {ARTICLES.map((art, index) => {
                      const isAnswered = chosenArticle !== null;
                      const isTarget = art === currentNoun.article;
                      const isSelected = chosenArticle === art;
                      const isWrongSelected = isAnswered && isSelected && !isTarget;
                      const isCorrectReveal = isAnswered && isTarget;

                      let buttonStyle =
                        'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-slate-900 dark:text-slate-100';

                      if (isCorrectReveal) {
                        buttonStyle =
                          'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-4 ring-emerald-500/20 shadow-sm';
                      } else if (isWrongSelected) {
                        buttonStyle =
                          'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 ring-4 ring-rose-500/20';
                      } else if (isAnswered) {
                        buttonStyle =
                          'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 opacity-45 text-slate-400';
                      }

                      const buttonAnimation = isWrongSelected
                        ? { x: [0, -7, 7, -5, 5, -2, 0] }
                        : isCorrectReveal
                          ? { scale: isSelected ? [1, 1.06, 1] : [1, 1.035, 1] }
                          : { x: 0, scale: 1 };

                      const buttonTransition = isWrongSelected
                        ? { duration: 0.42, ease: 'easeInOut' as const }
                        : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

                      return (
                        <motion.button
                          key={art}
                          type="button"
                          disabled={isAnswered}
                          onClick={() => handleSelectArticle(art)}
                          whileTap={!isAnswered ? { scale: 0.97 } : undefined}
                          animate={buttonAnimation}
                          transition={buttonTransition}
                          className={`relative overflow-hidden py-4 min-h-[68px] rounded-xl border-2 text-lg sm:text-xl font-bold transition-colors duration-350 flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:cursor-default ${buttonStyle}`}
                        >
                          {/* Subtle success pulse halo on correct article */}
                          {isCorrectReveal && isSelected && (
                            <motion.span
                              aria-hidden="true"
                              initial={{ opacity: 0.55, scale: 0.85 }}
                              animate={{ opacity: 0, scale: 1.25 }}
                              transition={{ duration: 0.48, ease: 'easeOut' }}
                              className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-400/25 dark:bg-emerald-400/20"
                            />
                          )}

                          <span className="relative z-10 inline-flex items-center gap-1.5">
                            {isCorrectReveal && (
                              <motion.span
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </motion.span>
                            )}
                            {isWrongSelected && (
                              <motion.span
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white"
                              >
                                <X className="w-3.5 h-3.5 stroke-[3]" />
                              </motion.span>
                            )}
                            <span>{art}</span>
                          </span>
                          <span className="relative z-10 text-[10px] font-mono opacity-60">
                            [{index + 1}]
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Detailed Answer Feedback & Smooth Auto-Next */}
                  <AnimatePresence>
                    {chosenArticle !== null && (
                      <motion.div
                        key={`feedback-${currentNoun.id}-${chosenArticle}`}
                        initial={{ opacity: 0, y: 8, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 ${
                          isCurrentCorrect
                            ? 'border-emerald-200 dark:border-emerald-900/80 bg-emerald-50/80 dark:bg-emerald-950/35'
                            : 'border-rose-200 dark:border-rose-900/80 bg-rose-50/80 dark:bg-rose-950/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                          <div className="space-y-1.5">
                            {isCurrentCorrect ? (
                              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-semibold">
                                <motion.span
                                  initial={{ scale: 0.7, rotate: -8 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white shrink-0"
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </motion.span>
                                <span className="text-emerald-800 dark:text-emerald-300 font-bn">
                                  {t.practiceSections.correctArticleFeedback}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold">
                                  ✓ {currentNoun.article} {currentNoun.noun}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300 font-bn">
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white shrink-0">
                                    <X className="w-3.5 h-3.5 stroke-[3]" />
                                  </span>
                                  <span>{t.practiceSections.wrongArticleFeedback}</span>
                                </div>
                                <div
                                  className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-bold"
                                  aria-live="polite"
                                >
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 line-through decoration-rose-500/70">
                                    <X className="w-4 h-4 stroke-[2.75] shrink-0" />
                                    {chosenArticle}
                                  </span>
                                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200">
                                    <Check className="w-4 h-4 stroke-[2.75] shrink-0" />
                                    {currentNoun.article} {currentNoun.noun}
                                  </span>
                                </div>
                              </div>
                            )}

                            {currentNoun.exampleGerman && (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-0.5">
                                {currentNoun.exampleGerman}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shrink-0 transition-colors cursor-pointer"
                          >
                            <span>{t.study.nextQuestion}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Subtle auto-advance timer bar */}
                        {autoAdvance && (
                          <motion.div
                            key={`timer-${currentNoun.id}-${chosenArticle}`}
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{
                              duration: (isCurrentCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS) / 1000,
                              ease: 'linear',
                            }}
                            style={{ transformOrigin: 'left' }}
                            className={`absolute bottom-0 inset-x-0 h-1 ${
                              isCurrentCorrect
                                ? 'bg-emerald-500/60 dark:bg-emerald-400/50'
                                : 'bg-rose-500/50 dark:bg-rose-400/40'
                            }`}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.section>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
