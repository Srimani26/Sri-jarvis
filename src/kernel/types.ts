/**
 * J.A.R.V.I.S. MARK-V Execution Kernel Types
 * Engineering truth: System defines truth, AI recommends.
 */

export type TaskStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'PLANNING'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'WAITING_FOR_INPUT'
  | 'BLOCKED'
  | 'RETRYING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type EventType =
  | 'TASK_CREATED'
  | 'TASK_PLANNED'
  | 'TASK_ASSIGNED'
  | 'AGENT_STARTED'
  | 'AGENT_THINKING'
  | 'AGENT_DELEGATED'
  | 'TOOL_STARTED'
  | 'TOOL_COMPLETED'
  | 'BROWSER_STARTED'
  | 'BROWSER_ACTION'
  | 'BROWSER_COMPLETED'
  | 'COMMAND_STARTED'
  | 'COMMAND_OUTPUT'
  | 'COMMAND_COMPLETED'
  | 'FILE_READ'
  | 'FILE_CREATED'
  | 'FILE_MODIFIED'
  | 'FILE_DELETED'
  | 'MODEL_STARTED'
  | 'MODEL_COMPLETED'
  | 'RETRIEVAL_STARTED'
  | 'RETRIEVAL_COMPLETED'
  | 'TEST_STARTED'
  | 'TEST_COMPLETED'
  | 'ERROR_DETECTED'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'VERIFICATION_STARTED'
  | 'VERIFICATION_PASSED'
  | 'VERIFICATION_FAILED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'WAITING_FOR_CAPABILITY';

export type ExecutionPolicy =
  | 'READ_ONLY'
  | 'SAFE_LOCAL'
  | 'PROJECT_WRITE'
  | 'SANDBOX'
  | 'PRIVILEGED'
  | 'PRODUCTION';

export interface KernelEvent {
  id: string;
  taskId: string;
  eventType: EventType;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TaskRecord {
  id: string;
  taskNumber: string;
  userRequest: string;
  normalizedObjective: string;
  parentTaskId?: string;
  childTaskIds: string[];
  assignedAgent: string;
  assignedSkill?: string;
  assignedModel?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: TaskStatus;
  progress: number;
  currentOperation: string;
  currentTool?: string;
  etaRange: string;
  confidence: number;
  filesTouched: string[];
  commandsExecuted: string[];
  errors: string[];
  retryCount: number;
  verificationResult?: string;
  finalResult?: string;
  failureReason?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  elapsedMs: number;
}

export interface KernelToolDefinition {
  name: string;
  description: string;
  category: 'SYSTEM' | 'FILES' | 'TERMINAL' | 'GIT' | 'BROWSER' | 'SEARCH' | 'HTTP' | 'DATABASE' | 'DOCUMENTS' | 'NOTIFICATIONS' | 'SCHEDULER' | 'MONITORING' | 'WEB' | 'CODE' | 'CRM' | 'AUTOMATION' | 'RESEARCH' | 'VOICE' | 'MEMORY';
  risk: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredPermission: ExecutionPolicy;
  requiresConfirmation: boolean;
  timeoutMs: number;
  execute: (args: Record<string, any>, context: KernelExecutionContext) => Promise<KernelToolResult>;
}

export interface KernelToolResult {
  tool: string;
  success: boolean;
  output: any;
  filesTouched?: string[];
  commandsExecuted?: string[];
  error?: string;
}

export interface KernelExecutionContext {
  taskId: string;
  agentId: string;
  policy: ExecutionPolicy;
  emitEvent: (eventType: EventType, message: string, metadata?: any) => Promise<void>;
  aiCall?: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<{ text: string; source: string }>;
}

export interface KernelPlanStep {
  stepNumber: number;
  objective: string;
  assignedAgent: string;
  toolToUse?: string;
  toolArgs?: Record<string, any>;
  verificationCheck: string;
}

export interface KernelVerificationResult {
  passed: boolean;
  checksRun: string[];
  evidence: string;
  failures: string[];
}
