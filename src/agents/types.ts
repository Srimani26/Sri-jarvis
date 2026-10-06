/**
 * J.A.R.V.I.S. MARK-V Specialist Agent Workforce Types
 * Formal contracts for autonomous multi-agent workforce.
 */

import { ExecutionPolicy } from '../kernel/types';

export type SpecialistAgentRole =
  | 'commander'
  | 'architect'
  | 'software_engineer'
  | 'frontend_engineer'
  | 'backend_engineer'
  | 'database_engineer'
  | 'devops_engineer'
  | 'qa_engineer'
  | 'debugger'
  | 'security_agent'
  | 'research_agent'
  | 'browser_agent'
  | 'automation_agent'
  | 'data_agent'
  | 'business_agent'
  | 'documentation_agent'
  | 'memory_agent'
  | 'monitor_agent'
  | 'scheduler_agent'
  | 'evolution_agent';

export interface AgentRetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export interface AgentTelemetry {
  invocations: number;
  successes: number;
  failures: number;
  totalDurationMs: number;
  avgDurationMs: number;
  lastActive?: string;
}

export interface AgentSpecification {
  id: string;
  name: string;
  codename: string;
  role: SpecialistAgentRole;
  description: string;
  allowedTools: string[];
  maxPermission: ExecutionPolicy;
  preferredModels: string[];
  timeoutMs: number;
  retryPolicy: AgentRetryPolicy;
  memoryScope: 'TASK' | 'SESSION' | 'PROJECT' | 'GLOBAL';
  systemPrompt: string;
  verificationChecklist: string[];
  health: 'HEALTHY' | 'DEGRADED' | 'STANDBY';
  telemetry: AgentTelemetry;
}

export interface AgentHandoffRequest {
  fromAgentId: string;
  toAgentId: string;
  taskId: string;
  reason: string;
  scopedContext: Record<string, any>;
  expectedOutput: string;
}

export interface AgentExecutionRequest {
  taskId: string;
  agentId: string;
  objective: string;
  inputData?: Record<string, any>;
  policyCeiling?: ExecutionPolicy;
  callingAgentId?: string;
}

export interface AgentExecutionResponse {
  taskId: string;
  agentId: string;
  success: boolean;
  output: any;
  toolsUsed: string[];
  durationMs: number;
  verificationPassed: boolean;
  handoff?: AgentHandoffRequest;
  errors?: string[];
}
