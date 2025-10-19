# VS Code Extension Integration Guide

**Version:** 0.1.0
**Status:** 📋 Planning Phase
**Target Extension Version:** 2.2.0
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Client Adapter](#mcp-client-adapter)
3. [Bi-Directional Sync](#bi-directional-sync)
4. [Event Hooks](#event-hooks)
5. [Configuration](#configuration)
6. [Testing Strategy](#testing-strategy)

---

## Overview

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               VS Code Extension (v2.2.0)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Existing Components                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │ Comment  │  │  Ghost   │  │   AST    │         │    │
│  │  │ Manager  │  │ Marker   │  │  Anchor  │         │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │    │
│  └───────┼─────────────┼─────────────┼────────────────┘    │
│          │             │             │                      │
│          └─────────────┴─────────────┘                      │
│                        │                                     │
│  ┌─────────────────────▼──────────────────────────────┐    │
│  │           NEW: MCP Client Adapter                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │  Event   │  │  Sync    │  │  Cache   │         │    │
│  │  │  Bridge  │  │  Manager │  │  Layer   │         │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │    │
│  └───────┼─────────────┼─────────────┼────────────────┘    │
│          │             │             │                      │
│          └─────────────┴─────────────┘                      │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                  JSON-RPC over stdio
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                   MCP Server                                  │
│  (Standalone process running in background)                  │
└───────────────────────────────────────────────────────────────┘
```

### Key Goals

1. **Minimal Changes to Existing Code** - Adapter pattern isolates MCP logic
2. **Backward Compatibility** - Extension works with or without MCP server
3. **Real-Time Sync** - Changes in extension sync to server and vice versa
4. **Performance** - Debounced sync, caching, lazy loading
5. **Error Handling** - Graceful degradation if MCP server is unavailable

---

## MCP Client Adapter

### 1. Installation

Add MCP SDK to extension dependencies:

```bash
cd /path/to/paired-comments-extension
npm install @modelcontextprotocol/sdk
```

### 2. MCP Client Implementation

Create `src/mcp/MCPClientAdapter.ts`:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as vscode from 'vscode';
import { CommentFile, Comment, GhostMarker } from '../types';

export class MCPClientAdapter {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected = false;

  constructor(private workspaceRoot: string) {}

  /**
   * Initialize MCP client and connect to server
   */
  async connect(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('pairedComments.mcp');
      const serverCommand = config.get<string>('serverCommand', 'npx');
      const serverArgs = config.get<string[]>('serverArgs', [
        '-y',
        '@paired-comments/mcp-server'
      ]);

      // Create stdio transport
      this.transport = new StdioClientTransport({
        command: serverCommand,
        args: serverArgs,
        env: {
          ...process.env,
          WORKSPACE_PATH: this.workspaceRoot
        }
      });

      // Create MCP client
      this.client = new Client({
        name: 'paired-comments-vscode',
        version: '2.2.0'
      }, {
        capabilities: {
          tools: {},
          resources: { subscribe: true }
        }
      });

      // Connect to server
      await this.client.connect(this.transport);
      this.connected = true;

      console.log('[MCP] Connected to server');

      // Subscribe to resource updates
      await this.subscribeToChanges();

    } catch (error) {
      console.error('[MCP] Connection failed:', error);
      vscode.window.showWarningMessage(
        'Paired Comments: MCP server unavailable. Extension will work in local-only mode.'
      );
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.transport = null;
      this.connected = false;
      console.log('[MCP] Disconnected from server');
    }
  }

  /**
   * Check if connected to MCP server
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Add comment via MCP server
   */
  async addComment(params: {
    filePath: string;
    line: number;
    text: string;
    tag: string;
    author: string;
  }): Promise<{ commentId: string; ghostMarkerId: string }> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'add_comment',
      arguments: params
    });

    // Parse result from MCP response
    const data = this.parseToolResult(result);
    return {
      commentId: data.commentId,
      ghostMarkerId: data.ghostMarkerId
    };
  }

  /**
   * Edit comment via MCP server
   */
  async editComment(params: {
    filePath: string;
    commentId: string;
    text: string;
  }): Promise<void> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    await this.client.callTool({
      name: 'edit_comment',
      arguments: params
    });
  }

  /**
   * Delete comment via MCP server
   */
  async deleteComment(params: {
    filePath: string;
    commentId: string;
  }): Promise<void> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    await this.client.callTool({
      name: 'delete_comment',
      arguments: params
    });
  }

  /**
   * Get all comments for a file
   */
  async getFileComments(filePath: string): Promise<CommentFile> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    const resource = await this.client.readResource({
      uri: `comment://workspace/${filePath}.comments`
    });

    return JSON.parse(resource.contents[0].text);
  }

  /**
   * Search comments across workspace
   */
  async searchComments(params: {
    query: string;
    filters?: any;
    limit?: number;
  }): Promise<any[]> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    const result = await this.client.callTool({
      name: 'search_comments',
      arguments: params
    });

    return this.parseToolResult(result);
  }

  /**
   * Subscribe to resource changes (for real-time sync)
   */
  private async subscribeToChanges(): Promise<void> {
    if (!this.client) return;

    // Subscribe to all comment files in workspace
    await this.client.subscribeResource({
      uri: 'comment://workspace/all'
    });

    // Listen for update notifications
    this.client.setNotificationHandler({
      async handleNotification(notification) {
        if (notification.method === 'notifications/resources/updated') {
          const uri = notification.params.uri;
          console.log('[MCP] Resource updated:', uri);
          // Trigger sync in extension
          vscode.commands.executeCommand('pairedComments.syncFromMCP', uri);
        }
      }
    });
  }

  /**
   * Parse tool call result from MCP response
   */
  private parseToolResult(result: any): any {
    // MCP returns results in content blocks
    const textContent = result.content.find((c: any) => c.type === 'text');
    if (textContent) {
      // Try to parse as JSON, fallback to raw text
      try {
        return JSON.parse(textContent.text);
      } catch {
        return textContent.text;
      }
    }
    return null;
  }
}
```

### 3. Activate MCP Client in Extension

Update `src/extension.ts`:

```typescript
import { MCPClientAdapter } from './mcp/MCPClientAdapter';

let mcpClient: MCPClientAdapter | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('[Extension] Activating Paired Comments v2.2.0');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  // Initialize existing components
  const commentManager = new CommentManager(workspaceRoot);
  const ghostMarkerManager = new GhostMarkerManager();
  const astAnchor = new ASTAnchor();

  // NEW: Initialize MCP client (optional feature)
  const mcpEnabled = vscode.workspace
    .getConfiguration('pairedComments')
    .get<boolean>('enableMCP', false);

  if (mcpEnabled) {
    mcpClient = new MCPClientAdapter(workspaceRoot);
    await mcpClient.connect();

    // Wire up MCP sync
    setupMCPSync(mcpClient, commentManager);
  }

  // ... rest of activation logic
}

export async function deactivate() {
  // Disconnect MCP client
  if (mcpClient) {
    await mcpClient.disconnect();
  }
}

function setupMCPSync(
  mcpClient: MCPClientAdapter,
  commentManager: CommentManager
) {
  // When comment is added locally, sync to MCP server
  commentManager.on('comment:added', async (data) => {
    if (mcpClient.isConnected()) {
      try {
        await mcpClient.addComment({
          filePath: data.filePath,
          line: data.line,
          text: data.text,
          tag: data.tag,
          author: 'user'
        });
      } catch (error) {
        console.error('[MCP] Failed to sync comment:', error);
      }
    }
  });

  // Similar handlers for edit, delete
  // ...
}
```

---

## Bi-Directional Sync

### Sync Flow: Extension → MCP Server

```
User adds comment in VS Code
         │
         ▼
CommentManager.addComment()
         │
         ├──→ Save to .comments file (existing)
         │
         └──→ MCPClientAdapter.addComment()
                  │
                  ▼
              MCP Server
                  │
                  ├──→ Update .comments file
                  │
                  └──→ Emit event to other clients (Claude, GPT)
```

### Sync Flow: MCP Server → Extension

```
Claude adds comment via MCP
         │
         ▼
    MCP Server
         │
         ├──→ Update .comments file
         │
         └──→ Send notification to VS Code extension
                  │
                  ▼
     MCPClientAdapter receives notification
                  │
                  ▼
     CommentManager.loadComments()
                  │
                  ▼
     DecorationManager.refresh()
                  │
                  ▼
     Gutter icons update in editor
```

### Implementing Sync Manager

Create `src/mcp/SyncManager.ts`:

```typescript
import { MCPClientAdapter } from './MCPClientAdapter';
import { CommentManager } from '../core/CommentManager';
import { debounce } from '../utils/debounce';

export class SyncManager {
  private syncInProgress = false;
  private pendingChanges: Map<string, any> = new Map();

  constructor(
    private mcpClient: MCPClientAdapter,
    private commentManager: CommentManager
  ) {
    this.setupExtensionToMCPSync();
    this.setupMCPToExtensionSync();
  }

  /**
   * Sync changes from extension to MCP server
   */
  private setupExtensionToMCPSync(): void {
    // Debounce to avoid spamming server
    const debouncedSync = debounce(async (filePath: string) => {
      if (!this.mcpClient.isConnected()) return;

      try {
        const commentFile = await this.commentManager.getComments(filePath);

        // TODO: Implement diff-based sync (only send changes)
        // For now, we sync via individual tool calls

      } catch (error) {
        console.error('[Sync] Extension→MCP failed:', error);
      }
    }, 500);

    // Listen to local changes
    this.commentManager.on('comment:added', async (data) => {
      await this.syncCommentToMCP('add', data);
    });

    this.commentManager.on('comment:updated', async (data) => {
      await this.syncCommentToMCP('edit', data);
    });

    this.commentManager.on('comment:deleted', async (data) => {
      await this.syncCommentToMCP('delete', data);
    });
  }

  /**
   * Sync changes from MCP server to extension
   */
  private setupMCPToExtensionSync(): void {
    // Register command to handle MCP notifications
    vscode.commands.registerCommand(
      'pairedComments.syncFromMCP',
      async (uri: string) => {
        const filePath = this.parseFilePathFromURI(uri);
        await this.syncFromMCP(filePath);
      }
    );
  }

  /**
   * Sync comment operation to MCP server
   */
  private async syncCommentToMCP(
    operation: 'add' | 'edit' | 'delete',
    data: any
  ): Promise<void> {
    if (!this.mcpClient.isConnected()) return;
    if (this.syncInProgress) {
      // Queue for later
      this.pendingChanges.set(data.commentId, { operation, data });
      return;
    }

    try {
      this.syncInProgress = true;

      switch (operation) {
        case 'add':
          await this.mcpClient.addComment(data);
          break;
        case 'edit':
          await this.mcpClient.editComment(data);
          break;
        case 'delete':
          await this.mcpClient.deleteComment(data);
          break;
      }

      console.log(`[Sync] ${operation} synced to MCP`);

    } catch (error) {
      console.error(`[Sync] Failed to sync ${operation}:`, error);
    } finally {
      this.syncInProgress = false;
      await this.processPendingChanges();
    }
  }

  /**
   * Sync comments from MCP server to extension
   */
  private async syncFromMCP(filePath: string): Promise<void> {
    try {
      const commentFile = await this.mcpClient.getFileComments(filePath);

      // Update local comment manager
      await this.commentManager.loadComments(filePath, commentFile);

      // Refresh UI
      vscode.commands.executeCommand('pairedComments.refresh');

      console.log(`[Sync] MCP→Extension complete for ${filePath}`);

    } catch (error) {
      console.error('[Sync] MCP→Extension failed:', error);
    }
  }

  /**
   * Process queued changes
   */
  private async processPendingChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) return;

    const changes = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();

    for (const change of changes) {
      await this.syncCommentToMCP(change.operation, change.data);
    }
  }

  /**
   * Parse file path from MCP resource URI
   */
  private parseFilePathFromURI(uri: string): string {
    // comment://workspace/src/app.ts.comments → src/app.ts
    return uri
      .replace('comment://workspace/', '')
      .replace('.comments', '');
  }
}
```

---

## Event Hooks

### Extension Events

```typescript
// Existing events in CommentManager
commentManager.on('comment:added', (data) => {
  // data: { filePath, commentId, comment, ghostMarker }
});

commentManager.on('comment:updated', (data) => {
  // data: { filePath, commentId, newText }
});

commentManager.on('comment:deleted', (data) => {
  // data: { filePath, commentId }
});

commentManager.on('file:changed', (data) => {
  // data: { filePath, changeType }
});
```

### MCP Server Events (via Notifications)

```typescript
// Notifications from MCP server
mcpClient.on('notification', (notification) => {
  switch (notification.method) {
    case 'notifications/resources/updated':
      // MCP server notifies extension of changes
      handleResourceUpdated(notification.params.uri);
      break;

    case 'notifications/tools/list_changed':
      // MCP server added new tools
      refreshToolsList();
      break;
  }
});
```

---

## Configuration

### Extension Settings (package.json)

Add MCP configuration options:

```json
{
  "contributes": {
    "configuration": {
      "title": "Paired Comments",
      "properties": {
        "pairedComments.enableMCP": {
          "type": "boolean",
          "default": false,
          "description": "Enable MCP server integration for AI-assisted commenting"
        },
        "pairedComments.mcp.serverCommand": {
          "type": "string",
          "default": "npx",
          "description": "Command to start MCP server"
        },
        "pairedComments.mcp.serverArgs": {
          "type": "array",
          "default": ["-y", "@paired-comments/mcp-server"],
          "description": "Arguments for MCP server command"
        },
        "pairedComments.mcp.autoSync": {
          "type": "boolean",
          "default": true,
          "description": "Automatically sync comments with MCP server"
        },
        "pairedComments.mcp.syncDebounce": {
          "type": "number",
          "default": 500,
          "description": "Debounce delay (ms) for syncing changes"
        }
      }
    }
  }
}
```

### User Configuration Example

In `.vscode/settings.json`:

```json
{
  "pairedComments.enableMCP": true,
  "pairedComments.mcp.serverCommand": "node",
  "pairedComments.mcp.serverArgs": [
    "/path/to/mcp-server/dist/server.js"
  ],
  "pairedComments.mcp.autoSync": true
}
```

---

## Testing Strategy

### Unit Tests

Test MCP client adapter in isolation:

```typescript
// test/unit/MCPClientAdapter.test.ts
import { MCPClientAdapter } from '../../src/mcp/MCPClientAdapter';

describe('MCPClientAdapter', () => {
  let adapter: MCPClientAdapter;

  beforeEach(() => {
    adapter = new MCPClientAdapter('/workspace');
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  it('should connect to MCP server', async () => {
    await adapter.connect();
    expect(adapter.isConnected()).toBe(true);
  });

  it('should add comment via MCP', async () => {
    await adapter.connect();

    const result = await adapter.addComment({
      filePath: 'src/app.ts',
      line: 42,
      text: 'TODO: Test comment',
      tag: 'TODO',
      author: 'test'
    });

    expect(result.commentId).toMatch(/^c_\d+$/);
    expect(result.ghostMarkerId).toMatch(/^gm_\d+$/);
  });

  it('should handle server unavailable gracefully', async () => {
    // Mock unavailable server
    jest.spyOn(adapter as any, 'connect').mockRejectedValue(
      new Error('Connection refused')
    );

    await adapter.connect();
    expect(adapter.isConnected()).toBe(false);
  });
});
```

### Integration Tests

Test bi-directional sync:

```typescript
// test/integration/MCPSync.test.ts
describe('MCP Sync', () => {
  it('should sync comment from extension to MCP', async () => {
    // 1. Add comment in extension
    const commentId = await commentManager.addComment({
      filePath: 'src/app.ts',
      line: 42,
      text: 'TODO: Integration test',
      tag: 'TODO'
    });

    // 2. Wait for sync
    await sleep(600); // Debounce delay

    // 3. Verify comment exists in MCP server
    const commentFile = await mcpClient.getFileComments('src/app.ts');
    const comment = commentFile.comments.find(c => c.id === commentId);

    expect(comment).toBeDefined();
    expect(comment.text).toBe('TODO: Integration test');
  });

  it('should sync comment from MCP to extension', async () => {
    // 1. Add comment via MCP
    const result = await mcpClient.addComment({
      filePath: 'src/app.ts',
      line: 50,
      text: 'FIXME: From MCP',
      tag: 'FIXME',
      author: 'claude'
    });

    // 2. Trigger sync notification
    await vscode.commands.executeCommand(
      'pairedComments.syncFromMCP',
      'comment://workspace/src/app.ts.comments'
    );

    // 3. Verify comment exists in extension
    const comments = await commentManager.getComments('src/app.ts');
    const comment = comments.comments.find(c => c.id === result.commentId);

    expect(comment).toBeDefined();
    expect(comment.text).toBe('FIXME: From MCP');
  });
});
```

### E2E Tests with Claude Desktop

```typescript
// test/e2e/ClaudeIntegration.test.ts
describe('Claude Desktop Integration', () => {
  it('should allow Claude to add comments via MCP', async () => {
    // This test requires Claude Desktop with MCP server configured

    // 1. Send prompt to Claude (via MCP Inspector or API)
    const prompt = 'Add a TODO comment at line 42 in src/app.ts';

    // 2. Claude calls add_comment tool
    // (Simulated here, in real test would use Claude API)
    const result = await mcpClient.addComment({
      filePath: 'src/app.ts',
      line: 42,
      text: 'TODO: Added by Claude',
      tag: 'TODO',
      author: 'claude'
    });

    // 3. Verify comment appears in VS Code
    await sleep(1000); // Wait for sync
    const editor = await vscode.window.showTextDocument(
      vscode.Uri.file('/workspace/src/app.ts')
    );

    // Check for gutter icon decoration
    const decorations = editor.visibleRanges;
    expect(decorations).toBeDefined();
  });
});
```

---

## Next Steps

1. ✅ Integration guide complete
2. ⏭️ Implement MCP client adapter (Phase 3)
3. ⏭️ Add comprehensive tests
4. ⏭️ Deploy and package MCP server

---

**Status:** Planning Complete
**Next:** Deployment Documentation
