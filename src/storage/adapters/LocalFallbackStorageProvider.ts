import { promises as fs } from 'node:fs';
import { existsSync, createReadStream } from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { IStorageProvider, StorageHealth, StorageMetadata, StorageProviderType } from '../interfaces';

export class LocalFallbackStorageProvider implements IStorageProvider {
  public readonly name = 'Local Durable Filesystem Provider';
  public readonly type: StorageProviderType = 'LOCAL_DURABLE';
  private rootDir: string;

  constructor(customPath?: string) {
    this.rootDir = customPath || process.env.STORAGE_LOCAL_ROOT || path.join(process.cwd(), 'data', 'cloud_storage');
  }

  public isConfigured(): boolean {
    return true;
  }

  private resolvePath(bucket: string, key: string): string {
    const sanitizedBucket = bucket.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const sanitizedKey = key.replace(/\\/g, '/').replace(/\.\./g, '');
    return path.join(this.rootDir, sanitizedBucket, sanitizedKey);
  }

  public async putObject(
    bucket: string,
    key: string,
    data: Buffer | Uint8Array | string,
    contentType = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    const filePath = this.resolvePath(bucket, key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const buffer = Buffer.isBuffer(data)
      ? data
      : typeof data === 'string'
      ? Buffer.from(data, 'utf-8')
      : Buffer.from(data);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    await fs.writeFile(filePath, buffer);

    const stat = await fs.stat(filePath);
    const nowIso = new Date().toISOString();

    const meta: StorageMetadata = {
      key,
      sizeBytes: stat.size,
      contentType,
      etag: hash,
      createdAt: stat.birthtime.toISOString() || nowIso,
      lastModified: stat.mtime.toISOString() || nowIso,
      customMetadata: metadata,
    };

    // Store metadata sidecar file for persistence
    const metaPath = `${filePath}.meta.json`;
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    return meta;
  }

  public async getObject(bucket: string, key: string): Promise<Buffer | null> {
    const filePath = this.resolvePath(bucket, key);
    if (!existsSync(filePath)) {
      return null;
    }
    return fs.readFile(filePath);
  }

  public async deleteObject(bucket: string, key: string): Promise<boolean> {
    const filePath = this.resolvePath(bucket, key);
    if (!existsSync(filePath)) {
      return false;
    }
    await fs.unlink(filePath);
    const metaPath = `${filePath}.meta.json`;
    if (existsSync(metaPath)) {
      await fs.unlink(metaPath).catch(() => {});
    }
    return true;
  }

  public async listObjects(bucket: string, prefix = ''): Promise<StorageMetadata[]> {
    const bucketDir = path.join(this.rootDir, bucket.replace(/[^a-zA-Z0-9_\-\.]/g, '_'));
    if (!existsSync(bucketDir)) {
      return [];
    }

    const results: StorageMetadata[] = [];
    const scanDir = async (currentDir: string, relBase = '') => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.endsWith('.meta.json')) continue;
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.join(relBase, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          await scanDir(fullPath, relPath);
        } else if (entry.isFile()) {
          if (!prefix || relPath.startsWith(prefix)) {
            const stat = await fs.stat(fullPath);
            let meta: StorageMetadata | null = null;
            const metaPath = `${fullPath}.meta.json`;
            if (existsSync(metaPath)) {
              try {
                meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
              } catch (_) {}
            }
            if (!meta) {
              meta = {
                key: relPath,
                sizeBytes: stat.size,
                contentType: 'application/octet-stream',
                etag: 'local-' + stat.mtimeMs,
                createdAt: stat.birthtime.toISOString(),
                lastModified: stat.mtime.toISOString(),
              };
            }
            results.push(meta);
          }
        }
      }
    };

    await scanDir(bucketDir);
    return results;
  }

  public async getHealth(): Promise<StorageHealth> {
    const start = Date.now();
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
      const testFile = path.join(this.rootDir, '.health_probe');
      await fs.writeFile(testFile, 'JARVIS_PROBE', 'utf-8');
      await fs.unlink(testFile);
      const latencyMs = Date.now() - start;
      return {
        healthy: true,
        provider: this.type,
        latencyMs,
        bucketOrRoot: this.rootDir,
      };
    } catch (err: any) {
      return {
        healthy: false,
        provider: this.type,
        latencyMs: Date.now() - start,
        bucketOrRoot: this.rootDir,
        error: err?.message || String(err),
      };
    }
  }
}
