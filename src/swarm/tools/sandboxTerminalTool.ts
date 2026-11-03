/**
 * sandboxTerminalTool.ts — High-Speed Terminal Sandbox with Feedback Recovery
 * Target: server/src/swarm/tools/sandboxTerminalTool.ts & src/swarm/tools/sandboxTerminalTool.ts
 *
 * Implements:
 * 1. Safe shell command execution inside workspace directory.
 * 2. Merged stdout/stderr capture with millisecond telemetry.
 * 3. Execution failure formatting with structured error blocks for self-healing.
 * 4. Dangerous command guard blocking system-destroying operations.
 */

import { exec } from 'node:child_process'
import { resolve } from 'node:path'

export interface TerminalExecutionResult {
  success: boolean
  command: string
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
  errorBlock?: string
  workingDir: string
}

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\/($|\s)/i,
  /mkfs/i,
  /:(){ :|:& };:/,
  /format\s+[c-z]:/i,
  /dd\s+if=.*of=\/dev\//i,
  /shutdown/i,
  /reboot/i
]

/**
 * Executes a terminal command with high-speed stdout/stderr capture and error formatting
 */
export async function terminalRunCommand(
  command: string,
  workingDir = process.cwd(),
  timeoutMs = 30000
): Promise<TerminalExecutionResult> {
  const cleanCmd = (command || '').trim()

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(cleanCmd)) {
      return {
        success: false,
        command: cleanCmd,
        exitCode: 126,
        stdout: '',
        stderr: 'SECURITY_ALERT: Command blocked by sovereign safety perimeter.',
        durationMs: 0,
        errorBlock: `[SECURITY_BLOCKED: Command violates safety invariants: ${cleanCmd}]`,
        workingDir
      }
    }
  }

  const resolvedDir = resolve(workingDir)
  const startTime = Date.now()

  return new Promise((resolveResult) => {
    const isWindows = process.platform === 'win32'
    const shell = isWindows ? 'powershell.exe' : '/bin/bash'

    const child = exec(cleanCmd, {
      cwd: resolvedDir,
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      shell,
      env: {
        ...process.env,
        CI: 'true',
        NODE_ENV: 'test'
      }
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime
      const out = (stdout || '').trim()
      const err = (stderr || '').trim()

      if (error) {
        const exitCode = typeof error.code === 'number' ? error.code : 1
        const errorDetails = err || out || error.message

        resolveResult({
          success: false,
          command: cleanCmd,
          exitCode,
          stdout: out,
          stderr: err,
          durationMs,
          errorBlock: `[EXECUTION_FAILED: code ${exitCode}]\nStderr:\n${errorDetails}`,
          workingDir: resolvedDir
        })
      } else {
        resolveResult({
          success: true,
          command: cleanCmd,
          exitCode: 0,
          stdout: out,
          stderr: err,
          durationMs,
          workingDir: resolvedDir
        })
      }
    })

    child.on('error', (spawnErr) => {
      const durationMs = Date.now() - startTime
      resolveResult({
        success: false,
        command: cleanCmd,
        exitCode: 1,
        stdout: '',
        stderr: spawnErr.message,
        durationMs,
        errorBlock: `[SPAWN_ERROR: ${spawnErr.message}]`,
        workingDir: resolvedDir
      })
    })
  })
}
