import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const KEY_ENV = 'MISSION_CHECKPOINT_ENCRYPTION_KEY';
const VERSION = 'v1';

function decodeKey(encoded: string | undefined): Buffer {
  if (!encoded) throw new Error(`${KEY_ENV} is required for approval-backed missions`);
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) {
    throw new Error(`${KEY_ENV} must be a canonical base64-encoded 32-byte key`);
  }
  return key;
}

/** Encrypts resumable tool arguments. The key is never derived from another secret. */
export class MissionCheckpointCrypto {
  private readonly key: Buffer;

  constructor(encodedKey: string | undefined = process.env[KEY_ENV]) {
    this.key = decodeKey(encodedKey);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
  }

  decrypt(payload: string): string {
    const [version, ivText, tagText, ciphertextText, extra] = payload.split('.');
    if (version !== VERSION || !ivText || !tagText || ciphertextText === undefined || extra !== undefined) {
      throw new Error('Invalid mission checkpoint envelope');
    }
    try {
      const iv = Buffer.from(ivText, 'base64url');
      const tag = Buffer.from(tagText, 'base64url');
      if (iv.length !== 12 || tag.length !== 16) throw new Error('Invalid envelope');
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextText, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new Error('Mission checkpoint authentication failed');
    }
  }
}
