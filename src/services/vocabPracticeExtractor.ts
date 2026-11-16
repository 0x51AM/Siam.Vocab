import {
  NounPracticeEntry,
  SentencePracticeEntry,
  VerbPracticeEntry,
  VocabItem,
} from '../types';

const COMMON_NON_VERB_LOWERCASE = new Set([
  'morgen',
  'gestern',
  'vorgestern',
  'übermorgen',
  'heute',
  'abend',
  'oben',
  'unten',
  'innen',
  'außen',
  'aussen',
  'zwischen',
  'neben',
  'hinter',
  'wegen',
  'meinetwegen',
  'trotz',
  'während',
  'gegen',
  'dagegen',
  'ohne',
  'zusammen',
  'allein',
  'draußen',
  'drinnen',
  'drüben',
  'hinten',
  'vorne',
  'eben',
  'schon',
  'gern',
  'viel',
  'wenig',
  'selten',
  'immer',
  'meistens',
  'besonders',
  'manchmal',
  'eigentlich',
  'natürlich',
  'vielleicht',
  'wirklich',
  'hoffentlich',
  'leider',
  'deswegen',
  'trotzdem',
  'außerdem',
  'daneben',
  'dazwischen',
  'inzwischen',
  'mittlerweile',
  'sofort',
  'gerade',
  'direkt',
  'ungefähr',
  'fast',
  'kaum',
  'noch',
  'nicht',
  'auch',
  'nur',
  'aber',
  'oder',
  'denn',
  'weil',
  'dass',
  'wenn',
  'als',
  'ob',
  'bis',
  'seit',
  'nach',
  'von',
  'mit',
  'bei',
  'aus',
  'für',
  'durch',
  'über',
  'unter',
  'vor',
  'an',
  'auf',
  'in',
  'zu',
  'um',
  'ein',
  'eine',
  'einen',
  'einem',
  'einer',
  'kein',
  'keine',
  'mein',
  'dein',
  'sein',
  'ihr',
  'unser',
  'euer',
  'dieser',
  'diese',
  'dieses',
  'jeder',
  'jede',
  'jedes',
  'alle',
  'viele',
  'einige',
  'andere',
  'erste',
  'zweite',
  'dritte',
  'guten',
  'gute',
  'gutes',
  'guter',
  'alten',
  'neue',
  'neuen',
  'eigenen',
  'eigen',
  'offen',
  'trocken',
  'modern',
  'unmodern',
  'einzeln',
  'fern',
  'zufrieden',
  'willkommen',
  'wessen',
  'verschieden',
  'verboten',
  'geschieden',
  'geschlossen',
  'erwachsen',
  'erfahren',
  'einverstanden',
  'betrunken',
  'geboren',
  'einigermaßen',
]);

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanSentenceText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function looksLikeGermanSentence(text: string): boolean {
  const s = cleanSentenceText(text);
  if (!s || s.length < 10) return false;
  if (s.includes('|')) return false;
  if (/^(?:der|die|das)\s+[A-ZÄÖÜ][a-zäöüß]+(?:,\s*[-"¨eërn\s()]+)?$/i.test(s)) return false;

  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;

  // Must start with uppercase letter or German quote and end cleanly as sentence or contain finite structure
  if (!/^[A-ZÄÖÜ„"0-9]/.test(s)) return false;
  if (!/[.!?…]$/.test(s) && words.length < 4) return false;
  return true;
}

function extractVerbFormsFromHeadword(rawGerman: string): {
  infinitive: string;
  verbForms?: string;
} {
  const cleaned = rawGerman.trim();
  // Format: "arbeiten (arbeitet, arbeitete, hat gearbeitet)"
  const parenMatch = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const inside = parenMatch[2].trim();
    if (inside.includes(',') || /\b(?:hat|ist|war)\b/.test(inside)) {
      return {
        infinitive: parenMatch[1].trim(),
        verbForms: inside,
      };
    }
  }
  return { infinitive: cleaned };
}

function isLikelyGermanVerb(rawGerman: string, english: string): boolean {
  const cleaned = rawGerman.trim();
  if (!cleaned) return false;
  if (/^(?:der|die|das|ein|eine)\b/i.test(cleaned)) return false;

  const { infinitive } = extractVerbFormsFromHeadword(cleaned);
  const base = infinitive.replace(/\s*\([^)]*\)\s*/g, '').trim();

  if (!base || base.includes(',') || base.includes('/') || base.split(/\s+/).length > 3) {
    return false;
  }

  // Must start lowercase (excluding nouns, expressions) or start with reflexive "sich "
  const isLowercaseInfinitive = /^(?:sich\s+)?[a-zäöüß][a-zäöüß\s-]{1,40}(?:en|ern|eln|sein|tun)$/.test(
    base
  );
  if (!isLowercaseInfinitive) return false;

  const bareLower = base.toLowerCase();
  if (COMMON_NON_VERB_LOWERCASE.has(bareLower)) return false;

  const en = (english || '').trim();
  // Explicit infinitive English gloss ("to ...", "hier: to ...", "here: to ...")
  if (/^(?:(?:hier|here):\s*)?to\s+[a-z]/i.test(en)) {
    return true;
  }

  // Known modal / common German infinitives expressed without "to " in English gloss
  if (/^(?:would like|must\/have to|will|will\s*\/\s*to become|horseback riding)$/i.test(en)) {
    return true;
  }

  return false;
}

export function extractVocabularyPracticePools(items: VocabItem[]): {
  nouns: NounPracticeEntry[];
  verbs: VerbPracticeEntry[];
  sentences: SentencePracticeEntry[];
} {
  const nouns: NounPracticeEntry[] = [];
  const verbs: VerbPracticeEntry[] = [];
  const sentences: SentencePracticeEntry[] = [];

  const seenNouns = new Set<string>();
  const seenVerbs = new Set<string>();
  const seenSentences = new Set<string>();

  for (const item of items) {
    const sourceLabel = item.topic || (item.chapter ? `${item.level} · ${item.chapter}` : item.level);

    // 1. Singular German nouns with definite articles (der / die / das)
    if (
      (item.article === 'der' || item.article === 'die' || item.article === 'das') &&
      /^[A-ZÄÖÜ]/.test(item.germanWord) &&
      !/\(Pl\.\)/i.test(item.german)
    ) {
      const nounKey = `${item.article}|${normalizeKey(item.germanWord)}`;
      if (!seenNouns.has(nounKey)) {
        seenNouns.add(nounKey);
        nouns.push({
          id: `noun-${item.id}`,
          chapter: item.chapter,
          section: item.section,
          topic: item.topic,
          level: item.level,
          sourceLabel,
          german: item.german,
          article: item.article,
          noun: item.germanWord,
          plural: item.plural,
          bangla: item.bangla,
          english: item.english,
          exampleGerman: item.exampleGerman,
        });
      }
    } else if (isLikelyGermanVerb(item.german, item.english)) {
      // 2. German verbs
      const { infinitive, verbForms } = extractVerbFormsFromHeadword(item.german);
      const verbKey = normalizeKey(infinitive);
      if (!seenVerbs.has(verbKey)) {
        seenVerbs.add(verbKey);
        verbs.push({
          id: `verb-${item.id}`,
          chapter: item.chapter,
          section: item.section,
          topic: item.topic,
          level: item.level,
          sourceLabel,
          verb: infinitive,
          verbForms,
          bangla: item.bangla,
          english: item.english,
          exampleGerman: item.exampleGerman,
        });
      }
    }

    // 3. Complete German sentences from existing vocabulary examples
    if (item.exampleGerman && looksLikeGermanSentence(item.exampleGerman)) {
      const cleanedSent = cleanSentenceText(item.exampleGerman);
      const sentKey = normalizeKey(cleanedSent);
      if (!seenSentences.has(sentKey)) {
        seenSentences.add(sentKey);
        sentences.push({
          id: `sent-${item.id}`,
          chapter: item.chapter,
          section: item.section,
          topic: item.topic,
          level: item.level,
          sourceLabel,
          germanSentence: cleanedSent,
          bangla: item.exampleBangla,
          english: item.exampleEnglish,
          sourceWord: item.german,
        });
      }
    }
  }

  return { nouns, verbs, sentences };
}
