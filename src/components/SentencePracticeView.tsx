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
  SentencePracticeEntry,
  StudyDirection,
} from '../types';
import { FilterOption, PracticeToolbar } from './PracticeToolbar';

interface SentencePracticeViewProps {
  t: Translations;
  direction: StudyDirection;
  sentences: SentencePracticeEntry[];
  stats: PracticeSectionStats;
  onRecordAttempt: (itemId: string, wasCorrect: boolean) => void;
}

type SentenceExerciseMode = 'completion' | 'ordering' | 'translation';

const UMLAUT_KEYS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

function tokenizeGermanSentence(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean);
}

function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed + 17;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SentencePracticeView({
  t,
  direction,
  sentences,
  stats,
  onRecordAttempt,
}: SentencePracticeViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'quiz' | 'browse'>('quiz');
  const [exerciseMode, setExerciseMode] = useState<SentenceExerciseMode>('completion');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [missedOnly, setMissedOnly] = useState(false);
  const [visibleBrowseCount, setVisibleBrowseCount] = useState(50);

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);

  // Completion mode state
  const [chosenBlankWord, setChosenBlankWord] = useState<string | null>(null);
  const [typedBlankWord, setTypedBlankWord] = useState('');

  // Ordering mode state
  const [selectedTokenIndices, setSelectedTokenIndices] = useState<number[]>([]);
  const [orderingChecked, setOrderingChecked] = useState<boolean | null>(null);

  // Translation / dictation mode state
  const [selectedTransId, setSelectedTransId] = useState<string | null>(null);
  const [typedSentence, setTypedSentence] = useState('');
  const [dictationChecked, setDictationChecked] = useState<boolean | null>(null);

  const levelOptions = useMemo<FilterOption[]>(() => {
    const levels = new Set<string>();
    sentences.forEach((s) => levels.add(s.level));
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'Custom'];
    return order
      .filter((lvl) => levels.has(lvl))
      .map((lvl) => ({ value: lvl, label: lvl }));
  }, [sentences]);

  const chapterOptions = useMemo<FilterOption[]>(() => {
    const present = new Set<string>();
    sentences.forEach((s) => {
      if (selectedLevel !== 'all' && s.level !== selectedLevel) return;
      if (s.chapter) present.add(s.chapter);
    });
    const opts: FilterOption[] = [];
    ALL_CHAPTERS.forEach((ch) => {
      if (present.has(ch.chapterKey)) {
        opts.push({ value: ch.chapterKey, label: ch.title });
      }
    });
    return opts;
  }, [sentences, selectedLevel]);

  useEffect(() => {
    if (selectedChapter !== 'all' && !chapterOptions.some((c) => c.value === selectedChapter)) {
      setSelectedChapter('all');
    }
  }, [selectedLevel, chapterOptions, selectedChapter]);

  const filteredSentences = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const missedSet = new Set(stats.missedIds);

    return sentences.filter((item) => {
      if (selectedLevel !== 'all' && item.level !== selectedLevel) return false;
      if (selectedChapter !== 'all' && item.chapter !== selectedChapter) return false;
      if (missedOnly && !missedSet.has(item.id)) return false;
      if (q) {
        const hay = `${item.germanSentence} ${item.bangla || ''} ${item.english || ''} ${item.sourceWord || ''} ${item.sourceLabel} ${item.level}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sentences, selectedLevel, selectedChapter, searchQuery, missedOnly, stats.missedIds]);

  const resetQuestionStates = useCallback(() => {
    setChosenBlankWord(null);
    setTypedBlankWord('');
    setSelectedTokenIndices([]);
    setOrderingChecked(null);
    setSelectedTransId(null);
    setTypedSentence('');
    setDictationChecked(null);
  }, []);

  useEffect(() => {
    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const s of filteredSentences) {
      const k = s.germanSentence.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(k)) continue;
      seen.add(k);
      uniqueIds.push(s.id);
    }
    setQueueIds(uniqueIds);
    setCursor(0);
    resetQuestionStates();
    setVisibleBrowseCount(50);
  }, [filteredSentences, resetQuestionStates]);

  const currentSentence = useMemo(() => {
    const id = queueIds[cursor];
    if (!id) return null;
    return filteredSentences.find((s) => s.id === id) || null;
  }, [queueIds, cursor, filteredSentences]);

  // 1. Completion exercise derivation (target word + distractors solely from existing vocabulary sentences)
  const completionData = useMemo(() => {
    if (!currentSentence) return null;
    const rawTokens = tokenizeGermanSentence(currentSentence.germanSentence);
    const candidates = rawTokens
      .map((tok, idx) => ({
        idx,
        raw: tok,
        clean: tok.replace(/^[„"'(]+|[.,!?;:)"']+$/g, ''),
        suffix: tok.match(/[.,!?;:)"']+$/)?.[0] || '',
        prefix: tok.match(/^[„"'(]+/)?.[0] || '',
      }))
      .filter((c) => c.clean.length >= 3 && /^[A-Za-zÄÖÜäöüß-]+$/.test(c.clean));

    const target =
      candidates.length > 0
        ? candidates[Math.floor(candidates.length / 2)]
        : {
            idx: Math.max(0, rawTokens.length - 1),
            raw: rawTokens[rawTokens.length - 1] || '',
            clean: (rawTokens[rawTokens.length - 1] || '').replace(/[.,!?]+$/, ''),
            suffix: '',
            prefix: '',
          };

    const distractorWords: string[] = [];
    const seenWords = new Set<string>([target.clean.toLowerCase()]);
    const pool = filteredSentences.length > 1 ? filteredSentences : sentences;

    for (let offset = 1; offset < pool.length && distractorWords.length < 3; offset++) {
      const sent = pool[(cursor + offset * 3) % pool.length];
      for (const w of tokenizeGermanSentence(sent.germanSentence)) {
        const cleaned = w.replace(/^[„"'(]+|[.,!?;:)"']+$/g, '');
        if (
          cleaned.length >= 3 &&
          /^[A-Za-zÄÖÜäöüß-]+$/.test(cleaned) &&
          !seenWords.has(cleaned.toLowerCase())
        ) {
          seenWords.add(cleaned.toLowerCase());
          distractorWords.push(cleaned);
          break;
        }
      }
    }

    const options =
      distractorWords.length >= 2
        ? [target.clean, ...distractorWords].sort((a, b) => a.localeCompare(b))
        : [];

    return {
      rawTokens,
      targetIdx: target.idx,
      targetWord: target.clean,
      prefix: target.prefix,
      suffix: target.suffix,
      options,
    };
  }, [currentSentence, filteredSentences, sentences, cursor]);

  // 2. Word ordering derivation
  const orderingData = useMemo(() => {
    if (!currentSentence) return null;
    const tokens = tokenizeGermanSentence(currentSentence.germanSentence);
    let shuffledIndices = deterministicShuffle(
      tokens.map((_, i) => i),
      cursor * 31 + tokens.length
    );
    if (
      tokens.length >= 2 &&
      shuffledIndices.every((val, i) => val === i)
    ) {
      shuffledIndices = [...shuffledIndices.slice(1), shuffledIndices[0]];
    }
    return { tokens, shuffledIndices };
  }, [currentSentence, cursor]);

  // 3. Translation / Dictation derivation
  const translationChoices = useMemo(() => {
    if (!currentSentence) return [];
    const targetTrans =
      direction === 'de-en' || direction === 'en-de'
        ? currentSentence.english || currentSentence.bangla
        : currentSentence.bangla || currentSentence.english;
    if (!targetTrans) return [];

    const pool = filteredSentences.length >= 4 ? filteredSentences : sentences;
    const others = pool.filter((s) => {
      if (s.id === currentSentence.id) return false;
      const trans =
        direction === 'de-en' || direction === 'en-de'
          ? s.english || s.bangla
          : s.bangla || s.english;
      return Boolean(trans && trans.trim() !== targetTrans.trim());
    });

    if (others.length === 0) return [];
    const picks = [
      currentSentence,
      ...deterministicShuffle(others, cursor * 13).slice(0, 3),
    ];
    return picks.sort((a, b) => a.id.localeCompare(b.id));
  }, [currentSentence, filteredSentences, sentences, direction, cursor]);

  const handleCompletionAnswer = (word: string) => {
    if (!currentSentence || !completionData || chosenBlankWord !== null) return;
    setChosenBlankWord(word);
    const correct = word.trim().toLowerCase() === completionData.targetWord.toLowerCase();
    onRecordAttempt(currentSentence.id, correct);
    speakGerman(currentSentence.germanSentence);
  };

  const handleCheckOrdering = () => {
    if (!currentSentence || !orderingData || orderingChecked !== null) return;
    const built = selectedTokenIndices.map((idx) => orderingData.tokens[idx]).join(' ');
    const correct = built.trim() === orderingData.tokens.join(' ').trim();
    setOrderingChecked(correct);
    onRecordAttempt(currentSentence.id, correct);
    speakGerman(currentSentence.germanSentence);
  };

  const handleSelectTranslation = (opt: SentencePracticeEntry) => {
    if (!currentSentence || selectedTransId) return;
    setSelectedTransId(opt.id);
    const correct = opt.id === currentSentence.id;
    onRecordAttempt(currentSentence.id, correct);
    speakGerman(currentSentence.germanSentence);
  };

  const handleCheckDictation = () => {
    if (!currentSentence || dictationChecked !== null) return;
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/[.,!?;:„"'()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const correct = Boolean(
      typedSentence.trim() && norm(typedSentence) === norm(currentSentence.germanSentence)
    );
    setDictationChecked(correct);
    onRecordAttempt(currentSentence.id, correct);
    speakGerman(currentSentence.germanSentence);
  };

  const handleNext = () => {
    resetQuestionStates();
    setCursor((c) => c + 1);
  };

  const handleShuffle = () => {
    const next = [...queueIds];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setQueueIds(next);
    setCursor(0);
    resetQuestionStates();
  };

  const handleRestart = () => {
    setCursor(0);
    resetQuestionStates();
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PracticeToolbar
        t={t}
        title={t.practiceSections.sentenceTitle}
        subtitle={t.practiceSections.sentenceSub}
        stats={stats}
        totalPoolCount={filteredSentences.length}
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
          {filteredSentences.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
              {t.practiceSections.noItemsInScope}
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {filteredSentences.slice(0, visibleBrowseCount).map((item) => {
                  const chMeta = getChapterMeta(item.chapter);
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {chMeta ? chMeta.title : item.sourceLabel}
                          {item.sourceWord ? ` · ${item.sourceWord}` : ''}
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                          {item.germanSentence}
                        </p>
                        {item.bangla && (
                          <p lang="bn" className="text-xs sm:text-sm font-bn text-slate-700 dark:text-slate-300">
                            {item.bangla}
                          </p>
                        )}
                        {item.english && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.english}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakGerman(item.germanSentence)}
                        aria-label={t.common.listen}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </article>
                  );
                })}
              </div>
              {filteredSentences.length > visibleBrowseCount && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleBrowseCount((c) => c + 50)}
                    className="px-5 py-2.5 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    +50 ({visibleBrowseCount} / {filteredSentences.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* INTERACTIVE PRACTICE (ONE SENTENCE AT A TIME) */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['completion', t.practiceSections.completionMode],
                  ['ordering', t.practiceSections.orderingMode],
                  ['translation', t.practiceSections.translationMode],
                ] as const
              ).map(([modeKey, label]) => (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => {
                    setExerciseMode(modeKey);
                    resetQuestionStates();
                  }}
                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    exerciseMode === modeKey
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
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
          ) : !currentSentence ? (
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
              {/* Top Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-mono tabular-nums truncate">
                  {getChapterMeta(currentSentence.chapter)?.title || currentSentence.sourceLabel}
                  {currentSentence.sourceWord ? ` · ${currentSentence.sourceWord}` : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakGerman(currentSentence.germanSentence)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t.common.listen}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakGerman(currentSentence.germanSentence, { rate: 0.7 })}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    {t.common.slowListen}
                  </button>
                </div>
              </div>

              {/* EXERCISE 1: SENTENCE COMPLETION */}
              {exerciseMode === 'completion' && completionData && (
                <div className="space-y-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-bn text-center">
                    {t.practiceSections.pickMissingWord}
                  </p>

                  <div className="text-center text-xl sm:text-2xl font-bold leading-relaxed text-slate-900 dark:text-slate-100 px-2">
                    {completionData.rawTokens.map((tok, idx) =>
                      idx === completionData.targetIdx ? (
                        <span key={idx} className="mx-1">
                          {completionData.prefix}
                          <span
                            className={`inline-block min-w-[5rem] px-2 border-b-2 ${
                              chosenBlankWord === null
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : chosenBlankWord.toLowerCase() ===
                                    completionData.targetWord.toLowerCase()
                                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                                  : 'border-rose-600 text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {chosenBlankWord === null ? '_____' : completionData.targetWord}
                          </span>
                          {completionData.suffix}
                        </span>
                      ) : (
                        <span key={idx} className="mx-1">
                          {tok}
                        </span>
                      )
                    )}
                  </div>

                  {(currentSentence.bangla || currentSentence.english) && (
                    <div className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-bn">
                      {currentSentence.bangla || currentSentence.english}
                    </div>
                  )}

                  {completionData.options.length >= 2 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {completionData.options.map((word) => {
                        const isTarget =
                          word.toLowerCase() === completionData.targetWord.toLowerCase();
                        const isSelected = chosenBlankWord === word;

                        let style =
                          'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-blue-600 text-slate-900 dark:text-slate-100';
                        if (chosenBlankWord !== null) {
                          if (isTarget) {
                            style =
                              'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                          } else if (isSelected) {
                            style =
                              'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                          } else {
                            style = 'border-slate-200 dark:border-slate-800 opacity-50 text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={word}
                            type="button"
                            disabled={chosenBlankWord !== null}
                            onClick={() => handleCompletionAnswer(word)}
                            className={`rounded-xl border p-3.5 min-h-[52px] text-base font-semibold transition-colors flex items-center justify-between gap-2 cursor-pointer ${style}`}
                          >
                            <span>{word}</span>
                            {chosenBlankWord !== null && isTarget && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {chosenBlankWord !== null && isSelected && !isTarget && (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto space-y-2.5">
                      <input
                        type="text"
                        value={typedBlankWord}
                        disabled={chosenBlankWord !== null}
                        onChange={(e) => setTypedBlankWord(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && typedBlankWord.trim()) {
                            handleCompletionAnswer(typedBlankWord);
                          }
                        }}
                        placeholder="..."
                        className="w-full px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                      />
                      {chosenBlankWord === null && (
                        <button
                          type="button"
                          disabled={!typedBlankWord.trim()}
                          onClick={() => handleCompletionAnswer(typedBlankWord)}
                          className="w-full py-2.5 min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          {t.study.checkAnswer}
                        </button>
                      )}
                    </div>
                  )}

                  {chosenBlankWord !== null && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-sm font-semibold">
                        {chosenBlankWord.toLowerCase() ===
                        completionData.targetWord.toLowerCase() ? (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {t.study.correctFeedback}
                          </span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400">
                            {t.study.incorrectFeedback} {completionData.targetWord}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                      >
                        {t.study.nextQuestion}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EXERCISE 2: WORD ORDERING */}
              {exerciseMode === 'ordering' && orderingData && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 font-bn">
                      {t.practiceSections.arrangeWordsPrompt}
                    </p>
                    {(currentSentence.bangla || currentSentence.english) && (
                      <p lang="bn" className="text-sm font-medium font-bn text-slate-800 dark:text-slate-200">
                        {currentSentence.bangla || currentSentence.english}
                      </p>
                    )}
                  </div>

                  {/* Assembled Sentence Drop Area */}
                  <div className="min-h-[68px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 flex flex-wrap items-center gap-2">
                    {selectedTokenIndices.map((tokIdx, pos) => (
                      <button
                        key={`${tokIdx}-${pos}`}
                        type="button"
                        disabled={orderingChecked !== null}
                        onClick={() =>
                          setSelectedTokenIndices((prev) => prev.filter((_, i) => i !== pos))
                        }
                        className="px-3 py-1.5 min-h-[36px] rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        {orderingData.tokens[tokIdx]}
                      </button>
                    ))}
                  </div>

                  {/* Available Shuffled Words */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {orderingData.shuffledIndices.map((tokIdx) => {
                      const alreadyPicked = selectedTokenIndices.includes(tokIdx);
                      return (
                        <button
                          key={tokIdx}
                          type="button"
                          disabled={alreadyPicked || orderingChecked !== null}
                          onClick={() => setSelectedTokenIndices((prev) => [...prev, tokIdx])}
                          className={`px-3.5 py-2 min-h-[40px] rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                            alreadyPicked
                              ? 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-40'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-blue-600'
                          }`}
                        >
                          {orderingData.tokens[tokIdx]}
                        </button>
                      );
                    })}
                  </div>

                  {orderingChecked === null ? (
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        disabled={selectedTokenIndices.length === 0}
                        onClick={() => setSelectedTokenIndices([])}
                        className="px-4 py-2.5 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        {t.practiceSections.clearOrderBtn}
                      </button>
                      <button
                        type="button"
                        disabled={selectedTokenIndices.length < orderingData.tokens.length}
                        onClick={handleCheckOrdering}
                        className="px-6 py-2.5 min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        {t.study.checkAnswer}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                          {orderingChecked ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {t.study.correctFeedback}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              <span className="text-rose-700 dark:text-rose-400">
                                {t.study.incorrectFeedback}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {currentSentence.germanSentence}
                        </p>
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
                </div>
              )}

              {/* EXERCISE 3: TRANSLATION / DICTATION */}
              {exerciseMode === 'translation' && (
                <div className="space-y-5">
                  {translationChoices.length >= 2 ? (
                    <>
                      <div className="text-center py-2 space-y-1.5">
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {currentSentence.germanSentence}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 max-w-2xl mx-auto">
                        {translationChoices.map((opt) => {
                          const label =
                            direction === 'de-en' || direction === 'en-de'
                              ? opt.english || opt.bangla || ''
                              : opt.bangla || opt.english || '';
                          const isTarget = opt.id === currentSentence.id;
                          const isSelected = selectedTransId === opt.id;

                          let style =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-blue-600 text-slate-900 dark:text-slate-100';
                          if (selectedTransId) {
                            if (isTarget) {
                              style =
                                'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                            } else if (isSelected) {
                              style =
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                            } else {
                              style = 'border-slate-200 dark:border-slate-800 opacity-50 text-slate-500';
                            }
                          }

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={Boolean(selectedTransId)}
                              onClick={() => handleSelectTranslation(opt)}
                              className={`rounded-xl border p-4 min-h-[54px] text-left font-medium text-sm sm:text-base transition-colors flex items-center justify-between gap-2 cursor-pointer ${style}`}
                            >
                              <span lang="bn" className="font-bn">
                                {label}
                              </span>
                              {selectedTransId && isTarget && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              )}
                              {selectedTransId && isSelected && !isTarget && (
                                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedTransId && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="text-sm font-semibold">
                            {selectedTransId === currentSentence.id ? (
                              <span className="text-emerald-700 dark:text-emerald-400">
                                {t.study.correctFeedback}
                              </span>
                            ) : (
                              <span className="text-rose-700 dark:text-rose-400 font-bn">
                                {t.study.incorrectFeedback}{' '}
                                {direction === 'de-en' || direction === 'en-de'
                                  ? currentSentence.english || currentSentence.bangla
                                  : currentSentence.bangla || currentSentence.english}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                          >
                            {t.study.nextQuestion}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Dictation fallback when no separate sentence translation exists in vocabulary data */
                    <div className="space-y-4 max-w-xl mx-auto">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bn text-center">
                        {currentSentence.bangla || currentSentence.english
                          ? currentSentence.bangla || currentSentence.english
                          : t.practiceSections.noSentenceTranslationInData}
                      </p>

                      {dictationChecked !== null && (
                        <div className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">
                          {currentSentence.germanSentence}
                        </div>
                      )}

                      <input
                        type="text"
                        value={typedSentence}
                        disabled={dictationChecked !== null}
                        onChange={(e) => setTypedSentence(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCheckDictation();
                        }}
                        placeholder={t.study.typeGermanPlaceholder}
                        className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm sm:text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />

                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {UMLAUT_KEYS.map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            disabled={dictationChecked !== null}
                            onClick={() => setTypedSentence((prev) => prev + ch)}
                            className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            {ch}
                          </button>
                        ))}
                      </div>

                      {dictationChecked === null ? (
                        <button
                          type="button"
                          disabled={!typedSentence.trim()}
                          onClick={handleCheckDictation}
                          className="w-full py-3 min-h-[48px] rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          {t.study.checkAnswer}
                        </button>
                      ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {dictationChecked ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  {t.study.correctFeedback}
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                <span className="text-rose-700 dark:text-rose-400">
                                  {t.study.incorrectFeedback} {currentSentence.germanSentence}
                                </span>
                              </>
                            )}
                          </div>
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
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
