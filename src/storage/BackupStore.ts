import { StorageProvider } from './StorageProvider';
import { StorageMetadata } from './interfaces';

/**
 * J.A.R.V.I.S. BackupStore
 * Disaster recovery snapshots, database dumps, and configuration bundles.
 */
export class BackupStore {
  private static readonly BUCKET = 'jarvis-backups';

  public static async putBackup(
    backupId: string,
    data: Buffer | Uint8Array | string,
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `snapshots/${timestamp}_${backupId}.json`;
    const provider = StorageProvider.getProvider();
    return provider.putObject(this.BUCKET, key, data, 'application/json', {
      backupId,
      created: timestamp,
      ...metadata,
    });
  }

  public static async getBackup(key: string): Promise<Buffer | null> {
    const provider = StorageProvider.getProvider();
    return provider.getObject(this.BUCKET, key);
  }

  public static async listBackups(): Promise<StorageMetadata[]> {
    const provider = StorageProvider.getProvider();
    return provider.listObjects(this.BUCKET, 'snapshots/');
  }
}
