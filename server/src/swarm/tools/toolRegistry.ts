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
  },
  {
    type: 'function',
    function: {
      name: 'headless_web_research',
      description: 'Fetch and extract clean markdown content from public URLs using lightweight headless scraper with SSRF protection (Lightpanda pattern).',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target web URL to research' },
          selector: { type: 'string', description: 'Optional CSS selector' },
          extract_markdown: { type: 'boolean', description: 'Whether to return formatted markdown (default: true)' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'treg_catalog_search',
      description: 'Search external tools and capabilities by intent ("Ask for the task, not the tool") across SEO, enrichment, social, web, and finance (Treg pattern).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Intent or task description (e.g. "find email", "crypto price", "backlinks")' },
          category: { type: 'string', description: 'Optional category: web, enrichment, seo, social, finance, audio' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'treg_call_tool',
      description: 'Execute external tool via Treg faithful relay with server-side credential injection without exposing credentials to caller.',
      parameters: {
        type: 'object',
        properties: {
          toolId: { type: 'string', description: 'Tool ID from catalog (e.g. "treg.web.search", "treg.people.email.find")' },
          params: { type: 'object', description: 'Parameters and query arguments for the tool' }
        },
        required: ['toolId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'google_workspace_action',
      description: 'Interact with Google Workspace MCP tools (Gmail drafts/emails, Google Calendar events, Google Drive folders).',
      parameters: {
        type: 'object',
        properties: {
          service: { type: 'string', enum: ['gmail', 'calendar', 'drive'], description: 'Target Google Workspace service' },
          action: { type: 'string', enum: ['draft_email', 'send_email', 'schedule_meeting', 'create_folder'], description: 'Action to perform' },
          payload: { type: 'object', description: 'Action parameters and body payload' }
        },
        required: ['service', 'action', 'payload']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_office_document',
      description: 'Generate styled executive office documents (PDF reports, Excel workbooks, Word docs) and return download links.',
      parameters: {
        type: 'object',
        properties: {
          fileType: { type: 'string', enum: ['pdf', 'excel', 'docx'], description: 'Document format to generate' },
          fileName: { type: 'string', description: 'Output document filename' },
          contentStructure: { type: 'object', description: 'Document title, sections, headers, and sheet data' }
        },
        required: ['fileType', 'fileName', 'contentStructure']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'aegis_scaffold_and_deploy_web',
      description: 'Aegis autonomous web builder: scaffolds responsive React/HTML/Tailwind applications and mounts live browser preview.',
      parameters: {
        type: 'object',
        properties: {
          projectSlug: { type: 'string', description: 'Unique slug for project workspace (e.g. "client-portfolio")' },
          appType: { type: 'string', enum: ['react_spa', 'landing_page', 'fullstack'], description: 'Architecture type' },
          specification: { type: 'object', description: 'Components, features, title, styling and theme specifications' }
        },
        required: ['projectSlug', 'specification']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'workspace_view_tree',
      description: 'List directory file structure tree up to maxDepth (excluding node_modules and dist).',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to view (default ".")' },
          maxDepth: { type: 'number', description: 'Maximum depth to traverse (default 3)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'workspace_read_file',
      description: 'Read exact line ranges from a file with line numbers to conserve tokens.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to target file' },
          startLine: { type: 'number', description: 'Starting line number (1-based)' },
          endLine: { type: 'number', description: 'Ending line number' }
        },
        required: ['filePath']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'workspace_patch_file',
      description: 'Perform surgical diff patch replacement in a file without rewriting entire contents.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to target file' },
          oldString: { type: 'string', description: 'Exact string to be replaced' },
          newString: { type: 'string', description: 'Replacement string' }
        },
        required: ['filePath', 'oldString', 'newString']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'workspace_write_file',
      description: 'Create or completely overwrite a file in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Target file path' },
          content: { type: 'string', description: 'Complete content to write' }
        },
        required: ['filePath', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'workspace_grep',
      description: 'Search for regex pattern across codebase files.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern or substring' },
          directory: { type: 'string', description: 'Directory to search (default ".")' }
        },
        required: ['pattern']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'terminal_run_command',
      description: 'Execute a terminal command inside the workspace and capture stdout/stderr with feedback recovery.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command line string to execute' },
          workingDir: { type: 'string', description: 'Working directory path' },
          timeoutMs: { type: 'number', description: 'Timeout in ms (default 30000)' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email via Google Workspace / Gmail API (RFC 2822 base64 MIME).',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          bodyHtml: { type: 'string', description: 'HTML or text body of the email' },
          cc: { type: 'string', description: 'CC recipient address (optional)' }
        },
        required: ['to', 'subject', 'bodyHtml']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Create an email draft in Google Workspace / Gmail.',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          bodyHtml: { type: 'string', description: 'HTML or text body of draft' }
        },
        required: ['to', 'subject', 'bodyHtml']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'schedule_meeting',
      description: 'Schedule a calendar meeting with automatic Google Meet conference link and 15-minute reminders.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Meeting title/summary' },
          startIso: { type: 'string', description: 'Start time in ISO format (e.g. 2026-11-04T15:00:00Z)' },
          endIso: { type: 'string', description: 'End time in ISO format (e.g. 2026-11-04T16:00:00Z)' },
          attendees: { type: 'array', items: { type: 'string' }, description: 'List of attendee email addresses' },
          description: { type: 'string', description: 'Meeting agenda and notes' }
        },
        required: ['title', 'startIso', 'endIso']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_upcoming_meetings',
      description: 'List upcoming Google Calendar meetings and Google Meet video links.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum meetings to return (default 10)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_presentation',
      description: 'Generate an executive PowerPoint (.pptx) presentation with dark slate theme (#0F172A), cyan accents, and structured layouts.',
      parameters: {
        type: 'object',
        properties: {
          fileName: { type: 'string', description: 'Presentation filename (e.g. "ai_automation_strategy.pptx")' },
          title: { type: 'string', description: 'Presentation main title' },
          subtitle: { type: 'string', description: 'Subtitle for cover slide' },
          slides: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Slide title' },
                subtitle: { type: 'string', description: 'Slide subtitle' },
                bulletPoints: { type: 'array', items: { type: 'string' } },
                visualLayout: { type: 'string', enum: ['standard', 'two-column', 'hero', 'metric-cards', 'timeline'] },
                speakerNotes: { type: 'string' },
                metrics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      value: { type: 'string' }
                    }
                  }
                }
              },
              required: ['title']
            },
            description: 'Array of slide definitions'
          }
        },
        required: ['fileName', 'title', 'slides']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'android_device_control',
      description: 'Control connected Android mobile device via WebSocket bridge (launch apps, make phone calls, inspect device status).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['launch_app', 'make_call', 'get_device_status'], description: 'Action to perform on phone' },
          target: { type: 'string', description: 'Package name / app alias (e.g. "whatsapp", "youtube") or phone number' }
        },
        required: ['action']
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

    case 'headless_web_research': {
      const { executeHeadlessWebResearch } = await import('./webResearchEngine')
      return await executeHeadlessWebResearch(args as any)
    }

    case 'treg_catalog_search': {
      const { tregToolRegistry } = await import('./TregToolRegistry')
      return tregToolRegistry.searchCatalog(args.query, args.category)
    }

    case 'treg_call_tool': {
      const { tregToolRegistry } = await import('./TregToolRegistry')
      return await tregToolRegistry.callTool(args.toolId, args.params || {})
    }

    case 'google_workspace_action': {
      const { executeGoogleWorkspaceAction } = await import('./officeMcpTools')
      return await executeGoogleWorkspaceAction(args as any)
    }

    case 'generate_office_document': {
      const { executeGenerateOfficeDocument } = await import('./officeMcpTools')
      return await executeGenerateOfficeDocument(args as any)
    }

    case 'aegis_scaffold_and_deploy_web': {
      const { appBuilderEngine } = await import('./appBuilderEngine')
      return await appBuilderEngine.scaffoldAndDeployWeb(args as any)
    }

    case 'workspace_view_tree': {
      const { workspaceViewTree } = await import('./surgicalFileTools')
      return workspaceViewTree(args?.directory, args?.maxDepth)
    }

    case 'workspace_read_file': {
      const { workspaceReadFile } = await import('./surgicalFileTools')
      return workspaceReadFile(args?.filePath, args?.startLine, args?.endLine)
    }

    case 'workspace_patch_file': {
      const { workspacePatchFile } = await import('./surgicalFileTools')
      return workspacePatchFile(args?.filePath, args?.oldString, args?.newString)
    }

    case 'workspace_write_file': {
      const { workspaceWriteFile } = await import('./surgicalFileTools')
      return workspaceWriteFile(args?.filePath, args?.content)
    }

    case 'workspace_grep': {
      const { workspaceGrep } = await import('./surgicalFileTools')
      return workspaceGrep(args?.pattern, args?.directory)
    }

    case 'terminal_run_command': {
      const { terminalRunCommand } = await import('./sandboxTerminalTool')
      return await terminalRunCommand(args?.command, args?.workingDir, args?.timeoutMs)
    }

    case 'send_email': {
      const { googleWorkspaceService } = await import('../../services/googleWorkspaceService')
      return await googleWorkspaceService.send_email(args as any)
    }

    case 'draft_email': {
      const { googleWorkspaceService } = await import('../../services/googleWorkspaceService')
      return await googleWorkspaceService.draft_email(args as any)
    }

    case 'schedule_meeting': {
      const { googleWorkspaceService } = await import('../../services/googleWorkspaceService')
      return await googleWorkspaceService.schedule_meeting(args as any)
    }

    case 'list_upcoming_meetings': {
      const { googleWorkspaceService } = await import('../../services/googleWorkspaceService')
      return await googleWorkspaceService.list_upcoming_meetings(args?.maxResults)
    }

    case 'generate_presentation': {
      const { generatePresentation } = await import('./presentationGenerator')
      return await generatePresentation(args as any)
    }

    case 'android_device_control': {
      const { androidBridgeService } = await import('../../services/androidBridgeService')
      return androidBridgeService.executeDeviceControl(args as any)
    }

    default:
      throw new Error(`Tool "${name}" is not registered in the Sovereign Swarm Tool Arsenal.`)
  }
}

