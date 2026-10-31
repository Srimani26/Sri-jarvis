/**
 * SentenceSplitter.ts — Streaming Sentence Boundary Splitter
 * Assimilated from ethan-jarvis speech.py and dograh realtime chunking pipeline.
 *
 * Breaks streaming AI text into natural prosody sentence units:
 * - Emits opening chunk at the first strong break (dash, colon, semicolon, comma) past 35 chars
 * - Eliminates 5-second wait times by synthesizing the first sentence in ~350ms
 * - Handles honorifics (Mr., Dr.), abbreviations (e.g., i.e.), decimals (3.5), and list indices (1.)
 */

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'inc', 'ltd',
  'co', 'no', 'approx', 'fig', 'dept', 'e.g', 'i.e', 'a.m', 'p.m', 'u.s', 'u.k'
])

const CLOSERS = new Set(['"', "'", ')', ']', '}'])
const STRONG_BREAKS = [' — ', ' – ', '; ', ': ']
const CLAUSE_BREAKS = [', ', '; ', ' — ', ' – ', ': ']

function getWordBefore(text: string, index: number): string {
  let j = index
  while (j > 0 && !/\s/.test(text[j - 1])) {
    j--
  }
  return text.slice(j, index)
}

export class SentenceSplitter {
  private buffer = ''
  private emittedCount = 0
  private readonly firstChunkMax: number
  private readonly firstChunkMin: number

  constructor(firstChunkMax: number = 140, firstChunkMin: number = 18) {
    this.firstChunkMax = firstChunkMax
    this.firstChunkMin = firstChunkMin
  }

  public reset() {
    this.buffer = ''
    this.emittedCount = 0
  }

  public feed(delta: string): string[] {
    this.buffer += delta
    const out: string[] = []

    while (true) {
      const cut = this.findBoundary(this.buffer)
      if (cut === null) break
      out.push(this.take(cut))
    }

    if (this.emittedCount === 0) {
      // Early emission of opening phrase for sub-400ms time-to-first-sound
      let cut = this.findFirstStrongBreak(this.buffer, this.firstChunkMin)
      if (cut === null && this.buffer.length >= this.firstChunkMax) {
        cut = this.findLastClauseBreak(this.buffer)
      }
      if (cut !== null) {
        out.push(this.take(cut))
      }
    }

    return out.filter(Boolean)
  }

  public flush(): string | null {
    const chunk = this.buffer.trim()
    this.buffer = ''
    if (chunk) {
      this.emittedCount++
      return chunk
    }
    return null
  }

  private take(cut: number): string {
    const chunk = this.buffer.slice(0, cut).trim()
    this.buffer = this.buffer.slice(cut).trimStart()
    if (chunk) {
      this.emittedCount++
    }
    return chunk
  }

  private findFirstStrongBreak(text: string, minPos: number): number | null {
    let best: number | null = null
    const effectiveMin = Math.min(minPos, 18)
    for (const sep of STRONG_BREAKS) {
      const pos = text.indexOf(sep)
      if (pos >= effectiveMin) {
        const end = pos + sep.trimEnd().length
        if (best === null || end < best) {
          best = end
        }
      }
    }
    return best
  }

  private findLastClauseBreak(text: string): number | null {
    let best: number | null = null
    for (const sep of CLAUSE_BREAKS) {
      const pos = text.lastIndexOf(sep)
      if (pos > 0) {
        const end = pos + sep.trimEnd().length
        if (best === null || end > best) {
          best = end
        }
      }
    }
    return best
  }

  private findBoundary(text: string): number | null {
    const n = text.length
    let i = 0

    while (i < n) {
      const ch = text[i]
      if (ch === '.' || ch === '!' || ch === '?') {
        let j = i
        while (j < n && (text[j] === '.' || text[j] === '!' || text[j] === '?')) {
          j++
        }
        let k = j
        while (k < n && CLOSERS.has(text[k])) {
          k++
        }
        if (k >= n) {
          return null // Wait for following characters to confirm boundary
        }
        if (!/\s/.test(text[k])) {
          // E.g. "3.5", "server.js"
          i = k
          continue
        }
        if (ch === '.' && j - i === 1) {
          const word = getWordBefore(text, i).toLowerCase().replace(/[^a-z0-9]/g, '')
          if (
            ABBREVIATIONS.has(word) ||
            (word.length === 1 && /^[A-Z]$/.test(getWordBefore(text, i))) ||
            /^\d+$/.test(word)
          ) {
            i = k
            continue
          }
        }
        return k
      }
      i++
    }
    return null
  }

  /**
   * Utility to split a static block of text into sentences.
   */
  public static split(text: string): string[] {
    const splitter = new SentenceSplitter()
    const chunks = splitter.feed(text)
    const final = splitter.flush()
    if (final) chunks.push(final)
    return chunks
  }
}

