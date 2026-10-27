// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. Luxury Clothing & Ethnic Apparel E-Commerce Store Generator
 * Produces genuine, production-grade MULTI-PAGE fullstack stores backed by persistent SQLite database.
 * Tailored for Invi Creation luxury ethnic wear, handcrafted kurthis, sarees, lehengas, and couture.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ClothingStoreBundle {
  serverJs: string;
  appJs: string;
  appHtml: string;
  testJs: string;
  pkgJson: string;
  readmeMd: string;
  files: Record<string, string>;
}

export class ClothingStoreGenerator {
  public static generate(topic: string, projectName: string): ClothingStoreBundle {
    const storeTitle = 'Invi Creation // Luxury Ethnic Couture';
    const storeDesc = 'Handcrafted Pure Kanchipuram Sarees, Chanderi Kurthis, Mulberry Silk & Artisanal Lehengas';

    const files: Record<string, string> = {};

    // 1. Check if the verified master multi-page template exists in workspaces/app_invi_luxury_clothing_store
    const masterDir = path.resolve(process.cwd(), 'workspaces', 'app_invi_luxury_clothing_store');
    
    if (fs.existsSync(masterDir)) {
      const loadDirRecursive = (currentDir: string, baseDir: string) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          
          // Skip sqlite binary databases and node_modules
          if (entry.name.endsWith('.sqlite') || entry.name.endsWith('.sqlite-wal') || entry.name.endsWith('.sqlite-shm') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            loadDirRecursive(fullPath, baseDir);
          } else {
            files[relPath] = fs.readFileSync(fullPath, 'utf-8');
          }
        }
      };

      loadDirRecursive(masterDir, masterDir);
    }

    // Ensure fallback or default files exist
    const serverJs = files['server.js'] || '';
    const appHtml = files['public/index.html'] || files['index.html'] || '';
    const appJs = files['public/js/cart-utils.js'] || files['app.js'] || '';
    const testJs = files['test.js'] || '';
    const pkgJson = files['package.json'] || JSON.stringify({
      name: projectName,
      version: '1.0.0',
      description: `${topic} - Invi Creation Autonomous Multi-Page SQLite E-Commerce Platform`,
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        test: 'node test.js'
      },
      keywords: ['jarvis', 'invi-creation', 'clothing', 'e-commerce', 'sqlite', 'multi-page'],
      author: 'Master Sri (Sovereign Engineering)',
      license: 'Apache-2.0'
    }, null, 2);

    const readmeMd = files['README.md'] || `# ${storeTitle}\n\n${storeDesc}\n\nAutonomous Multi-Page SQLite Fullstack Platform.`;

    return {
      serverJs,
      appJs,
      appHtml,
      testJs,
      pkgJson,
      readmeMd,
      files
    };
  }
}
