export interface MissionStatusPresentation {
  label: string;
  nextAction: string;
  tone: 'neutral' | 'working' | 'waiting' | 'success' | 'danger';
  completionEvidenceVisible: boolean;
}

const PRESENTATION: Record<string, MissionStatusPresentation> = {
  CREATED: { label: 'Created', nextAction: 'Waiting to enter the queue.', tone: 'neutral', completionEvidenceVisible: false },
  QUEUED: { label: 'Queued', nextAction: 'Waiting for an agent to start.', tone: 'neutral', completionEvidenceVisible: false },
  PLANNING: { label: 'Planning', nextAction: 'Jarvis is preparing the work.', tone: 'working', completionEvidenceVisible: false },
  ASSIGNED: { label: 'Assigned', nextAction: 'An agent is ready to begin.', tone: 'working', completionEvidenceVisible: false },
  RUNNING: { label: 'In progress', nextAction: 'Work is running.', tone: 'working', completionEvidenceVisible: false },
  WAITING: { label: 'Waiting for input', nextAction: 'Review the request and provide the missing information.', tone: 'waiting', completionEvidenceVisible: false },
  WAITING_FOR_INPUT: { label: 'Waiting for input', nextAction: 'Review the request and provide the missing information.', tone: 'waiting', completionEvidenceVisible: false },
  AWAITING_APPROVAL: { label: 'Approval required', nextAction: 'Review the exact action before it runs.', tone: 'waiting', completionEvidenceVisible: false },
  RETRYING: { label: 'Retrying', nextAction: 'The previous attempt failed; another attempt is running.', tone: 'working', completionEvidenceVisible: false },
  RECOVERING: { label: 'Recovering', nextAction: 'Jarvis is attempting a recovery.', tone: 'working', completionEvidenceVisible: false },
  VERIFYING: { label: 'Checking work', nextAction: 'Waiting for the required checks to finish.', tone: 'working', completionEvidenceVisible: false },
  COMPLETED: { label: 'Completed', nextAction: 'Review the recorded actions and verification evidence.', tone: 'success', completionEvidenceVisible: true },
  FAILED: { label: 'Failed', nextAction: 'Review the error and decide what to try next.', tone: 'danger', completionEvidenceVisible: false },
  BLOCKED: { label: 'Blocked', nextAction: 'Review what prevented the work from continuing.', tone: 'danger', completionEvidenceVisible: false },
  CANCELLED: { label: 'Cancelled', nextAction: 'Start a new mission if you still need this work.', tone: 'neutral', completionEvidenceVisible: false },
};

export function getMissionStatusPresentation(status: string): MissionStatusPresentation {
  return PRESENTATION[status] ?? {
    label: 'Status unavailable',
    nextAction: 'Refresh mission details to check its current state.',
    tone: 'neutral',
    completionEvidenceVisible: false,
  };
}
