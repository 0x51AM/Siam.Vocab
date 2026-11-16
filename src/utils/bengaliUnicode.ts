const GLYPH_MAP: ReadonlyArray<readonly [string, string]> = [
  [' াব অ', ' ক্লাব'],
  [' াব \u0F60', ' ক্লাব'],
  ['াব \u0F60', 'ক্লাব'],
  ['ােসর \u0F60', 'ক্লাস\uE011র'],
  ['ি\u0F60 ', 'ক্ল\uE010'],
  ['া\u0F79\u0FB2 \u0F60', 'ক্লান্ত'],
  ['র \u0FB6', 'র\u200D\u09CD\u09AF'],
  ['অথŪ', 'অর্থ'],

  ['\u0FC1', '('],
  ['\u0FC2', ')'],
  ['\u0FBA', ','],
  ['\u0FBB', ':'],
  ['\u0FB9', '.'],
  ['\u0FBF', '?'],

  ['\u0E74', '\u09C7'],
  ['\u0F48', '\u09C7'],
  ['\u0F49', '\u09C7'],
  ['\u0F4A', '\u09C7'],
  ['\u0F4B', '\u09C7'],
  ['\u0E76', '\u09C8'],

  ['\u0F27', '\u09BF'],
  ['\u0F28', '\u09BF'],
  ['\u0F29', '\u09BF'],
  ['\u0F2A', '\u09BF'],
  ['\u0F2C', '\u09BF'],
  ['\u0F2D', '\u09BF'],
  ['\u0F2E', '\u09BF'],
  ['\u0F2F', '\u09BF'],
  ['\u0F30', '\uE001'],
  ['\u0F33', '\uE002'],
  ['\u0F35', '\uE002'],

  ['\u0F3A', '\u09C0'],
  ['\u0F3F', '\u09C1'],
  ['\u0F40', '\u09C1'],
  ['\u0F42', '\u09C1'],
  ['\u0F44', '\u09C2'],
  ['\u0F45', '\u09C2'],

  ['\u0F50', '\uE003'],
  ['\u0F51', '\uE003'],
  ['\u0F52', '\uE003'],

  ['\u0FB6', '\u09CD\u09AF'],
  ['\u0FB7', '\u09CD\u09AF'],
  ['\u0F59', '\u09CD\u09AC'],
  ['\u0F26\u0FB8', '\u0981\u099B'],
  ['\u0F26', '\u0981'],
  ['\u0FB8', '\u099B'],

  ['\u0F0C', '\u09A0\uE010'],
  ['\u0F1A', '\u0997\u09C1'],
  ['\u0F1C', '\u09A4\u09CD\u09B0\u09C1'],
  ['\u0F1F', '\u09B0\u09C1'],
  ['\u0F21', '\u09B6\u09C1'],
  ['\u0F22', '\u09B9\u09C1'],
  ['\u0F60', '\u0995\u09CD\u09B2'],

  ['\u0F7B\u0FAE', '\u09AA\u09CD\u09B0'],
  ['\u0F7B\u0FB1', '\u09AA\u09CD\u09B0'],
  ['\u0F63\u0FAE', '\u0997\u09CD\u09B0'],
  ['\u0F7A', '\u09AA\u09CD'],
  ['\u0FB4', '\u09B2'],
  ['\u0F62', '\u0997\u09CD'],
  ['\u0F9F', '\u09A8'],
  ['\u0FA0', '\u09A8'],
  ['\u0FA1', '\u09AA'],
  ['\u0FA2', '\u09AC'],
  ['\u0FA3', '\u09AC'],
  ['\u0FA4', '\u09AC'],
  ['\u0FA5', '\u09AC'],
  ['\u0FA8', '\u09B0'],
  ['\u0FA9', '\u09B0'],
  ['\u0FAB', '\u09B0'],
  ['\u0FAC', '\u09B0'],
  ['\u0FAF', '\u09B0'],
  ['\u0FB1', '\u09B0'],
  ['\u0FB2', '\u09A4'],
  ['\u0F9B', '\u09A4\u09C1'],
  ['\u0F9C', '\u09A5'],
  ['\u0F9E', '\u09A8'],
  ['\u0F95', '\u09B9\u09CD'],
  ['\u0F93 \u0FB2\u0F44', '\u09B8\u09CD\u09A4\u09C2'],
  ['\u0F93 ', '\u09B8\u09CD\u09A4'],
  ['\u0F93', '\u09B8\u09CD\u09A4'],
  ['\u0F92', '\u09B8\u09CD'],
  ['\u0F55', '\u099F'],
  ['\u0F87', '\u09B2\u09CD'],
  ['\u0F88', '\u09B2\u09CD'],
  ['\u0F89', '\u09B6\u09CD'],
  ['\u0F8B', '\u09B7\u09CD'],
  ['\u0F8E', '\u09B8\u09CD'],
  ['\u0F8F', '\u09B8\u09CD'],
  ['\u0F90', '\u09B8\u09CD'],
  ['\u0F91', '\u09B8\u09CD'],
  ['\u0F94', '\u09B8\u09CD'],
  ['\u0F5A', '\u09AE'],
  ['\u0F5D', '\u09AE'],
  ['\u0F65', '\u0999\u09CD'],
  ['\u0F68', '\u099C\u09CD'],
  ['\u0F6A', '\u099F\u09CD'],
  ['\u0F6C', '\u09A1\u09CD'],
  ['\u0F6F', '\u09A3\u09CD'],
  ['\u0F70', '\u09A4\u09CD'],
  ['\u0F74', '\u09A6\u09CD'],
  ['\u0F75', '\u09A7\u09CD'],
  ['\u0F76', '\u09A8\u09CD'],
  ['\u0F77', '\u09A8\u09CD'],
  ['\u0F78', '\u09A8\u09CD'],
  ['\u0F79', '\u09A8\u09CD'],
  ['\u0F80', '\u09AD\u09CD'],
  ['\u0F81', '\u09AE\u09CD'],
  ['\u0F82', '\u09AE\u09CD'],
  ['\u0F83', '\u09AE\u09CD'],

  ['\u0E8D', '\u0995\u09CD\u0995'],
  ['\u0E8E', '\u0995\u09CD\u099F'],
  ['\u0E8F', '\u0995\u09CD\u09A4'],
  ['\u0E92', '\u0995\u09CD\u09B0'],
  ['\u0E93', '\u0995\u09CD\u09B7'],
  ['\u0E94', '\u0995\u09CD\u09B8'],
  ['\u0E95', '\u0997\u09CD\u09A7'],
  ['\u0E97', '\u0999\u09CD\u0995'],
  ['\u0E98', '\u0999\u09CD\u0996'],
  ['\u0E99', '\u0999\u09CD\u0997'],
  ['\u0E9B', '\u099A\u09CD\u099A'],
  ['\u0E9C', '\u099A\u09CD\u099B'],
  ['\u0EA0', '\u099C\u09CD\u099C'],
  ['\u0EA2', '\u099C\u09CD\u099E'],
  ['\u0EA4', '\u099E\u09CD\u099A'],
  ['\u0EA5', '\u099E\u09CD\u099B'],
  ['\u0EA6', '\u099E\u09CD\u099C'],
  ['\u0EAA', '\u099F\u09CD\u099F'],
  ['\u0EAB', '\u099F\u09CD\u09B0'],
  ['\u0EB2', '\u09A3\u09CD\u09A0'],
  ['\u0EB3', '\u09A3\u09CD\u09A1'],
  ['\u0EB4', '\u09A4\u09CD\u09A4'],
  ['\u0EB6', '\u09A4\u09CD\u09AE'],
  ['\u0EB7', '\u09A4\u09CD\u09B0'],
  ['\u0EB8', '\u09A6\u09CD\u09A6'],
  ['\u0EB9', '\u09A6\u09CD\u09A7'],
  ['\u0EBB', '\u09A6\u09CD\u09AC'],
  ['\u0EBC', '\u09A6\u09CD\u09AD'],
  ['\u0EBE', '\u09A6\u09CD\u09B0'],
  ['\u0EC1', '\u09A8\u09CD\u09A1'],
  ['\u0EC3', '\u09A8\u09CD\u09A7'],
  ['\u0EC5', '\u09A8\u09CD\u09B8'],
  ['\u0EC6', '\u09AA\u09CD\u09A4'],
  ['\u0EC9', '\u09AB\u09CD\u09B0'],
  ['\u0ECD', '\u09AC\u09CD\u09A6'],
  ['\u0ECF', '\u09AC\u09CD\u09AC'],
  ['\u0ED1', '\u09AC\u09CD\u09B0'],
  ['\u0ED2', '\u09AC\u09CD\u09B2'],
  ['\u0ED4', '\u09AE\u09CD\u09AD'],
  ['\u0ED6', '\u09B2\u09CD\u0995'],
  ['\u0EDD', '\u09B2\u09CD\u09B2'],
  ['\u0EDE', '\u09B6\u09CD\u099A'],
  ['\u0EE0', '\u09B6\u09CD\u09B0'],
  ['\u0EE1', '\u09B7\u09CD\u0995'],
  ['\u0EE2', '\u09B7\u09CD\u099F'],
  ['\u0EE3', '\u09B7\u09CD\u09A0'],
  ['\u0EE4', '\u09B7\u09CD\u09A3'],
  ['\u0EE6', '\u09B8\u09CD\u0995'],
  ['\u0EEA', '\u09B9\u09CD\u09B0'],
  ['\u0EFD', '\u09A8\u09CD\u09A4\u09CD\u09B0'],
  ['\u0F07', '\u09B7\u09CD\u099F\u09CD\u09B0'],
  ['\u0F0B', '\u09B8\u09CD\u09A4\u09CD\u09B0'],
];

/**
 * Detects non-Unicode Bengali font artifacts (Lao/Tibetan glyph mapping, replacement characters,
 * or broken pre-base vowel placement at word start).
 */
export function hasLegacyPdfBengaliArtifacts(text: string): boolean {
  if (!text) return false;
  // Lao/Tibetan/Gurmukhi/PUA glyph blocks or replacement char or অথŪ
  if (/[\u0E70-\u0EFF\u0F00-\u0FFF\u0A00-\u0A7F\uFFFD]/.test(text)) return true;
  if (text.includes('অথŪ')) return true;
  // Pre-base vowel sign at word boundary (e.g. িবষ, ๴খাল)
  if (/(?:^|[\s(/\-])[িেৈ][\u0995-\u09B9\u09DC-\u09DF]/.test(text)) return true;
  // Misordered chandrabindu before vowel sign (e.g. হঁা)
  if (/\u0981[\u09BE-\u09CC\u09D7]/.test(text)) return true;
  return false;
}

/**
 * Safely repairs legacy PDF Bengali glyph encoding and visual-order vowel placement into clean UTF-8 Bengali.
 * Leaves clean Unicode Bengali completely untouched.
 */
export function repairBengaliUnicode(raw: string): string {
  if (!raw) return raw;
  const hasGlyphNoise = /[\u0E70-\u0EFF\u0F00-\u0FFF\u0A00-\u0A7F]/.test(raw) || raw.includes('অথŪ');
  const hasVisualPreVowel = /(?:^|[\s(/\-])[িেৈ][\u0995-\u09B9\u09DC-\u09DF]/.test(raw);
  const hasBadChandra = /\u0981[\u09BE-\u09CC\u09D7]/.test(raw);

  if (!hasGlyphNoise && !hasVisualPreVowel && !hasBadChandra) {
    return raw;
  }

  let s = raw;
  if (hasGlyphNoise) {
    for (const [k, v] of GLYPH_MAP) {
      s = s.split(k).join(v);
    }
  }

  const C = '[\\u0995-\\u09B9\\u09DC-\\u09DF]';
  const CLUSTER = `${C}(?:\\u200D?\\u09CD${C})*`;
  const FULL_CLUSTER = `(?:\\u09B0\\u09CD)?${CLUSTER}`;

  // Move reph markers
  s = s.replace(new RegExp(`(${CLUSTER})([\\u09C0-\\u09C4]?)\\uE003`, 'g'), '\u09B0\u09CD$1$2');
  s = s.replace(new RegExp(`\\uE002(${CLUSTER})`, 'g'), '\u09B0\u09CD$1\uE010');
  s = s.replace(new RegExp(`\\uE001(${CLUSTER})`, 'g'), '$1\uE010\u0981');

  if (hasGlyphNoise || hasVisualPreVowel) {
    // Reorder visual pre-base ে + cluster + া/ৗ -> ো/ৌ
    s = s.replace(
      new RegExp(`\\u09C7(${FULL_CLUSTER})([\\u09C1-\\u09C4]?)\\u0981?\\u09BE`, 'g'),
      (m, cl: string, u: string) => `${cl}${u}\u09CB${m.includes('\u0981') ? '\u0981' : ''}`
    );
    s = s.replace(
      new RegExp(`\\u09C7(${FULL_CLUSTER})([\\u09C1-\\u09C4]?)\\u0981?\\u09D7`, 'g'),
      (m, cl: string, u: string) => `${cl}${u}\u09CC${m.includes('\u0981') ? '\u0981' : ''}`
    );
    // Reorder remaining visual pre-base ি, ে, ৈ
    s = s.replace(
      new RegExp(`([\\u09BF\\u09C7\\u09C8])(${FULL_CLUSTER})([\\u09C1-\\u09C4]?)`, 'g'),
      '$2$3$1'
    );
  }

  s = s.replace(/\uE010/g, '\u09BF').replace(/\uE011/g, '\u09C7');
  s = s.replace(/\u0981([\u09BE-\u09CC\u09D7])/g, '$1\u0981');

  if (hasGlyphNoise) {
    s = s
      .replace(/পৌঁছছে/g, 'পৌঁছে')
      .replace(/পৌঁছছানো/g, 'পৌঁছানো')
      .replace(/স্ততূপ/g, 'স্তূপ')
      .replace(/প্রস্তত/g, 'প্রস্তুত')
      .replace(/বিষয়বস্ত(?![\u0980-\u09FF])/g, 'বিষয়বস্তু')
      .replace(/শিল্প বস্ত/g, 'শিল্পবস্তু');
  }

  return s.replace(/\s{2,}/g, ' ').trim().normalize('NFC');
}

/**
 * Checks whether a Bengali translation string still has uncertain/corrupted sequences
 * (unmapped glyphs, replacement chars, orphan vowel signs, or empty meaning) and should be flagged for manual review.
 */
export function isUncertainBengaliMeaning(bangla: string): boolean {
  const trimmed = (bangla || '').trim();
  if (!trimmed) return true;
  if (/[\u0E70-\u0EFF\u0F00-\u0FFF\u0A00-\u0A7F\uFFFD□]/.test(trimmed)) return true;
  if (/(?:^|[\s(/\-:,;?])[\u09BE-\u09CC\u09D7\u09CD\u0981\u0982\u0983]/.test(trimmed)) return true;
  if (/\u09CD(?:$|[\s)/\-:,;?])/.test(trimmed)) return true;
  return false;
}
