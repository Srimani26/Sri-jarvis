/**
 * Native browser recognition used as a second opinion for speech-to-text.
 *
 * The server pipeline (Deepgram Nova) is the primary recognizer. When it is
 * unavailable, rate-limited, or returns nothing for a real utterance, this
 * one-shot recognizer keeps the conversation alive instead of dropping the
 * turn. It never throws and always resolves within the timeout.
 */

export interface NativeRecognitionResult {
  text: string;
  confidence: number;
  source: 'native' | 'none';
  error?: string;
}

export interface NativeRecognitionOptions {
  lang?: string;
  timeoutMs?: number;
  maxAlternatives?: number;
}

type SpeechRecognitionCtor = new () => any;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Picks the highest-confidence transcript from a recognition event.
 * Accepts both real `SpeechRecognitionResult` values (array-like collections of
 * alternatives) and plain alternative objects, which keeps it testable.
 */
export function selectBestAlternative(results: any): { text: string; confidence: number } {
  const list: any[] = results && typeof results.length === 'number' ? Array.from(results as any) : [];
  let best = { text: '', confidence: 0 };

  const consider = (alternative: any) => {
    const text = String(alternative?.transcript ?? '').trim();
    if (!text) return;
    const confidence = typeof alternative.confidence === 'number' ? alternative.confidence : 0;
    if (!best.text || confidence > best.confidence) {
      best = { text, confidence };
    }
  };

  for (const entry of list) {
    const isCollection = entry && typeof entry.length === 'number' && typeof entry.transcript !== 'string';
    if (isCollection) {
      for (const alternative of Array.from(entry as any)) consider(alternative);
    } else {
      consider(entry);
    }
  }
  return best;
}

export function recognizeOnce(options: NativeRecognitionOptions = {}): Promise<NativeRecognitionResult> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    return Promise.resolve({ text: '', confidence: 0, source: 'none', error: 'SpeechRecognition unavailable' });
  }

  const lang = options.lang || 'en-IN';
  const timeoutMs = options.timeoutMs ?? 7000;
  const maxAlternatives = options.maxAlternatives ?? 3;

  return new Promise<NativeRecognitionResult>(resolve => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let recognition: any = null;

    const finish = (result: NativeRecognitionResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try { recognition?.abort?.(); } catch {}
      resolve(result);
    };

    try {
      recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onresult = (event: any) => {
        const finalResult = event?.results?.[event.results.length - 1];
        const best = selectBestAlternative(finalResult);
        finish({
          text: best.text,
          confidence: best.confidence,
          source: best.text ? 'native' : 'none',
        });
      };
      recognition.onerror = (event: any) => {
        finish({ text: '', confidence: 0, source: 'none', error: String(event?.error ?? 'recognition_error') });
      };
      recognition.onend = () => {
        finish({ text: '', confidence: 0, source: 'none' });
      };

      timer = setTimeout(() => finish({ text: '', confidence: 0, source: 'none', error: 'timeout' }), timeoutMs);
      recognition.start();
    } catch (error: any) {
      finish({ text: '', confidence: 0, source: 'none', error: error?.message ?? String(error) });
    }
  });
}
