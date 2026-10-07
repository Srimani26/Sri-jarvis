import * as crypto from 'node:crypto';
import { IStorageProvider, StorageHealth, StorageMetadata, StorageProviderType } from '../interfaces';

export interface S3Config {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  forcePathStyle?: boolean;
}

export class S3StorageProvider implements IStorageProvider {
  public readonly name = 'S3-Compatible Cloud Storage Provider (5TB Capable)';
  public readonly type: StorageProviderType = 'S3_COMPATIBLE';
  private config: S3Config;

  constructor(customConfig?: Partial<S3Config>) {
    this.config = {
      endpoint: customConfig?.endpoint || process.env.STORAGE_S3_ENDPOINT || process.env.AWS_ENDPOINT_URL || '',
      bucket: customConfig?.bucket || process.env.STORAGE_S3_BUCKET || process.env.AWS_S3_BUCKET || 'jarvis-5tb-vault',
      accessKeyId: customConfig?.accessKeyId || process.env.STORAGE_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: customConfig?.secretAccessKey || process.env.STORAGE_S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
      region: customConfig?.region || process.env.STORAGE_S3_REGION || process.env.AWS_REGION || 'auto',
      forcePathStyle: customConfig?.forcePathStyle ?? true,
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.endpoint && this.config.accessKeyId && this.config.secretAccessKey);
  }

  private getUrl(bucket: string, key: string): string {
    const ep = this.config.endpoint.replace(/\/$/, '');
    const cleanKey = key.replace(/^\//, '');
    if (this.config.forcePathStyle) {
      return `${ep}/${bucket}/${cleanKey}`;
    }
    return `https://${bucket}.${ep.replace(/^https?:\/\//, '')}/${cleanKey}`;
  }

  /**
   * Generates AWS SigV4 authorization headers
   */
  private signRequest(
    method: string,
    urlStr: string,
    payload: Buffer | Uint8Array | string,
    contentType = 'application/octet-stream',
    extraHeaders: Record<string, string> = {}
  ): Record<string, string> {
    const url = new URL(urlStr);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const region = this.config.region || 'us-east-1';
    const service = 's3';

    const payloadBuffer = Buffer.isBuffer(payload)
      ? payload
      : typeof payload === 'string'
      ? Buffer.from(payload, 'utf-8')
      : Buffer.from(payload);

    const payloadHash = crypto.createHash('sha256').update(payloadBuffer).digest('hex');

    const headers: Record<string, string> = {
      host: url.host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'content-type': contentType,
      ...extraHeaders,
    };

    const sortedHeaderKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedHeaderKeys.map((k) => `${k.toLowerCase()}:${headers[k].trim()}\n`).join('');
    const signedHeaders = sortedHeaderKeys.map((k) => k.toLowerCase()).join(';');

    const canonicalUri = encodeURI(url.pathname);
    const canonicalQuery = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const canonicalRequest = [
      method.toUpperCase(),
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${this.config.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    headers['Authorization'] = `${algorithm} Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return headers;
  }

  public async putObject(
    bucket: string,
    key: string,
    data: Buffer | Uint8Array | string,
    contentType = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    if (!this.isConfigured()) {
      throw new Error('S3StorageProvider is not configured with valid endpoint and keys.');
    }

    const url = this.getUrl(bucket, key);
    const extraHeaders: Record<string, string> = {};
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        extraHeaders[`x-amz-meta-${k.toLowerCase()}`] = v;
      }
    }

    const headers = this.signRequest('PUT', url, data, contentType, extraHeaders);
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as any);

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: buffer,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`S3 PUT failed with status ${res.status}: ${errText}`);
    }

    const etag = (res.headers.get('etag') || '').replace(/"/g, '');
    const nowIso = new Date().toISOString();

    return {
      key,
      sizeBytes: buffer.length,
      contentType,
      etag,
      createdAt: nowIso,
      lastModified: nowIso,
      customMetadata: metadata,
    };
  }

  public async getObject(bucket: string, key: string): Promise<Buffer | null> {
    if (!this.isConfigured()) return null;
    const url = this.getUrl(bucket, key);
    const headers = this.signRequest('GET', url, '');

    const res = await fetch(url, { method: 'GET', headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`S3 GET failed with status ${res.status}`);

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  public async deleteObject(bucket: string, key: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const url = this.getUrl(bucket, key);
    const headers = this.signRequest('DELETE', url, '');

    const res = await fetch(url, { method: 'DELETE', headers });
    return res.ok || res.status === 204;
  }

  public async listObjects(bucket: string, prefix = ''): Promise<StorageMetadata[]> {
    if (!this.isConfigured()) return [];
    let url = this.getUrl(bucket, '');
    if (prefix) {
      url += `?prefix=${encodeURIComponent(prefix)}`;
    }
    const headers = this.signRequest('GET', url, '');
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return [];

    // Parse basic S3 ListObjects XML
    const xml = await res.text();
    const items: StorageMetadata[] = [];
    const contentsMatches = xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g);

    for (const match of contentsMatches) {
      const block = match[1];
      const key = block.match(/<Key>(.*?)<\/Key>/)?.[1] || '';
      const sizeBytes = parseInt(block.match(/<Size>(\d+)<\/Size>/)?.[1] || '0', 10);
      const etag = (block.match(/<ETag>(.*?)<\/ETag>/)?.[1] || '').replace(/"/g, '');
      const lastModified = block.match(/<LastModified>(.*?)<\/LastModified>/)?.[1] || new Date().toISOString();

      if (key) {
        items.push({
          key,
          sizeBytes,
          contentType: 'application/octet-stream',
          etag,
          createdAt: lastModified,
          lastModified,
        });
      }
    }
    return items;
  }

  public async getHealth(): Promise<StorageHealth> {
    const start = Date.now();
    if (!this.isConfigured()) {
      return {
        healthy: false,
        provider: this.type,
        latencyMs: 0,
        bucketOrRoot: this.config.bucket,
        error: 'S3 Credentials not configured (STORAGE_S3_ENDPOINT, ACCESS_KEY, SECRET_KEY missing)',
      };
    }

    try {
      // Perform HEAD bucket or list probe
      const url = this.getUrl(this.config.bucket, '?max-keys=1');
      const headers = this.signRequest('GET', url, '');
      const res = await fetch(url, { method: 'GET', headers });
      const latencyMs = Date.now() - start;

      return {
        healthy: res.ok || res.status === 200,
        provider: this.type,
        latencyMs,
        bucketOrRoot: `${this.config.endpoint}/${this.config.bucket}`,
        error: res.ok ? undefined : `Probe returned HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        healthy: false,
        provider: this.type,
        latencyMs: Date.now() - start,
        bucketOrRoot: `${this.config.endpoint}/${this.config.bucket}`,
        error: err?.message || String(err),
      };
    }
  }
}
