/**
 * J.A.R.V.I.S. MARK-V Public APIs Engine
 * Parses, indexes, and queries the world's largest catalog of 1,400+ free public APIs
 * (from https://github.com/public-apis/public-apis).
 * Equips agents with instant API discovery, documentation lookups, and integration blueprints.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface PublicApiEntry {
  name: string;
  url: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  category: string;
}

export class PublicApisEngine {
  private static cachedApis: PublicApiEntry[] | null = null;
  private static readmePath = path.resolve(process.cwd(), 'external', 'arsenal', 'public-apis', 'README.md');

  public static initialize(): PublicApiEntry[] {
    if (this.cachedApis) return this.cachedApis;

    if (!fs.existsSync(this.readmePath)) {
      this.cachedApis = [];
      return [];
    }

    try {
      const content = fs.readFileSync(this.readmePath, 'utf-8');
      const lines = content.split('\n');
      const apis: PublicApiEntry[] = [];
      let currentCategory = 'General';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          currentCategory = trimmed.replace('### ', '').trim();
          continue;
        }

        if (trimmed.startsWith('| [') && trimmed.includes('|')) {
          const parts = trimmed.split('|').map(p => p.trim());
          if (parts.length >= 6) {
            const linkMatch = parts[1].match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
              const name = linkMatch[1];
              const url = linkMatch[2];
              const description = parts[2];
              const auth = parts[3] || 'No';
              const https = (parts[4] || '').toLowerCase() === 'yes';
              const cors = parts[5] || 'Unknown';

              apis.push({
                name,
                url,
                description,
                auth,
                https,
                cors,
                category: currentCategory,
              });
            }
          }
        }
      }

      this.cachedApis = apis;
      return apis;
    } catch (err: any) {
      console.error('[PublicApisEngine] Failed to parse public-apis README:', err?.message);
      this.cachedApis = [];
      return [];
    }
  }

  public static searchApis(query: string, category?: string, limit: number = 10): PublicApiEntry[] {
    const all = this.initialize();
    const lowerQuery = (query || '').toLowerCase().trim();
    const lowerCategory = (category || '').toLowerCase().trim();

    return all
      .filter(api => {
        const matchCategory = !lowerCategory || api.category.toLowerCase().includes(lowerCategory);
        if (!matchCategory) return false;
        if (!lowerQuery) return true;
        return (
          api.name.toLowerCase().includes(lowerQuery) ||
          api.description.toLowerCase().includes(lowerQuery) ||
          api.category.toLowerCase().includes(lowerQuery)
        );
      })
      .slice(0, limit);
  }

  public static getCategories(): string[] {
    const all = this.initialize();
    const cats = new Set<string>();
    for (const a of all) {
      cats.add(a.category);
    }
    return Array.from(cats).sort();
  }

  public static getSummary(): { totalApis: number; categoriesCount: number; categories: string[] } {
    const all = this.initialize();
    const categories = this.getCategories();
    return {
      totalApis: all.length,
      categoriesCount: categories.length,
      categories,
    };
  }
}
