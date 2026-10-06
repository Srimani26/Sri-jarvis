/**
 * J.A.R.V.I.S. MARK-V Phase 20: Distributed Worker Fabric
 * Orchestrates multi-node worker network, auto-discovers worker capabilities,
 * balances compute jobs, and secures remote task execution.
 */

import * as crypto from 'crypto';

export type WorkerCapability =
  | 'GPU_ACCELERATION'
  | 'LOCAL_OLLAMA'
  | 'SANDBOXED_FILESYSTEM'
  | 'HEADED_BROWSER'
  | 'LOCAL_TERMINAL'
  | 'HEAVY_COMPILATION';

export interface FabricWorkerNode {
  workerId: string;
  hostname: string;
  ip: string;
  capabilities: WorkerCapability[];
  status: 'ONLINE' | 'BUSY' | 'DRAINING' | 'OFFLINE';
  lastHeartbeat: number;
  activeJobCount: number;
  maxConcurrency: number;
  hardware: {
    cpuCores: number;
    ramGb: number;
    hasGpu: boolean;
    gpuModel?: string;
  };
}

export interface FabricTaskAssignment {
  taskId: string;
  workerId: string;
  capabilityToken: string;
  assignedAt: string;
  requiredCapability: WorkerCapability;
}

export class WorkerFabric {
  private static nodes: Map<string, FabricWorkerNode> = new Map();
  private static activeAssignments: Map<string, FabricTaskAssignment> = new Map();
  private static hmacSecret: string = process.env.WORKER_SHARED_SECRET || 'jarvis-fabric-node-secret-mark-v';

  public static registerNode(node: Omit<FabricWorkerNode, 'status' | 'lastHeartbeat' | 'activeJobCount'>): { success: boolean; workerId: string } {
    const fullNode: FabricWorkerNode = {
      ...node,
      status: 'ONLINE',
      lastHeartbeat: Date.now(),
      activeJobCount: 0,
    };
    this.nodes.set(fullNode.workerId, fullNode);
    return { success: true, workerId: fullNode.workerId };
  }

  public static recordHeartbeat(workerId: string): boolean {
    const node = this.nodes.get(workerId);
    if (!node) return false;
    node.lastHeartbeat = Date.now();
    if (node.status === 'OFFLINE') node.status = 'ONLINE';
    return true;
  }

  public static sweepStaleNodes(timeoutMs: number = 60_000): number {
    const now = Date.now();
    let swept = 0;
    for (const [id, node] of this.nodes.entries()) {
      if (now - node.lastHeartbeat > timeoutMs) {
        node.status = 'OFFLINE';
        swept++;
      }
    }
    return swept;
  }

  public static findBestWorkerForCapability(capability: WorkerCapability): FabricWorkerNode | null {
    this.sweepStaleNodes();
    let bestNode: FabricWorkerNode | null = null;
    let lowestLoad = Infinity;

    for (const node of this.nodes.values()) {
      if (node.status === 'ONLINE' && node.capabilities.includes(capability)) {
        if (node.activeJobCount < node.maxConcurrency) {
          const loadScore = node.activeJobCount / node.maxConcurrency;
          if (loadScore < lowestLoad) {
            lowestLoad = loadScore;
            bestNode = node;
          }
        }
      }
    }

    return bestNode;
  }

  public static generateCapabilityToken(workerId: string, taskId: string, capability: WorkerCapability): string {
    const payload = `${workerId}:${taskId}:${capability}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');
    return `cap_${Buffer.from(payload).toString('base64url')}.${hmac}`;
  }

  public static verifyCapabilityToken(token: string): { valid: boolean; workerId?: string; taskId?: string; capability?: WorkerCapability } {
    try {
      const [b64Payload, hmac] = token.replace('cap_', '').split('.');
      if (!b64Payload || !hmac) return { valid: false };

      const payload = Buffer.from(b64Payload, 'base64url').toString('utf-8');
      const expectedHmac = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');

      if (hmac !== expectedHmac) return { valid: false };

      const [workerId, taskId, capability] = payload.split(':');
      return { valid: true, workerId, taskId, capability: capability as WorkerCapability };
    } catch {
      return { valid: false };
    }
  }

  public static dispatchTask(taskId: string, requiredCapability: WorkerCapability): FabricTaskAssignment | null {
    const worker = this.findBestWorkerForCapability(requiredCapability);
    if (!worker) return null;

    const token = this.generateCapabilityToken(worker.workerId, taskId, requiredCapability);
    worker.activeJobCount++;

    const assignment: FabricTaskAssignment = {
      taskId,
      workerId: worker.workerId,
      capabilityToken: token,
      assignedAt: new Date().toISOString(),
      requiredCapability,
    };

    this.activeAssignments.set(taskId, assignment);
    return assignment;
  }

  public static completeTask(taskId: string): boolean {
    const assignment = this.activeAssignments.get(taskId);
    if (!assignment) return false;

    const worker = this.nodes.get(assignment.workerId);
    if (worker && worker.activeJobCount > 0) {
      worker.activeJobCount--;
    }

    this.activeAssignments.delete(taskId);
    return true;
  }

  public static getFabricSummary() {
    this.sweepStaleNodes();
    const all = Array.from(this.nodes.values());
    return {
      totalNodes: all.length,
      onlineNodes: all.filter((n) => n.status === 'ONLINE').length,
      busyNodes: all.filter((n) => n.status === 'BUSY' || (n.status === 'ONLINE' && n.activeJobCount >= n.maxConcurrency)).length,
      offlineNodes: all.filter((n) => n.status === 'OFFLINE').length,
      activeAssignments: this.activeAssignments.size,
      nodes: all,
    };
  }
}
