import { Search } from 'lucide-react';
import { Translations } from '../i18n/translations';
import { PracticeSectionStats } from '../types';

export interface FilterOption {
  value: string;
  label: string;
}

interface PracticeToolbarProps {
  t: Translations;
  title: string;
  subtitle: string;
  stats: PracticeSectionStats;
  totalPoolCount: number;
  levelOptions: FilterOption[];
  selectedLevel: string;
  onSelectLevel: (val: string) => void;
  chapterOptions: FilterOption[];
  selectedChapter: string;
  onSelectChapter: (val: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeSubTab: 'quiz' | 'browse';
  onChangeSubTab: (tab: 'quiz' | 'browse') => void;
}

export function PracticeToolbar({
  t,
  title,
  subtitle,
  stats,
  totalPoolCount,
  levelOptions,
  selectedLevel,
  onSelectLevel,
  chapterOptions,
  selectedChapter,
  onSelectChapter,
  searchQuery,
  onSearchChange,
  activeSubTab,
  onChangeSubTab,
}: PracticeToolbarProps) {
  const accuracy =
    stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
          {t.practiceSections.sourceVocabulary}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-bn">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bn">
          {subtitle}
        </p>
      </div>

      {/* Progress & Score Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {t.practiceSections.answeredLabel}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.answered}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {t.practiceSections.accuracyLabel}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400 mt-0.5">
            {accuracy}%
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {t.practiceSections.streakLabel}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.streak}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {t.practiceSections.masteredLabel}
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.masteredIds.length} / {totalPoolCount}
          </div>
        </div>
      </section>

      {/* Sub-tabs & Level / Chapter / Search Filters */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            <button
              type="button"
              onClick={() => onChangeSubTab('quiz')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'quiz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.practiceSections.quizTab}
            </button>
            <button
              type="button"
              onClick={() => onChangeSubTab('browse')}
              className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'browse'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.practiceSections.browseTab} ({totalPoolCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.practiceSections.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            aria-label={t.common.level}
            value={selectedLevel}
            onChange={(e) => onSelectLevel(e.target.value)}
            className="px-3 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t.practiceSections.allLevels}</option>
            {levelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label={t.common.chapter}
            value={selectedChapter}
            onChange={(e) => onSelectChapter(e.target.value)}
            disabled={chapterOptions.length === 0}
            className="px-3 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="all">{t.practiceSections.allChapters}</option>
            {chapterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
}
