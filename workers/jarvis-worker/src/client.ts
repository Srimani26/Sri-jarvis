/**
 * J.A.R.V.I.S. Distributed PC Worker Client Daemon
 * Handles registration, periodic heartbeats, and task communication with the central cloud server.
 */

import os from 'node:os';
import { WorkerDoctor } from './doctor.js';
import { WorkerExecutor } from './executor.js';
import { WorkerDoctorReport } from './types.js';

export class WorkerClient {
  private serverUrl: string;
  private workerId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private doctorReport: WorkerDoctorReport | null = null;
  private executor: WorkerExecutor | null = null;

  constructor(serverUrl?: string, workerId?: string) {
    this.serverUrl = (serverUrl || process.env.JARVIS_SERVER_URL || 'https://sri-jarvis.onrender.com').replace(/\/$/, '');
    this.workerId = workerId || process.env.JARVIS_WORKER_ID || `worker-${os.hostname().toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  public async start(): Promise<boolean> {
    console.log(`🚀 [JARVIS PC Worker] Starting daemon [${this.workerId}]...`);
    console.log(`🌐 Target Server: ${this.serverUrl}`);

    // Run diagnostics
    this.doctorReport = await WorkerDoctor.runDiagnostics();
    this.executor = new WorkerExecutor(this.doctorReport.detectedCapabilities, this.doctorReport.workspacePath);

    console.log(`💻 Detected Capabilities: ${this.doctorReport.detectedCapabilities.join(', ')}`);
    console.log(`📁 Scoped Workspace: ${this.doctorReport.workspacePath}`);
    console.log(`🧠 Ollama Available: ${this.doctorReport.ollamaAvailable ? 'YES (' + this.doctorReport.ollamaModels.join(', ') + ')' : 'NO'}`);

    // Register with server
    const registered = await this.register();
    if (!registered) {
      console.warn('⚠️ Server registration returned non-200. Will keep retrying via heartbeat loop...');
    }

    this.isRunning = true;
    this.startHeartbeatLoop();
    return true;
  }

  public async register(): Promise<boolean> {
    if (!this.doctorReport) {
      this.doctorReport = await WorkerDoctor.runDiagnostics();
    }

    try {
      const res = await fetch(`${this.serverUrl}/api/workers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.workerId,
          name: `PC Worker (${os.hostname()})`,
          capabilities: this.doctorReport.detectedCapabilities,
          health: {
            freeMemoryMB: this.doctorReport.freeMemoryMB,
            hostname: os.hostname(),
            os: this.doctorReport.os,
            ollamaRunning: this.doctorReport.ollamaAvailable,
            browserAvailable: this.doctorReport.browserAvailable,
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      return res.status === 200;
    } catch (err: any) {
      console.error(`❌ Registration network failure: ${err?.message || err}`);
      return false;
    }
  }

  private startHeartbeatLoop(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(async () => {
      if (!this.isRunning) return;
      try {
        await fetch(`${this.serverUrl}/api/workers/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workerId: this.workerId,
            health: {
              freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
              activeTasksCount: 0,
            },
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Heartbeat failure logged silently to avoid spam
      }
    }, 15000); // 15-second heartbeat
  }

  public stop(): void {
    this.isRunning = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    console.log(`🛑 [JARVIS PC Worker] Stopped daemon [${this.workerId}].`);
  }

  public getStatus() {
    return {
      workerId: this.workerId,
      serverUrl: this.serverUrl,
      isRunning: this.isRunning,
      capabilities: this.doctorReport?.detectedCapabilities || [],
      workspace: this.doctorReport?.workspacePath || '',
    };
  }
}
