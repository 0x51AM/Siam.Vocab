import { DailyStats, SrsState, VocabItem } from '../types';

export type ReviewRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export function computeNextSrs(current: SrsState, rating: ReviewRating): SrsState {
  const now = new Date();
  let { intervalDays, easeFactor, repetitions, lapses } = current;

  if (rating === 1) {
    // Again: reset repetitions, review soon
    repetitions = 0;
    intervalDays = 0;
    lapses += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (repetitions === 0) {
      intervalDays = rating === 4 ? 4 : 1;
    } else if (repetitions === 1) {
      intervalDays = rating === 4 ? 7 : rating === 3 ? 6 : 3;
    } else {
      const mult = rating === 2 ? 1.2 : rating === 4 ? easeFactor * 1.3 : easeFactor;
      intervalDays = Math.max(1, Math.round(intervalDays * mult));
    }
    repetitions += 1;

    if (rating === 2) easeFactor = Math.max(1.3, easeFactor - 0.15);
    if (rating === 4) easeFactor = easeFactor + 0.15;
  }

  const nextDate = new Date(now.getTime());
  if (intervalDays === 0) {
    nextDate.setMinutes(nextDate.getMinutes() + 10);
  } else {
    nextDate.setDate(nextDate.getDate() + intervalDays);
  }

  let status: SrsState['status'] = 'learning';
  if (repetitions >= 3 && intervalDays >= 6) {
    status = 'mastered';
  } else if (repetitions === 0) {
    status = 'learning';
  }

  return {
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    nextReviewAt: nextDate.toISOString(),
    lastReviewedAt: now.toISOString(),
    lapses,
    status,
  };
}

export function previewNextIntervalLabel(current: SrsState, rating: ReviewRating): string {
  const next = computeNextSrs(current, rating);
  if (next.intervalDays === 0) return '10m';
  if (next.intervalDays === 1) return '1d';
  return `${next.intervalDays}d`;
}

export function isDueForReview(item: VocabItem): boolean {
  return new Date(item.srs.nextReviewAt).getTime() <= Date.now();
}

export function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function updateDailyStats(
  stats: DailyStats,
  wasCorrect: boolean,
  becameMastered: boolean
): DailyStats {
  const today = getTodayDateString();
  let streakDays = stats.streakDays;

  if (stats.date !== today) {
    // Check if yesterday
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (stats.lastStudyDate === yesterday && stats.reviewedCount > 0) {
      streakDays = stats.streakDays + 1;
    } else if (stats.lastStudyDate === today) {
      streakDays = Math.max(1, stats.streakDays);
    } else {
      streakDays = 1;
    }

    return {
      date: today,
      reviewedCount: 1,
      correctCount: wasCorrect ? 1 : 0,
      learnedNewCount: becameMastered ? 1 : 0,
      dailyGoal: stats.dailyGoal,
      streakDays,
      lastStudyDate: today,
    };
  }

  return {
    ...stats,
    reviewedCount: stats.reviewedCount + 1,
    correctCount: stats.correctCount + (wasCorrect ? 1 : 0),
    learnedNewCount: stats.learnedNewCount + (becameMastered ? 1 : 0),
    streakDays: Math.max(1, streakDays),
    lastStudyDate: today,
  };
}
