import { createInitialDemoVocab } from '../data/demoVocab';
import { DailyStats, PdfDocumentRecord, UiLanguage, StudyDirection, VocabItem } from '../types';
import { getTodayDateString } from './srsService';
import { getSupabaseClient } from './supabaseClient';
import {
  hasLegacyPdfBengaliArtifacts,
  isUncertainBengaliMeaning,
  repairBengaliUnicode,
} from '../utils/bengaliUnicode';

const KEYS = {
  VOCAB: 'siamvocab_vocab_v1',
  VOCAB_BACKUP: 'siamvocab_vocab_backup_v1',
  VOCAB_PRE_REPLACE_BACKUP: 'siamvocab_vocab_pre_replace_backup_v1',
  DATASET_VERSION: 'siamvocab_dataset_version_v1',
  PDFS: 'siamvocab_pdfs_v1',
  STATS: 'siamvocab_stats_v1',
  UI_LANG: 'siamvocab_ui_lang_v1',
  DIRECTION: 'siamvocab_direction_v1',
  THEME: 'siamvocab_theme_v1',
};

const CURRENT_DATASET_VERSION = 'deutsch-a1-a2-b1-12-chapters-v2';

function repairVocabListPreservingCleanData(items: VocabItem[]): {
  items: VocabItem[];
  repairedCount: number;
} {
  let repairedCount = 0;
  const updated = items.map((item) => {
    let nextBangla = item.bangla || '';
    let nextExampleBangla = item.exampleBangla;
    let changed = false;

    if (hasLegacyPdfBengaliArtifacts(nextBangla) || /Deutsch mit Shakil/i.test(nextBangla)) {
      const cleaned = repairBengaliUnicode(
        nextBangla.replace(/Deutsch mit Shakil.*$/i, '').trim()
      );
      if (cleaned !== nextBangla) {
        nextBangla = cleaned;
        changed = true;
      }
    }

    if (nextExampleBangla && hasLegacyPdfBengaliArtifacts(nextExampleBangla)) {
      const cleanedEx = repairBengaliUnicode(nextExampleBangla);
      if (cleanedEx !== nextExampleBangla) {
        nextExampleBangla = cleanedEx;
        changed = true;
      }
    }

    const uncertain = isUncertainBengaliMeaning(nextBangla);
    const nextNeedsReview = uncertain ? true : item.needsReview;

    if (changed || nextNeedsReview !== item.needsReview) {
      if (changed) repairedCount++;
      return {
        ...item,
        bangla: nextBangla,
        exampleBangla: nextExampleBangla,
        needsReview: nextNeedsReview,
      };
    }

    return item;
  });

  return { items: updated, repairedCount };
}

export function loadLocalUiLanguage(): UiLanguage {
  const val = localStorage.getItem(KEYS.UI_LANG);
  if (val === 'bn' || val === 'en' || val === 'de') return val;
  return 'bn';
}

export function saveLocalUiLanguage(lang: UiLanguage) {
  localStorage.setItem(KEYS.UI_LANG, lang);
}

export function loadLocalDirection(): StudyDirection {
  const val = localStorage.getItem(KEYS.DIRECTION);
  if (val === 'bn-de' || val === 'de-bn' || val === 'en-de' || val === 'de-en') return val;
  return 'bn-de';
}

export function saveLocalDirection(dir: StudyDirection) {
  localStorage.setItem(KEYS.DIRECTION, dir);
}

export function loadLocalTheme(): 'light' | 'dark' {
  const val = localStorage.getItem(KEYS.THEME);
  return val === 'dark' ? 'dark' : 'light';
}

export function saveLocalTheme(theme: 'light' | 'dark') {
  localStorage.setItem(KEYS.THEME, theme);
}

interface BuiltInVocabOverride {
  isFavorite?: boolean;
  needsReview?: boolean;
  srs?: VocabItem['srs'];
  mistakeCount?: number;
  correctCount?: number;
  german?: string;
  article?: VocabItem['article'];
  germanWord?: string;
  plural?: string;
  bangla?: string;
  english?: string;
  exampleGerman?: string;
  exampleBangla?: string;
  topic?: string;
  level?: VocabItem['level'];
  pdfPage?: number;
}

interface CompactLocalVocabPayload {
  v: 2;
  deletedBuiltInIds: string[];
  overrides: Record<string, BuiltInVocabOverride>;
  customItems: VocabItem[];
}

let cachedBuiltInSeedMap: Map<string, VocabItem> | null = null;

function getBuiltInSeedMap(): Map<string, VocabItem> {
  if (!cachedBuiltInSeedMap) {
    cachedBuiltInSeedMap = new Map(createInitialDemoVocab().map((item) => [item.id, item]));
  }
  return cachedBuiltInSeedMap;
}

function isDefaultSrs(srs: VocabItem['srs']): boolean {
  return (
    srs.status === 'new' &&
    srs.repetitions === 0 &&
    srs.lapses === 0 &&
    srs.intervalDays === 0 &&
    srs.easeFactor === 2.5 &&
    !srs.lastReviewedAt
  );
}

function isCompactPayload(val: unknown): val is CompactLocalVocabPayload {
  return Boolean(
    val &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      (val as CompactLocalVocabPayload).v === 2
  );
}

function serializeCompactVocab(items: VocabItem[]): string {
  const seedMap = getBuiltInSeedMap();
  const presentIds = new Set<string>();
  const overrides: Record<string, BuiltInVocabOverride> = {};
  const customItems: VocabItem[] = [];

  for (const item of items) {
    presentIds.add(item.id);
    const seed = seedMap.get(item.id);
    if (!seed) {
      customItems.push(item);
      continue;
    }

    const patch: BuiltInVocabOverride = {};
    let hasChanges = false;

    if (item.isFavorite !== seed.isFavorite) {
      patch.isFavorite = item.isFavorite;
      hasChanges = true;
    }
    if (item.needsReview !== seed.needsReview) {
      patch.needsReview = item.needsReview;
      hasChanges = true;
    }
    if (!isDefaultSrs(item.srs)) {
      patch.srs = item.srs;
      hasChanges = true;
    }
    if (item.mistakeCount !== 0) {
      patch.mistakeCount = item.mistakeCount;
      hasChanges = true;
    }
    if (item.correctCount !== 0) {
      patch.correctCount = item.correctCount;
      hasChanges = true;
    }
    if (item.german !== seed.german) {
      patch.german = item.german;
      patch.article = item.article;
      patch.germanWord = item.germanWord;
      patch.plural = item.plural;
      hasChanges = true;
    }
    if (item.bangla !== seed.bangla) {
      patch.bangla = item.bangla;
      hasChanges = true;
    }
    if (item.english !== seed.english) {
      patch.english = item.english;
      hasChanges = true;
    }
    if (item.exampleGerman !== seed.exampleGerman) {
      patch.exampleGerman = item.exampleGerman;
      hasChanges = true;
    }
    if (item.exampleBangla !== seed.exampleBangla) {
      patch.exampleBangla = item.exampleBangla;
      hasChanges = true;
    }
    if (item.topic !== seed.topic) {
      patch.topic = item.topic;
      hasChanges = true;
    }
    if (item.level !== seed.level) {
      patch.level = item.level;
      hasChanges = true;
    }
    if (item.pdfPage !== seed.pdfPage) {
      patch.pdfPage = item.pdfPage;
      hasChanges = true;
    }

    if (hasChanges) {
      overrides[item.id] = patch;
    }
  }

  const deletedBuiltInIds: string[] = [];
  for (const seedId of seedMap.keys()) {
    if (!presentIds.has(seedId)) {
      deletedBuiltInIds.push(seedId);
    }
  }

  const payload: CompactLocalVocabPayload = {
    v: 2,
    deletedBuiltInIds,
    overrides,
    customItems,
  };
  return JSON.stringify(payload);
}

function hydrateCompactVocab(payload: CompactLocalVocabPayload, seeds: VocabItem[]): VocabItem[] {
  const deletedSet = new Set(payload.deletedBuiltInIds || []);
  const overrides = payload.overrides || {};
  const customItems = Array.isArray(payload.customItems) ? payload.customItems : [];

  const hydratedSeeds: VocabItem[] = [];
  for (const seed of seeds) {
    if (deletedSet.has(seed.id)) continue;
    const patch = overrides[seed.id];
    if (!patch) {
      hydratedSeeds.push(seed);
      continue;
    }
    hydratedSeeds.push({
      ...seed,
      ...patch,
      srs: patch.srs ?? seed.srs,
    });
  }

  return [...customItems, ...hydratedSeeds];
}

export function loadLocalVocab(): VocabItem[] {
  const raw = localStorage.getItem(KEYS.VOCAB);
  const currentVersion = localStorage.getItem(KEYS.DATASET_VERSION);

  // One-time safe migration: back up prior active dataset first, preserve custom PDF/manual entries & progress, and load A1 + A2 + B1 chapters
  if (currentVersion !== CURRENT_DATASET_VERSION) {
    let preservedCustomItems: VocabItem[] = [];
    const previousItemsById = new Map<string, VocabItem>();
    const previousOverrides = new Map<string, BuiltInVocabOverride>();

    if (raw) {
      try {
        localStorage.setItem(KEYS.VOCAB_PRE_REPLACE_BACKUP, raw);
      } catch {
        // Ignore backup quota overflow on large legacy payloads
      }
      try {
        const oldParsed = JSON.parse(raw);
        if (Array.isArray(oldParsed)) {
          preservedCustomItems = oldParsed.filter(
            (item: VocabItem) => item && (item.source === 'pdf' || item.source === 'manual')
          );
          for (const item of oldParsed) {
            if (item && item.id) previousItemsById.set(item.id, item);
          }
        } else if (isCompactPayload(oldParsed)) {
          preservedCustomItems = (oldParsed.customItems || []).filter(
            (item: VocabItem) => item && (item.source === 'pdf' || item.source === 'manual')
          );
          for (const [id, patch] of Object.entries(oldParsed.overrides || {})) {
            previousOverrides.set(id, patch);
          }
        }
      } catch {
        // fall through to fresh dataset
      }
    }

    const freshChapters = createInitialDemoVocab().map((fresh) => {
      const previous = previousItemsById.get(fresh.id);
      if (previous) {
        return {
          ...fresh,
          isFavorite: previous.isFavorite ?? fresh.isFavorite,
          needsReview: previous.needsReview ?? fresh.needsReview,
          srs: previous.srs ?? fresh.srs,
          mistakeCount: previous.mistakeCount ?? fresh.mistakeCount,
          correctCount: previous.correctCount ?? fresh.correctCount,
        };
      }
      const patch = previousOverrides.get(fresh.id);
      if (patch) {
        return {
          ...fresh,
          ...patch,
          srs: patch.srs ?? fresh.srs,
        };
      }
      return fresh;
    });

    const combined = [...preservedCustomItems, ...freshChapters];
    try {
      localStorage.setItem(KEYS.VOCAB, serializeCompactVocab(combined));
      localStorage.setItem(KEYS.DATASET_VERSION, CURRENT_DATASET_VERSION);
    } catch {
      // Ignore storage errors while still returning merged dataset
    }
    return combined;
  }

  try {
    if (!raw) {
      const initial = createInitialDemoVocab();
      saveLocalVocab(initial);
      localStorage.setItem(KEYS.DATASET_VERSION, CURRENT_DATASET_VERSION);
      return initial;
    }

    const parsed: unknown = JSON.parse(raw);
    let items: VocabItem[];
    let migratedFromLegacyArray = false;

    if (isCompactPayload(parsed)) {
      items = hydrateCompactVocab(parsed, createInitialDemoVocab());
    } else if (Array.isArray(parsed)) {
      items = parsed as VocabItem[];
      migratedFromLegacyArray = true;
    } else {
      return createInitialDemoVocab();
    }

    const { items: repairedItems, repairedCount } = repairVocabListPreservingCleanData(items);
    if (repairedCount > 0 || migratedFromLegacyArray) {
      try {
        if (repairedCount > 0 && raw.length < 1_500_000 && !localStorage.getItem(KEYS.VOCAB_BACKUP)) {
          localStorage.setItem(KEYS.VOCAB_BACKUP, raw);
        }
        saveLocalVocab(repairedItems);
      } catch {
        // Handle storage quota gracefully
      }
    }
    return repairedItems;
  } catch {
    return createInitialDemoVocab();
  }
}

export function saveLocalVocab(items: VocabItem[]) {
  try {
    localStorage.setItem(KEYS.VOCAB, serializeCompactVocab(items));
  } catch {
    // Handle storage quota gracefully
  }
}

export function loadLocalPdfs(): PdfDocumentRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.PDFS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPdfs(pdfs: PdfDocumentRecord[]) {
  try {
    localStorage.setItem(KEYS.PDFS, JSON.stringify(pdfs));
  } catch {
    // Ignore
  }
}

export function loadLocalStats(): DailyStats {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    if (!raw) {
      return {
        date: today,
        reviewedCount: 0,
        correctCount: 0,
        learnedNewCount: 0,
        dailyGoal: 20,
        streakDays: 0,
      };
    }
    const parsed: DailyStats = JSON.parse(raw);
    if (parsed.date !== today) {
      return {
        ...parsed,
        date: today,
        reviewedCount: 0,
        correctCount: 0,
        learnedNewCount: 0,
      };
    }
    return parsed;
  } catch {
    return {
      date: today,
      reviewedCount: 0,
      correctCount: 0,
      learnedNewCount: 0,
      dailyGoal: 20,
      streakDays: 0,
    };
  }
}

export function saveLocalStats(stats: DailyStats) {
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch {
    // Ignore
  }
}

// ---------- Supabase Cloud Sync (Row Level Security Protected) ----------

export async function uploadPrivatePdfToSupabase(
  userId: string,
  documentId: string,
  file: File
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${documentId}_${safeName}`;

  const { error } = await supabase.storage
    .from('user-pdfs')
    .upload(path, file, { contentType: 'application/pdf', upsert: true });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return path;
}

export async function getPrivatePdfSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from('user-pdfs')
    .createSignedUrl(storagePath, 300);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function syncPdfDocumentToSupabase(
  userId: string,
  doc: PdfDocumentRecord
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from('pdf_documents').upsert({
    id: doc.id,
    user_id: userId,
    file_name: doc.fileName,
    storage_path: doc.storagePath ?? null,
    page_count: doc.pageCount,
    imported_count: doc.importedCount,
    ocr_used: doc.ocrUsed,
    topic: doc.topic,
    level: doc.level,
    created_at: doc.createdAt,
  });

  if (error) throw new Error(error.message);
}

export async function syncVocabItemsToSupabase(
  userId: string,
  items: VocabItem[]
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || items.length === 0) return;

  // Batch upserts in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize).map((item) => ({
      id: item.id,
      user_id: userId,
      pdf_document_id: item.pdfDocumentId ?? null,
      pdf_name: item.pdfName ?? null,
      pdf_page: item.pdfPage ?? null,
      chapter: item.chapter ?? null,
      section: item.section ?? null,
      topic: item.topic,
      level: item.level,
      german: item.german,
      article: item.article ?? null,
      german_word: item.germanWord,
      plural: item.plural ?? null,
      bangla: item.bangla,
      english: item.english,
      example_german: item.exampleGerman ?? null,
      example_bangla: item.exampleBangla ?? null,
      example_english: item.exampleEnglish ?? null,
      image_json: item.image ?? null,
      image_query: item.imageQuery ?? null,
      source: item.source,
      is_favorite: item.isFavorite,
      srs_json: item.srs,
      mistake_count: item.mistakeCount,
      correct_count: item.correctCount,
      created_at: item.createdAt,
    }));

    const { error } = await supabase.from('vocab_items').upsert(chunk);
    if (error) throw new Error(error.message);
  }
}

export async function deleteVocabItemFromSupabase(userId: string, itemId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase
    .from('vocab_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function fetchUserCloudData(userId: string): Promise<{
  vocab: VocabItem[];
  pdfs: PdfDocumentRecord[];
  stats: DailyStats | null;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { vocab: [], pdfs: [], stats: null };
  }

  const [vocabRes, pdfsRes, statsRes] = await Promise.all([
    supabase
      .from('vocab_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('pdf_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('study_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (vocabRes.error) throw new Error(vocabRes.error.message);
  if (pdfsRes.error) throw new Error(pdfsRes.error.message);

  const vocab: VocabItem[] = (vocabRes.data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    pdfDocumentId: row.pdf_document_id ?? undefined,
    pdfName: row.pdf_name ?? undefined,
    pdfPage: row.pdf_page ?? undefined,
    chapter: row.chapter ?? undefined,
    section: row.section ?? undefined,
    topic: row.topic,
    level: row.level,
    german: row.german,
    article: row.article ?? null,
    germanWord: row.german_word,
    plural: row.plural ?? undefined,
    bangla: row.bangla,
    english: row.english,
    exampleGerman: row.example_german ?? undefined,
    exampleBangla: row.example_bangla ?? undefined,
    exampleEnglish: row.example_english ?? undefined,
    image: row.image_json ?? null,
    imageQuery: row.image_query ?? undefined,
    source: row.source,
    isFavorite: Boolean(row.is_favorite),
    srs: row.srs_json,
    mistakeCount: row.mistake_count ?? 0,
    correctCount: row.correct_count ?? 0,
    createdAt: row.created_at,
  }));

  const pdfs: PdfDocumentRecord[] = (pdfsRes.data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    storagePath: row.storage_path ?? undefined,
    pageCount: row.page_count,
    importedCount: row.imported_count,
    ocrUsed: Boolean(row.ocr_used),
    topic: row.topic,
    level: row.level,
    createdAt: row.created_at,
  }));

  const stats: DailyStats | null = statsRes.data?.stats_json ?? null;
  const { items: repairedVocab } = repairVocabListPreservingCleanData(vocab);

  return { vocab: repairedVocab, pdfs, stats };
}

export async function syncStatsToSupabase(userId: string, stats: DailyStats): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from('study_stats').upsert({
    user_id: userId,
    stats_json: stats,
    updated_at: new Date().toISOString(),
  });
}
