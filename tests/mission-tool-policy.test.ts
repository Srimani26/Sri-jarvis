import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeMissionTool,
  describeMissionAction,
  redactMissionValue,
  isIrreversibleAction,
  MISSION_TOOL_POLICY,
} from '../src/kernel/MissionToolPolicy';

test('unknown tools and unknown agents fail closed', () => {
  const unknownTool = authorizeMissionTool({ agentId: 'jarvis', toolName: 'shell_everything' });
  assert.equal(unknownTool.allowed, false);
  assert.match(unknownTool.reason ?? '', /not registered/);

  const unknownAgent = authorizeMissionTool({ agentId: 'not_an_agent', toolName: 'workspace_read_file' });
  assert.equal(unknownAgent.allowed, false);
  assert.match(unknownAgent.reason ?? '', /not registered/);
});

test('an agent cannot use a tool outside its allowlist', () => {
  // C.E.R.B.E.R.U.S. is read-only and has no email capability.
  const decision = authorizeMissionTool({ agentId: 'security_agent', toolName: 'send_email', args: { to: 'a@b.c' } });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason ?? '', /not allowed/);
});

test('read-only work on the workspace needs no approval', () => {
  const decision = authorizeMissionTool({ agentId: 'aegis', toolName: 'workspace_read_file', args: { path: 'src/App.tsx' } });
  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, false);
});

test('external sends always pause for an approval bound to the exact action', () => {
  const args = { to: 'owner@example.com', subject: 'Invoice', body: 'Sensitive content' };
  const decision = authorizeMissionTool({ agentId: 'friday', toolName: 'send_email', args });
  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, true);
  assert.match(decision.actionDigest ?? '', /^[a-f0-9]{64}$/);
  assert.ok(decision.summary && decision.summary.length <= 500);

  const different = authorizeMissionTool({ agentId: 'friday', toolName: 'send_email', args: { ...args, body: 'Other' } });
  assert.notEqual(different.actionDigest, decision.actionDigest);
});

test('a permission ceiling cannot be exceeded by the task scope', () => {
  const decision = authorizeMissionTool({
    agentId: 'friday',
    toolName: 'send_email',
    args: { to: 'x@y.z' },
    taskScope: 'READ_ONLY',
  });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason ?? '', /task scope/);
});

test('irreversible shell commands require approval even for powerful agents', () => {
  assert.equal(isIrreversibleAction({ command: 'rm -rf /' }), true);
  assert.equal(isIrreversibleAction({ command: 'git push origin main --force' }), true);
  assert.equal(isIrreversibleAction({ sql: 'DROP TABLE users' }), true);
  assert.equal(isIrreversibleAction({ command: 'npm run build' }), false);

  const decision = authorizeMissionTool({ agentId: 'jarvis', toolName: 'terminal_run_command', args: { command: 'rm -rf /' } });
  assert.equal(decision.allowed, true);
  assert.equal(decision.requiresApproval, true);
  assert.match(decision.summary ?? '', /irreversible/i);
});

test('evidence redaction never persists secrets', () => {
  const redacted = redactMissionValue({
    path: 'src/App.tsx',
    apiKey: 'sk-live-123',
    nested: { authorization: 'Bearer abc', note: 'keep me' },
    command: 'x'.repeat(400),
  }) as any;

  assert.equal(redacted.path, 'src/App.tsx');
  assert.equal(redacted.apiKey, '[redacted]');
  assert.equal(redacted.nested.authorization, '[redacted]');
  assert.equal(redacted.nested.note, 'keep me');
  assert.ok(redacted.command.length < 400);
  assert.equal(JSON.stringify(redacted).includes('sk-live-123'), false);
});

test('plain-language summaries stay short and secret-free', () => {
  const summary = describeMissionAction('send_email', { to: 'owner@example.com', body: 'Sensitive content' });
  assert.ok(summary.length <= 500);
  assert.equal(summary.toLowerCase().includes('sensitive content'), false);
});

test('every swarm tool has explicit risk metadata', () => {
  const required = [
    'neon_sql_query', 'github_manage_file', 'execute_sandbox_command', 'finish_task', 'complete_task',
    'query_public_service', 'aegis_code_engineer', 'headless_web_research', 'treg_catalog_search',
    'treg_call_tool', 'google_workspace_action', 'generate_office_document', 'aegis_scaffold_and_deploy_web',
    'workspace_view_tree', 'workspace_read_file', 'workspace_patch_file', 'workspace_write_file',
    'workspace_grep', 'terminal_run_command', 'send_email', 'draft_email', 'schedule_meeting',
    'list_upcoming_meetings', 'generate_presentation', 'android_device_control',
  ];
  for (const tool of required) {
    assert.ok(MISSION_TOOL_POLICY[tool], `${tool} must have policy metadata`);
  }
});
