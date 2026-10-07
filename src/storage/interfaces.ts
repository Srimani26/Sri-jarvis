/**
 * J.A.R.V.I.S. MARK-V Sovereign 5TB Cloud Storage Interfaces
 * Provider-agnostic contracts for Object, Artifact, Memory, and Backup storage.
 */

export interface StorageMetadata {
  key: string;
  sizeBytes: number;
  contentType: string;
  etag: string;
  createdAt: string;
  lastModified: string;
  customMetadata?: Record<string, string>;
}

export interface StorageObject {
  key: string;
  data: Buffer | Uint8Array | string;
  metadata: StorageMetadata;
}

export type StorageProviderType = 
  | 'S3_COMPATIBLE' 
  | 'GOOGLE_DRIVE' 
  | 'ONEDRIVE' 
  | 'DROPBOX' 
  | 'LOCAL_DURABLE';

export interface StorageHealth {
  healthy: boolean;
  provider: StorageProviderType;
  latencyMs: number;
  bucketOrRoot: string;
  quotaBytes?: number;
  usedBytes?: number;
  error?: string;
}

export interface IStorageProvider {
  readonly name: string;
  readonly type: StorageProviderType;
  isConfigured(): boolean;
  putObject(
    bucket: string,
    key: string,
    data: Buffer | Uint8Array | string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<StorageMetadata>;
  getObject(bucket: string, key: string): Promise<Buffer | null>;
  deleteObject(bucket: string, key: string): Promise<boolean>;
  listObjects(bucket: string, prefix?: string): Promise<StorageMetadata[]>;
  getHealth(): Promise<StorageHealth>;
}
