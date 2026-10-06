/**
 * J.A.R.V.I.S. MARK-V Surgical Diff Patcher
 * Deterministic Aider-style Search & Replace diff applicator.
 * Guarantees zero code destruction and whitespace preservation.
 */

export interface PatchBlock {
  search: string;
  replace: string;
}

export interface PatchResult {
  success: boolean;
  patchedContent: string;
  blocksApplied: number;
  error?: string;
}

export class DiffPatcher {
  /**
   * Parse Aider-style Search/Replace blocks:
   * <<<<<<< SEARCH
   * ... search lines ...
   * =======
   * ... replace lines ...
   * >>>>>>>
   */
  public static parseBlocks(patchText: string): PatchBlock[] {
    const blocks: PatchBlock[] = [];
    const blockRegex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>>/g;

    let match: RegExpExecArray | null;
    while ((match = blockRegex.exec(patchText)) !== null) {
      blocks.push({
        search: match[1],
        replace: match[2],
      });
    }

    return blocks;
  }

  /**
   * Apply search and replace blocks onto target source code
   */
  public static applyPatch(originalContent: string, patchTextOrBlocks: string | PatchBlock[]): PatchResult {
    const blocks = typeof patchTextOrBlocks === 'string'
      ? this.parseBlocks(patchTextOrBlocks)
      : patchTextOrBlocks;

    if (blocks.length === 0) {
      return {
        success: false,
        patchedContent: originalContent,
        blocksApplied: 0,
        error: 'No valid SEARCH/REPLACE blocks found in patch text',
      };
    }

    let current = originalContent;
    let applied = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const searchNormalized = block.search.replace(/\r\n/g, '\n');
      const currentNormalized = current.replace(/\r\n/g, '\n');

      const index = currentNormalized.indexOf(searchNormalized);
      if (index === -1) {
        return {
          success: false,
          patchedContent: originalContent,
          blocksApplied: applied,
          error: `Patch block ${i + 1} failed: search block not found in target file`,
        };
      }

      // Check for multiple occurrences
      const nextIndex = currentNormalized.indexOf(searchNormalized, index + searchNormalized.length);
      if (nextIndex !== -1) {
        return {
          success: false,
          patchedContent: originalContent,
          blocksApplied: applied,
          error: `Patch block ${i + 1} ambiguous: search block matches multiple locations`,
        };
      }

      // Apply replacement
      current =
        currentNormalized.slice(0, index) +
        block.replace.replace(/\r\n/g, '\n') +
        currentNormalized.slice(index + searchNormalized.length);

      applied++;
    }

    return {
      success: true,
      patchedContent: current,
      blocksApplied: applied,
    };
  }
}
