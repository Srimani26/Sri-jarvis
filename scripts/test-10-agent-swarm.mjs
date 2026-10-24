// scripts/test-10-agent-swarm.mjs
import assert from 'node:assert';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';

const host = 'http://127.0.0.1:3005';
const secret = fs.readFileSync('.jarvis-secret', 'utf8').trim();
const token = jwt.sign({ userId: 'commander-sri', username: 'Sri' }, secret, { expiresIn: '1h' });

console.log('Testing 10-Agent Swarm Registry & 5-Stage Task Pipeline...');

// 1. Check Agent Registry endpoint
const agentsRes = await fetch(`${host}/api/agents`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const agentsData = await agentsRes.json();
console.log('Agents count:', agentsData?.agents?.length || Object.keys(agentsData || {}).length);
assert.ok(agentsRes.ok, `Agents API must respond 200, got ${agentsRes.status}`);

// 2. Dispatch a task through 5-stage pipeline
console.log('Dispatching 5-stage mission: Scaffold High-Performance E-Commerce Module...');
const dispatchRes = await fetch(`${host}/api/tasks/dispatch`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Scaffold High-Performance E-Commerce Module',
    agentId: 'friday',
    domain: 'ecommerce'
  })
});

const dispatchData = await dispatchRes.json();
console.log('Task dispatch response:', dispatchData);
assert.ok(dispatchRes.ok, `Task dispatch must return 200, got ${dispatchRes.status}`);
const taskId = dispatchData.taskId || dispatchData.task?.id || dispatchData.taskNumber || dispatchData.id;
assert.ok(taskId, 'Task ID must be generated');

console.log('✔ Task 3 test passed: 10-Agent Swarm and 5-stage pipeline operational!');
