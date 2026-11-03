/**
 * surgicalFileTools.ts — Claude-Code Grade Surgical File Operations Engine
 * Target: server/src/swarm/tools/surgicalFileTools.ts & src/swarm/tools/surgicalFileTools.ts
 *
 * Implements:
 * 1. workspace_view_tree: Fast directory tree visualization.
 * 2. workspace_read_file: Exact line-range reads to conserve token window.
 * 3. workspace_patch_file: Surgical substring / diff patching without full rewriting.
 * 4. workspace_write_file: Full file generation with automatic directory creation.
 * 5. workspace_grep: Regex-based pattern search across project codebase.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, relative, dirname } from 'node:path'

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.cache',
  'tmp',
  '.next',
  '.turbo',
  'build'
])

export interface ReadFileResult {
  filePath: string
  totalLines: number
  startLine: number
  endLine: number
  content: string
}

export interface PatchFileResult {
  success: boolean
  filePath: string
  replacements: number
  message: string
}

export interface GrepMatch {
  file: string
  line: number
  content: string
}

/**
 * 1. workspace_view_tree: Returns structured ASCII tree
 */
export function workspaceViewTree(
  directory = '.',
  maxDepth = 3,
  workspaceRoot = process.cwd()
): string {
  const root = resolve(workspaceRoot, directory)
  if (!existsSync(root)) {
    return `[TREE_ERROR] Directory not found: ${directory}`
  }

  const lines: string[] = [relative(workspaceRoot, root) || '.']

  function walk(currentDir: string, currentDepth: number, prefix: string) {
    if (currentDepth > maxDepth) return

    let entries: string[] = []
    try {
      entries = readdirSync(currentDir).filter(name => !IGNORED_DIRS.has(name))
    } catch {
      return
    }

    entries.sort((a, b) => {
      const aIsDir = statSync(join(currentDir, a)).isDirectory()
      const bIsDir = statSync(join(currentDir, b)).isDirectory()
      if (aIsDir && !bIsDir) return -1
      if (!aIsDir && bIsDir) return 1
      return a.localeCompare(b)
    })

    entries.forEach((entry, idx) => {
      const fullPath = join(currentDir, entry)
      const isLast = idx === entries.length - 1
      const isDir = statSync(fullPath).isDirectory()
      const branch = isLast ? '└── ' : '├── '
      lines.push(`${prefix}${branch}${entry}${isDir ? '/' : ''}`)

      if (isDir) {
        walk(fullPath, currentDepth + 1, prefix + (isLast ? '    ' : '│   '))
      }
    })
  }

  walk(root, 1, '')
  return lines.join('\n')
}

/**
 * 2. workspace_read_file: Reads exact line ranges with 1-based line numbering
 */
export function workspaceReadFile(
  filePath: string,
  startLine = 1,
  endLine?: number,
  workspaceRoot = process.cwd()
): ReadFileResult {
  const targetPath = resolve(workspaceRoot, filePath)
  if (!existsSync(targetPath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const raw = readFileSync(targetPath, 'utf-8')
  const lines = raw.split(/\r?\n/)
  const totalLines = lines.length

  const s = Math.max(1, startLine)
  const e = endLine ? Math.min(totalLines, endLine) : totalLines

  const sliced = lines.slice(s - 1, e)
  const formatted = sliced.map((line, idx) => {
    const lineNum = String(s + idx).padStart(4, ' ')
    return `${lineNum} | ${line}`
  }).join('\n')

  return {
    filePath: relative(workspaceRoot, targetPath),
    totalLines,
    startLine: s,
    endLine: e,
    content: formatted
  }
}

/**
 * 3. workspace_patch_file: Performs surgical diff patching
 */
export function workspacePatchFile(
  filePath: string,
  oldString: string,
  newString: string,
  workspaceRoot = process.cwd()
): PatchFileResult {
  const targetPath = resolve(workspaceRoot, filePath)
  if (!existsSync(targetPath)) {
    throw new Error(`Cannot patch non-existent file: ${filePath}`)
  }

  const raw = readFileSync(targetPath, 'utf-8')

  // 1. Direct exact replacement
  if (raw.includes(oldString)) {
    const patched = raw.replace(oldString, newString)
    writeFileSync(targetPath, patched, 'utf-8')
    return {
      success: true,
      filePath: relative(workspaceRoot, targetPath),
      replacements: 1,
      message: `Successfully replaced target substring in ${filePath}.`
    }
  }

  // 2. Normalized newline replacement (CRLF vs LF)
  const normalizedRaw = raw.replace(/\r\n/g, '\n')
  const normalizedOld = oldString.replace(/\r\n/g, '\n')
  const normalizedNew = newString.replace(/\r\n/g, '\n')

  if (normalizedRaw.includes(normalizedOld)) {
    const patched = normalizedRaw.replace(normalizedOld, normalizedNew)
    writeFileSync(targetPath, patched, 'utf-8')
    return {
      success: true,
      filePath: relative(workspaceRoot, targetPath),
      replacements: 1,
      message: `Successfully replaced normalized substring in ${filePath}.`
    }
  }

  // 3. Trimmed single-line match fallback
  const trimmedOld = oldString.trim()
  if (trimmedOld.length > 0 && normalizedRaw.includes(trimmedOld)) {
    const patched = normalizedRaw.replace(trimmedOld, normalizedNew.trim())
    writeFileSync(targetPath, patched, 'utf-8')
    return {
      success: true,
      filePath: relative(workspaceRoot, targetPath),
      replacements: 1,
      message: `Successfully patched trimmed single-line match in ${filePath}.`
    }
  }

  throw new Error(`Target string not found in ${filePath}. Please read the file first to verify exact contents.`)
}

/**
 * 4. workspace_write_file: Creates or overwrites complete file
 */
export function workspaceWriteFile(
  filePath: string,
  content: string,
  workspaceRoot = process.cwd()
): { success: boolean; filePath: string; bytesWritten: number } {
  const targetPath = resolve(workspaceRoot, filePath)
  const dir = dirname(targetPath)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(targetPath, content, 'utf-8')

  return {
    success: true,
    filePath: relative(workspaceRoot, targetPath),
    bytesWritten: Buffer.byteLength(content, 'utf-8')
  }
}

/**
 * 5. workspace_grep: Regex-based pattern search across files
 */
export function workspaceGrep(
  pattern: string,
  directory = '.',
  maxResults = 40,
  workspaceRoot = process.cwd()
): GrepMatch[] {
  const root = resolve(workspaceRoot, directory)
  if (!existsSync(root)) return []

  const results: GrepMatch[] = []
  const regex = new RegExp(pattern, 'i')

  function walk(currentDir: string) {
    if (results.length >= maxResults) return

    let entries: string[] = []
    try {
      entries = readdirSync(currentDir).filter(name => !IGNORED_DIRS.has(name))
    } catch {
      return
    }

    for (const entry of entries) {
      if (results.length >= maxResults) break
      const fullPath = join(currentDir, entry)

      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory()) {
          walk(fullPath)
        } else if (stat.isFile() && stat.size < 500_000) {
          // Only inspect text files under 500KB
          const content = readFileSync(fullPath, 'utf-8')
          const lines = content.split(/\r?\n/)
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              results.push({
                file: relative(workspaceRoot, fullPath),
                line: i + 1,
                content: lines[i].trim().substring(0, 140)
              })
              if (results.length >= maxResults) break
            }
          }
        }
      } catch {}
    }
  }

  walk(root)
  return results
}

