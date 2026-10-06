import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DiffPatcher } from '../src/coding/DiffPatcher';
import { CodingExecutionLoop } from '../src/coding/CodingExecutionLoop';
import { TaskStore } from '../src/kernel/TaskStore';
import { prisma } from '../src/lib/db';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Phase 5: J.A.R.V.I.S. Coding Agent & Execution Loop', () => {
  const scratchFile = 'tests/temp_coding_fixture.ts';
  const scratchAbs = resolve(process.cwd(), scratchFile);

  beforeEach(() => {
    // Initial pristine file
    const initialContent = `export function calculateTax(amount: number): number {\n  return amount * 0.15;\n}\n`;
    writeFileSync(scratchAbs, initialContent, 'utf-8');
  });

  after(async () => {
    try {
      await (prisma as any).$disconnect();
    } catch {}
    if (existsSync(scratchAbs)) {
      try { unlinkSync(scratchAbs); } catch {}
    }
  });

  test('DiffPatcher applies surgical search/replace blocks with exact fidelity', () => {
    const original = `function greet(name: string): string {\n  const message = 'Hello ' + name;\n  return message;\n}\n`;
    const patch = `<<<<<<< SEARCH\n  const message = 'Hello ' + name;\n  return message;\n=======\n  return \`Greetings, \${name}!\`;\n>>>>>>>`;

    const result = DiffPatcher.applyPatch(original, patch);
    assert.equal(result.success, true);
    assert.equal(result.blocksApplied, 1);
    assert.equal(
      result.patchedContent,
      `function greet(name: string): string {\n  return \`Greetings, \${name}!\`;\n}\n`
    );
  });

  test('DiffPatcher fails safely when search block is missing or ambiguous', () => {
    const original = `const a = 1;\nconst b = 2;\n`;

    // 1. Missing target block
    const badPatch = `<<<<<<< SEARCH\nconst c = 3;\n=======\nconst c = 4;\n>>>>>>>`;
    const missingRes = DiffPatcher.applyPatch(original, badPatch);
    assert.equal(missingRes.success, false);
    assert.match(missingRes.error || '', /search block not found/);

    // 2. Ambiguous target block (multiple matches)
    const duplicateContent = `const item = 1;\nconst item = 1;\n`;
    const ambiguousPatch = `<<<<<<< SEARCH\nconst item = 1;\n=======\nconst item = 2;\n>>>>>>>`;
    const ambiguousRes = DiffPatcher.applyPatch(duplicateContent, ambiguousPatch);
    assert.equal(ambiguousRes.success, false);
    assert.match(ambiguousRes.error || '', /ambiguous/);
  });

  test('CodingExecutionLoop applies edit and passes automated verification', async () => {
    const task = await TaskStore.createTask({
      title: 'Update tax rate to 20%',
      description: 'Modify tax rate in calculateTax function',
      agentId: 'software_engineer',
      totalSteps: 3,
    });

    const result = await CodingExecutionLoop.execute({
      taskId: task.id,
      objective: 'Update tax rate to 0.20',
      edits: [
        {
          filePath: scratchFile,
          patchBlocks: [
            {
              search: '  return amount * 0.15;',
              replace: '  return amount * 0.20;',
            },
          ],
        },
      ],
    });

    assert.equal(result.success, true);
    assert.equal(result.filesModified.length, 1);
    assert.equal(result.rolledBack, false);

    const updatedContent = readFileSync(scratchAbs, 'utf-8');
    assert.ok(updatedContent.includes('return amount * 0.20;'), 'File must reflect surgical patch');
  });

  test('CodingExecutionLoop auto-repairs failure via fixProvider', async () => {
    const task = await TaskStore.createTask({
      title: 'Auto-repair buggy syntax',
      description: 'Test autonomous recovery loop',
      agentId: 'software_engineer',
      totalSteps: 4,
    });

    let attemptCount = 0;

    const result = await CodingExecutionLoop.execute({
      taskId: task.id,
      objective: 'Refactor calculateTax',
      edits: [
        {
          filePath: scratchFile,
          // Intentionally broken syntax on attempt 1
          directContent: `export function calculateTax(amount: number) { broken syntax `,
        },
      ],
      // Simulated test command that fails on broken syntax and succeeds on valid syntax
      testCommand: {
        executable: process.execPath,
        args: ['-e', `
          const fs = require('fs');
          const code = fs.readFileSync('${scratchFile.replace(/\\/g, '/')}', 'utf8');
          if (code.includes('broken syntax')) {
            console.error('SyntaxError: Unexpected token');
            process.exit(1);
          }
          process.exit(0);
        `],
      },
      maxRetries: 2,
      fixProvider: async (errorOutput) => {
        attemptCount++;
        // Fix syntax on retry
        return [
          {
            filePath: scratchFile,
            directContent: `export function calculateTax(amount: number): number { return amount * 0.25; }`,
          },
        ];
      },
    });

    assert.equal(result.success, true);
    assert.equal(attemptCount, 1, 'Fix provider must be invoked once to repair syntax');
    assert.equal(result.rolledBack, false);

    const repairedContent = readFileSync(scratchAbs, 'utf-8');
    assert.ok(repairedContent.includes('return amount * 0.25;'), 'Repaired code must be present in workspace');
  });

  test('CodingExecutionLoop executes safe rollback when retries are exhausted', async () => {
    const originalContent = readFileSync(scratchAbs, 'utf-8');

    const task = await TaskStore.createTask({
      title: 'Unrecoverable failing edit',
      description: 'Ensure workspace rollback protects codebase',
      agentId: 'software_engineer',
      totalSteps: 3,
    });

    const result = await CodingExecutionLoop.execute({
      taskId: task.id,
      objective: 'Fatal code break',
      edits: [
        {
          filePath: scratchFile,
          directContent: `export function fatalBroken() { throw new Error('Unrecoverable'); }`,
        },
      ],
      testCommand: {
        executable: process.execPath,
        args: ['-e', 'process.exit(1)'], // Always fails
      },
      maxRetries: 1,
      // Fix provider still fails
      fixProvider: async () => [
        {
          filePath: scratchFile,
          directContent: `// Still failing`,
        },
      ],
    });

    assert.equal(result.success, false);
    assert.equal(result.rolledBack, true, 'Must execute rollback when retries exhausted');

    // Verify pristine content was restored
    const restoredContent = readFileSync(scratchAbs, 'utf-8');
    assert.equal(restoredContent, originalContent, 'Original file content must be restored exactly');
  });

});
