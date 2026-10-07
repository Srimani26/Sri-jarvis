// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Srimani Kandan. J.A.R.V.I.S. Operating System.
/**
 * J.A.R.V.I.S. MARK-V Isolated Workspace Execution Engine
 * Provides sandboxed project directories where coding agents can run
 * npm init, npm install, build scripts, tests, and file management safely.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface WorkspaceCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface WorkspaceFileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  sizeBytes?: number;
}

export class WorkspaceManager {
  private static baseDir = resolve(process.cwd(), 'workspaces');

  static {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Get the absolute path for a project workspace with path traversal protection
   */
  public static getProjectPath(projectName: string): string {
    const sanitized = projectName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
    const target = resolve(this.baseDir, sanitized);
    if (!target.startsWith(this.baseDir)) {
      throw new Error(`Security violation: Workspace path traversal blocked for '${projectName}'`);
    }
    return target;
  }

  /**
   * Initialize a new project directory
   */
  public static initProject(projectName: string): { success: boolean; path: string; isNew: boolean; name: string; createdAt: string } {
    const projectPath = this.getProjectPath(projectName);
    const isNew = !existsSync(projectPath);
    if (isNew) {
      mkdirSync(projectPath, { recursive: true });
    }
    return { success: true, path: projectPath, isNew, name: projectName, createdAt: new Date().toISOString() };
  }

  /**
   * Write a file inside the project workspace
   */
  public static writeFile(projectName: string, relativePath: string, content: string): { success: boolean; filePath: string; bytesWritten: number; bytes: number } {
    const projectPath = this.getProjectPath(projectName);
    if (!existsSync(projectPath)) {
      mkdirSync(projectPath, { recursive: true });
    }

    const fullFilePath = resolve(projectPath, relativePath);
    if (!fullFilePath.startsWith(projectPath)) {
      throw new Error(`Path traversal denied: '${relativePath}' escapes project root`);
    }

    const parentDir = resolve(fullFilePath, '..');
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    writeFileSync(fullFilePath, content, 'utf-8');
    const bytesWritten = Buffer.byteLength(content, 'utf-8');
    return { success: true, filePath: relative(projectPath, fullFilePath).replace(/\\/g, '/'), bytesWritten, bytes: bytesWritten };
  }

  /**
   * Read a file inside the project workspace
   */
  public static readFile(projectName: string, relativePath: string): { success: boolean; content: string; bytes: number; filePath: string } {
    const projectPath = this.getProjectPath(projectName);
    const fullFilePath = resolve(projectPath, relativePath);
    if (!fullFilePath.startsWith(projectPath)) {
      throw new Error(`Path traversal denied: '${relativePath}' escapes project root`);
    }

    if (!existsSync(fullFilePath)) {
      throw new Error(`File not found: '${relativePath}' in project '${projectName}'`);
    }

    const content = readFileSync(fullFilePath, 'utf-8');
    return { success: true, content, bytes: Buffer.byteLength(content, 'utf-8'), filePath: relative(projectPath, fullFilePath).replace(/\\/g, '/') };
  }

  /**
   * List files recursively or flat within the workspace
   */
  public static listFiles(projectName: string, subDir = '', recursive = true): (WorkspaceFileEntry & { relativePath: string })[] {
    const projectPath = this.getProjectPath(projectName);
    const targetDir = resolve(projectPath, subDir);
    if (!targetDir.startsWith(projectPath) || !existsSync(targetDir)) {
      return [];
    }

    const results: (WorkspaceFileEntry & { relativePath: string })[] = [];
    const scan = (currentDir: string) => {
      const items = readdirSync(currentDir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git') continue; // Skip bloat
        const full = join(currentDir, item);
        const st = statSync(full);
        const rel = relative(projectPath, full).replace(/\\/g, '/');
        const isDir = st.isDirectory();
        results.push({
          path: rel,
          relativePath: rel,
          name: item,
          isDirectory: isDir,
          sizeBytes: isDir ? undefined : st.size,
        });
        if (isDir && recursive) {
          scan(full);
        }
      }
    };

    scan(targetDir);
    return results;
  }

  /**
   * Run a terminal command inside the project workspace (cross-platform, e.g. npm init, npm install)
   */
  public static async runCommand(
    projectName: string,
    command: string,
    timeoutMs = 60_000,
    onOutputChunk?: (chunk: string) => void
  ): Promise<WorkspaceCommandResult> {
    const projectPath = this.getProjectPath(projectName);
    if (!existsSync(projectPath)) {
      mkdirSync(projectPath, { recursive: true });
    }

    // Security check: Block dangerous host-level destructive commands
    const blockedPatterns = [/rm\s+-rf\s+[\/\\]/i, /format\s+[a-z]:/i, /shutdown/i, /drop\s+database/i];
    for (const pat of blockedPatterns) {
      if (pat.test(command)) {
        return {
          success: false,
          stdout: '',
          stderr: `SECURITY BLOCK: Command violates host protection policy: ${command}`,
          exitCode: 1,
          durationMs: 0,
        };
      }
    }

    const start = Date.now();

    return new Promise((resolve) => {
      const proc = spawn(command, {
        cwd: projectPath,
        shell: true,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          CI: 'true', // Non-interactive mode for npm / build scripts
        },
      });

      let stdout = '';
      let stderr = '';
      let timer: NodeJS.Timeout | null = null;

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          proc.kill();
          stderr += `\nCommand timed out after ${timeoutMs}ms`;
        }, timeoutMs);
      }

      proc.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (onOutputChunk) onOutputChunk(text);
      });

      proc.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (onOutputChunk) onOutputChunk(text);
      });

      proc.on('close', (code) => {
        if (timer) clearTimeout(timer);
        const durationMs = Date.now() - start;
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? (stderr ? 1 : 0),
          durationMs,
        });
      });

      proc.on('error', (err) => {
        if (timer) clearTimeout(timer);
        const durationMs = Date.now() - start;
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: `${stderr}\n${err.message}`.trim(),
          exitCode: 1,
          durationMs,
        });
      });
    });
  }

  /**
   * Delete a project workspace safely
   */
  public static deleteProject(projectName: string): boolean {
    const projectPath = this.getProjectPath(projectName);
    if (existsSync(projectPath)) {
      rmSync(projectPath, { recursive: true, force: true });
      return true;
    }
    return false;
  }

  /**
   * Alias for deleting project during test teardown
   */
  public static cleanProject(projectName: string): boolean {
    return this.deleteProject(projectName);
  }
}
