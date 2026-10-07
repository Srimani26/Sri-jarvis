import { StorageProvider } from './StorageProvider';
import { StorageMetadata } from './interfaces';

/**
 * J.A.R.V.I.S. ObjectStore
 * High-capacity storage for large objects: datasets, models, media, documents, and research files.
 */
export class ObjectStore {
  private static readonly BUCKET = 'jarvis-objects';

  public static async put(
    key: string,
    data: Buffer | Uint8Array | string,
    contentType = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    const provider = StorageProvider.getProvider();
    return provider.putObject(this.BUCKET, key, data, contentType, metadata);
  }

  public static async get(key: string): Promise<Buffer | null> {
    const provider = StorageProvider.getProvider();
    return provider.getObject(this.BUCKET, key);
  }

  public static async delete(key: string): Promise<boolean> {
    const provider = StorageProvider.getProvider();
    return provider.deleteObject(this.BUCKET, key);
  }

  public static async list(prefix = ''): Promise<StorageMetadata[]> {
    const provider = StorageProvider.getProvider();
    return provider.listObjects(this.BUCKET, prefix);
  }
}
