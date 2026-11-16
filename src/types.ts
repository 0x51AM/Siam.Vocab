export type UiLanguage = 'bn' | 'en' | 'de';

export type StudyDirection = 'bn-de' | 'de-bn' | 'en-de' | 'de-en';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'Custom';

export type VocabSource = 'demo' | 'pdf' | 'manual' | 'sample-a1' | 'sample-a2' | 'sample-b1';

export type StudyMode = 'flashcards' | 'mcq' | 'image-quiz' | 'listening';

export type AppView =
  | 'dashboard'
  | 'study'
  | 'vocabulary'
  | 'articles'
  | 'verbs'
  | 'sentences'
  | 'account';

export type GermanArticle = 'der' | 'die' | 'das' | 'die (Pl.)' | null;

export interface WikimediaImage {
  url: string;
  thumbUrl: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  pageUrl: string;
  fetchedAt: string;
}

export interface SrsState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string; // ISO date string
  lastReviewedAt?: string;
  lapses: number;
  status: 'new' | 'learning' | 'mastered';
}

export interface VocabItem {
  id: string;
  userId?: string;
  pdfDocumentId?: string;
  pdfName?: string;
  pdfPage?: number;
  chapter?: string;
  section?: string;
  topic: string;
  level: CefrLevel;
  german: string; // Full German headword as stored, e.g. "der Himmel, -"
  article: GermanArticle;
  germanWord: string; // Core word without article/plural suffix
  plural?: string;
  bangla: string;
  english: string;
  exampleGerman?: string;
  exampleBangla?: string;
  exampleEnglish?: string;
  image?: WikimediaImage | null;
  imageQuery?: string;
  source: VocabSource;
  isFavorite: boolean;
  needsReview?: boolean;
  srs: SrsState;
  mistakeCount: number;
  correctCount: number;
  createdAt: string;
}

export interface PdfDocumentRecord {
  id: string;
  userId?: string;
  fileName: string;
  storagePath?: string;
  pageCount: number;
  importedCount: number;
  ocrUsed: boolean;
  topic: string;
  level: CefrLevel;
  createdAt: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  reviewedCount: number;
  correctCount: number;
  learnedNewCount: number;
  dailyGoal: number;
  streakDays: number;
  lastStudyDate?: string;
}

export interface ExtractedDraftItem {
  id: string;
  german: string;
  article: GermanArticle;
  germanWord: string;
  plural?: string;
  bangla: string;
  english: string;
  exampleGerman?: string;
  pdfPage: number;
  chapter?: string;
  section?: string;
  status: 'approved' | 'rejected' | 'duplicate';
  duplicateOfId?: string;
  warning?: string;
}

export interface UserProfile {
  id: string;
  email: string;
}

export interface NounPracticeEntry {
  id: string;
  chapter?: string;
  section?: string;
  topic?: string;
  level: CefrLevel;
  sourceLabel: string;
  german: string;
  article: 'der' | 'die' | 'das';
  noun: string;
  plural?: string;
  bangla: string;
  english: string;
  exampleGerman?: string;
}

export interface VerbPracticeEntry {
  id: string;
  chapter?: string;
  section?: string;
  topic?: string;
  level: CefrLevel;
  sourceLabel: string;
  verb: string;
  verbForms?: string;
  bangla: string;
  english: string;
  exampleGerman?: string;
}

export interface SentencePracticeEntry {
  id: string;
  chapter?: string;
  section?: string;
  topic?: string;
  level: CefrLevel;
  sourceLabel: string;
  germanSentence: string;
  bangla?: string;
  english?: string;
  sourceWord?: string;
}

export type PracticeSectionKey = 'articles' | 'verbs' | 'sentences';

export interface PracticeSectionStats {
  answered: number;
  correct: number;
  streak: number;
  bestStreak: number;
  masteredIds: string[];
  missedIds: string[];
  lastPracticedAt?: string;
}
