/**
 * J.A.R.V.I.S. Distributed PC Worker Doctor
 * Audits local hardware, Ollama status, browser availability, and workspace security.
 */

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { WorkerCapabilityToken, WorkerDoctorReport } from './types.js';

export class WorkerDoctor {
  public static async runDiagnostics(customWorkspace?: string): Promise<WorkerDoctorReport> {
    const detectedCapabilities: WorkerCapabilityToken[] = ['WORKSPACE_FILES'];

    // 1. Check Ollama
    let ollamaAvailable = false;
    let ollamaModels: string[] = [];
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        ollamaAvailable = true;
        ollamaModels = (data.models || []).map((m: any) => m.name || m.model);
        detectedCapabilities.push('LOCAL_LLM');
      }
    } catch {
      ollamaAvailable = false;
    }

    // 2. Check Browser (Playwright / Chromium)
    let browserAvailable = false;
    let browserType: 'PLAYWRIGHT' | 'UNAVAILABLE' = 'UNAVAILABLE';
    try {
      const hasPlaywright = fs.existsSync(path.join(process.cwd(), 'node_modules', 'playwright')) ||
                            fs.existsSync(path.join(process.cwd(), '..', '..', 'node_modules', 'playwright'));
      if (hasPlaywright) {
        browserAvailable = true;
        browserType = 'PLAYWRIGHT';
        detectedCapabilities.push('LOCAL_BROWSER');
      }
    } catch {
      browserAvailable = false;
    }

    // 3. Workspace scoping security
    const workspacePath = customWorkspace || process.env.JARVIS_WORKER_WORKSPACE || path.join(process.cwd(), 'workspace');
    if (!fs.existsSync(workspacePath)) {
      try {
        fs.mkdirSync(workspacePath, { recursive: true });
      } catch { /* ignored */ }
    }

    // 4. Voice capabilities (Web Speech API / local audio drivers)
    detectedCapabilities.push('LOCAL_STT');
    detectedCapabilities.push('LOCAL_TTS');

    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown CPU';

    return {
      nodeVersion: process.version,
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      platform: os.platform(),
      cpuModel,
      cpuCores: cpus.length,
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
      ollamaAvailable,
      ollamaModels,
      browserAvailable,
      browserType,
      workspacePath,
      detectedCapabilities,
    };
  }
}
