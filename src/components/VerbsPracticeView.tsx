import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Shuffle,
  Volume2,
  XCircle,
} from 'lucide-react';
import { ALL_CHAPTERS, getChapterMeta } from '../data/demoVocab';
import { Translations } from '../i18n/translations';
import { speakGerman } from '../services/speechService';
import {
  PracticeSectionStats,
  StudyDirection,
  VerbPracticeEntry,
} from '../types';
import { FilterOption, PracticeToolbar } from './PracticeToolbar';

interface VerbsPracticeViewProps {
  t: Translations;
  direction: StudyDirection;
  verbs: VerbPracticeEntry[];
  stats: PracticeSectionStats;
  onRecordAttempt: (itemId: string, wasCorrect: boolean) => void;
}

const UMLAUT_KEYS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

function getVerbPromptAndAnswer(verb: VerbPracticeEntry, direction: StudyDirection) {
  const hasMeaning = Boolean(verb.bangla || verb.english);
  switch (direction) {
    case 'bn-de':
      return {
        promptIsGerman: !hasMeaning,
        prompt: hasMeaning ? verb.bangla || verb.english : verb.verb,
        answer: verb.verb,
        secondary: hasMeaning ? verb.english : '',
      };
    case 'en-de':
      return {
        promptIsGerman: !hasMeaning,
        prompt: hasMeaning ? verb.english || verb.bangla : verb.verb,
        answer: verb.verb,
        secondary: hasMeaning ? verb.bangla : '',
      };
    case 'de-en':
      return {
        promptIsGerman: true,
        prompt: verb.verb,
        answer: verb.english || verb.bangla || verb.verb,
        secondary: verb.bangla,
      };
    case 'de-bn':
    default:
      return {
        promptIsGerman: true,
        prompt: verb.verb,
        answer: verb.bangla || verb.english || verb.verb,
        secondary: verb.english,
      };
  }
}

export function VerbsPracticeView({
  t,
  direction,
  verbs,
  stats,
  onRecordAttempt,
}: VerbsPracticeViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'quiz' | 'browse'>('quiz');
  const [quizType, setQuizType] = useState<'mcq' | 'type'>('mcq');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [missedOnly, setMissedOnly] = useState(false);
  const [visibleBrowseCount, setVisibleBrowseCount] = useState(60);

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [selectedMcqId, setSelectedMcqId] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [typedChecked, setTypedChecked] = useState<boolean | null>(null);

  const levelOptions = useMemo<FilterOption[]>(() => {
    const levels = new Set<string>();
    verbs.forEach((v) => levels.add(v.level));
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'Custom'];
    return order
      .filter((lvl) => levels.has(lvl))
      .map((lvl) => ({ value: lvl, label: lvl }));
  }, [verbs]);

  const chapterOptions = useMemo<FilterOption[]>(() => {
    const present = new Set<string>();
    verbs.forEach((v) => {
      if (selectedLevel !== 'all' && v.level !== selectedLevel) return;
      if (v.chapter) present.add(v.chapter);
    });
    const opts: FilterOption[] = [];
    ALL_CHAPTERS.forEach((ch) => {
      if (present.has(ch.chapterKey)) {
        opts.push({ value: ch.chapterKey, label: ch.title });
      }
    });
    return opts;
  }, [verbs, selectedLevel]);

  useEffect(() => {
    if (selectedChapter !== 'all' && !chapterOptions.some((c) => c.value === selectedChapter)) {
      setSelectedChapter('all');
    }
  }, [selectedLevel, chapterOptions, selectedChapter]);

  const filteredVerbs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const missedSet = new Set(stats.missedIds);

    return verbs.filter((item) => {
      if (selectedLevel !== 'all' && item.level !== selectedLevel) return false;
      if (selectedChapter !== 'all' && item.chapter !== selectedChapter) return false;
      if (missedOnly && !missedSet.has(item.id)) return false;
      if (q) {
        const hay = `${item.verb} ${item.verbForms || ''} ${item.bangla} ${item.english} ${item.exampleGerman || ''} ${item.sourceLabel} ${item.level}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [verbs, selectedLevel, selectedChapter, searchQuery, missedOnly, stats.missedIds]);

  // Deduplicate queue and reset when filters change
  useEffect(() => {
    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const v of filteredVerbs) {
      const k = v.verb.toLowerCase().trim();
      if (seen.has(k)) continue;
      seen.add(k);
      uniqueIds.push(v.id);
    }
    setQueueIds(uniqueIds);
    setCursor(0);
    setSelectedMcqId(null);
    setTypedInput('');
    setTypedChecked(null);
    setVisibleBrowseCount(60);
  }, [filteredVerbs]);

  const currentVerb = useMemo(() => {
    const id = queueIds[cursor];
    if (!id) return null;
    return filteredVerbs.find((v) => v.id === id) || null;
  }, [queueIds, cursor, filteredVerbs]);

  const mcqOptions = useMemo(() => {
    if (!currentVerb) return [];
    const pool = filteredVerbs.length >= 4 ? filteredVerbs : verbs;
    const currentAns = getVerbPromptAndAnswer(currentVerb, direction).answer.toLowerCase();
    const others = pool.filter(
      (v) =>
        v.id !== currentVerb.id &&
        getVerbPromptAndAnswer(v, direction).answer.toLowerCase() !== currentAns
    );
    const ranked = [...others].sort((a, b) => {
      const ha = (a.verb.charCodeAt(0) + cursor * 11) % 23;
      const hb = (b.verb.charCodeAt(0) + cursor * 11) % 23;
      return ha - hb;
    });
    const picks = [currentVerb, ...ranked.slice(0, 3)];
    return picks.sort((a, b) => a.verb.localeCompare(b.verb));
  }, [currentVerb, filteredVerbs, verbs, direction, cursor]);

  const handleSelectMcq = (option: VerbPracticeEntry) => {
    if (!currentVerb || selectedMcqId) return;
    setSelectedMcqId(option.id);
    const correct = option.id === currentVerb.id;
    onRecordAttempt(currentVerb.id, correct);
    speakGerman(currentVerb.verb);
  };

  const handleCheckTyped = () => {
    if (!currentVerb || typedChecked !== null) return;
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const userVal = norm(typedInput);
    const targetFull = norm(currentVerb.verb);
    const targetBare = norm(currentVerb.verb.replace(/^sich\s+/i, ''));
    const correct = Boolean(userVal && (userVal === targetFull || userVal === targetBare));
    setTypedChecked(correct);
    onRecordAttempt(currentVerb.id, correct);
    speakGerman(currentVerb.verb);
  };

  const handleNext = useCallback(() => {
    setSelectedMcqId(null);
    setTypedInput('');
    setTypedChecked(null);
    setCursor((c) => c + 1);
  }, []);

  const handleShuffle = () => {
    const next = [...queueIds];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setQueueIds(next);
    setCursor(0);
    setSelectedMcqId(null);
    setTypedInput('');
    setTypedChecked(null);
  };

  const handleRestart = () => {
    setCursor(0);
    setSelectedMcqId(null);
    setTypedInput('');
    setTypedChecked(null);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PracticeToolbar
        t={t}
        title={t.practiceSections.verbsTitle}
        subtitle={t.practiceSections.verbsSub}
        stats={stats}
        totalPoolCount={filteredVerbs.length}
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
          {filteredVerbs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
              {t.practiceSections.noItemsInScope}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVerbs.slice(0, visibleBrowseCount).map((item) => {
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
                          onClick={() => speakGerman(item.verb)}
                          aria-label={t.common.listen}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.verb}
                      </div>
                      {item.verbForms && (
                        <div className="text-xs font-mono text-blue-700 dark:text-blue-400">
                          {item.verbForms}
                        </div>
                      )}
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
                      {item.exampleGerman && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          {item.exampleGerman}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
              {filteredVerbs.length > visibleBrowseCount && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleBrowseCount((c) => c + 60)}
                    className="px-5 py-2.5 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    +60 ({visibleBrowseCount} / {filteredVerbs.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* QUIZ VIEW */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setQuizType('mcq');
                  setSelectedMcqId(null);
                  setTypedChecked(null);
                }}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold cursor-pointer ${
                  quizType === 'mcq'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {t.practiceSections.meaningQuizMode}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizType('type');
                  setSelectedMcqId(null);
                  setTypedChecked(null);
                  setTypedInput('');
                }}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold cursor-pointer ${
                  quizType === 'type'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {t.practiceSections.typeVerbMode}
              </button>
              <button
                type="button"
                onClick={() => setMissedOnly((m) => !m)}
                disabled={stats.missedIds.length === 0 && !missedOnly}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer ${
                  missedOnly
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {t.practiceSections.missedOnlyBtn} ({stats.missedIds.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {queueIds.length > 0 ? Math.min(cursor + 1, queueIds.length) : 0} / {queueIds.length}
              </span>
              <button
                type="button"
                onClick={handleShuffle}
                disabled={queueIds.length < 2}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{t.practiceSections.shuffleBtn}</span>
              </button>
            </div>
          </div>

          {queueIds.length === 0 ? (
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
              {t.practiceSections.noItemsInScope}
            </section>
          ) : !currentVerb ? (
            <section className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {t.study.sessionComplete}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t.study.sessionCompleteSub}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.practiceSections.resetSessionBtn}</span>
              </button>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-mono tabular-nums truncate">
                  {getChapterMeta(currentVerb.chapter)?.title || currentVerb.sourceLabel}
                  {currentVerb.section ? ` · ${currentVerb.section}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => speakGerman(currentVerb.verb)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{t.common.listen}</span>
                </button>
              </div>

              {quizType === 'mcq' ? (
                (() => {
                  const pa = getVerbPromptAndAnswer(currentVerb, direction);
                  return (
                    <>
                      <div className="text-center py-3 space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-bn">
                          {pa.prompt}
                        </div>
                        {pa.promptIsGerman && currentVerb.verbForms && (
                          <div className="text-xs sm:text-sm font-mono text-blue-700 dark:text-blue-400">
                            {t.practiceSections.verbFormsLabel}: {currentVerb.verbForms}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mcqOptions.map((opt) => {
                          const optInfo = getVerbPromptAndAnswer(opt, direction);
                          const isSelected = selectedMcqId === opt.id;
                          const isTarget = opt.id === currentVerb.id;

                          let btnStyle =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-blue-600 text-slate-900 dark:text-slate-100';
                          if (selectedMcqId) {
                            if (isTarget) {
                              btnStyle =
                                'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                            } else if (isSelected) {
                              btnStyle =
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                            } else {
                              btnStyle = 'border-slate-200 dark:border-slate-800 opacity-50 text-slate-500';
                            }
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={Boolean(selectedMcqId)}
                              onClick={() => handleSelectMcq(opt)}
                              className={`rounded-xl border p-4 min-h-[60px] text-left font-semibold text-sm sm:text-base transition-colors flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                            >
                              <span className="font-bn">{optInfo.answer}</span>
                              {selectedMcqId && isTarget && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              )}
                              {selectedMcqId && isSelected && !isTarget && (
                                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedMcqId && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="space-y-1 text-sm">
                            {selectedMcqId === currentVerb.id ? (
                              <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {t.study.correctFeedback} {currentVerb.verb}
                              </div>
                            ) : (
                              <div className="font-semibold text-rose-700 dark:text-rose-400">
                                {t.study.incorrectFeedback} {pa.answer}
                              </div>
                            )}
                            {currentVerb.verbForms && (
                              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                {t.practiceSections.verbFormsLabel}: {currentVerb.verbForms}
                              </div>
                            )}
                            {currentVerb.exampleGerman && (
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {currentVerb.exampleGerman}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shrink-0 cursor-pointer"
                          >
                            {t.study.nextQuestion}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                /* TYPE VERB QUIZ */
                <div className="space-y-4 max-w-lg mx-auto">
                  <div className="text-center space-y-1.5 py-2">
                    <div lang="bn" className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-bn">
                      {currentVerb.bangla || currentVerb.english || currentVerb.verb}
                    </div>
                    {currentVerb.english && currentVerb.bangla && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {currentVerb.english}
                      </div>
                    )}
                    {currentVerb.verbForms && (
                      <div className="text-xs font-mono text-blue-700 dark:text-blue-400">
                        {t.practiceSections.verbFormsLabel}: {currentVerb.verbForms}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={typedInput}
                    disabled={typedChecked !== null}
                    onChange={(e) => setTypedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCheckTyped();
                    }}
                    placeholder={t.practiceSections.typeVerbPlaceholder}
                    className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />

                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {UMLAUT_KEYS.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        disabled={typedChecked !== null}
                        onClick={() => setTypedInput((prev) => prev + ch)}
                        className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>

                  {typedChecked === null ? (
                    <button
                      type="button"
                      disabled={!typedInput.trim()}
                      onClick={handleCheckTyped}
                      className="w-full py-3 min-h-[48px] rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {t.study.checkAnswer}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {typedChecked ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {t.study.correctFeedback} {currentVerb.verb}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span className="text-rose-700 dark:text-rose-400">
                              {t.study.incorrectFeedback} {currentVerb.verb}
                            </span>
                          </>
                        )}
                      </div>
                      {currentVerb.exampleGerman && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {currentVerb.exampleGerman}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                      >
                        {t.study.nextQuestion}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
