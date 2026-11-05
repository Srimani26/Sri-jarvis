/**
 * processManager.ts — Isolated Process Runner & Subprocess Management
 * Target: server/src/swarm/tools/processManager.ts & src/swarm/tools/processManager.ts
 *
 * Implements:
 * 1. Subprocess Execution:
 *    - runCommand(cmd, cwd): Executes CLI tasks (npm run build, npx prisma generate) and captures stdout/stderr.
 *    - spawnAppProcess(slug, command, port): Spawns generated Node.js backends in the background,
 *      allocates internal ports in the 4000-4999 range, and tracks PID lifecycles.
 * 2. Process Lifecycle & Port Pool Management:
 *    - Automatically recycles and allocates free ports between 4000-4999.
 *    - Circular log buffering for backend debugging.
 *    - Graceful process termination with stopAppProcess(slug).
 */

import { exec, spawn, ChildProcess } from 'node:child_process'
import path from 'node:path'

export interface ProcessInfo {
  slug: string
  pid: number
  port: number
  command: string
  cwd: string
  status: 'running' | 'stopped' | 'failed'
  startTime: number
  logs: string[]
}

export class ProcessManager {
  private static instance: ProcessManager
  private activeProcesses: Map<string, { info: ProcessInfo; process: ChildProcess }> = new Map()
  private allocatedPorts: Map<number, string> = new Map() // port -> slug
  private minPort = 4000
  private maxPort = 4999

  public static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager()
    }
    return ProcessManager.instance
  }

  /**
   * Execute CLI commands synchronously with promise resolution
   */
  public async runCommand(
    cmd: string,
    cwd: string = process.cwd(),
    timeoutMs = 60000
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      exec(cmd, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        const exitCode = err ? (typeof err.code === 'number' ? err.code : 1) : 0
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode
        })
      })
    })
  }

  /**
   * Allocate an unused internal port between 4000-4999
   */
  public allocatePort(slug: string, preferredPort?: number): number {
    if (preferredPort && preferredPort >= this.minPort && preferredPort <= this.maxPort) {
      if (!this.allocatedPorts.has(preferredPort) || this.allocatedPorts.get(preferredPort) === slug) {
        this.allocatedPorts.set(preferredPort, slug)
        return preferredPort
      }
    }

    for (let port = this.minPort; port <= this.maxPort; port++) {
      if (!this.allocatedPorts.has(port)) {
        this.allocatedPorts.set(port, slug)
        return port
      }
    }

    // Wrap around fallback
    const fallback = 4000 + (Math.floor(Math.random() * 900))
    this.allocatedPorts.set(fallback, slug)
    return fallback
  }

  /**
   * Spawn a background Node.js server process and bind to an allocated port
   */
  public spawnAppProcess(
    slug: string,
    command: string,
    port?: number,
    cwd?: string
  ): { pid: number; port: number; status: string } {
    // If already running, return existing process info
    const existing = this.activeProcesses.get(slug)
    if (existing && existing.info.status === 'running') {
      return {
        pid: existing.info.pid,
        port: existing.info.port,
        status: existing.info.status
      }
    }

    const assignedPort = this.allocatePort(slug, port)
    const workingDir = cwd || path.resolve(process.cwd(), 'workspaces', slug, 'server')

    const env = {
      ...process.env,
      PORT: String(assignedPort),
      NODE_ENV: 'production'
    }

    const child = spawn(command, {
      cwd: workingDir,
      env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const pid = child.pid || Date.now()
    const logs: string[] = []

    const appendLog = (chunk: any) => {
      const text = chunk.toString().trim()
      if (text) {
        logs.push(`[${new Date().toISOString()}] ${text}`)
        if (logs.length > 100) logs.shift()
      }
    }

    if (child.stdout) child.stdout.on('data', appendLog)
    if (child.stderr) child.stderr.on('data', appendLog)

    const info: ProcessInfo = {
      slug,
      pid,
      port: assignedPort,
      command,
      cwd: workingDir,
      status: 'running',
      startTime: Date.now(),
      logs
    }

    child.on('exit', (code) => {
      info.status = code === 0 ? 'stopped' : 'failed'
      this.allocatedPorts.delete(assignedPort)
    })

    child.on('error', (err) => {
      console.warn(`[ProcessManager] Subprocess error for ${slug}:`, err)
      info.status = 'failed'
      this.allocatedPorts.delete(assignedPort)
    })

    this.activeProcesses.set(slug, { info, process: child })

    return {
      pid,
      port: assignedPort,
      status: 'running'
    }
  }

  /**
   * Gracefully terminate a running child process and free its port
   */
  public stopAppProcess(slug: string): boolean {
    const entry = this.activeProcesses.get(slug)
    if (!entry) return false

    try {
      if (entry.process && !entry.process.killed) {
        entry.process.kill('SIGTERM')
        // Force kill if still open after 1s
        setTimeout(() => {
          try {
            if (!entry.process.killed) entry.process.kill('SIGKILL')
          } catch {}
        }, 1000)
      }
    } catch (err) {
      console.warn(`[ProcessManager] Could not kill process for ${slug}:`, err)
    }

    this.allocatedPorts.delete(entry.info.port)
    entry.info.status = 'stopped'
    this.activeProcesses.delete(slug)
    return true
  }

  public getProcessInfo(slug: string): ProcessInfo | undefined {
    return this.activeProcesses.get(slug)?.info
  }

  public getAllocatedPort(slug: string): number | undefined {
    const entry = this.activeProcesses.get(slug)
    return entry?.info.port
  }

  public listActiveProcesses(): ProcessInfo[] {
    return Array.from(this.activeProcesses.values()).map(e => e.info)
  }
}

export const processManager = ProcessManager.getInstance()

