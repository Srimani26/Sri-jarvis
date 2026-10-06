/**
 * J.A.R.V.I.S. Distributed PC Worker Types
 */

export type WorkerCapabilityToken =
  | 'LOCAL_LLM'
  | 'LOCAL_BROWSER'
  | 'WORKSPACE_FILES'
  | 'TERMINAL'
  | 'LOCAL_STT'
  | 'LOCAL_TTS';

export interface WorkerDoctorReport {
  nodeVersion: string;
  os: string;
  platform: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  ollamaAvailable: boolean;
  ollamaModels: string[];
  browserAvailable: boolean;
  browserType: 'PLAYWRIGHT' | 'UNAVAILABLE';
  workspacePath: string;
  detectedCapabilities: WorkerCapabilityToken[];
}

export interface WorkerTaskPayload {
  taskId: string;
  capabilityRequired: WorkerCapabilityToken;
  action: 'OLLAMA_CHAT' | 'OLLAMA_EMBED' | 'BROWSER_NAVIGATE' | 'FS_READ' | 'FS_WRITE' | 'TERMINAL_EXEC';
  params: Record<string, any>;
}

export interface WorkerTaskResult {
  taskId: string;
  success: boolean;
  output?: any;
  error?: string;
  durationMs: number;
}
