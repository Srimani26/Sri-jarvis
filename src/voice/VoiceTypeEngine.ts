/**
 * VoiceType Engine
 * Inspired by Reverse_Engineered_Voicetype (https://github.com/Thirumurugan240/Reverse_Engineered_Voicetype)
 * 
 * Features:
 * 1. Global / Browser Hotkey bindings:
 *    - Hold `Ctrl + Win` (or `Ctrl + Shift`) -> Push-to-talk dictation.
 *    - Press `Ctrl + Alt + Space` -> Hands-free toggle mode.
 * 2. Phonetic Dictionary & Vocabulary Replacements (fine-tuned for technical terms & Indian English speech).
 * 3. Audio Activity Energy Estimator (VAD) for clean endpointing.
 */

export interface VoiceTypeConfig {
  hotkeyHold: string; // e.g. 'ctrl+windows' or 'ctrl+shift'
  hotkeyToggle: string; // e.g. 'ctrl+alt+space'
  primaryLanguage: string; // 'en-IN'
  fallbackLanguage: string; // 'en-US'
  silenceThresholdMs: number;
}

export class VoiceTypeEngine {
  private static config: VoiceTypeConfig = {
    hotkeyHold: 'ctrl+shift',
    hotkeyToggle: 'ctrl+alt+space',
    primaryLanguage: 'en-IN',
    fallbackLanguage: 'en-US',
    silenceThresholdMs: 900,
  };

  public static readonly PHONETIC_DICTIONARY: [RegExp, string][] = [
    [/\b(down\s*theme|dawn\s*teme|don\s*theme)\b/gi, 'Dawn theme'],
    [/\b(shopify|shop\s*fi|shotify)\b/gi, 'Shopify'],
    [/\b(liquid|liqud|likwid)\b/gi, 'Liquid'],
    [/\b(c\s*s\s*s|see\s*ss)\b/gi, 'CSS'],
    [/\b(z\s*index|zed\s*index)\b/gi, 'z-index'],
    [/\b(u\s*p\s*i)\b/gi, 'UPI'],
    [/\b(atonoumus|autonomus|atonumus)\b/gi, 'autonomous'],
    [/\b(cart\s*drower|card\s*drawer)\b/gi, 'cart drawer'],
    [/\b(scout\s*lid|scout\s*lead|scout\s*leads)\b/gi, 'scout leads'],
    [/\b(e\s*o\s*d)\b/gi, 'EOD audit'],
    [/\b(make\s*money|money\s*making)\b/gi, 'make money'],
    [/\b(freelance|free\s*lancing)\b/gi, 'freelance'],
    [/\b(standard\s*roofs|standard\s*roof)\b/gi, 'Standard Roofs'],
    [/\b(tensor\s*flow|tenser\s*flow)\b/gi, 'TensorFlow'],
    [/\b(open\s*codex|open\s*qodex)\b/gi, 'OpenQodex'],
  ];

  /**
   * Apply domain & phonetic corrections to transcribed speech
   */
  public static cleanTranscript(raw: string): string {
    let text = raw;
    for (const [pattern, replacement] of this.PHONETIC_DICTIONARY) {
      text = text.replace(pattern, replacement);
    }
    return text.trim();
  }

  /**
   * Check if a keyboard event matches the push-to-talk hotkey
   */
  public static isPushToTalkTrigger(e: KeyboardEvent): boolean {
    return e.ctrlKey && (e.shiftKey || e.metaKey);
  }

  /**
   * Check if a keyboard event matches the hands-free toggle hotkey
   */
  public static isHandsFreeToggle(e: KeyboardEvent): boolean {
    return e.ctrlKey && e.altKey && e.code === 'Space';
  }

  /**
   * Calculate root-mean-square energy of PCM samples for voice detection
   */
  public static calculateRms(samples: Float32Array): number {
    if (samples.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }
}
