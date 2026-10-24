// scripts/test-voice-pipeline.mjs
import assert from 'node:assert';

// Test command parser for all voice navigation and task triggers
export function parseVoiceDirective(transcript) {
  const clean = transcript.toLowerCase().trim();
  
  // Navigation commands
  if (/(?:open|go to|show|switch to)\s+(?:the\s+)?task(?:\s+page|\s+pipeline|\s+hub)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'tasks', reply: 'Opening Task Pipeline, sir.' };
  }
  if (/(?:open|go to|show|switch to)\s+(?:the\s+)?code(?:\s*base|\s*lab|\s*editor)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'codelab', reply: 'Accessing Sovereign Code Lab, sir.' };
  }
  if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:money|revenue|freelance|earnings)(?:\s+making|\s+hunter|\s+space)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'revenue', reply: 'Routing to Midas Revenue Space, sir.' };
  }
  if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:self\s*healing|defense|diagnostics|repair)(?:\s+chamber|\s+page)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'defense', reply: 'Engaging Self-Healing Chamber, sir.' };
  }
  if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:agent|fleet|swarm)(?:\s+space|\s+ecosystem|\s+page)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'ecosystem', reply: 'Deploying Agent Fleet Roster, sir.' };
  }
  if (/(?:open|go to|show|switch to)\s+(?:the\s+)?(?:chat|ai\s+chat|console)(?:\s+page)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'chat', reply: 'Opening AI Chat Console, sir.' };
  }
  if (/(?:open|go to|show|switch to|return to)\s+(?:the\s+)?(?:home|command\s+center|hud)(?:\s+page)?/i.test(clean)) {
    return { action: 'NAVIGATE', surface: 'command', reply: 'Returning to Sovereign Command Center, sir.' };
  }

  // Task creation commands
  if (/(?:create|dispatch|start|launch)\s+task\s+(?:for\s+)?(.+)/i.test(clean)) {
    const match = clean.match(/(?:create|dispatch|start|launch)\s+task\s+(?:for\s+)?(.+)/i);
    return { action: 'CREATE_TASK', title: match[1].trim(), reply: `Initiating autonomous task for: ${match[1].trim()}` };
  }

  return { action: 'CHAT', message: transcript };
}

// Unit tests
console.log('Testing voice directive parser...');
assert.strictEqual(parseVoiceDirective('hey jarvis open the task page').surface, 'tasks');
assert.strictEqual(parseVoiceDirective('open code base').surface, 'codelab');
assert.strictEqual(parseVoiceDirective('go to money making space').surface, 'revenue');
assert.strictEqual(parseVoiceDirective('open self healing page').surface, 'defense');
assert.strictEqual(parseVoiceDirective('show agent fleet space').surface, 'ecosystem');
assert.strictEqual(parseVoiceDirective('return to command center').surface, 'command');
assert.strictEqual(parseVoiceDirective('create task for build shopify landing page').action, 'CREATE_TASK');
assert.strictEqual(parseVoiceDirective('create task for build shopify landing page').title, 'build shopify landing page');

console.log('✔ All voice command parser tests passed!');
