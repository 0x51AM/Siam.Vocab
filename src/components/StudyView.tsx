import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Star,
  Volume2,
  XCircle,
} from 'lucide-react';
import { ALL_CHAPTERS, getChapterMeta } from '../data/demoVocab';
import { Translations } from '../i18n/translations';
import { speakGerman } from '../services/speechService';
import { isDueForReview, previewNextIntervalLabel, ReviewRating } from '../services/srsService';
import { StudyDirection, StudyMode, VocabItem } from '../types';
import { GermanText } from './GermanText';

export type DeckFilter = 'all' | 'due' | 'new' | 'mistakes' | 'favorites';

interface StudyViewProps {
  t: Translations;
  vocab: VocabItem[];
  direction: StudyDirection;
  mode: StudyMode;
  filter: DeckFilter;
  selectedChapter: string;
  onSelectChapter: (chapterKey: string) => void;
  onChangeMode: (mode: StudyMode) => void;
  onChangeFilter: (filter: DeckFilter) => void;
  onRateCard: (itemId: string, rating: ReviewRating, wasCorrect: boolean) => void;
  onToggleFavorite: (itemId: string) => void;
}

const UMLAUT_KEYS = ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'];

function getPromptAndAnswer(
  item: VocabItem,
  direction: StudyDirection
): {
  prompt: string;
  answer: string;
  promptIsGerman: boolean;
  answerIsGerman: boolean;
  secondaryHint: string;
} {
  switch (direction) {
    case 'bn-de':
      return {
        prompt: item.bangla || item.english,
        answer: item.german,
        promptIsGerman: false,
        answerIsGerman: true,
        secondaryHint: item.english,
      };
    case 'de-bn':
      return {
        prompt: item.german,
        answer: item.bangla || item.english,
        promptIsGerman: true,
        answerIsGerman: false,
        secondaryHint: item.english,
      };
    case 'en-de':
      return {
        prompt: item.english || item.bangla,
        answer: item.german,
        promptIsGerman: false,
        answerIsGerman: true,
        secondaryHint: item.bangla,
      };
    case 'de-en':
      return {
        prompt: item.german,
        answer: item.english || item.bangla,
        promptIsGerman: true,
        answerIsGerman: false,
        secondaryHint: item.bangla,
      };
  }
}

export function StudyView({
  t,
  vocab,
  direction,
  mode,
  filter,
  selectedChapter,
  onSelectChapter,
  onChangeMode,
  onChangeFilter,
  onRateCard,
  onToggleFavorite,
}: StudyViewProps) {
  const [sessionOffset, setSessionOffset] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [listeningChecked, setListeningChecked] = useState<boolean | null>(null);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);

  const activeMode: StudyMode = mode === 'image-quiz' ? 'flashcards' : mode;

  const chapterScopedVocab = useMemo(() => {
    if (selectedChapter === 'all') return vocab;
    if (selectedChapter === 'custom') {
      const keys = new Set(ALL_CHAPTERS.map((c) => c.chapterKey));
      return vocab.filter((v) => !v.chapter || !keys.has(v.chapter));
    }
    return vocab.filter((v) => v.chapter === selectedChapter);
  }, [vocab, selectedChapter]);

  const filteredQueue = useMemo(() => {
    return chapterScopedVocab.filter((item) => {
      if (filter === 'due') return isDueForReview(item);
      if (filter === 'new') return item.srs.status === 'new';
      if (filter === 'mistakes') return item.mistakeCount > 0;
      if (filter === 'favorites') return item.isFavorite;
      return true;
    });
  }, [chapterScopedVocab, filter]);

  // Keep current index stable within session
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  useEffect(() => {
    setSessionIds(filteredQueue.map((i) => i.id));
    setSessionOffset(0);
    setSessionCompletedCount(0);
    setIsFlipped(false);
    setSelectedOptionId(null);
    setTypedInput('');
    setListeningChecked(null);
  }, [activeMode, filter, direction, selectedChapter]);

  // Re-sync if queue was initially empty and items arrive
  useEffect(() => {
    if (sessionIds.length === 0 && filteredQueue.length > 0) {
      setSessionIds(filteredQueue.map((i) => i.id));
      setSessionOffset(0);
    }
  }, [filteredQueue, sessionIds.length]);

  const currentItem = useMemo(() => {
    const id = sessionIds[sessionOffset];
    if (!id) return null;
    return vocab.find((v) => v.id === id) || null;
  }, [sessionIds, sessionOffset, vocab]);

  const advanceCard = useCallback(() => {
    setIsFlipped(false);
    setSelectedOptionId(null);
    setTypedInput('');
    setListeningChecked(null);
    setSessionCompletedCount((c) => c + 1);
    setSessionOffset((idx) => idx + 1);
  }, []);

  const handleFlashcardRate = useCallback(
    (rating: ReviewRating) => {
      if (!currentItem) return;
      onRateCard(currentItem.id, rating, rating >= 2);
      advanceCard();
    },
    [currentItem, onRateCard, advanceCard]
  );

  // Multiple choice 4 options (prioritize distractors from the same chapter)
  const mcqOptions = useMemo(() => {
    if (!currentItem || vocab.length < 2) return [];
    const pool = chapterScopedVocab.length >= 4 ? chapterScopedVocab : vocab;
    const others = pool.filter((v) => v.id !== currentItem.id);
    const shuffled = [...others].sort((a, b) => {
      const ha = (a.id.charCodeAt(0) + sessionOffset * 7) % 19;
      const hb = (b.id.charCodeAt(0) + sessionOffset * 7) % 19;
      return ha - hb;
    });
    const picks = [currentItem, ...shuffled.slice(0, 3)];
    return picks.sort((a, b) => a.german.localeCompare(b.german));
  }, [currentItem, chapterScopedVocab, vocab, sessionOffset]);

  // Keyboard shortcuts for flashcard study
  useEffect(() => {
    if (activeMode !== 'flashcards' || !currentItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key.toLowerCase() === 'a') {
        speakGerman(currentItem.german);
      } else if (e.key.toLowerCase() === 'f') {
        onToggleFavorite(currentItem.id);
      } else if (isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
        handleFlashcardRate(Number(e.key) as ReviewRating);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMode, currentItem, isFlipped, handleFlashcardRate, onToggleFavorite]);

  const handleSelectMcqOption = (option: VocabItem) => {
    if (!currentItem || selectedOptionId) return;
    setSelectedOptionId(option.id);
    const correct = option.id === currentItem.id;
    onRateCard(currentItem.id, correct ? 3 : 1, correct);
    speakGerman(currentItem.german);
  };

  const handleCheckListening = () => {
    if (!currentItem || listeningChecked !== null) return;
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/,\s*(?:"-e|"-er|"-|-e|-en|-er|-n|-s|\(Sg\.\)|\(Pl\.\))/gi, '')
        .replace(/[.,!?]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const userAns = normalize(typedInput);
    const fullAns = normalize(currentItem.german);
    const bareAns = normalize(currentItem.germanWord);
    const correct = Boolean(userAns && (userAns === fullAns || userAns === bareAns));

    setListeningChecked(correct);
    onRateCard(currentItem.id, correct ? 3 : 1, correct);
  };

  const insertGermanChar = (ch: string) => {
    setTypedInput((prev) => prev + ch);
  };

  const restartSession = () => {
    setSessionIds(filteredQueue.map((i) => i.id));
    setSessionOffset(0);
    setSessionCompletedCount(0);
    setIsFlipped(false);
    setSelectedOptionId(null);
    setTypedInput('');
    setListeningChecked(null);
  };

  const shuffleSession = () => {
    const shuffled = [...filteredQueue].map((item) => item.id);
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSessionIds(shuffled);
    setSessionOffset(0);
    setSessionCompletedCount(0);
    setIsFlipped(false);
  };

  const goToPreviousCard = () => {
    setSessionOffset((index) => Math.max(0, index - 1));
    setIsFlipped(false);
  };

  const goToNextCard = () => {
    setSessionOffset((index) => Math.min(sessionIds.length - 1, index + 1));
    setIsFlipped(false);
  };

  const modeButtons: Array<{ id: StudyMode; label: string }> = [
    { id: 'flashcards', label: t.dashboard.practiceFlashcards },
    { id: 'mcq', label: t.dashboard.practiceMcq },
    { id: 'listening', label: t.dashboard.practiceListening },
  ];

  const filterButtons: Array<{ id: DeckFilter; label: string }> = [
    { id: 'all', label: t.study.filterAll },
    { id: 'due', label: t.study.filterDue },
    { id: 'new', label: t.study.filterNew },
    { id: 'mistakes', label: t.study.filterMistakes },
    { id: 'favorites', label: t.study.filterFavorites },
  ];

  const selectedChapterMeta =
    selectedChapter !== 'all' && selectedChapter !== 'custom'
      ? getChapterMeta(selectedChapter)
      : undefined;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Mode, Chapter & Deck Filter Controls */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t.study.selectMode}>
            {modeButtons.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeMode(m.id)}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeMode === m.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
              {t.study.cardsRemaining}: {Math.max(0, sessionIds.length - sessionOffset)} / {sessionIds.length}
            </div>
            {activeMode === 'flashcards' && (
              <button
                type="button"
                onClick={shuffleSession}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                এলোমেলো
              </button>
            )}
          </div>
        </div>

        {/* Chapter Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label
              htmlFor="study-chapter-select"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0"
            >
              {t.chapters.chapterLabel}:
            </label>
            <select
              id="study-chapter-select"
              value={selectedChapter}
              onChange={(e) => onSelectChapter(e.target.value)}
              className="flex-1 max-w-md px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-medium font-bn text-slate-900 dark:text-slate-100"
            >
              {ALL_CHAPTERS.map((ch) => {
                const count = vocab.filter((v) => v.chapter === ch.chapterKey && v.level === ch.level).length;
                return (
                  <option key={ch.chapterKey} value={ch.chapterKey}>
                    {ch.level} · {ch.title} ({count})
                  </option>
                );
              })}
              <option value="all">
                {t.chapters.allChapters} ({vocab.length})
              </option>
            </select>
          </div>
          {selectedChapterMeta && (
            <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400 shrink-0">
              {selectedChapterMeta.fileName}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            {t.study.selectFilter}:
          </span>
          {filterButtons.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChangeFilter(f.id)}
              className={`px-2.5 py-1.5 min-h-[34px] rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === f.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {sessionIds.length === 0 ? (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t.study.emptyQueueTitle}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.study.emptyQueueSub}</p>
        </section>
      ) : !currentItem ? (
        <section className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t.study.sessionComplete}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t.study.sessionCompleteSub} ({sessionCompletedCount})
            </p>
          </div>
          <button
            type="button"
            onClick={restartSession}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.study.restartSession}</span>
          </button>
        </section>
      ) : (
        <>
          {/* FLASHCARDS MODE (Text-Based, Lightweight) */}
          {activeMode === 'flashcards' && (
            <div className="space-y-4">
              {(() => {
                const pa = getPromptAndAnswer(currentItem, direction);
                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 space-y-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="truncate font-bn">
                        {currentItem.topic}
                        {currentItem.section ? ` · [${currentItem.section}]` : ''}
                        {currentItem.pdfName ? ` · ${currentItem.pdfName}` : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(currentItem.id)}
                        aria-label={t.common.favorite}
                        className="p-2 min-w-[36px] min-h-[36px] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            currentItem.isFavorite
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Card Front / Back */}
                    <div
                      onClick={() => setIsFlipped((f) => !f)}
                      className="cursor-pointer py-6 text-center space-y-3 select-none"
                    >
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {pa.promptIsGerman ? (
                          <GermanText german={pa.prompt} article={currentItem.article} />
                        ) : (
                          <span
                            className={direction === 'bn-de' ? 'font-bn' : undefined}
                            lang={direction === 'bn-de' ? 'bn' : undefined}
                          >
                            {pa.prompt}
                          </span>
                        )}
                      </div>

                      {pa.promptIsGerman && (
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakGerman(currentItem.german);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.common.listen}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speakGerman(currentItem.german, { rate: 0.65 });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <span>{t.common.slowListen}</span>
                          </button>
                        </div>
                      )}

                      {!isFlipped ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                          {t.study.flashcardFlip}
                        </p>
                      ) : (
                        <div className="mt-4 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
                          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                            {pa.answerIsGerman ? (
                              <GermanText german={pa.answer} article={currentItem.article} />
                            ) : (
                              <span
                                className={direction === 'de-bn' ? 'font-bn' : undefined}
                                lang={direction === 'de-bn' ? 'bn' : undefined}
                              >
                                {pa.answer}
                              </span>
                            )}
                          </div>

                          {pa.secondaryHint && (
                            <div
                              className={`text-sm text-slate-600 dark:text-slate-300 ${
                                direction === 'en-de' || direction === 'de-en' ? 'font-bn' : ''
                              }`}
                              lang={direction === 'en-de' || direction === 'de-en' ? 'bn' : undefined}
                            >
                              {pa.secondaryHint}
                            </div>
                          )}

                          {pa.answerIsGerman && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakGerman(currentItem.german);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>{t.common.listen}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakGerman(currentItem.german, { rate: 0.65 });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <span>{t.common.slowListen}</span>
                              </button>
                            </div>
                          )}

                          {currentItem.exampleGerman && (
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-left space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                  {t.study.exampleSentence}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakGerman(currentItem.exampleGerman!);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>{t.common.listen}</span>
                                </button>
                              </div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {currentItem.exampleGerman}
                              </p>
                              {currentItem.exampleBangla && (
                                <p lang="bn" className="text-xs font-bn text-slate-600 dark:text-slate-400">
                                  {currentItem.exampleBangla}
                                </p>
                              )}
                              {currentItem.exampleEnglish && (
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                  {currentItem.exampleEnglish}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Simple recall choices */}
                    {isFlipped ? (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleFlashcardRate(1)}
                          className="rounded-xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-4 min-h-[58px] text-rose-700 dark:text-rose-300 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-950/60"
                        >
                          ✕ আবার শিখব
                          <span className="block text-[11px] font-normal opacity-75">পরে আবার দেখাও</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFlashcardRate(3)}
                          className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-4 min-h-[58px] text-emerald-700 dark:text-emerald-300 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                        >
                          ✓ আমি জানি
                          <span className="block text-[11px] font-normal opacity-75">পরের শব্দে যাও</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setIsFlipped(true)}
                          className="w-full sm:w-auto px-8 py-3 min-h-[48px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
                        >
                          উত্তর দেখুন
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={goToPreviousCard}
                        disabled={sessionOffset === 0}
                        className="px-4 py-2.5 min-h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40"
                      >
                        ← আগের কার্ড
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {sessionOffset + 1} / {sessionIds.length}
                      </span>
                      <button
                        type="button"
                        onClick={goToNextCard}
                        disabled={sessionOffset >= sessionIds.length - 1}
                        className="px-4 py-2.5 min-h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold disabled:opacity-40"
                      >
                        পরের কার্ড →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* MULTIPLE CHOICE MODE */}
          {activeMode === 'mcq' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-5 shadow-sm">
              {(() => {
                const pa = getPromptAndAnswer(currentItem, direction);
                return (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="font-bn">
                        {currentItem.topic}
                        {currentItem.section ? ` · [${currentItem.section}]` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakGerman(currentItem.german)}
                        className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{t.common.listen}</span>
                      </button>
                    </div>

                    <div className="text-center py-4 space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {pa.promptIsGerman ? (
                          <GermanText german={pa.prompt} article={currentItem.article} />
                        ) : (
                          <span
                            className={direction === 'bn-de' ? 'font-bn' : undefined}
                            lang={direction === 'bn-de' ? 'bn' : undefined}
                          >
                            {pa.prompt}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mcqOptions.map((opt) => {
                        const optInfo = getPromptAndAnswer(opt, direction);
                        const isSelected = selectedOptionId === opt.id;
                        const isTarget = opt.id === currentItem.id;

                        let btnClass =
                          'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-emerald-500 text-slate-900 dark:text-slate-100';
                        if (selectedOptionId) {
                          if (isTarget) {
                            btnClass =
                              'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                          } else if (isSelected) {
                            btnClass =
                              'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                          } else {
                            btnClass =
                              'border-slate-200 dark:border-slate-800 opacity-55 text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={Boolean(selectedOptionId)}
                            onClick={() => handleSelectMcqOption(opt)}
                            className={`rounded-xl border p-4 min-h-[60px] text-left font-semibold text-sm sm:text-base transition-colors flex items-center justify-between gap-2 cursor-pointer ${btnClass}`}
                          >
                            <span
                              className={direction === 'de-bn' ? 'font-bn' : undefined}
                              lang={direction === 'de-bn' ? 'bn' : undefined}
                            >
                              {optInfo.answer}
                            </span>
                            {selectedOptionId && isTarget && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {selectedOptionId && isSelected && !isTarget && (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedOptionId && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-sm font-medium">
                          {selectedOptionId === currentItem.id ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {t.study.correctFeedback}
                            </span>
                          ) : (
                            <span className="text-rose-700 dark:text-rose-400">
                              {t.study.incorrectFeedback} {pa.answer}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={advanceCard}
                          className="px-6 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
                        >
                          {t.study.nextQuestion}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* LISTENING PRACTICE MODE */}
          {activeMode === 'listening' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-5 shadow-sm">
              <div className="text-center space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.study.playAudioPrompt}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => speakGerman(currentItem.german)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>{t.common.listen}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakGerman(currentItem.german, { rate: 0.65 })}
                    className="inline-flex items-center gap-2 px-4 py-3.5 min-h-[52px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span>{t.common.slowListen}</span>
                  </button>
                </div>
                <p lang="bn" className="text-xs font-bn text-slate-500 dark:text-slate-400">
                  {currentItem.bangla} · {currentItem.english}
                </p>
              </div>

              <div className="space-y-3 max-w-lg mx-auto">
                <input
                  type="text"
                  value={typedInput}
                  disabled={listeningChecked !== null}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheckListening();
                  }}
                  placeholder={t.study.typeGermanPlaceholder}
                  className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />

                {/* Clickable Umlaut & ß keyboard helpers */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {UMLAUT_KEYS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      disabled={listeningChecked !== null}
                      onClick={() => insertGermanChar(ch)}
                      className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {ch}
                    </button>
                  ))}
                </div>

                {listeningChecked === null ? (
                  <button
                    type="button"
                    onClick={handleCheckListening}
                    disabled={!typedInput.trim()}
                    className="w-full py-3 min-h-[48px] rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    {t.study.checkAnswer}
                  </button>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {listeningChecked ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {t.study.correctFeedback}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <span className="text-rose-700 dark:text-rose-400">
                            {t.study.incorrectFeedback}{' '}
                            <GermanText german={currentItem.german} article={currentItem.article} />
                          </span>
                        </>
                      )}
                    </div>
                    {currentItem.exampleGerman && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {currentItem.exampleGerman}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={advanceCard}
                      className="w-full py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
                    >
                      {t.study.nextQuestion}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
