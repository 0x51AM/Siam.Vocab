import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Headphones,
  Layers,
  Play,
  RotateCcw,
  Star,
  Target,
  Trash2,
} from 'lucide-react';
import { ALL_CHAPTERS, B1_CHAPTERS } from '../data/demoVocab';
import { Translations } from '../i18n/translations';
import { isDueForReview } from '../services/srsService';
import {
  DailyStats,
  StudyMode,
  VocabItem,
} from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardViewProps {
  t: Translations;
  vocab: VocabItem[];
  stats: DailyStats;
  onUpdateDailyGoal: (goal: number) => void;
  onStartStudy: (
    mode: StudyMode,
    filter: 'all' | 'due' | 'new' | 'mistakes' | 'favorites',
    chapterKey?: string
  ) => void;
  onOpenChapter: (chapterKey: string) => void;
  onClearDemoData: () => void;
  onRestoreDemoData: () => void;
}

export function DashboardView({
  t,
  vocab,
  stats,
  onUpdateDailyGoal,
  onStartStudy,
  onOpenChapter,
  onClearDemoData,
  onRestoreDemoData,
}: DashboardViewProps) {
  const demoCount = vocab.filter((v) => v.source === 'demo').length;
  const masteredCount = vocab.filter((v) => v.srs.status === 'mastered').length;
  const dueCount = vocab.filter((v) => isDueForReview(v)).length;
  const mistakeItemsCount = vocab.filter((v) => v.mistakeCount > 0).length;
  const favoriteCount = vocab.filter((v) => v.isFavorite).length;

  const accuracyPct =
    stats.reviewedCount > 0
      ? Math.round((stats.correctCount / stats.reviewedCount) * 100)
      : 100;

  const goalPct = Math.min(
    100,
    Math.round((stats.reviewedCount / Math.max(1, stats.dailyGoal)) * 100)
  );

  const chapterSummaries = B1_CHAPTERS.map((ch) => {
    const chItems = vocab.filter((v) => v.chapter === ch.chapterKey);
    const chMastered = chItems.filter((v) => v.srs.status === 'mastered').length;
    const chDue = chItems.filter((v) => isDueForReview(v)).length;
    return {
      ...ch,
      total: chItems.length,
      mastered: chMastered,
      due: chDue,
    };
  });

  return (
    <div className="space-y-6">
      {/* Hero Progress & Start Learning Banner */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              {t.tagline}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {t.dashboard.welcomeTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-bn">
              {t.dashboard.welcomeSubtitle}
            </p>

            {/* Daily progress bar */}
            <div className="pt-3 space-y-2 max-w-lg">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {t.dashboard.todayProgress}
                </span>
                <span className="font-mono-tabular font-semibold text-blue-700 dark:text-blue-400">
                  {stats.reviewedCount} / {stats.dailyGoal} ({goalPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <label htmlFor="daily-goal-select" className="font-medium">
                  {t.dashboard.dailyGoal}:
                </label>
                <select
                  id="daily-goal-select"
                  value={stats.dailyGoal}
                  onChange={(e) => onUpdateDailyGoal(Number(e.target.value))}
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xs font-mono-tabular text-slate-800 dark:text-slate-200"
                >
                  {[10, 15, 20, 30, 50].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onStartStudy('flashcards', dueCount > 0 ? 'due' : 'all', '1')}
              disabled={vocab.length === 0}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 min-h-[54px] rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-base font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{t.common.startLearning}</span>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <PWAInstallButton t={t} compact />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Key Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.dashboard.dueForReview}</span>
            <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {dueCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {vocab.length} {t.dashboard.wordsCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.dashboard.learnedWords}</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {masteredCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {`${ALL_CHAPTERS.length} ${t.chapters.chapterLabel} · ${vocab.length} ${t.dashboard.wordsCount}`}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.dashboard.accuracy}</span>
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {accuracyPct}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {stats.correctCount}/{stats.reviewedCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.dashboard.streak}</span>
            <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
            {stats.streakDays}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.days}</div>
        </div>
      </section>

      {/* 12 Separate B1 Chapters Navigation Grid */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-bn">
              {t.chapters.heading}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bn">
              {t.chapters.subheading}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chapterSummaries.map((ch) => {
            const pct = ch.total > 0 ? Math.round((ch.mastered / ch.total) * 100) : 0;
            return (
              <div
                key={ch.chapterKey}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between gap-3 hover:border-blue-500 dark:hover:border-blue-600 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono-tabular font-semibold text-blue-700 dark:text-blue-400">
                      {t.chapters.chapterLabel} {ch.chapterNumber}
                    </span>
                    <span className="font-mono-tabular">{ch.fileName}</span>
                  </div>
                  <h3
                    lang="bn"
                    className="text-base font-bold text-slate-900 dark:text-slate-100 font-bn"
                  >
                    {ch.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono-tabular pt-0.5">
                    <span>
                      {ch.total} {t.dashboard.wordsCount}
                    </span>
                    <span>
                      {ch.mastered}/{ch.total} {t.chapters.masteredCount}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenChapter(ch.chapterKey)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span>{t.chapters.openChapter}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartStudy('flashcards', 'all', ch.chapterKey)}
                    disabled={ch.total === 0}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{t.chapters.practiceChapter}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Restore / Demo Notice (only if demo items exist or library is empty) */}
      {demoCount > 0 ? (
        <section className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              {t.dashboard.demoNoticeTitle} ({demoCount} {t.dashboard.wordsCount})
            </div>
            <p className="text-xs sm:text-sm text-amber-900/80 dark:text-amber-300/80">
              {t.dashboard.demoNoticeBody}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearDemoData}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.dashboard.clearDemoBtn}</span>
          </button>
        </section>
      ) : vocab.length === 0 ? (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            0 {t.dashboard.wordsCount}
          </p>
          <button
            type="button"
            onClick={onRestoreDemoData}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.dashboard.restoreDemoBtn}</span>
          </button>
        </section>
      ) : null}

      {/* Mastery by CEFR level */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Mastery by level
        </h2>
        <div className="space-y-3">
          {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((level) => {
            const levelItems = vocab.filter((item) => item.level === level);
            const levelMastered = levelItems.filter((item) => item.srs.status === 'mastered').length;
            const pct = levelItems.length > 0 ? Math.round((levelMastered / levelItems.length) * 100) : 0;
            return (
              <div key={level} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] sm:grid-cols-[5rem_minmax(0,1fr)_3rem] items-center gap-3">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{level}</span>
                <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-100">
                    {levelMastered}/{levelItems.length}
                  </span>
                </div>
                <span className="text-sm font-bold text-right tabular-nums text-slate-800 dark:text-slate-200">{pct}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weakest vocabulary */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Weakest words
        </h2>
        {mistakeItemsCount === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No activity yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...vocab]
              .filter((item) => item.mistakeCount > 0)
              .sort((a, b) => b.mistakeCount - a.mistakeCount)
              .slice(0, 5)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.german}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.bangla || item.english}</div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-rose-600 dark:text-rose-400">{item.mistakeCount} mistakes</span>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Sentence building connector stats */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Sentence building (connector stats)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No sentence-building activity yet.
        </p>
      </section>

      {/* Quick Learning Mode Launchers (Clean, Text-Based Modes) */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t.dashboard.quickActions}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onStartStudy('flashcards', 'all', '1')}
            className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors flex items-start gap-3.5 cursor-pointer"
          >
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t.dashboard.practiceFlashcards}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                SM-2 Spaced Repetition · {dueCount} {t.study.filterDue}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onStartStudy('mcq', 'all', '1')}
            className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors flex items-start gap-3.5 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t.dashboard.practiceMcq}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4 options · Instant feedback
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onStartStudy('listening', 'all', '1')}
            className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors flex items-start gap-3.5 cursor-pointer"
          >
            <Headphones className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t.dashboard.practiceListening}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                German pronunciation & typing
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onStartStudy('flashcards', 'mistakes', 'all')}
            className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors flex items-start gap-3.5 cursor-pointer"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t.dashboard.reviewMistakes}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-tabular">
                {mistakeItemsCount} {t.dashboard.wordsCount}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onStartStudy('flashcards', 'favorites', 'all')}
            className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors flex items-start gap-3.5 cursor-pointer"
          >
            <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t.dashboard.studyFavorites}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-tabular">
                {favoriteCount} {t.dashboard.wordsCount}
              </div>
            </div>
          </button>
        </div>
      </section>

    </div>
  );
}
