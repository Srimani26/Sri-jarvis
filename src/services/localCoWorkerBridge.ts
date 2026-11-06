/**
 * localCoWorkerBridge.ts — Sovereign Local Workspace Bridge for Claude-Grade Co-Workers
 * Target: server/src/services/localCoWorkerBridge.ts & src/services/localCoWorkerBridge.ts
 *
 * Provides bidirectional communication between Cloud J.A.R.V.I.S. (Render)
 * and Master Sri's local workstation (E:\Invi-theme & E:\standardroofs-jarvis).
 *
 * Implements:
 * 1. WebSocket Gateway at /api/coworker/bridge/ws
 * 2. Real-time file system operations (read, write, list, patch, diff)
 * 3. Local shell execution (git status/commit, shopify theme check, test suites)
 * 4. Liquid syntax & asset auditor for Invi Luxury Theme
 */

import { WebSocketServer, WebSocket } from 'ws'
import type { Server as HttpServer } from 'node:http'

export type CoWorkerActionType =
  | 'READ_FILE'
  | 'WRITE_FILE'
  | 'LIST_DIR'
  | 'AUDIT_LIQUID'
  | 'EXECUTE_SHELL'
  | 'GIT_STATUS'
  | 'PING'

export interface BridgeRequest {
  id: string
  action: CoWorkerActionType
  workspace: 'invi-theme' | 'standardroofs-jarvis' | 'custom'
  path?: string
  content?: string
  command?: string
  args?: Record<string, any>
  timestamp: number
}

export interface BridgeResponse {
  id: string
  success: boolean
  data?: any
  error?: string
  executionTimeMs?: number
}

export interface LocalWorkerClient {
  id: string
  hostname: string
  os: string
  workspaces: Record<string, string>
  connectedAt: number
  lastSeen: number
  ws: WebSocket
}

export class LocalCoWorkerBridgeService {
  private static instance: LocalCoWorkerBridgeService
  private wss: WebSocketServer | null = null
  private connectedWorker: LocalWorkerClient | null = null
  private pendingRequests: Map<string, {
    resolve: (res: BridgeResponse) => void
    reject: (err: any) => void
    timer: NodeJS.Timeout
  }> = new Map()

  public static getInstance(): LocalCoWorkerBridgeService {
    if (!LocalCoWorkerBridgeService.instance) {
      LocalCoWorkerBridgeService.instance = new LocalCoWorkerBridgeService()
    }
    return LocalCoWorkerBridgeService.instance
  }

  /**
   * Attach WebSocket server to HTTP instance
   */
  public attach(server: HttpServer): void {
    if (this.wss) return

    this.wss = new WebSocketServer({
      server,
      path: '/api/coworker/bridge/ws'
    })

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('⚡ [LocalCoWorkerBridge] Inbound connection attempt from:', req.socket.remoteAddress)

      ws.on('message', (raw: Buffer | string) => {
        try {
          const payload = JSON.parse(raw.toString())
          this.handleWorkerMessage(ws, payload)
        } catch (err: any) {
          console.error('[LocalCoWorkerBridge] Failed to parse worker message:', err.message)
        }
      })

      ws.on('close', () => {
        if (this.connectedWorker?.ws === ws) {
          console.warn('⚠️ [LocalCoWorkerBridge] Local worker daemon disconnected.')
          this.connectedWorker = null
        }
      })

      ws.on('error', (err) => {
        console.error('[LocalCoWorkerBridge] Socket error:', err.message)
      })
    })

    console.log('🚀 [LocalCoWorkerBridge] Co-Worker Bridge WS listening at /api/coworker/bridge/ws')
  }

  private handleWorkerMessage(ws: WebSocket, message: any): void {
    // 1. Handshake Register
    if (message.type === 'WORKER_REGISTER') {
      this.connectedWorker = {
        id: message.workerId || 'local-worker-1',
        hostname: message.hostname || 'MasterSri-PC',
        os: message.os || 'Windows',
        workspaces: message.workspaces || {
          'invi-theme': 'E:\\Invi-theme',
          'standardroofs-jarvis': 'E:\\standardroofs-jarvis'
        },
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        ws
      }
      console.log(`✅ [LocalCoWorkerBridge] Local Worker Connected: ${this.connectedWorker.hostname} (${this.connectedWorker.os})`)
      ws.send(JSON.stringify({ type: 'REGISTER_ACK', status: 'ONLINE', timestamp: Date.now() }))
      return
    }

    // 2. Response to a pending request
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const pending = this.pendingRequests.get(message.requestId)!
      clearTimeout(pending.timer)
      this.pendingRequests.delete(message.requestId)
      pending.resolve(message)
      return
    }

    // 3. Heartbeat Ping
    if (message.type === 'PING') {
      if (this.connectedWorker) this.connectedWorker.lastSeen = Date.now()
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }))
    }
  }

  /**
   * Check if local worker is connected
   */
  public isWorkerConnected(): boolean {
    return !!(this.connectedWorker && this.connectedWorker.ws.readyState === WebSocket.OPEN)
  }

  /**
   * Get telemetry status
   */
  public getStatus(): Record<string, any> {
    const isOnline = this.isWorkerConnected()
    return {
      online: isOnline,
      workerId: this.connectedWorker?.id || null,
      hostname: this.connectedWorker?.hostname || null,
      os: this.connectedWorker?.os || null,
      workspaces: this.connectedWorker?.workspaces || {},
      connectedAt: this.connectedWorker?.connectedAt || null,
      lastSeen: this.connectedWorker?.lastSeen || null
    }
  }

  /**
   * Dispatch a real command to Master Sri's local workstation
   */
  public async dispatchToLocal(
    action: CoWorkerActionType,
    workspace: 'invi-theme' | 'standardroofs-jarvis' | 'custom',
    options: { path?: string; content?: string; command?: string; args?: Record<string, any> } = {},
    timeoutMs = 15000
  ): Promise<BridgeResponse> {
    if (!this.isWorkerConnected()) {
      return {
        id: 'no-worker',
        success: false,
        error: 'Local Co-Worker Daemon is not connected. Start it on your PC by running: node scripts/jarvis-local-bridge.mjs'
      }
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const requestPayload: BridgeRequest = {
      id: requestId,
      action,
      workspace,
      path: options.path,
      content: options.content,
      command: options.command,
      args: options.args,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        resolve({
          id: requestId,
          success: false,
          error: `Request timed out after ${timeoutMs}ms waiting for local workstation response.`
        })
      }, timeoutMs)

      this.pendingRequests.set(requestId, { resolve, reject, timer })
      this.connectedWorker!.ws.send(JSON.stringify(requestPayload))
    })
  }
}

export const localCoWorkerBridge = LocalCoWorkerBridgeService.getInstance()

