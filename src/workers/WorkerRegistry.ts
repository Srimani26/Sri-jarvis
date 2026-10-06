/**
 * J.A.R.V.I.S. Mark-V — Worker Node Registry & Capability Scheduler
 * Phase 17: Distributed PC Worker, Local Execution & Heartbeat Management
 */

export type WorkerStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'DEGRADED';

export type WorkerCapability =
  | 'LOCAL_LLM'
  | 'LOCAL_BROWSER'
  | 'WORKSPACE_FILES'
  | 'TERMINAL'
  | 'LOCAL_STT'
  | 'LOCAL_TTS'
  | 'local_inference'
  | 'browser_automation'
  | 'local_filesystem'
  | 'gpu_compute'
  | 'coding_worker'
  | string;

export interface WorkerHealth {
  cpuUsagePercent?: number;
  freeMemoryMB?: number;
  activeTasksCount: number;
  os?: string;
  hostname?: string;
  ollamaRunning?: boolean;
  browserAvailable?: boolean;
}

export interface WorkerNode {
  id: string;
  name: string;
  status: WorkerStatus;
  capabilities: WorkerCapability[];
  lastHeartbeat: number;
  health: WorkerHealth;
  currentTask?: string;
}

export class WorkerRegistry {
  private static workers: Map<string, WorkerNode> = new Map();
  private static readonly DEFAULT_HEARTBEAT_TTL_MS = 60_000;

  /**
   * Register or update a worker node
   */
  public static registerWorker(params: {
    id: string;
    name: string;
    capabilities: WorkerCapability[];
    health?: Partial<WorkerHealth>;
  }): WorkerNode {
    const worker: WorkerNode = {
      id: params.id,
      name: params.name,
      status: 'ONLINE',
      capabilities: params.capabilities,
      lastHeartbeat: Date.now(),
      health: {
        activeTasksCount: 0,
        ...params.health,
      },
    };
    this.workers.set(params.id, worker);
    return worker;
  }

  /**
   * Process a heartbeat ping from an active worker
   */
  public static recordHeartbeat(
    workerId: string,
    health?: Partial<WorkerHealth>
  ): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    worker.lastHeartbeat = Date.now();
    if (worker.status === 'OFFLINE') {
      worker.status = 'ONLINE';
    }
    if (health) {
      worker.health = {
        ...worker.health,
        ...health,
      };
    }
    return true;
  }

  /**
   * Mark a worker as busy processing a task
   */
  public static markBusy(workerId: string, taskId?: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = 'BUSY';
      worker.currentTask = taskId;
      worker.health.activeTasksCount += 1;
    }
  }

  /**
   * Mark a worker as idle/ready for new tasks
   */
  public static markIdle(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = 'ONLINE';
      worker.currentTask = undefined;
      worker.health.activeTasksCount = Math.max(0, worker.health.activeTasksCount - 1);
    }
  }

  /**
   * Check if a specific worker holds a capability token
   */
  public static hasCapability(workerId: string, capability: string): boolean {
    const worker = this.getWorker(workerId);
    if (!worker) return false;
    return worker.capabilities.includes(capability);
  }

  /**
   * Find an available worker offering a requested capability
   */
  public static findWorkerWithCapability(
    capability: WorkerCapability
  ): WorkerNode | null {
    this.auditHeartbeats();

    for (const worker of this.workers.values()) {
      if (
        worker.status === 'ONLINE' &&
        worker.capabilities.includes(capability)
      ) {
        return worker;
      }
    }
    return null;
  }

  /**
   * Mark workers whose heartbeats have expired as OFFLINE
   */
  public static auditHeartbeats(ttlMs: number = this.DEFAULT_HEARTBEAT_TTL_MS): number {
    const now = Date.now();
    let offlineCount = 0;

    for (const worker of this.workers.values()) {
      if (worker.status !== 'OFFLINE' && now - worker.lastHeartbeat >= ttlMs) {
        worker.status = 'OFFLINE';
        offlineCount++;
      }
    }

    return offlineCount;
  }

  /**
   * Get worker by ID
   */
  public static getWorker(workerId: string): WorkerNode | null {
    this.auditHeartbeats();
    return this.workers.get(workerId) || null;
  }

  /**
   * List all registered workers
   */
  public static listWorkers(): WorkerNode[] {
    this.auditHeartbeats();
    return Array.from(this.workers.values());
  }

  /**
   * Clear registry (used in test isolation)
   */
  public static clear(): void {
    this.workers.clear();
  }
}
