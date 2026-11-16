import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { ALL_CHAPTERS, getChapterMeta, parseGermanHeadword } from '../data/demoVocab';
import { Translations } from '../i18n/translations';
import { speakGerman } from '../services/speechService';
import { isDueForReview } from '../services/srsService';
import { CefrLevel, StudyMode, VocabItem } from '../types';
import { isUncertainBengaliMeaning, repairBengaliUnicode } from '../utils/bengaliUnicode';
import { GermanText } from './GermanText';

interface VocabularyViewProps {
  t: Translations;
  vocab: VocabItem[];
  selectedChapter: string | null;
  onSelectChapter: (chapterKey: string | null) => void;
  onStartChapterStudy: (chapterKey: string, mode?: StudyMode) => void;
  onToggleFavorite: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveItem: (item: VocabItem, isNew: boolean) => void;
}

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'Custom'];
const BUILT_IN_CHAPTER_KEYS = new Set(ALL_CHAPTERS.map((c) => c.chapterKey));

export function VocabularyView({
  t,
  vocab,
  selectedChapter,
  onSelectChapter,
  onStartChapterStudy,
  onToggleFavorite,
  onDeleteItem,
  onSaveItem,
}: VocabularyViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedPdf, setSelectedPdf] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'due' | 'mastered' | 'mistakes' | 'favorites' | 'needs-review'
  >('all');

  const [editingItem, setEditingItem] = useState<VocabItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(60);

  // Edit / Create form state
  const [formGerman, setFormGerman] = useState('');
  const [formBangla, setFormBangla] = useState('');
  const [formEnglish, setFormEnglish] = useState('');
  const [formExampleGerman, setFormExampleGerman] = useState('');
  const [formTopic, setFormTopic] = useState('Alltag');
  const [formLevel, setFormLevel] = useState<CefrLevel>('B1');
  const [formPage, setFormPage] = useState('');

  // Reset per-chapter filters when switching chapters
  useEffect(() => {
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedPdf('all');
    setSelectedStatus('all');
    setVisibleCount(60);
  }, [selectedChapter]);

  useEffect(() => {
    setVisibleCount(60);
  }, [searchQuery, selectedSection, selectedPdf, selectedStatus]);

  const chapterSummaries = useMemo(() => {
    return ALL_CHAPTERS.map((ch) => {
      const items = vocab.filter((v) => v.chapter === ch.chapterKey && v.level === ch.level);
      const mastered = items.filter((v) => v.srs.status === 'mastered').length;
      const due = items.filter((v) => isDueForReview(v)).length;
      return {
        ...ch,
        items,
        total: items.length,
        mastered,
        due,
      };
    });
  }, [vocab]);

  const customItems = useMemo(
    () => vocab.filter((v) => !v.chapter || !BUILT_IN_CHAPTER_KEYS.has(v.chapter)),
    [vocab]
  );

  // Strictly scope items to ONLY the selected chapter (never merge the 12 chapters!)
  const chapterItems = useMemo(() => {
    if (!selectedChapter) return [];
    if (selectedChapter === 'custom') return customItems;
    return vocab.filter((v) => v.chapter === selectedChapter);
  }, [vocab, selectedChapter, customItems]);

  const activeChapterMeta = useMemo(
    () => (selectedChapter && selectedChapter !== 'custom' ? getChapterMeta(selectedChapter) : undefined),
    [selectedChapter]
  );

  const chapterSections = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();
    chapterItems.forEach((item) => {
      if (item.section && !seen.has(item.section)) {
        seen.add(item.section);
        ordered.push(item.section);
      }
    });
    return ordered;
  }, [chapterItems]);

  const pdfFilterOptions = useMemo(() => {
    const options = new Map<string, string>();
    chapterItems.forEach((v) => {
      if (v.source === 'manual') {
        options.set('source:manual', 'Manual');
      } else if (v.level) {
        options.set(`level:${v.level}`, v.level);
      }
    });
    return Array.from(options.entries());
  }, [chapterItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return chapterItems.filter((item) => {
      if (q) {
        const hay = `${item.german} ${item.bangla} ${item.english} ${item.exampleGerman || ''} ${item.section || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (selectedSection !== 'all' && item.section !== selectedSection) return false;

      if (selectedPdf !== 'all') {
        if (selectedPdf === 'source:manual' && item.source !== 'manual') return false;
        if (selectedPdf.startsWith('level:') && item.level !== selectedPdf.slice(6)) return false;
      }

      if (selectedStatus === 'due' && !isDueForReview(item)) return false;
      if (selectedStatus === 'mastered' && item.srs.status !== 'mastered') return false;
      if (selectedStatus === 'mistakes' && item.mistakeCount === 0) return false;
      if (selectedStatus === 'favorites' && !item.isFavorite) return false;
      if (selectedStatus === 'needs-review' && !item.needsReview) return false;

      return true;
    });
  }, [chapterItems, searchQuery, selectedSection, selectedPdf, selectedStatus]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  const needsReviewCount = useMemo(
    () => chapterItems.filter((v) => v.needsReview).length,
    [chapterItems]
  );

  const openEditModal = (item: VocabItem) => {
    setIsCreatingNew(false);
    setEditingItem(item);
    setFormGerman(item.german);
    setFormBangla(item.bangla);
    setFormEnglish(item.english);
    setFormExampleGerman(item.exampleGerman || '');
    setFormTopic(item.topic || activeChapterMeta?.title || 'Alltag');
    setFormLevel(item.level || 'B1');
    setFormPage(item.pdfPage ? String(item.pdfPage) : '');
  };

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingItem(null);
    setFormGerman('');
    setFormBangla('');
    setFormEnglish('');
    setFormExampleGerman('');
    setFormTopic(activeChapterMeta?.title || 'Alltag');
    setFormLevel(activeChapterMeta?.level || 'B1');
    setFormPage('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGerman.trim() || (!formBangla.trim() && !formEnglish.trim())) return;

    const parsed = parseGermanHeadword(formGerman);
    const cleanBangla = repairBengaliUnicode(formBangla);
    const uncertainBangla = isUncertainBengaliMeaning(cleanBangla);
    const nowIso = new Date().toISOString();

    if (isCreatingNew) {
      const targetChapter =
        selectedChapter && selectedChapter !== 'custom' ? selectedChapter : undefined;
      const newItem: VocabItem = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        pdfName: activeChapterMeta?.fileName || 'Manual Entry',
        pdfPage: formPage ? Number(formPage) : undefined,
        chapter: targetChapter,
        topic: formTopic.trim() || activeChapterMeta?.title || 'Alltag',
        level: formLevel,
        german: formGerman.trim(),
        article: parsed.article,
        germanWord: parsed.germanWord,
        plural: parsed.plural,
        bangla: cleanBangla,
        english: formEnglish.trim(),
        exampleGerman: formExampleGerman.trim() || undefined,
        image: null,
        source: 'manual',
        isFavorite: false,
        needsReview: uncertainBangla,
        srs: {
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewAt: nowIso,
          lapses: 0,
          status: 'new',
        },
        mistakeCount: 0,
        correctCount: 0,
        createdAt: nowIso,
      };
      onSaveItem(newItem, true);
    } else if (editingItem) {
      const updated: VocabItem = {
        ...editingItem,
        german: formGerman.trim(),
        article: parsed.article,
        germanWord: parsed.germanWord,
        plural: parsed.plural,
        bangla: cleanBangla,
        english: formEnglish.trim(),
        exampleGerman: formExampleGerman.trim() || undefined,
        topic: formTopic.trim() || editingItem.topic,
        level: formLevel,
        pdfPage: formPage ? Number(formPage) : undefined,
        needsReview: uncertainBangla,
      };
      onSaveItem(updated, false);
    }

    setEditingItem(null);
    setIsCreatingNew(false);
  };

  const activeChapterIndex = selectedChapter && selectedChapter !== 'custom'
    ? ALL_CHAPTERS.findIndex((chapter) => chapter.chapterKey === selectedChapter)
    : -1;

  // ---------------------------------------------------------------------------
  // VIEW 1: 12 SEPARATE CHAPTERS DIRECTORY (Never merged into one list)
  // ---------------------------------------------------------------------------
  if (!selectedChapter) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-bn">
              {t.chapters.heading}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bn">
              {t.chapters.subheading}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.vocabulary.addManual}</span>
          </button>
        </div>

        {/* Separate A1, A2 and B1 chapter groups */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapterSummaries.map((ch) => {
            const pct = ch.total > 0 ? Math.round((ch.mastered / ch.total) * 100) : 0;
            return (
              <article
                key={ch.chapterKey}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono-tabular font-bold text-blue-700 dark:text-blue-400">
                      {t.chapters.chapterLabel} {ch.level} · {ch.chapterNumber} / 12
                    </span>
                    <span className="font-mono-tabular">{ch.fileName}</span>
                  </div>

                  <h2
                    lang="bn"
                    className="text-lg font-bold text-slate-900 dark:text-slate-100 font-bn leading-snug"
                  >
                    {ch.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono-tabular">
                    <span>
                      {ch.total} {t.dashboard.wordsCount}
                    </span>
                    <span>·</span>
                    <span>
                      {ch.mastered} {t.chapters.masteredCount}
                    </span>
                    <span>·</span>
                    <span>
                      {ch.due} {t.chapters.dueCount}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden pt-0">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectChapter(ch.chapterKey)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t.chapters.openChapter}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartChapterStudy(ch.chapterKey, 'flashcards')}
                    disabled={ch.total === 0}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t.chapters.practiceChapter}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Separate Custom / PDF-Imported Vocabulary Section (if user added any) */}
        {customItems.length > 0 && (
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-bn">
                {t.chapters.customTitle} ({customItems.length} {t.dashboard.wordsCount})
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bn">
                {t.chapters.customSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectChapter('custom')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            >
              <span>{t.chapters.openChapter}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* Create Modal */}
        {isCreatingNew && renderFormModal()}
      </div>
    );
  }

  function renderFormModal() {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      >
        <form
          onSubmit={handleSaveForm}
          className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isCreatingNew ? t.vocabulary.addManual : t.common.edit}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsCreatingNew(false);
              }}
              aria-label={t.common.close}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.vocabulary.germanLabel}
              </label>
              <input
                type="text"
                required
                value={formGerman}
                onChange={(e) => setFormGerman(e.target.value)}
                placeholder='der Apfel, "-e'
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.vocabulary.banglaLabel}
              </label>
              <input
                type="text"
                lang="bn"
                value={formBangla}
                onChange={(e) => setFormBangla(e.target.value)}
                placeholder="আপেল"
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bn text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.vocabulary.englishLabel}
              </label>
              <input
                type="text"
                value={formEnglish}
                onChange={(e) => setFormEnglish(e.target.value)}
                placeholder="apple"
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.vocabulary.exampleLabel}
              </label>
              <input
                type="text"
                value={formExampleGerman}
                onChange={(e) => setFormExampleGerman(e.target.value)}
                placeholder="Ich esse jeden Tag einen Apfel."
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.common.level}
                </label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value as CefrLevel)}
                  className="w-full px-2.5 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.common.topic}
                </label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full px-2.5 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.common.page}
                </label>
                <input
                  type="number"
                  min={1}
                  value={formPage}
                  onChange={(e) => setFormPage(e.target.value)}
                  className="w-full px-2.5 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsCreatingNew(false);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: SELECTED SINGLE CHAPTER VOCABULARY (Strictly isolated to 1 chapter)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      {/* Chapter Navigation Bar: Back + Quick 1..12 Switcher + Prev/Next */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectChapter(null)}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.chapters.backToAll}</span>
          </button>

          {activeChapterIndex >= 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activeChapterIndex <= 0}
                onClick={() => onSelectChapter(ALL_CHAPTERS[activeChapterIndex - 1].chapterKey)}
                className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.chapters.prevChapter}</span>
              </button>
              <button
                type="button"
                disabled={activeChapterIndex < 0 || activeChapterIndex >= ALL_CHAPTERS.length - 1}
                onClick={() => onSelectChapter(ALL_CHAPTERS[activeChapterIndex + 1].chapterKey)}
                className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <span>{t.chapters.nextChapter}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Chapter navigation strip */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {chapterSummaries.map((ch) => {
            const active = selectedChapter === ch.chapterKey;
            return (
              <button
                key={ch.chapterKey}
                type="button"
                onClick={() => onSelectChapter(ch.chapterKey)}
                title={`${ch.title} (${ch.total})`}
                className={`px-2.5 py-1.5 min-h-[34px] rounded-md text-xs font-semibold font-mono-tabular transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ch.level}-{ch.chapterNumber} ({ch.total})
              </button>
            );
          })}
          {customItems.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectChapter('custom')}
              className={`px-2.5 py-1.5 min-h-[34px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedChapter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Custom ({customItems.length})
            </button>
          )}
        </div>
      </section>

      {/* Selected Chapter Header & Practice Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          {activeChapterMeta ? (
            <>
              <div className="text-xs font-mono-tabular font-semibold text-blue-700 dark:text-blue-400">
                {t.chapters.chapterLabel} {activeChapterMeta.chapterNumber} · {activeChapterMeta.fileName} ·{' '}
                {chapterItems.length} {t.dashboard.wordsCount}
              </div>
              <h1
                lang="bn"
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-bn"
              >
                {activeChapterMeta.title}
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-bn">
                {t.chapters.customTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bn">
                {chapterItems.length} {t.dashboard.wordsCount}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStartChapterStudy(selectedChapter, 'flashcards')}
            disabled={chapterItems.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.chapters.practiceChapter}</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.vocabulary.addManual}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar (Scoped strictly to THIS chapter) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.chapters.searchInChapter}
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {selectedChapter !== 'custom' ? (
            <select
              aria-label={t.common.section}
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="all">{t.chapters.allSections}</option>
              {chapterSections.map((sec) => (
                <option key={sec} value={sec}>
                  [{sec}]
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label={t.vocabulary.allPdfs}
              value={selectedPdf}
              onChange={(e) => setSelectedPdf(e.target.value)}
              className="px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="all">{t.vocabulary.allPdfs}</option>
              {pdfFilterOptions.map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status Tabs + Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', t.vocabulary.statusAll],
                ['due', t.vocabulary.statusDue],
                ['mastered', t.vocabulary.statusMastered],
                ['mistakes', t.vocabulary.statusMistakes],
                ['favorites', t.vocabulary.statusFavorites],
                ...(needsReviewCount > 0 || selectedStatus === 'needs-review'
                  ? ([['needs-review', `${t.vocabulary.statusNeedsReview} (${needsReviewCount})`]] as const)
                  : ([] as const)),
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedStatus(val)}
                className={`px-3 py-1.5 min-h-[36px] rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedStatus === val
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : val === 'needs-review'
                      ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
            {filteredItems.length} / {chapterItems.length}
          </span>
        </div>
      </section>

      {/* Clean Text-Based Vocabulary Cards Grid (Zero Images, Fast & Lightweight) */}
      {filteredItems.length === 0 ? (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t.vocabulary.emptyTitle}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t.vocabulary.emptySub}</p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  {/* Metadata row */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate font-mono-tabular">
                      {item.section ? `[${item.section}]` : item.pdfName || t.common.yourPdfLabel}
                      {item.chapter ? ` · ${t.common.chapter} ${item.chapter}` : ''}
                      {item.pdfPage ? ` · ${t.common.page} ${item.pdfPage}` : ''}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => speakGerman(item.german)}
                        aria-label={t.common.listen}
                        className="p-1.5 min-w-[34px] min-h-[34px] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 flex items-center justify-center cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={t.common.favorite}
                        className="p-1.5 min-w-[34px] min-h-[34px] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            item.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* German Headword + Bengali + English */}
                  <div className="space-y-1">
                    <div className="text-lg font-bold leading-snug">
                      <GermanText german={item.german} article={item.article} />
                    </div>
                    <div lang="bn" className="text-base font-medium font-bn text-slate-800 dark:text-slate-200">
                      {item.bangla || '—'}
                    </div>
                    {item.needsReview && (
                      <div lang="bn" className="flex items-start gap-1.5 text-xs font-bn text-amber-700 dark:text-amber-400 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{t.vocabulary.needsReviewNotice}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.english || '—'}
                    </div>
                  </div>

                  {/* Example sentence + audio button */}
                  {item.exampleGerman && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-start justify-between gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.exampleGerman}
                      </p>
                      <button
                        type="button"
                        onClick={() => speakGerman(item.exampleGerman!)}
                        aria-label={t.study.exampleSentence}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                    {item.srs.status} · ✓{item.correctCount} ✕{item.mistakeCount}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t.common.edit}</span>
                    </button>
                    {deletingId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteItem(item.id);
                            setDeletingId(null);
                          }}
                          className="px-2 py-1.5 rounded-md bg-rose-600 text-white font-semibold cursor-pointer"
                        >
                          {t.common.delete}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        aria-label={t.common.delete}
                        className="p-1.5 min-w-[34px] min-h-[34px] rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredItems.length > visibleItems.length && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 60)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                +60 ({visibleItems.length} / {filteredItems.length})
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filteredItems.length)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t.common.all} ({filteredItems.length})
              </button>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {(editingItem || isCreatingNew) && renderFormModal()}
    </div>
  );
}
