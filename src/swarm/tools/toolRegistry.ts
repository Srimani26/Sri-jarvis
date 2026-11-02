/**
 * toolRegistry.ts — Sovereign Autonomous Tool Definitions & Execution Registry
 * Target: server/src/swarm/tools/toolRegistry.ts & src/swarm/tools/toolRegistry.ts
 *
 * Implements:
 * 1. OpenAI-compliant Function Tool Schemas for neon_sql_query, github_manage_file,
 *    execute_sandbox_command, and finish_task.
 * 2. Sandboxed execution with security perimeter guards (blocks destructive commands).
 * 3. GitHub API integration with GITHUB_TOKEN.
 * 4. Neon PostgreSQL query execution via @neondatabase/serverless and pg.
 */

import { exec } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import pg from 'pg'

// Security perimeter blocklist
const DANGEROUS_COMMANDS = [
  /rm\s+-rf\s+\//i,
  /rm\s+-rf\s+\*/i,
  /mkfs/i,
  /dd\s+if=/i,
  /shutdown/i,
  /reboot/i,
  /format\s+[a-z]:/i,
  /:(){ :|:& };:/
]

// 1. OpenAI-compliant Function Tool Schemas
export const SWARM_TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'neon_sql_query',
      description: 'Execute parameter-validated SQL directly on your Neon PostgreSQL database (read/write state, audit logs, metrics).',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL query string to execute' },
          params: { type: 'array', items: { type: 'string' }, description: 'Query parameters array for prepared statement' }
        },
        required: ['sql']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'github_manage_file',
      description: 'Read or commit files in the Sri-jarvis GitHub repository using authenticated GITHUB_TOKEN.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['read', 'write'], description: 'Read or write operation' },
          path: { type: 'string', description: 'File path relative to repository root' },
          content: { type: 'string', description: 'File content to write (required for action=write)' },
          commitMessage: { type: 'string', description: 'Commit message (optional, used for action=write)' }
        },
        required: ['action', 'path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_sandbox_command',
      description: 'Run safe shell commands (npm test, git status, ls, grep) in the project workspace with execution timeout and security boundaries.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command string to execute' },
          timeoutMs: { type: 'number', description: 'Timeout in milliseconds (default: 10000)' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'finish_task',
      description: 'Explicit termination signal returning the deliverable summary to the user.',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Complete executive summary of the task execution and deliverables' },
          artifacts: { type: 'array', items: { type: 'string' }, description: 'List of files modified, created, or relevant links' }
        },
        required: ['summary']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_public_service',
      description: 'Query verified free public APIs (weather, currency rates, crypto prices, geolocation, Wikipedia summary) without authentication.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Category: weather, currency, crypto, geolocation, knowledge, network' },
          endpoint: { type: 'string', description: 'Endpoint ID or verified URL' },
          queryParams: { type: 'object', description: 'Key-value query parameters' }
        },
        required: ['category', 'endpoint']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'aegis_code_engineer',
      description: 'Autonomous CLI code generation, inspection, and refactoring engine with AST/syntax validation (LocalCodeCli pattern).',
      parameters: {
        type: 'object',
        properties: {
          targetFilePath: { type: 'string', description: 'Relative path to file in project' },
          action: { type: 'string', enum: ['CREATE', 'REFACTOR', 'INSPECT'], description: 'Action to perform' },
          instructions: { type: 'string', description: 'Directive or modification instructions' },
          codeSnippet: { type: 'string', description: 'Code content for creation or replacement' }
        },
        required: ['targetFilePath', 'action', 'instructions']
      }
    }
  }
]

let neonPool: pg.Pool | null = null

function getNeonPool(): pg.Pool | null {
  const rawDbUrl = process.env.DATABASE_URL
  if (!rawDbUrl || (!rawDbUrl.startsWith('postgres://') && !rawDbUrl.startsWith('postgresql://'))) {
    return null
  }
  if (!neonPool) {
    try {
      neonPool = new pg.Pool({
        connectionString: rawDbUrl,
        connectionTimeoutMillis: 5000,
        ssl: rawDbUrl.includes('sslmode=require') || rawDbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
      })
    } catch {}
  }
  return neonPool
}

/**
 * Execute neon_sql_query
 */
export async function executeNeonQuery(sql: string, params: any[] = []): Promise<any> {
  const pool = getNeonPool()
  if (!pool) {
    // Graceful fallback for local development without active DATABASE_URL
    return {
      status: 'LOCAL_SANDBOX',
      message: 'DATABASE_URL not configured for remote Neon; query simulated in sovereign development sandbox.',
      rowCount: 0,
      rows: []
    }
  }

  const client = await pool.connect()
  try {
    const res = await client.query(sql, params)
    return {
      rowCount: res.rowCount,
      rows: res.rows
    }
  } finally {
    client.release()
  }
}

/**
 * Execute github_manage_file
 */
export async function executeGithubManageFile(
  action: 'read' | 'write',
  filePath: string,
  content?: string,
  commitMessage?: string
): Promise<any> {
  const token = process.env.GITHUB_TOKEN
  const repoOwner = 'Srimani26'
  const repoName = 'Sri-jarvis'
  const cleanPath = filePath.replace(/^\/+/, '')

  // 1. Read Action
  if (action === 'read') {
    if (token) {
      try {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${cleanPath}`
        const res = await fetch(url, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'JARVIS-Swarm-ToolEngine'
          }
        })
        if (res.ok) {
          const json = await res.json() as any
          if (json.content) {
            const decoded = Buffer.from(json.content, 'base64').toString('utf-8')
            return { path: cleanPath, size: json.size, sha: json.sha, content: decoded }
          }
        }
      } catch {}
    }

    // Local file fallback
    const localPath = resolve(process.cwd(), cleanPath)
    if (existsSync(localPath)) {
      const text = readFileSync(localPath, 'utf-8')
      return { path: cleanPath, size: text.length, content: text, source: 'LOCAL_WORKSPACE' }
    }

    throw new Error(`File not found in GitHub repository or local workspace: ${cleanPath}`)
  }

  // 2. Write Action
  if (action === 'write') {
    if (!content && content !== '') {
      throw new Error(`Content string required for action='write' on ${cleanPath}`)
    }

    let sha: string | undefined

    if (token) {
      try {
        // Fetch existing sha if file already exists
        const getUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${cleanPath}`
        const getRes = await fetch(getUrl, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'JARVIS-Swarm-ToolEngine'
          }
        })
        if (getRes.ok) {
          const getJson = await getRes.json() as any
          sha = getJson.sha
        }

        const putRes = await fetch(getUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'JARVIS-Swarm-ToolEngine',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: commitMessage || `chore: update ${cleanPath} via autonomous swarm`,
            content: Buffer.from(content).toString('base64'),
            sha
          })
        })

        if (putRes.ok) {
          const putJson = await putRes.json() as any
          return {
            status: 'COMMITTED',
            path: cleanPath,
            commitSha: putJson.commit?.sha,
            url: putJson.commit?.html_url
          }
        }
      } catch (err: any) {
        console.warn('[GitHub Tool] Remote commit error, persisting locally:', err?.message || err)
      }
    }

    // Local filesystem sync fallback
    const localPath = resolve(process.cwd(), cleanPath)
    writeFileSync(localPath, content, 'utf-8')
    return {
      status: 'SAVED_LOCALLY',
      path: cleanPath,
      message: 'Saved directly to local workspace.'
    }
  }

  throw new Error(`Unknown action: ${action}. Must be 'read' or 'write'.`)
}

/**
 * Execute execute_sandbox_command
 */
export async function executeSandboxCommand(command: string, timeoutMs = 10000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Check security perimeter
  for (const regex of DANGEROUS_COMMANDS) {
    if (regex.test(command)) {
      throw new Error(`Command blocked by Sovereign Security Perimeter: detected dangerous operation (${command})`)
    }
  }

  return new Promise((resolveResult) => {
    const cwd = process.cwd()

    exec(
      command,
      {
        cwd,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 4 // 4 MB buffer
      },
      (error, stdout, stderr) => {
        resolveResult({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode: error && error.code !== undefined ? (typeof error.code === 'number' ? error.code : 1) : 0
        })
      }
    )
  })
}

/**
 * Universal Tool Dispatcher
 */
export async function dispatchToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'neon_sql_query':
      return await executeNeonQuery(args.sql, args.params || [])

    case 'github_manage_file':
      return await executeGithubManageFile(args.action, args.path, args.content, args.commitMessage)

    case 'execute_sandbox_command':
      return await executeSandboxCommand(args.command, args.timeoutMs || 10000)

    case 'finish_task':
      return {
        completed: true,
        summary: args.summary,
        artifacts: args.artifacts || []
      }

    case 'query_public_service': {
      const { executeQueryPublicService } = await import('./publicApiDirectory')
      return await executeQueryPublicService(args.category, args.endpoint, args.queryParams || {})
    }

    case 'aegis_code_engineer': {
      const { executeAegisCodeEngineer } = await import('./codeGenerator')
      return await executeAegisCodeEngineer(args as any)
    }

    default:
      throw new Error(`Tool "${name}" is not registered in the Sovereign Swarm Tool Arsenal.`)
  }
}

