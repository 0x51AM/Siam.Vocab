import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  BookOpenCheck,
  Languages,
  Puzzle,
  LayoutDashboard,
  Layers,
  Moon,
  Play,
  Sun,
  User,
} from 'lucide-react';
import { AccountView } from './components/AccountView';
import { ArticleTrainerView } from './components/ArticleTrainerView';
import { DashboardView } from './components/DashboardView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SentencePracticeView } from './components/SentencePracticeView';
import { DeckFilter, StudyView } from './components/StudyView';
import { VerbsPracticeView } from './components/VerbsPracticeView';
import { VocabularyView } from './components/VocabularyView';
import { createInitialDemoVocab } from './data/demoVocab';
import { translations } from './i18n/translations';
import {
  AllPracticeProgress,
  loadAllPracticeProgress,
  recordPracticeAttempt,
  saveAllPracticeProgress,
} from './services/practiceProgressStore';
import { extractVocabularyPracticePools } from './services/vocabPracticeExtractor';
import {
  computeNextSrs,
  ReviewRating,
  updateDailyStats,
} from './services/srsService';
import {
  deleteVocabItemFromSupabase,
  fetchUserCloudData,
  loadLocalDirection,
  loadLocalStats,
  loadLocalTheme,
  loadLocalUiLanguage,
  loadLocalVocab,
  saveLocalDirection,
  saveLocalStats,
  saveLocalTheme,
  saveLocalUiLanguage,
  saveLocalVocab,
  syncStatsToSupabase,
  syncVocabItemsToSupabase,
} from './services/storageService';
import { getSupabaseClient } from './services/supabaseClient';
import {
  AppView,
  DailyStats,
  PracticeSectionKey,
  StudyDirection,
  StudyMode,
  UiLanguage,
  UserProfile,
  VocabItem,
} from './types';

export default function App() {
  const [uiLang, setUiLang] = useState<UiLanguage>(() => loadLocalUiLanguage());
  const [direction, setDirection] = useState<StudyDirection>(() => loadLocalDirection());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadLocalTheme());
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const [vocab, setVocab] = useState<VocabItem[]>(() => loadLocalVocab());
  const [practiceProgress, setPracticeProgress] = useState<AllPracticeProgress>(() =>
    loadAllPracticeProgress()
  );
  const [stats, setStats] = useState<DailyStats>(() => loadLocalStats());

  const [selectedVocabChapter, setSelectedVocabChapter] = useState<string | null>(null);
  const [studyChapter, setStudyChapter] = useState<string>('1');
  const [studyMode, setStudyMode] = useState<StudyMode>('flashcards');
  const [studyFilter, setStudyFilter] = useState<DeckFilter>('all');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const t = translations[uiLang];

  const practicePools = useMemo(() => extractVocabularyPracticePools(vocab), [vocab]);

  // Apply theme & lang attributes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = uiLang;
    saveLocalUiLanguage(uiLang);
  }, [uiLang]);

  useEffect(() => {
    saveLocalDirection(direction);
  }, [direction]);

  useEffect(() => {
    saveLocalVocab(vocab);
  }, [vocab]);

  useEffect(() => {
    saveLocalStats(stats);
  }, [stats]);

  useEffect(() => {
    saveAllPracticeProgress(practiceProgress);
  }, [practiceProgress]);

  // Listen for Supabase Auth state & merge user's private cloud data
  const syncDownFromSupabase = useCallback(async (userId: string) => {
    setIsSyncing(true);
    try {
      const cloud = await fetchUserCloudData(userId);
      if (cloud.vocab.length > 0) {
        setVocab((local) => {
          const cloudIds = new Set(cloud.vocab.map((c) => c.id));
          const localOnlyUserItems = local.filter(
            (l) => !cloudIds.has(l.id) && l.source !== 'demo'
          );
          return [...cloud.vocab, ...localOnlyUserItems];
        });
      }
      if (cloud.stats) {
        setStats(cloud.stats);
      }
    } catch {
      // Fail gracefully in case of offline or unconfigured tables
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const sUser = data.session?.user;
      if (sUser) {
        setUser({ id: sUser.id, email: sUser.email || '' });
        void syncDownFromSupabase(sUser.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sUser = session?.user;
      if (sUser) {
        setUser({ id: sUser.id, email: sUser.email || '' });
        void syncDownFromSupabase(sUser.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncDownFromSupabase]);

  const handleSyncNow = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await syncVocabItemsToSupabase(user.id, vocab);
      await syncStatsToSupabase(user.id, stats);
      await syncDownFromSupabase(user.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartStudy = (mode: StudyMode, filter: DeckFilter, chapterKey?: string) => {
    setStudyMode(mode === 'image-quiz' ? 'flashcards' : mode);
    setStudyFilter(filter);
    if (chapterKey) {
      setStudyChapter(chapterKey);
    }
    setActiveView('study');
  };

  const handleOpenChapter = (chapterKey: string) => {
    setSelectedVocabChapter(chapterKey);
    setActiveView('vocabulary');
  };

  const handleRateCard = (itemId: string, rating: ReviewRating, wasCorrect: boolean) => {
    let becameMastered = false;
    let updatedItem: VocabItem | null = null;

    setVocab((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextSrs = computeNextSrs(item.srs, rating);
        if (item.srs.status !== 'mastered' && nextSrs.status === 'mastered') {
          becameMastered = true;
        }
        updatedItem = {
          ...item,
          srs: nextSrs,
          correctCount: item.correctCount + (wasCorrect ? 1 : 0),
          mistakeCount: item.mistakeCount + (wasCorrect ? 0 : 1),
        };
        return updatedItem;
      })
    );

    setStats((prev) => {
      const next = updateDailyStats(prev, wasCorrect, becameMastered);
      if (user) {
        void syncStatsToSupabase(user.id, next);
      }
      return next;
    });

    if (user && updatedItem) {
      void syncVocabItemsToSupabase(user.id, [updatedItem]);
    }
  };

  const handleToggleFavorite = (itemId: string) => {
    let updatedItem: VocabItem | null = null;
    setVocab((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        updatedItem = { ...item, isFavorite: !item.isFavorite };
        return updatedItem;
      })
    );
    if (user && updatedItem) {
      void syncVocabItemsToSupabase(user.id, [updatedItem]);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setVocab((prev) => prev.filter((item) => item.id !== itemId));
    if (user) {
      void deleteVocabItemFromSupabase(user.id, itemId);
    }
  };

  const handleSaveItem = (item: VocabItem, isNew: boolean) => {
    setVocab((prev) => {
      if (isNew) return [item, ...prev];
      return prev.map((existing) => (existing.id === item.id ? item : existing));
    });
    if (user) {
      void syncVocabItemsToSupabase(user.id, [item]);
    }
  };

  const handleClearDemoData = () => {
    setVocab((prev) => prev.filter((item) => item.source !== 'demo'));
  };

  const handleRestoreDemoData = () => {
    const demos = createInitialDemoVocab();
    setVocab((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const toAdd = demos.filter((d) => !existingIds.has(d.id));
      return [...prev, ...toAdd];
    });
  };

  const handleRecordSectionAttempt = (
    section: PracticeSectionKey,
    itemId: string,
    wasCorrect: boolean
  ) => {
    setPracticeProgress((prev) => ({
      ...prev,
      [section]: recordPracticeAttempt(prev[section], itemId, wasCorrect),
    }));
  };

  const navItems: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'study', label: t.nav.study, icon: Layers },
    { id: 'vocabulary', label: t.nav.vocabulary, icon: BookOpen },
    { id: 'account', label: t.nav.account, icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <OfflineIndicator t={t} />

      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left Zone: Brand wordmark only */}
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0"
          >
            {t.brand}
          </button>

          {/* Center Zone: Single-line navigation links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'vocabulary' && activeView !== 'vocabulary') {
                      setSelectedVocabChapter(null);
                    }
                    setActiveView(item.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Zone: 1 Primary CTA */}
          <button
            type="button"
            onClick={() => handleStartStudy('flashcards', 'all', studyChapter || '1')}
            disabled={vocab.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t.common.startLearning}</span>
          </button>
        </div>
      </header>

      {/* Practice Sections Tabs */}
      <div className="sticky top-14 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <nav
          aria-label="Learning tools"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveView('articles')}
            className={`inline-flex shrink-0 items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              activeView === 'articles'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>{t.practiceSections.articleTrainerTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('verbs')}
            className={`inline-flex shrink-0 items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              activeView === 'verbs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>{t.practiceSections.verbsTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('sentences')}
            className={`inline-flex shrink-0 items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              activeView === 'sentences'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            <span>{t.practiceSections.sentencePracticeTab}</span>
          </button>
        </nav>
      </div>

      {/* Workspace Controls Bar: Language, Direction, Theme */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* UI Language Switcher */}
          <div className="flex items-center gap-1" role="group" aria-label="Interface Language">
            {(
              [
                ['bn', 'বাংলা'],
                ['en', 'EN'],
                ['de', 'DE'],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setUiLang(code)}
                className={`px-2.5 py-1.5 min-h-[32px] rounded-md font-semibold transition-colors cursor-pointer ${
                  uiLang === code
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Study Direction Selector */}
            <label htmlFor="direction-select" className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              {t.directions.label}:
            </label>
            <select
              id="direction-select"
              value={direction}
              onChange={(e) => setDirection(e.target.value as StudyDirection)}
              className="px-2.5 py-1.5 min-h-[34px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="bn-de">{t.directions['bn-de']}</option>
              <option value="de-bn">{t.directions['de-bn']}</option>
              <option value="en-de">{t.directions['en-de']}</option>
              <option value="de-en">{t.directions['de-en']}</option>
            </select>

            {/* Light / Dark Toggle */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              aria-label="Toggle color theme"
              className="p-2 min-w-[34px] min-h-[34px] rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
        {activeView === 'dashboard' && (
          <DashboardView
            t={t}
            vocab={vocab}
            stats={stats}
            onUpdateDailyGoal={(goal) => setStats((prev) => ({ ...prev, dailyGoal: goal }))}
            onStartStudy={handleStartStudy}
            onOpenChapter={handleOpenChapter}
            onClearDemoData={handleClearDemoData}
            onRestoreDemoData={handleRestoreDemoData}
          />
        )}

        {activeView === 'study' && (
          <StudyView
            t={t}
            vocab={vocab}
            direction={direction}
            mode={studyMode}
            filter={studyFilter}
            selectedChapter={studyChapter}
            onSelectChapter={setStudyChapter}
            onChangeMode={setStudyMode}
            onChangeFilter={setStudyFilter}
            onRateCard={handleRateCard}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeView === 'vocabulary' && (
          <VocabularyView
            t={t}
            vocab={vocab}
            selectedChapter={selectedVocabChapter}
            onSelectChapter={setSelectedVocabChapter}
            onStartChapterStudy={(chapterKey, mode) =>
              handleStartStudy(mode || 'flashcards', 'all', chapterKey)
            }
            onToggleFavorite={handleToggleFavorite}
            onDeleteItem={handleDeleteItem}
            onSaveItem={handleSaveItem}
          />
        )}

        {activeView === 'articles' && (
          <ArticleTrainerView
            t={t}
            nouns={practicePools.nouns}
            stats={practiceProgress.articles}
            onRecordAttempt={(itemId, wasCorrect) =>
              handleRecordSectionAttempt('articles', itemId, wasCorrect)
            }
          />
        )}

        {activeView === 'verbs' && (
          <VerbsPracticeView
            t={t}
            direction={direction}
            verbs={practicePools.verbs}
            stats={practiceProgress.verbs}
            onRecordAttempt={(itemId, wasCorrect) =>
              handleRecordSectionAttempt('verbs', itemId, wasCorrect)
            }
          />
        )}

        {activeView === 'sentences' && (
          <SentencePracticeView
            t={t}
            direction={direction}
            sentences={practicePools.sentences}
            stats={practiceProgress.sentences}
            onRecordAttempt={(itemId, wasCorrect) =>
              handleRecordSectionAttempt('sentences', itemId, wasCorrect)
            }
          />
        )}

        {activeView === 'account' && (
          <AccountView
            t={t}
            user={user}
            onSyncNow={handleSyncNow}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-15 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm grid grid-cols-4"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'vocabulary' && activeView !== 'vocabulary') {
                  setSelectedVocabChapter(null);
                }
                setActiveView(item.id);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[10px] font-medium cursor-pointer ${
                active
                  ? 'text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[68px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
