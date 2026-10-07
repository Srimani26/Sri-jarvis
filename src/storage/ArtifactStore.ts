import { StorageProvider } from './StorageProvider';
import { StorageMetadata } from './interfaces';

/**
 * J.A.R.V.I.S. ArtifactStore
 * Dedicated storage for agent execution artifacts, traces, diffs, audio outputs, and evidence.
 */
export class ArtifactStore {
  private static readonly BUCKET = 'jarvis-artifacts';

  public static async putArtifact(
    taskId: string,
    filename: string,
    data: Buffer | Uint8Array | string,
    contentType = 'application/json',
    metadata?: Record<string, string>
  ): Promise<StorageMetadata> {
    const key = `tasks/${taskId}/${filename}`;
    const provider = StorageProvider.getProvider();
    return provider.putObject(this.BUCKET, key, data, contentType, {
      taskId,
      artifactType: 'EXECUTION_EVIDENCE',
      ...metadata,
    });
  }

  public static async getArtifact(taskId: string, filename: string): Promise<Buffer | null> {
    const key = `tasks/${taskId}/${filename}`;
    const provider = StorageProvider.getProvider();
    return provider.getObject(this.BUCKET, key);
  }

  public static async listTaskArtifacts(taskId: string): Promise<StorageMetadata[]> {
    const prefix = `tasks/${taskId}/`;
    const provider = StorageProvider.getProvider();
    return provider.listObjects(this.BUCKET, prefix);
  }
}
