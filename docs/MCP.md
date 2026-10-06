# J.A.R.V.I.S. MARK-V — Model Context Protocol (MCP) Integration

## 1. Protocol Architecture
- **Standard**: Anthropic Model Context Protocol specification (`@modelcontextprotocol/sdk`).
- **Client Manager**: `src/mcp/MCPClientManager.ts` connects to external MCP tool servers via standard JSON-RPC.
- **Dynamic Tool Registration**: Discovered MCP tools are registered into `ToolRegistry.ts` with explicit capability permission tokens and parameter validation schemas.

## 2. Security Boundaries
- MCP tools inherit standard `ExecutionKernel` timeout protection (default 30s).
- Destructive actions (dropping tables, broad deletions) require human confirmation tokens (`ASK_USER`).
