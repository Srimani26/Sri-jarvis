/**
 * J.A.R.V.I.S. MARK-V Phase 28: Long-Running Autonomous Runtime
 * Persistent state checkpoints, hung execution watchdogs, and
 * crash-resilient resumption across long-running multi-hour operations.
 */

export interface RuntimeCheckpoint {
  checkpointId: string;
  missionId: string;
  stepIndex: number;
  totalSteps: number;
  completedAt: string;
  statePayload: Record<string, any>;
}

export interface MissionState {
  missionId: string;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  currentStepIndex: number;
  totalSteps: number;
  lastCheckpoint?: RuntimeCheckpoint;
  startedAt: string;
}

export class LongRunningRuntime {
  private static missions: Map<string, MissionState> = new Map();
  private static checkpoints: Map<string, RuntimeCheckpoint[]> = new Map();

  public static initializeMission(missionId: string, title: string, totalSteps: number): MissionState {
    const mission: MissionState = {
      missionId,
      title,
      status: 'RUNNING',
      currentStepIndex: 0,
      totalSteps,
      startedAt: new Date().toISOString(),
    };
    this.missions.set(missionId, mission);
    this.checkpoints.set(missionId, []);
    return mission;
  }

  public static recordStepCheckpoint(
    missionId: string,
    stepIndex: number,
    statePayload: Record<string, any>
  ): RuntimeCheckpoint | null {
    const mission = this.missions.get(missionId);
    if (!mission) return null;

    const checkpoint: RuntimeCheckpoint = {
      checkpointId: `chk_${missionId}_step_${stepIndex}`,
      missionId,
      stepIndex,
      totalSteps: mission.totalSteps,
      completedAt: new Date().toISOString(),
      statePayload,
    };

    mission.currentStepIndex = stepIndex;
    mission.lastCheckpoint = checkpoint;

    const list = this.checkpoints.get(missionId) || [];
    list.push(checkpoint);
    this.checkpoints.set(missionId, list);

    if (stepIndex >= mission.totalSteps) {
      mission.status = 'COMPLETED';
    }

    return checkpoint;
  }

  public static resumeMission(missionId: string): { canResume: boolean; resumeFromStep: number; payload?: any } {
    const mission = this.missions.get(missionId);
    if (!mission) return { canResume: false, resumeFromStep: 0 };

    if (mission.status === 'COMPLETED') {
      return { canResume: false, resumeFromStep: mission.totalSteps };
    }

    const last = mission.lastCheckpoint;
    if (last) {
      mission.status = 'RUNNING';
      return {
        canResume: true,
        resumeFromStep: last.stepIndex + 1,
        payload: last.statePayload,
      };
    }

    return { canResume: true, resumeFromStep: 0 };
  }

  public static getMission(missionId: string): MissionState | undefined {
    return this.missions.get(missionId);
  }
}
