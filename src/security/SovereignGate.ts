/**
 * J.A.R.V.I.S. MARK-V Sovereign Gate & Auth Session Guardian
 * Eliminates session disconnects by enforcing durable JWT secret management,
 * persistent token verification, and transparent session stabilization.
 */

import { readFileSync, writeFileSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

export class SovereignGate {
  private static cachedSecret: string | null = null;

  /**
   * Resolve durable JWT signing secret.
   * Priority:
   * 1. process.env.JWT_SECRET
   * 2. process.env.RUNTIME_AUTH_SECRET
   * 3. .jarvis-secret file on persistent storage
   * 4. Generated high-entropy 96-char hex secret persisted with 0600 permissions
   */
  public static getJwtSecret(): string {
    if (this.cachedSecret) return this.cachedSecret;

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
      this.cachedSecret = process.env.JWT_SECRET.trim();
      return this.cachedSecret;
    }

    if (process.env.RUNTIME_AUTH_SECRET && process.env.RUNTIME_AUTH_SECRET.trim().length >= 16) {
      this.cachedSecret = process.env.RUNTIME_AUTH_SECRET.trim();
      return this.cachedSecret;
    }

    const secretFile = join(process.cwd(), '.jarvis-secret');
    try {
      if (existsSync(secretFile)) {
        const stored = readFileSync(secretFile, 'utf8').trim();
        if (stored.length >= 32) {
          this.cachedSecret = stored;
          return this.cachedSecret;
        }
      }
    } catch {
      // Fall through to file write
    }

    const generated = randomBytes(48).toString('hex');
    try {
      writeFileSync(secretFile, generated, { mode: 0o600 });
      chmodSync(secretFile, 0o600);
    } catch {
      // Ephemeral disk fallback
    }

    this.cachedSecret = generated;
    return this.cachedSecret;
  }

  /**
   * Generate standard 7-day session token with unique jti
   */
  public static createSessionToken(userId: string, username: string, expiresIn: string = '7d'): string {
    const secret = this.getJwtSecret();
    return jwt.sign(
      {
        userId,
        username,
        jti: randomBytes(16).toString('hex'),
        issuedAt: Date.now(),
      },
      secret,
      { expiresIn: expiresIn as any }
    );
  }

  /**
   * Generate durable 30-day refresh token
   */
  public static createRefreshToken(userId: string, username: string): string {
    const secret = this.getJwtSecret();
    return jwt.sign(
      {
        userId,
        username,
        type: 'refresh',
        jti: randomBytes(16).toString('hex'),
        issuedAt: Date.now(),
      },
      secret,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verify and decode JWT token safely
   */
  public static verifyToken(token: string): { valid: boolean; decoded?: any; error?: string } {
    try {
      const secret = this.getJwtSecret();
      const decoded = jwt.verify(token, secret);
      return { valid: true, decoded };
    } catch (err: any) {
      return { valid: false, error: err?.message || 'Invalid or expired token' };
    }
  }
}
