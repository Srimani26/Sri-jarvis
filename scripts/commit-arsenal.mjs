/**
 * commit-arsenal.mjs
 * Iteratively stages, commits, and pushes each Universal Arsenal repository
 * to origin main with individual progress logs and error tolerance.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ARSENAL_DIR = resolve(process.cwd(), 'external', 'arsenal');
const REA_DIR = resolve(process.cwd(), 'external', 'rea');

const reposToStage = [];

if (existsSync(REA_DIR)) {
  reposToStage.push({ name: 'rea', path: 'external/rea', label: 'Reverse Engineer Anything (REA Core)' });
}

if (existsSync(ARSENAL_DIR)) {
  const dirs = readdirSync(ARSENAL_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const dir of dirs) {
    reposToStage.push({ name: dir, path: `external/arsenal/${dir}`, label: dir });
  }
}

console.log(`Found ${reposToStage.length} arsenal repositories to commit.`);

for (const repo of reposToStage) {
  console.log(`\n📦 Staging: ${repo.label}...`);
  try {
    execSync(`git add "${repo.path}"`, { stdio: 'inherit', timeout: 300000 });
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.includes(repo.path)) {
      console.log(`💾 Committing: ${repo.name}...`);
      execSync(`git commit -m "feat(arsenal): add ${repo.name} framework to sovereign arsenal"`, { stdio: 'inherit' });
      console.log(`✔ Committed: ${repo.name}`);
    } else {
      console.log(`ℹ No changes or already committed: ${repo.name}`);
    }
  } catch (err) {
    console.error(`⚠️ Notice on ${repo.name}: ${err?.message || err}`);
  }
}

console.log('\n🚀 Pushing commits to GitHub (origin main)...');
try {
  execSync('git push origin main', { stdio: 'inherit', timeout: 600000 });
  console.log('🎉 Push to GitHub successfully completed!');
} catch (pushErr) {
  console.error('Push error:', pushErr?.message || pushErr);
}
