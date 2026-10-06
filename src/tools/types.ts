/**
 * J.A.R.V.I.S. MARK-V Tool Ecosystem & MCP Protocol Types
 * Engineering truth: Strict contracts, schema validation, and risk classification.
 */

import { ExecutionPolicy, KernelExecutionContext, KernelToolResult } from '../kernel/types';

export type ToolCategory =
  | 'FILES'
  | 'TERMINAL'
  | 'GIT'
  | 'BROWSER'
  | 'SEARCH'
  | 'HTTP'
  | 'DATABASE'
  | 'DOCUMENTS'
  | 'NOTIFICATIONS'
  | 'SCHEDULER'
  | 'MONITORING'
  | 'SYSTEM';

export type ToolRiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolTelemetry {
  callCount: number;
  successCount: number;
  errorCount: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  lastExecuted?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  requiredPermission: ExecutionPolicy;
  riskLevel: ToolRiskLevel;
  timeoutMs: number;
  requiresConfirmation: boolean;
  requiresAuth: boolean;
  health: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  telemetry: ToolTelemetry;
  execute: (args: Record<string, any>, context: KernelExecutionContext) => Promise<KernelToolResult>;
}

export interface MCPDiscoveryManifest {
  serverId: string;
  serverName: string;
  transport: 'stdio' | 'sse' | 'in_process';
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
  }>;
}
