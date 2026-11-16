import { PracticeSectionKey, PracticeSectionStats } from '../types';

const PROGRESS_KEY = 'siamvocab_practice_progress_v1';

const DEFAULT_SECTION_STATS: PracticeSectionStats = {
  answered: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  masteredIds: [],
  missedIds: [],
};

export type AllPracticeProgress = Record<PracticeSectionKey, PracticeSectionStats>;

export function loadAllPracticeProgress(): AllPracticeProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      return {
        articles: { ...DEFAULT_SECTION_STATS },
        verbs: { ...DEFAULT_SECTION_STATS },
        sentences: { ...DEFAULT_SECTION_STATS },
      };
    }
    const parsed = JSON.parse(raw) as Partial<AllPracticeProgress>;
    return {
      articles: { ...DEFAULT_SECTION_STATS, ...(parsed.articles || {}) },
      verbs: { ...DEFAULT_SECTION_STATS, ...(parsed.verbs || {}) },
      sentences: { ...DEFAULT_SECTION_STATS, ...(parsed.sentences || {}) },
    };
  } catch {
    return {
      articles: { ...DEFAULT_SECTION_STATS },
      verbs: { ...DEFAULT_SECTION_STATS },
      sentences: { ...DEFAULT_SECTION_STATS },
    };
  }
}

export function saveAllPracticeProgress(progress: AllPracticeProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Handle quota gracefully
  }
}

export function recordPracticeAttempt(
  current: PracticeSectionStats,
  itemId: string,
  wasCorrect: boolean
): PracticeSectionStats {
  const masteredSet = new Set(current.masteredIds);
  const missedSet = new Set(current.missedIds);

  if (wasCorrect) {
    masteredSet.add(itemId);
    missedSet.delete(itemId);
  } else {
    missedSet.add(itemId);
  }

  const nextStreak = wasCorrect ? current.streak + 1 : 0;

  return {
    answered: current.answered + 1,
    correct: current.correct + (wasCorrect ? 1 : 0),
    streak: nextStreak,
    bestStreak: Math.max(current.bestStreak, nextStreak),
    masteredIds: Array.from(masteredSet),
    missedIds: Array.from(missedSet),
    lastPracticedAt: new Date().toISOString(),
  };
}
