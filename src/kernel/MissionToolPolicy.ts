/**
 * J.A.R.V.I.S. Mission Tool Policy
 *
 * The single authorization boundary for every tool call made on behalf of a
 * mission. Nothing is dispatched until the agent identity, the agent allowlist,
 * the agent permission ceiling, the task scope, and the per-tool risk class all
 * agree. Unknown agents, unknown tools, and unknown risk fail closed.
 *
 * Consequential actions (external sends, deploys/production changes, and
 * irreversible destructive commands) do not execute directly: they return an
 * approval requirement bound to the exact arguments via a SHA-256 digest.
 */

import { AgentRegistry } from '../agents/AgentRegistry';
import { digestMissionAction } from './missionDigest';
import type { ExecutionPolicy } from './types';

export type ToolRisk = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface MissionToolMeta {
  risk: ToolRisk;
  requiredPermission: ExecutionPolicy;
  /** Consequential external effect: always pauses for an explicit approval. */
  requiresApproval: boolean;
  description: string;
}

// Shell tools sit at PROJECT_WRITE because that is the ceiling of the coding
// agents that legitimately own them (Aegis/Friday). Irreversible commands are
// held back by argument inspection rather than by a blanket permission bump.
const SANDBOX_COMMAND: MissionToolMeta = {
  risk: 'HIGH',
  requiredPermission: 'PROJECT_WRITE',
  requiresApproval: false,
  description: 'Execute a sandboxed shell command',
};

/**
 * Exact metadata for every tool exposed through SWARM_TOOL_SCHEMAS. A tool that
 * is not listed here cannot be dispatched by a mission.
 */
export const MISSION_TOOL_POLICY: Readonly<Record<string, MissionToolMeta>> = Object.freeze({
  neon_sql_query: { risk: 'MEDIUM', requiredPermission: 'SAFE_LOCAL', requiresApproval: false, description: 'Query the project database' },
  github_manage_file: { risk: 'HIGH', requiredPermission: 'PROJECT_WRITE', requiresApproval: true, description: 'Write a file to a remote Git repository' },
  execute_sandbox_command: { ...SANDBOX_COMMAND, description: 'Execute a sandboxed shell command' },
  terminal_run_command: { ...SANDBOX_COMMAND, description: 'Run a terminal command in the mission workspace' },
  sandbox_terminal_execute: { ...SANDBOX_COMMAND, description: 'Run a terminal command in the mission workspace' },
  finish_task: { risk: 'SAFE', requiredPermission: 'READ_ONLY', requiresApproval: false, description: 'Declare the mission finished' },
  complete_task: { risk: 'SAFE', requiredPermission: 'READ_ONLY', requiresApproval: false, description: 'Declare the mission finished' },
  query_public_service: { risk: 'LOW', requiredPermission: 'SAFE_LOCAL', requiresApproval: false, description: 'Read from a public API directory service' },
  aegis_code_engineer: { risk: 'MEDIUM', requiredPermission: 'PROJECT_WRITE', requiresApproval: false, description: 'Generate and write project code' },
  headless_web_research: { risk: 'LOW', requiredPermission: 'SAFE_LOCAL', requiresApproval: false, description: 'Research public web pages' },
  treg_catalog_search: { risk: 'LOW', requiredPermission: 'SAFE_LOCAL', requiresApproval: false, description: 'Search the external tool catalog' },
  treg_call_tool: { risk: 'HIGH', requiredPermission: 'SAFE_LOCAL', requiresApproval: true, description: 'Invoke an arbitrary external catalog tool' },
  google_workspace_action: { risk: 'HIGH', requiredPermission: 'SAFE_LOCAL', requiresApproval: true, description: 'Perform an action in Google Workspace' },
  generate_office_document: { risk: 'LOW', requiredPermission: 'PROJECT_WRITE', requiresApproval: false, description: 'Write a document artifact' },
  generate_presentation: { risk: 'LOW', requiredPermission: 'PROJECT_WRITE', requiresApproval: false, description: 'Write a presentation artifact' },
  aegis_scaffold_and_deploy_web: { risk: 'CRITICAL', requiredPermission: 'PROJECT_WRITE', requiresApproval: true, description: 'Scaffold and deploy a public web app' },
  workspace_view_tree: { risk: 'SAFE', requiredPermission: 'READ_ONLY', requiresApproval: false, description: 'List the workspace tree' },
  workspace_read_file: { risk: 'SAFE', requiredPermission: 'READ_ONLY', requiresApproval: false, description: 'Read a workspace file' },
  workspace_grep: { risk: 'SAFE', requiredPermission: 'READ_ONLY', requiresApproval: false, description: 'Search workspace files' },
  workspace_patch_file: { risk: 'MEDIUM', requiredPermission: 'PROJECT_WRITE', requiresApproval: false, description: 'Patch a workspace file' },
  workspace_write_file: { risk: 'MEDIUM', requiredPermission: 'PROJECT_WRITE', requiresApproval: false, description: 'Write a workspace file' },
  send_email: { risk: 'HIGH', requiredPermission: 'SAFE_LOCAL', requiresApproval: true, description: 'Send an email to a real recipient' },
  draft_email: { risk: 'LOW', requiredPermission: 'SAFE_LOCAL', requiresApproval: false, description: 'Draft an email without sending it' },
  schedule_meeting: { risk: 'HIGH', requiredPermission: 'SAFE_LOCAL', requiresApproval: true, description: 'Create a calendar event' },
  list_upcoming_meetings: { risk: 'LOW', requiredPermission: 'READ_ONLY', requiresApproval: false, description: 'List calendar events' },
  android_device_control: { risk: 'CRITICAL', requiredPermission: 'PRIVILEGED', requiresApproval: true, description: 'Control a physical Android device' },
});

const POLICY_LEVELS: Record<ExecutionPolicy, number> = {
  READ_ONLY: 1,
  SAFE_LOCAL: 2,
  PROJECT_WRITE: 3,
  SANDBOX: 4,
  PRIVILEGED: 5,
  PRODUCTION: 6,
};

/** Argument shapes that are never safe to run without an explicit approval. */
const IRREVERSIBLE_PATTERNS: RegExp[] = [
  /\brm\s+(-[a-z]*[rf][a-z]*\s+)+/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+push\b[^\n]*--force\b/i,
  /\bgit\s+clean\s+-[a-z]*[fd]/i,
  /\bdrop\s+(table|database|schema|index)\b/i,
  /\btruncate\s+table\b/i,
  /\bmkfs(\.\w+)?\b/i,
  /\b(shutdown|reboot|halt)\b/i,
  /\bformat\s+[a-z]:/i,
  /\bchmod\s+-R\s+777\b/i,
  /\b(render|vercel|netlify)\s+deploy\b/i,
  /\bnpm\s+publish\b/i,
];

const SENSITIVE_KEY = /(token|secret|password|passwd|api[_-]?key|authorization|cookie|credential|private[_-]?key|body|content)/i;

export function isIrreversibleAction(args: Record<string, unknown>): boolean {
  const flattened = JSON.stringify(args ?? {});
  return IRREVERSIBLE_PATTERNS.some(pattern => pattern.test(flattened));
}

/** Redacts values that must never be persisted into mission evidence. */
export function redactMissionValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[truncated]';
  if (typeof value === 'string') {
    return value.length > 280 ? `${value.slice(0, 280)}…[truncated]` : value;
  }
  if (Array.isArray(value)) return value.slice(0, 50).map(entry => redactMissionValue(entry, depth + 1));
  if (value && typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        redacted[key] = entry === undefined || entry === null || entry === '' ? entry : '[redacted]';
        continue;
      }
      redacted[key] = redactMissionValue(entry, depth + 1);
    }
    return redacted;
  }
  return value;
}

function summariseArgument(args: Record<string, unknown>): string {
  for (const key of ['summary', 'description', 'path', 'filePath', 'command', 'sql', 'to', 'recipient', 'objective', 'query']) {
    const value = args?.[key];
    if (typeof value === 'string' && value.trim()) {
      const trimmed = value.trim().replace(/\s+/g, ' ');
      return trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed;
    }
  }
  const keys = Object.keys(args ?? {});
  return keys.length ? `with ${keys.slice(0, 4).join(', ')}` : 'with no arguments';
}

/** Plain-language, secret-free description of the exact action awaiting approval. */
export function describeMissionAction(toolName: string, args: Record<string, unknown>): string {
  const meta = MISSION_TOOL_POLICY[toolName];
  const label = meta?.description ?? `Run ${toolName}`;
  const summary = `${label} — ${summariseArgument(args ?? {})}`;
  return summary.length > 500 ? `${summary.slice(0, 497)}…` : summary;
}

export interface MissionAuthorizationInput {
  agentId: string;
  toolName: string;
  args?: Record<string, unknown>;
  /** Permission ceiling granted to this task; defaults to the agent ceiling. */
  taskScope?: ExecutionPolicy;
}

export interface MissionAuthorization {
  allowed: boolean;
  toolName: string;
  agentId: string;
  registryAgentId?: string;
  risk: ToolRisk;
  requiredPermission: ExecutionPolicy;
  requiresApproval: boolean;
  actionDigest?: string;
  summary?: string;
  reason?: string;
}

const DENIED = (input: MissionAuthorizationInput, reason: string): MissionAuthorization => ({
  allowed: false,
  toolName: input.toolName,
  agentId: input.agentId,
  risk: 'CRITICAL',
  requiredPermission: 'PRODUCTION',
  requiresApproval: false,
  reason,
});

/**
 * Authorize one tool call. Pure apart from the static agent registry: no
 * database, no network, no side effects, so it can run immediately before
 * dispatch and again after an approval is consumed.
 */
export function authorizeMissionTool(input: MissionAuthorizationInput): MissionAuthorization {
  const toolName = String(input.toolName ?? '').trim();
  const agentId = String(input.agentId ?? '').trim();
  const args = (input.args ?? {}) as Record<string, unknown>;

  const meta = MISSION_TOOL_POLICY[toolName];
  if (!meta) return DENIED(input, `Tool '${toolName}' is not registered in the mission policy`);

  const agent = AgentRegistry.getAgent(agentId);
  if (!agent) return DENIED(input, `Agent '${agentId}' is not registered in the workforce`);

  if (!AgentRegistry.canUseTool(agentId, toolName)) {
    return DENIED(input, `Agent '${agentId}' is not allowed to use '${toolName}'`);
  }

  if (!AgentRegistry.isPermissionAllowed(agentId, meta.requiredPermission)) {
    return DENIED(
      input,
      `'${toolName}' requires ${meta.requiredPermission}, above ${agent.name}'s ceiling of ${agent.maxPermission}`,
    );
  }

  const scope = input.taskScope ?? agent.maxPermission;
  if (POLICY_LEVELS[meta.requiredPermission] > POLICY_LEVELS[scope]) {
    return DENIED(input, `'${toolName}' requires ${meta.requiredPermission}, above the task scope of ${scope}`);
  }

  const irreversible = isIrreversibleAction(args);
  if (meta.requiresApproval || meta.risk === 'CRITICAL' || irreversible) {
    return {
      allowed: true,
      toolName,
      agentId,
      registryAgentId: agent.id,
      risk: meta.risk,
      requiredPermission: meta.requiredPermission,
      requiresApproval: true,
      actionDigest: digestMissionAction(toolName, args),
      summary: irreversible && !meta.requiresApproval
        ? `${describeMissionAction(toolName, args)} (irreversible action detected)`
        : describeMissionAction(toolName, args),
    };
  }

  return {
    allowed: true,
    toolName,
    agentId,
    registryAgentId: agent.id,
    risk: meta.risk,
    requiredPermission: meta.requiredPermission,
    requiresApproval: false,
  };
}
