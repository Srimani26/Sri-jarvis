import { existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join, extname } from 'path'

export interface CodeSymbol {
  name: string
  kind: 'function' | 'class' | 'interface' | 'route' | 'type'
  file: string
  line: number
}

export interface CodebaseIndex {
  rootPath: string
  totalFiles: number
  symbolsCount: number
  fileTree: string[]
  symbols: CodeSymbol[]
  indexedAt: string
}

// Scans and builds a fast structural symbol graph of any project
export function indexProjectCodebase(projectDir: string): CodebaseIndex {
  const fileTree: string[] = []
  const symbols: CodeSymbol[] = []

  function walk(dir: string, depth = 0) {
    if (depth > 6) return
    try {
      const items = readdirSync(dir)
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.next') continue
        const fullPath = join(dir, item)
        const relPath = fullPath.replace(projectDir, '').replace(/^[/\\]/, '')
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath, depth + 1)
        } else if (stat.isFile()) {
          const ext = extname(item).toLowerCase()
          if (['.ts', '.tsx', '.js', '.jsx', '.py'].includes(ext)) {
            fileTree.push(relPath)
            try {
              const content = readFileSync(fullPath, 'utf8')
              const lines = content.split('\n')
              lines.forEach((line, idx) => {
                // Functions
                const fnMatch = line.match(/(?:function|const|let|async function)\s+([a-zA-Z0-9_]+)\s*(?:=|\()/)
                if (fnMatch && !['if', 'for', 'switch'].includes(fnMatch[1])) {
                  symbols.push({ name: fnMatch[1], kind: 'function', file: relPath, line: idx + 1 })
                }
                // Classes & Interfaces
                const clsMatch = line.match(/(?:class|interface|type)\s+([a-zA-Z0-9_]+)/)
                if (clsMatch) {
                  symbols.push({ name: clsMatch[1], kind: 'class', file: relPath, line: idx + 1 })
                }
                // API Routes
                if (line.includes('app.get(') || line.includes('app.post(') || line.includes('export async function POST')) {
                  symbols.push({ name: line.trim().slice(0, 45), kind: 'route', file: relPath, line: idx + 1 })
                }
              })
            } catch {}
          }
        }
      }
    } catch {}
  }

  walk(projectDir)

  return {
    rootPath: projectDir,
    totalFiles: fileTree.length,
    symbolsCount: symbols.length,
    fileTree: fileTree.slice(0, 80),
    symbols: symbols.slice(0, 200),
    indexedAt: new Date().toISOString(),
  }
}
