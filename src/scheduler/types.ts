/**
 * J.A.R.V.I.S. MARK-V Autonomous Scheduler & 24/7 Workers Types
 */

export type ScheduleType =
  | 'ONE_TIME'
  | 'RECURRING_INTERVAL'
  | 'CRON'
  | 'EVENT_TRIGGERED';

export interface ScheduledJob {
  id: string;
  name: string;
  type: ScheduleType;
  intervalMs?: number;
  cronExpression?: string;
  targetAgentId: string;
  objective: string;
  inputData?: Record<string, any>;
  nextRunAt: string;
  lastRunAt?: string;
  runCount: number;
  enabled: boolean;
  maxRuns?: number;
  lastTaskId?: string;
}

export interface SchedulerStats {
  totalJobs: number;
  activeJobs: number;
  runsCompleted: number;
  nextScheduledJob?: ScheduledJob;
}
