import b1ChaptersRaw from './b1Chapters.json';
import a1ChaptersRaw from './a1Chapters.json';
import a2ChaptersRaw from './a2Chapters.json';
import { ExtractedDraftItem, GermanArticle, VocabItem } from '../types';
import {
  hasLegacyPdfBengaliArtifacts,
  isUncertainBengaliMeaning,
  repairBengaliUnicode,
} from '../utils/bengaliUnicode';

export interface B1ChapterEntryRaw {
  section: string;
  german: string;
  bangla: string;
  english: string;
  exampleGerman: string;
}

export interface B1ChapterDefinition {
  chapterNumber: number;
  chapterKey: string;
  fileName: string;
  title: string;
  shortTitle: string;
  bengaliTitle: string;
  entryCount: number;
  entries: B1ChapterEntryRaw[];
}

export const B1_CHAPTERS: B1ChapterDefinition[] = b1ChaptersRaw as B1ChapterDefinition[];
export const A1_CHAPTERS = a1ChaptersRaw as Array<{ chapterNumber: number; chapterKey: string; entries: Array<Omit<B1ChapterEntryRaw, 'section'> & { exampleBangla?: string }> }>;
export const A2_CHAPTERS = a2ChaptersRaw as Array<{ chapterNumber: number; chapterKey: string; entries: Array<B1ChapterEntryRaw & { section?: string }> }>;

function createImportedLevelVocab(
  chapters: Array<{ chapterNumber: number; chapterKey: string; entries: Array<Omit<B1ChapterEntryRaw, 'section'> & { section?: string; exampleBangla?: string }> }>,
  level: 'A1' | 'A2',
  source: 'sample-a1' | 'sample-a2',
  nowIso: string
): VocabItem[] {
  const items: VocabItem[] = [];
  for (const ch of chapters) {
    ch.entries.forEach((row, idx) => {
      const german = row.german.trim();
      const parsed = parseGermanHeadword(german);
      const bangla = repairBengaliUnicode(row.bangla.trim());
      items.push({
        id: `${level.toLowerCase()}-ch${ch.chapterKey}-${idx + 1}`,
        chapter: `${level}-${ch.chapterKey}`,
        section: row.section?.trim(),
        topic: `${level} Kapitel ${ch.chapterNumber}`,
        level,
        german,
        article: parsed.article,
        germanWord: parsed.germanWord,
        plural: parsed.plural,
        bangla,
        english: row.english.trim(),
        exampleGerman: row.exampleGerman?.trim() || undefined,
        exampleBangla: row.exampleBangla?.trim() || undefined,
        image: null,
        imageQuery: parsed.germanWord,
        source,
        isFavorite: false,
        needsReview: isUncertainBengaliMeaning(bangla),
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
      });
    });
  }
  return items;
}

export function getB1ChapterMeta(chapterKey?: string | null): B1ChapterDefinition | undefined {
  if (!chapterKey) return undefined;
  return B1_CHAPTERS.find(
    (ch) => ch.chapterKey === chapterKey || String(ch.chapterNumber) === chapterKey
  );
}

export interface LearningChapterMeta {
  chapterKey: string;
  chapterNumber: number;
  level: 'A1' | 'A2' | 'B1';
  title: string;
  shortTitle: string;
  bengaliTitle: string;
  fileName: string;
  entryCount: number;
}

export const ALL_CHAPTERS: LearningChapterMeta[] = [
  ...A1_CHAPTERS.map((ch) => ({
    chapterKey: `A1-${ch.chapterKey}`,
    chapterNumber: ch.chapterNumber,
    level: 'A1' as const,
    title: `A1 · Kapitel ${ch.chapterNumber}`,
    shortTitle: `A1 · ${ch.chapterNumber}`,
    bengaliTitle: `A1 অধ্যায় ${ch.chapterNumber}`,
    fileName: `A1 Kapitel ${ch.chapterNumber}`,
    entryCount: ch.entries.length,
  })),
  ...A2_CHAPTERS.map((ch) => ({
    chapterKey: `A2-${ch.chapterKey}`,
    chapterNumber: ch.chapterNumber,
    level: 'A2' as const,
    title: `A2 · Kapitel ${ch.chapterNumber}`,
    shortTitle: `A2 · ${ch.chapterNumber}`,
    bengaliTitle: `A2 অধ্যায় ${ch.chapterNumber}`,
    fileName: `A2 Kapitel ${ch.chapterNumber}`,
    entryCount: ch.entries.length,
  })),
  ...B1_CHAPTERS.map((ch) => ({
    chapterKey: ch.chapterKey,
    chapterNumber: ch.chapterNumber,
    level: 'B1' as const,
    title: ch.title,
    shortTitle: ch.shortTitle,
    bengaliTitle: ch.bengaliTitle,
    fileName: ch.fileName,
    entryCount: ch.entryCount,
  })),
];

export function getChapterMeta(chapterKey?: string | null): LearningChapterMeta | undefined {
  if (!chapterKey) return undefined;
  return ALL_CHAPTERS.find((ch) => ch.chapterKey === chapterKey);
}

export function parseGermanHeadword(raw: string): {
  article: GermanArticle;
  germanWord: string;
  plural?: string;
} {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  let article: GermanArticle = null;
  let rest = cleaned;

  if (/^der\/die\s+/i.test(rest)) {
    article = 'der';
    rest = rest.replace(/^der\/die\s+/i, '');
  } else if (/^der\/das\s+/i.test(rest)) {
    article = 'der';
    rest = rest.replace(/^der\/das\s+/i, '');
  } else if (/^der\s+/i.test(rest)) {
    article = 'der';
    rest = rest.replace(/^der\s+/i, '');
  } else if (/^die\s+/i.test(rest) && /\(Pl\.\)/i.test(rest)) {
    article = 'die (Pl.)';
    rest = rest.replace(/^die\s+/i, '');
  } else if (/^die\s+/i.test(rest)) {
    article = 'die';
    rest = rest.replace(/^die\s+/i, '');
  } else if (/^das\s+/i.test(rest)) {
    article = 'das';
    rest = rest.replace(/^das\s+/i, '');
  }

  let plural: string | undefined;
  if (article !== null) {
    const commaMatch = rest.match(/^([^,]+),\s*(.+)$/);
    if (commaMatch) {
      rest = commaMatch[1].trim();
      plural = commaMatch[2].trim();
    } else if (/\(Pl\.\)$/i.test(rest)) {
      plural = '(Pl.)';
    }
  }

  // Strip grammatical tags like (Sg.), (Pl.), (Sg., ugs.), (ugs.) from bare germanWord for search/audio
  const bareWord = rest
    .replace(/\s*\((?:Sg\.|Pl\.|Sg\.,\s*ugs\.|ugs\.)\)\s*$/i, '')
    .trim();

  return {
    article,
    germanWord: bareWord || rest.trim(),
    plural,
  };
}

export function createInitialDemoVocab(): VocabItem[] {
  const nowIso = new Date().toISOString();
  const items: VocabItem[] = [];

  items.push(...createImportedLevelVocab(A1_CHAPTERS, 'A1', 'sample-a1', nowIso));
  items.push(...createImportedLevelVocab(A2_CHAPTERS, 'A2', 'sample-a2', nowIso));

  for (const ch of B1_CHAPTERS) {
    ch.entries.forEach((row, idx) => {
      const cleanGerman = row.german.trim();
      const parsed = parseGermanHeadword(cleanGerman);
      const cleanBangla = row.bangla.trim();
      const cleanEnglish = row.english.trim();
      const cleanExample = row.exampleGerman.trim();

      items.push({
        id: `b1-ch${ch.chapterKey}-${idx + 1}`,
        pdfName: ch.fileName,
        chapter: ch.chapterKey,
        section: row.section.trim(),
        topic: ch.title,
        level: 'B1',
        german: cleanGerman,
        article: parsed.article,
        germanWord: parsed.germanWord,
        plural: parsed.plural,
        bangla: cleanBangla,
        english: cleanEnglish,
        exampleGerman: cleanExample || undefined,
        image: null,
        imageQuery: parsed.germanWord,
        source: 'sample-b1',
        isFavorite: false,
        needsReview: isUncertainBengaliMeaning(cleanBangla),
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
      });
    });
  }

  return items;
}

export function hasCorruptedBengaliGlyphs(text: string): boolean {
  return hasLegacyPdfBengaliArtifacts(text);
}

export function parseCleanB1TextToDrafts(
  rawText: string,
  existingItems: VocabItem[]
): ExtractedDraftItem[] {
  const lines = rawText.split(/\r?\n/);
  const existingSet = new Set(existingItems.map((i) => i.german.toLowerCase().trim()));
  const seenInBatch = new Set<string>();
  const drafts: ExtractedDraftItem[] = [];

  let currentChapter = '1';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      !line ||
      /^[=-]+$/.test(line) ||
      line.startsWith('DEUTSCH B1') ||
      line.startsWith('Source:') ||
      line.startsWith('Format:')
    ) {
      continue;
    }

    const chapterMatch = line.match(/^KAPITEL\s+(\d+)/i);
    if (chapterMatch) {
      currentChapter = chapterMatch[1];
      continue;
    }

    const entryMatch = line.match(/^\[([^\]]+)\]\s+(.+)$/);
    if (!entryMatch) continue;

    const section = entryMatch[1].trim();
    const parts = entryMatch[2].split('|').map((p) => p.trim());
    if (parts.length < 2) continue;

    const cleanGerman = parts[0];
    const meaningPart = parts[1];
    const cleanExample = parts[2] || '';

    const dashIdx = meaningPart.indexOf(' - ');
    const banglaRaw = dashIdx !== -1 ? meaningPart.slice(0, dashIdx).trim() : meaningPart;
    const english = dashIdx !== -1 ? meaningPart.slice(dashIdx + 3).trim() : '';
    const bangla = repairBengaliUnicode(banglaRaw);

    const parsed = parseGermanHeadword(cleanGerman);
    const key = cleanGerman.toLowerCase();
    const isDup = existingSet.has(key) || seenInBatch.has(key);
    seenInBatch.add(key);

    const uncertain = isUncertainBengaliMeaning(bangla);

    drafts.push({
      id: `b1-txt-${drafts.length + 1}-${Date.now()}`,
      german: cleanGerman,
      article: parsed.article,
      germanWord: parsed.germanWord,
      plural: parsed.plural,
      bangla,
      english,
      exampleGerman: cleanExample || undefined,
      pdfPage: Number(currentChapter) || 1,
      chapter: currentChapter,
      section,
      status: isDup ? 'duplicate' : 'approved',
      warning: uncertain
        ? 'Uncertain Bengali text detected — review or edit manually before importing.'
        : undefined,
    });
  }

  return drafts;
}

export async function loadAttachedB1SampleDrafts(
  existingItems: VocabItem[]
): Promise<ExtractedDraftItem[]> {
  const res = await fetch('/assets/aistudio/deutsch_b1_vocabulary_clean_text_version_83e9d80a.txt');
  if (!res.ok) {
    throw new Error('Could not load deutsch_b1_vocabulary_clean_text_version.txt');
  }
  const rawText = await res.text();
  return parseCleanB1TextToDrafts(rawText, existingItems);
}
