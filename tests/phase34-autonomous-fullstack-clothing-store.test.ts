// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * Phase 34: Autonomous Fullstack Multi-Page SQLite Clothing Platform Test Suite
 * Verifies that J.A.R.V.I.S. agents generate genuine multi-page fullstack applications
 * backed by persistent SQLite database with zero dummy templates.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { ToolRegistry } from '../src/tools/ToolRegistry.js';
import { ClothingStoreGenerator } from '../src/tools/ClothingStoreGenerator.js';

describe('Phase 34: Autonomous Fullstack Multi-Page SQLite Platform Verification', () => {

  it('1. ClothingStoreGenerator outputs all 7 distinct HTML pages and SQLite database architecture', () => {
    const bundle = ClothingStoreGenerator.generate('Invi Creation Luxury Clothing', 'test_invi_store');
    assert.ok(bundle, 'Bundle must be generated');
    assert.ok(bundle.files, 'Bundle must contain files dictionary');

    const expectedPages = [
      'public/index.html',
      'public/catalog.html',
      'public/product.html',
      'public/cart.html',
      'public/checkout.html',
      'public/track.html',
      'public/admin.html'
    ];

    for (const page of expectedPages) {
      assert.ok(bundle.files[page], `Missing expected distinct view: ${page}`);
      assert.ok(bundle.files[page].length > 500, `Page ${page} must contain rich HTML markup`);
    }

    assert.ok(bundle.files['db.js'], 'Missing persistent SQLite db.js');
    assert.ok(bundle.files['db.js'].includes('node:sqlite'), 'Must use native Node.js node:sqlite persistence');
    assert.ok(bundle.files['server.js'], 'Missing multi-page REST server.js');
    assert.ok(bundle.files['test.js'], 'Missing automated integration test.js');
    assert.ok(bundle.files['public/css/style.css'], 'Missing luxury master style.css');
  });

  it('2. ToolRegistry build_fullstack_app tool creates full multi-page project in workspace', async () => {
    const tool = ToolRegistry.getTool('build_fullstack_app');
    assert.ok(tool, 'build_fullstack_app tool must be registered in ToolRegistry');

    const testProjectName = 'test_invi_multi_page_' + Date.now().toString().slice(-4);
    const result = await tool.execute({
      topic: 'Invi Creation Luxury Ethnic Apparel Boutique',
      projectName: testProjectName
    });

    assert.strictEqual(result.success, true, 'Tool execution must succeed');
    assert.ok(result.output.filesCreated.length > 5, 'Must create multiple distinct files across directories');

    const projectDir = path.resolve(process.cwd(), 'workspaces', testProjectName);
    assert.ok(fs.existsSync(projectDir), 'Project directory must exist');
    assert.ok(fs.existsSync(path.join(projectDir, 'db.js')), 'db.js must exist on disk');
    assert.ok(fs.existsSync(path.join(projectDir, 'server.js')), 'server.js must exist on disk');
    assert.ok(fs.existsSync(path.join(projectDir, 'public', 'catalog.html')), 'public/catalog.html must exist on disk');
    assert.ok(fs.existsSync(path.join(projectDir, 'public', 'product.html')), 'public/product.html must exist on disk');
    assert.ok(fs.existsSync(path.join(projectDir, 'public', 'admin.html')), 'public/admin.html must exist on disk');

    // Clean up temporary test workspace
    try {
      fs.rmSync(projectDir, { recursive: true, force: true });
    } catch {}
  });

  it('3. Invi Creation Master Workspace contains verified persistent SQLite database', () => {
    const masterDbPath = path.resolve(process.cwd(), 'workspaces', 'app_invi_luxury_clothing_store', 'database.sqlite');
    assert.ok(fs.existsSync(masterDbPath), 'Persistent database.sqlite must exist on disk');
    const stats = fs.statSync(masterDbPath);
    assert.ok(stats.size > 0, 'database.sqlite must be non-empty and initialized');
  });

});
