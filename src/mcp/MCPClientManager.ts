/**
 * J.A.R.V.I.S. MARK-V Model Context Protocol (MCP) Client Manager
 * Dynamically connects to MCP servers and registers capabilities into ToolRegistry.
 */

import { ToolRegistry } from '../tools/ToolRegistry';
import { MCPDiscoveryManifest, ToolDefinition } from '../tools/types';
import { ExecutionPolicy } from '../kernel/types';

export class MCPClientManager {
  private static mountedServers: Map<string, MCPDiscoveryManifest> = new Map();

  /**
   * Mount tools from an MCP server manifest into the unified ToolRegistry
   */
  public static mountServer(
    manifest: MCPDiscoveryManifest,
    rpcCaller?: (toolName: string, args: Record<string, any>) => Promise<any>
  ): { mountedCount: number; toolNames: string[] } {
    this.mountedServers.set(manifest.serverId, manifest);
    const toolNames: string[] = [];

    for (const tool of manifest.tools) {
      const toolDef: ToolDefinition = {
        name: `mcp_${manifest.serverId}_${tool.name}`,
        description: `[MCP: ${manifest.serverName}] ${tool.description}`,
        category: 'SYSTEM',
        inputSchema: tool.inputSchema,
        requiredPermission: 'SAFE_LOCAL',
        riskLevel: 'LOW',
        timeoutMs: 30_000,
        requiresConfirmation: false,
        requiresAuth: false,
        health: 'ONLINE',
        telemetry: {
          callCount: 0,
          successCount: 0,
          errorCount: 0,
          totalLatencyMs: 0,
          avgLatencyMs: 0,
        },
        execute: async (args, context) => {
          if (rpcCaller) {
            try {
              const res = await rpcCaller(tool.name, args);
              return {
                tool: tool.name,
                success: true,
                output: res,
              };
            } catch (rpcErr: any) {
              return {
                tool: tool.name,
                success: false,
                output: null,
                error: rpcErr?.message || String(rpcErr),
              };
            }
          }
          return {
            tool: tool.name,
            success: true,
            output: { simulatedMcpOutput: true, args, serverId: manifest.serverId },
          };
        },
      };

      ToolRegistry.registerTool(toolDef);
      toolNames.push(toolDef.name);
    }

    return {
      mountedCount: toolNames.length,
      toolNames,
    };
  }

  public static listMountedServers(): MCPDiscoveryManifest[] {
    return Array.from(this.mountedServers.values());
  }

  public static isServerMounted(serverId: string): boolean {
    return this.mountedServers.has(serverId);
  }
}
