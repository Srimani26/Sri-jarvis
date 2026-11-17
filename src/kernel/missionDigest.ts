import { createHash } from 'node:crypto';

/**
 * Stable SHA-256 digest of exactly what a mission is about to do.
 * Kept dependency-free (no database import) so the dispatch-time policy can
 * bind an approval to an action without touching persistence.
 */
export function digestMissionAction(toolName: string, action: Record<string, unknown>): string {
  const stable = (value: any): any => Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
      : value;
  return createHash('sha256').update(JSON.stringify(stable({ toolName, action }))).digest('hex');
}
