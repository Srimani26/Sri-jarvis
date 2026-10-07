import { IStorageProvider, StorageHealth, StorageMetadata, StorageProviderType } from '../interfaces';

export interface GoogleDriveConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  apiKey?: string;
  rootFolderId?: string;
}

export class GoogleDriveStorageProvider implements IStorageProvider {
  public readonly name = 'Google Drive 5TB Cloud Storage Provider';
  public readonly type: StorageProviderType = 'GOOGLE_DRIVE';
  private config: GoogleDriveConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(customConfig?: Partial<GoogleDriveConfig>) {
    this.config = {
      clientId: customConfig?.clientId || process.env.GDRIVE_CLIENT_ID || '',
      clientSecret: customConfig?.clientSecret || process.env.GDRIVE_CLIENT_SECRET || '',
      refreshToken: customConfig?.refreshToken || process.env.GDRIVE_REFRESH_TOKEN || '',
      apiKey: customConfig?.apiKey || process.env.GDRIVE_API_KEY || '',
      rootFolderId: customConfig?.rootFolderId || process.env.GDRIVE_ROOT_FOLDER_ID || 'root',
    };
  }

  public isConfigured(): boolean {
    return Boolean(
      (this.config.clientId && this.config.clientSecret && this.config.refreshToken) ||
      this.config.apiKey
    );
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      return null;
    }

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!res.ok) return null;
      const data: any = await res.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      return this.accessToken;
    } catch {
      return null;
    }
  }

  public async putObject(
    bucket: string,
    key: string,
    data: Buffer | Uint8Array | string,
    contentType = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    const token = await this.getAccessToken();
    if (!token && !this.config.apiKey) {
      throw new Error('Google Drive API not authenticated (Refresh token or API key required)');
    }

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as any);
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const fileMetadata = {
      name: `${bucket}_${key.replace(/\//g, '_')}`,
      parents: [this.config.rootFolderId || 'root'],
      properties: metadata || {},
    };

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(fileMetadata) +
          delimiter +
          `Content-Type: ${contentType}\r\n\r\n`
      ),
      buffer,
      Buffer.from(closeDelimiter),
    ]);

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const headers: Record<string, string> = {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error(`Google Drive upload failed: ${res.statusText}`);
    }

    const fileRes: any = await res.json();
    const nowIso = new Date().toISOString();

    return {
      key,
      sizeBytes: buffer.length,
      contentType,
      etag: fileRes.id || 'gdrive-' + Date.now(),
      createdAt: nowIso,
      lastModified: nowIso,
      customMetadata: metadata,
    };
  }

  public async getObject(bucket: string, key: string): Promise<Buffer | null> {
    const token = await this.getAccessToken();
    if (!token && !this.config.apiKey) return null;

    // Search for file by name
    const fileName = `${bucket}_${key.replace(/\//g, '_')}`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and trashed=false`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) return null;
    const searchData: any = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) return null;

    const fileId = searchData.files[0].id;
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const downloadRes = await fetch(downloadUrl, { headers });
    if (!downloadRes.ok) return null;

    const arrayBuf = await downloadRes.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  public async deleteObject(bucket: string, key: string): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    const fileName = `${bucket}_${key.replace(/\//g, '_')}`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and trashed=false`;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) return false;
    const searchData: any = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) return false;

    const fileId = searchData.files[0].id;
    const deleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers,
    });
    return deleteRes.ok;
  }

  public async listObjects(bucket: string, prefix = ''): Promise<StorageMetadata[]> {
    const token = await this.getAccessToken();
    if (!token && !this.config.apiKey) return [];

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const searchUrl = `https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,size,mimeType,createdTime,modifiedTime)&trashed=false`;
    const res = await fetch(searchUrl, { headers });
    if (!res.ok) return [];

    const data: any = await res.json();
    const items: StorageMetadata[] = [];
    const bucketPrefix = `${bucket}_`;

    for (const file of data.files || []) {
      if (file.name.startsWith(bucketPrefix)) {
        const key = file.name.substring(bucketPrefix.length);
        if (!prefix || key.startsWith(prefix)) {
          items.push({
            key,
            sizeBytes: parseInt(file.size || '0', 10),
            contentType: file.mimeType || 'application/octet-stream',
            etag: file.id,
            createdAt: file.createdTime || new Date().toISOString(),
            lastModified: file.modifiedTime || new Date().toISOString(),
          });
        }
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
        bucketOrRoot: this.config.rootFolderId || 'gdrive_root',
        error: 'Google Drive not configured (GDRIVE_REFRESH_TOKEN or GDRIVE_API_KEY required)',
      };
    }

    try {
      const token = await this.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', { headers });
      const latencyMs = Date.now() - start;
      const data: any = await res.json();

      return {
        healthy: res.ok,
        provider: this.type,
        latencyMs,
        bucketOrRoot: this.config.rootFolderId || 'gdrive_root',
        quotaBytes: parseInt(data?.storageQuota?.limit || '5497558138880', 10), // ~5TB
        usedBytes: parseInt(data?.storageQuota?.usage || '0', 10),
        error: res.ok ? undefined : `Google Drive returned ${res.statusText}`,
      };
    } catch (err: any) {
      return {
        healthy: false,
        provider: this.type,
        latencyMs: Date.now() - start,
        bucketOrRoot: this.config.rootFolderId || 'gdrive_root',
        error: err?.message || String(err),
      };
    }
  }
}
