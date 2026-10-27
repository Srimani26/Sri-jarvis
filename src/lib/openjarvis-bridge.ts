import fs from 'node:fs';
import path from 'node:path';

export interface OpenJarvisTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  maxTurns: number;
  temperature: number;
  tools: string[];
  systemPrompt: string;
  sourceFile: string;
}

export interface OpenJarvisRecipe {
  id: string;
  name: string;
  description: string;
  sourceFile: string;
  rawContent: string;
}

export interface OpenJarvisTool {
  id: string;
  name: string;
  description: string;
  sourceFile: string;
  rawContent: string;
}

export class OpenJarvisBridge {
  private static rootDir = path.join(process.cwd(), 'integrations', 'openjarvis');

  static isAvailable(): boolean {
    return fs.existsSync(this.rootDir);
  }

  static getRootDir(): string {
    return this.rootDir;
  }

  /**
   * Load and parse all 16 built-in agent templates from OpenJarvis
   */
  static getTemplates(): OpenJarvisTemplate[] {
    const templatesDir = path.join(this.rootDir, 'src', 'openjarvis', 'templates', 'data');
    if (!fs.existsSync(templatesDir)) return [];

    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.toml'));
    const templates: OpenJarvisTemplate[] = [];

    for (const file of files) {
      try {
        const fullPath = path.join(templatesDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const id = file.replace('.toml', '');

        // Lightweight TOML key extraction without heavy external dependency
        const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
        const descMatch = content.match(/description\s*=\s*["']([^"']+)["']/);
        const typeMatch = content.match(/type\s*=\s*["']([^"']+)["']/);
        const turnsMatch = content.match(/max_turns\s*=\s*(\d+)/);
        const tempMatch = content.match(/temperature\s*=\s*([0-9.]+)/);
        const promptMatch = content.match(/system_prompt\s*=\s*"""([\s\S]*?)"""/) || content.match(/system_prompt\s*=\s*["']([^"']+)["']/);
        const toolsMatch = content.match(/tools\s*=\s*\[(.*?)\]/);

        let tools: string[] = [];
        if (toolsMatch && toolsMatch[1]) {
          tools = toolsMatch[1].split(',').map(t => t.replace(/["'\s]/g, '')).filter(Boolean);
        }

        templates.push({
          id,
          name: nameMatch ? nameMatch[1] : id,
          description: descMatch ? descMatch[1] : `OpenJarvis ${id} agent template`,
          type: typeMatch ? typeMatch[1] : 'orchestrator',
          maxTurns: turnsMatch ? parseInt(turnsMatch[1], 10) : 10,
          temperature: tempMatch ? parseFloat(tempMatch[1]) : 0.5,
          tools,
          systemPrompt: promptMatch ? promptMatch[1].trim() : '',
          sourceFile: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
        });
      } catch (err) {
        console.warn(`[OpenJarvisBridge] Failed to load template ${file}:`, err);
      }
    }

    return templates;
  }

  /**
   * Load all multi-agent workflow recipes from OpenJarvis
   */
  static getRecipes(): OpenJarvisRecipe[] {
    const recipesDir = path.join(this.rootDir, 'src', 'openjarvis', 'recipes', 'data');
    if (!fs.existsSync(recipesDir)) return [];

    const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.toml'));
    return files.map(file => {
      const fullPath = path.join(recipesDir, file);
      const rawContent = fs.readFileSync(fullPath, 'utf-8');
      const id = file.replace('.toml', '');
      const nameMatch = rawContent.match(/name\s*=\s*["']([^"']+)["']/);
      const descMatch = rawContent.match(/description\s*=\s*["']([^"']+)["']/);

      return {
        id,
        name: nameMatch ? nameMatch[1] : id.replace(/_/g, ' '),
        description: descMatch ? descMatch[1] : `OpenJarvis ${id} workflow recipe`,
        sourceFile: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
        rawContent,
      };
    });
  }

  /**
   * Load all built-in tool templates from OpenJarvis
   */
  static getTools(): OpenJarvisTool[] {
    const toolsDir = path.join(this.rootDir, 'src', 'openjarvis', 'tools', 'templates', 'builtin');
    if (!fs.existsSync(toolsDir)) return [];

    const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.toml'));
    return files.map(file => {
      const fullPath = path.join(toolsDir, file);
      const rawContent = fs.readFileSync(fullPath, 'utf-8');
      const id = file.replace('.toml', '');
      const nameMatch = rawContent.match(/name\s*=\s*["']([^"']+)["']/);
      const descMatch = rawContent.match(/description\s*=\s*["']([^"']+)["']/);

      return {
        id,
        name: nameMatch ? nameMatch[1] : id,
        description: descMatch ? descMatch[1] : `OpenJarvis builtin ${id} tool`,
        sourceFile: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
        rawContent,
      };
    });
  }

  /**
   * Retrieve catalog of supported model specifications
   */
  static getModelCatalog() {
    return [
      { id: 'qwen3:0.6b', name: 'Qwen3 0.6B', params: '0.6B', context: 40960, provider: 'alibaba', engines: ['ollama', 'vllm', 'llamacpp'] },
      { id: 'qwen3:1.7b', name: 'Qwen3 1.7B', params: '1.7B', context: 40960, provider: 'alibaba', engines: ['ollama', 'vllm', 'llamacpp'] },
      { id: 'qwen3:4b', name: 'Qwen3 4B', params: '4.0B', context: 262144, provider: 'alibaba', engines: ['ollama', 'vllm', 'llamacpp'] },
      { id: 'qwen3:8b', name: 'Qwen3 8B', params: '8.2B', context: 32768, provider: 'alibaba', engines: ['ollama', 'vllm', 'llamacpp'] },
      { id: 'deepseek-r1:671b', name: 'DeepSeek R1 671B', params: '671B', context: 128000, provider: 'deepseek', engines: ['cloud-api', 'groq'] },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', params: 'MoE', context: 1048576, provider: 'google', engines: ['cloud-api'] },
    ];
  }
}
