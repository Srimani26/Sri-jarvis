import type { TaskStatus } from './types';

export type MissionStatus = 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'WAITING_FOR_INPUT' | 'AWAITING_APPROVAL';

export interface MissionOutcomeInput {
  executedActions: number;
  terminalIntentReceived: boolean;
  executionState: 'IDLE' | 'RUNNING' | 'ERROR' | 'EXHAUSTED';
  verification: 'NOT_REQUIRED' | 'NOT_RUN' | 'PASSED' | 'FAILED';
  waitingForInput?: boolean;
  awaitingApproval?: boolean;
}

export function classifyMissionOutcome(input: MissionOutcomeInput): MissionStatus {
  if (input.awaitingApproval) return 'AWAITING_APPROVAL';
  if (input.waitingForInput) return 'WAITING_FOR_INPUT';
  if (input.executionState === 'ERROR' || input.verification === 'FAILED') return 'FAILED';
  if (input.executionState !== 'IDLE' || !Number.isInteger(input.executedActions) || input.executedActions <= 0 || !input.terminalIntentReceived) return 'BLOCKED';
  if (input.verification !== 'PASSED' && input.verification !== 'NOT_REQUIRED') return 'BLOCKED';
  return 'COMPLETED';
}

const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  CREATED: ['QUEUED', 'PLANNING', 'CANCELLED', 'FAILED'],
  QUEUED: ['PLANNING', 'ASSIGNED', 'RUNNING', 'BLOCKED', 'FAILED', 'CANCELLED'],
  PLANNING: ['ASSIGNED', 'RUNNING', 'WAITING_FOR_INPUT', 'BLOCKED', 'FAILED', 'CANCELLED'],
  ASSIGNED: ['RUNNING', 'BLOCKED', 'FAILED', 'CANCELLED'],
  RUNNING: ['PLANNING', 'VERIFYING', 'WAITING_FOR_INPUT', 'AWAITING_APPROVAL', 'RECOVERING', 'BLOCKED', 'RETRYING', 'FAILED', 'CANCELLED'],
  WAITING_FOR_INPUT: ['PLANNING', 'RUNNING', 'BLOCKED', 'FAILED', 'CANCELLED'],
  AWAITING_APPROVAL: ['RUNNING', 'BLOCKED', 'FAILED', 'CANCELLED'],
  RECOVERING: ['RUNNING', 'BLOCKED', 'FAILED', 'CANCELLED'],
  BLOCKED: ['QUEUED', 'PLANNING', 'RUNNING', 'FAILED', 'CANCELLED'],
  RETRYING: ['RUNNING', 'BLOCKED', 'FAILED', 'CANCELLED'],
  VERIFYING: ['RUNNING', 'COMPLETED', 'BLOCKED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  const allowed = TRANSITIONS[from];
  return from === to || Boolean(allowed?.includes(to));
}
