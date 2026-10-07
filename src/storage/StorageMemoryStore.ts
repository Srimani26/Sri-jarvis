import { StorageProvider } from './StorageProvider';
import { StorageMetadata } from './interfaces';

/**
 * J.A.R.V.I.S. StorageMemoryStore
 * Storage backend for heavy memory payloads: audio transcripts, deep context, RAG embeddings, and history.
 */
export class StorageMemoryStore {
  private static readonly BUCKET = 'jarvis-memories';

  public static async putMemoryPayload(
    memoryId: string,
    data: Buffer | Uint8Array | string,
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    const key = `records/${memoryId}.json`;
    const provider = StorageProvider.getProvider();
    return provider.putObject(this.BUCKET, key, data, 'application/json', {
      memoryId,
      ...metadata,
    });
  }

  public static async getMemoryPayload(memoryId: string): Promise<Buffer | null> {
    const key = `records/${memoryId}.json`;
    const provider = StorageProvider.getProvider();
    return provider.getObject(this.BUCKET, key);
  }

  public static async deleteMemoryPayload(memoryId: string): Promise<boolean> {
    const key = `records/${memoryId}.json`;
    const provider = StorageProvider.getProvider();
    return provider.deleteObject(this.BUCKET, key);
  }
}
