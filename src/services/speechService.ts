export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakGerman(
  text: string,
  options?: { rate?: number; onStart?: () => void; onEnd?: () => void; onError?: () => void }
): void {
  if (!isSpeechSupported() || !text.trim()) {
    options?.onError?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/,\s*(?:"-e|"-er|"-|-e|-en|-er|-n|-s|\(Sg\.\)|\(Pl\.\))/gi, '')
      .replace(/\|/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = options?.rate ?? 0.95;

    const voices = window.speechSynthesis.getVoices();
    const germanVoice =
      voices.find((v) => v.lang.toLowerCase() === 'de-de') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('de'));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }

    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = () => options?.onError?.();

    window.speechSynthesis.speak(utterance);
  } catch {
    options?.onError?.();
  }
}
