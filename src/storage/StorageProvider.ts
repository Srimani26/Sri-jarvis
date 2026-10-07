import { IStorageProvider, StorageHealth, StorageMetadata, StorageProviderType } from './interfaces';
import { LocalFallbackStorageProvider } from './adapters/LocalFallbackStorageProvider';
import { S3StorageProvider } from './adapters/S3StorageProvider';
import { GoogleDriveStorageProvider } from './adapters/GoogleDriveStorageProvider';

export class StorageProvider {
  private static instance: IStorageProvider | null = null;
  private static activeType: StorageProviderType = 'LOCAL_DURABLE';

  /**
   * Initializes or gets the active 5TB storage provider based on environment credentials
   */
  public static getProvider(): IStorageProvider {
    if (this.instance) {
      return this.instance;
    }

    // 1. Check S3-Compatible configuration (AWS S3, MinIO, R2, Wasabi, B2)
    const s3 = new S3StorageProvider();
    if (s3.isConfigured()) {
      console.log('📦 [StorageFabric] Detected and activated S3-Compatible 5TB Cloud Storage Provider');
      this.instance = s3;
      this.activeType = 'S3_COMPATIBLE';
      return this.instance;
    }

    // 2. Check Google Drive configuration
    const gdrive = new GoogleDriveStorageProvider();
    if (gdrive.isConfigured()) {
      console.log('📦 [StorageFabric] Detected and activated Google Drive 5TB Cloud Storage Provider');
      this.instance = gdrive;
      this.activeType = 'GOOGLE_DRIVE';
      return this.instance;
    }

    // 3. Fallback to Local Durable Storage Provider
    console.log('📦 [StorageFabric] Activating Local Durable Filesystem Storage Provider (warning: Render ephemeral warning in effect)');
    this.instance = new LocalFallbackStorageProvider();
    this.activeType = 'LOCAL_DURABLE';
    return this.instance;
  }

  /**
   * Explicitly set provider for testing or custom multi-cloud tiering
   */
  public static setProvider(provider: IStorageProvider): void {
    this.instance = provider;
    this.activeType = provider.type;
  }

  public static getActiveType(): StorageProviderType {
    return this.activeType;
  }

  public static async checkHealth(): Promise<StorageHealth> {
    return this.getProvider().getHealth();
  }
}
