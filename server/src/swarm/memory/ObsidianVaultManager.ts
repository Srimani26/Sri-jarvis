/**
 * ObsidianVaultManager.ts — Local Markdown Memory & Obsidian Vault Synchronization
 * Target: src/swarm/memory/ObsidianVaultManager.ts & server/src/swarm/memory/ObsidianVaultManager.ts
 *
 * Implements Obsidian integration from:
 * https://gist.github.com/Syedmudassir1604/512684147667ecd5e6cc9843e4277a48
 *
 * Features:
 * 1. Plain text markdown notes with YAML frontmatter and [[wikilinks]].
 * 2. Dedicated vault folders: DailyBriefs/, Pipelines/, Specialists/, Memory/.
 * 3. Bidirectional search across local vault markdown files without cloud lock-in.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export interface ObsidianNoteMeta {
  title: string
  date: string
  tags: string[]
  agent?: string
  status?: string
  [key: string]: any
}

export interface ObsidianNote {
  fileName: string
  category: string
  filePath: string
  meta: ObsidianNoteMeta
  content: string
}

export class ObsidianVaultManager {
  private static instance: ObsidianVaultManager
  private vaultRoot: string

  public static getInstance(vaultRoot?: string): ObsidianVaultManager {
    if (!ObsidianVaultManager.instance) {
      ObsidianVaultManager.instance = new ObsidianVaultManager(vaultRoot)
    }
    return ObsidianVaultManager.instance
  }

  constructor(customPath?: string) {
    this.vaultRoot = customPath || process.env.OBSIDIAN_VAULT_PATH || join(process.cwd(), 'vault')
    this.ensureVaultStructure()
  }

  public getVaultRoot(): string {
    return this.vaultRoot
  }

  /**
   * Ensure standard Obsidian directory hierarchy
   */
  public ensureVaultStructure(): void {
    const categories = ['DailyBriefs', 'Pipelines', 'Specialists', 'Memory', 'Tasks']
    if (!existsSync(this.vaultRoot)) {
      mkdirSync(this.vaultRoot, { recursive: true })
    }
    for (const cat of categories) {
      const catDir = join(this.vaultRoot, cat)
      if (!existsSync(catDir)) {
        mkdirSync(catDir, { recursive: true })
      }
    }
  }

  /**
   * Save a formatted Markdown note with YAML frontmatter and [[wikilinks]]
   */
  public saveNote(
    category: 'DailyBriefs' | 'Pipelines' | 'Specialists' | 'Memory' | 'Tasks' | string,
    title: string,
    content: string,
    meta: Partial<ObsidianNoteMeta> = {}
  ): { filePath: string; fileName: string; note: ObsidianNote } {
    this.ensureVaultStructure()

    const safeTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim()
    const fileName = `${safeTitle.replace(/\s+/g, '_')}.md`
    const targetDir = join(this.vaultRoot, category)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const fullPath = join(targetDir, fileName)

    const fullMeta: ObsidianNoteMeta = {
      title,
      date: new Date().toISOString(),
      tags: ['jarvis', 'autonomous', category.toLowerCase(), ...(meta.tags || [])],
      agent: meta.agent || 'jarvis',
      status: meta.status || 'COMPLETED',
      ...meta
    }

    const frontmatterLines = [
      '---',
      `title: "${fullMeta.title}"`,
      `date: "${fullMeta.date}"`,
      `tags: [${fullMeta.tags.map(t => `"${t}"`).join(', ')}]`,
      `agent: "${fullMeta.agent}"`,
      `status: "${fullMeta.status}"`,
      '---',
      ''
    ]

    const bodyWithWikilinks = [
      `# ${title}`,
      '',
      content.trim(),
      '',
      '---',
      '## Sovereign Swarm Context',
      `- **Agent Node:** [[Specialists/${fullMeta.agent}]]`,
      `- **Obsidian Category:** [[${category}]]`,
      `- **High Command:** [[Master Sri]]`,
      `- **Pipeline Index:** [[Pipelines/Index]]`
    ].join('\n')

    const fileContent = frontmatterLines.join('\n') + bodyWithWikilinks
    writeFileSync(fullPath, fileContent, 'utf-8')

    return {
      filePath: fullPath,
      fileName,
      note: {
        fileName,
        category,
        filePath: fullPath,
        meta: fullMeta,
        content: bodyWithWikilinks
      }
    }
  }

  /**
   * Read note from vault
   */
  public readNote(category: string, fileName: string): string | null {
    const fullPath = join(this.vaultRoot, category, fileName.endsWith('.md') ? fileName : `${fileName}.md`)
    if (!existsSync(fullPath)) return null
    return readFileSync(fullPath, 'utf-8')
  }

  /**
   * Search markdown notes across all vault categories
   */
  public searchVault(query: string): ObsidianNote[] {
    const q = query.toLowerCase()
    const results: ObsidianNote[] = []

    if (!existsSync(this.vaultRoot)) return results

    const categories = readdirSync(this.vaultRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const cat of categories) {
      const catPath = join(this.vaultRoot, cat)
      const files = readdirSync(catPath).filter(f => f.endsWith('.md'))

      for (const file of files) {
        const filePath = join(catPath, file)
        try {
          const raw = readFileSync(filePath, 'utf-8')
          if (raw.toLowerCase().includes(q)) {
            results.push({
              fileName: file,
              category: cat,
              filePath,
              meta: { title: file.replace('.md', ''), date: '', tags: [] },
              content: raw
            })
          }
        } catch {}
      }
    }

    return results
  }
}

export const obsidianVaultManager = ObsidianVaultManager.getInstance()
