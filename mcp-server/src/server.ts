#!/usr/bin/env node

/**
 * Paired Comments MCP Server
 * Model Context Protocol server for AI-accessible code annotation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Core
import { FileSystemManager } from './core/FileSystemManager.js';
import { ASTParser } from './core/ASTParser.js';
import { EventBusImpl } from './core/EventBus.js';

// Services
import { CommentService } from './services/CommentService.js';
import { SearchService } from './services/SearchService.js';
import { ExportService } from './services/ExportService.js';

// Protocol
import { ToolsHandler } from './protocol/tools.js';
import { ResourcesHandler } from './protocol/resources.js';


/**
 * Main server class
 */
class PairedCommentsMCPServer {
  private server: Server;
  private workspaceRoot: string;
  private toolsHandler: ToolsHandler;
  private resourcesHandler: ResourcesHandler;

  constructor() {
    // Get workspace path from environment or use current directory
    this.workspaceRoot = process.env.WORKSPACE_PATH || process.cwd();

    console.error(`[MCP Server] Workspace root: ${this.workspaceRoot}`);

    // Initialize core components
    const fileSystem = new FileSystemManager(this.workspaceRoot);
    const astParser = new ASTParser();
    const eventBus = new EventBusImpl();

    // Initialize services
    const commentService = new CommentService(fileSystem, astParser, eventBus);
    const searchService = new SearchService(fileSystem);
    const exportService = new ExportService(fileSystem, astParser);

    // Initialize protocol handlers
    this.toolsHandler = new ToolsHandler(commentService, searchService, exportService);
    this.resourcesHandler = new ResourcesHandler(fileSystem, searchService);

    // Create MCP server
    this.server = new Server(
      {
        name: 'paired-comments-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add_comment',
            description: 'Add a new paired comment to a source file at a specific line',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Relative path to source file from workspace root'
                },
                line: {
                  type: 'integer',
                  description: 'Line number where comment should be added (1-indexed)',
                  minimum: 1
                },
                text: {
                  type: 'string',
                  description: 'Comment text content'
                },
                tag: {
                  type: 'string',
                  enum: ['TODO', 'FIXME', 'NOTE', 'STAR', 'QUESTION'],
                  description: 'Comment tag category'
                },
                author: {
                  type: 'string',
                  description: 'Author name (e.g., "claude", "gpt-4", "user")',
                  default: 'ai'
                },
                aiMeta: {
                  type: 'object',
                  description: 'Optional AI metadata',
                  properties: {
                    model: { type: 'string' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    reasoning: { type: 'string' }
                  }
                }
              },
              required: ['filePath', 'line', 'text', 'tag']
            }
          },
          {
            name: 'edit_comment',
            description: 'Edit the text content of an existing comment',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: { type: 'string' },
                commentId: { type: 'string', pattern: '^c_\\d+$' },
                text: { type: 'string' }
              },
              required: ['filePath', 'commentId', 'text']
            }
          },
          {
            name: 'delete_comment',
            description: 'Delete a comment and its associated ghost marker',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: { type: 'string' },
                commentId: { type: 'string', pattern: '^c_\\d+$' }
              },
              required: ['filePath', 'commentId']
            }
          },
          {
            name: 'search_comments',
            description: 'Search comments by text query with optional filters',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                filters: {
                  type: 'object',
                  properties: {
                    tag: { type: 'string', enum: ['TODO', 'FIXME', 'NOTE', 'STAR', 'QUESTION'] },
                    author: { type: 'string' },
                    filePath: { type: 'string' },
                    hasAIMetadata: { type: 'boolean' }
                  }
                },
                limit: { type: 'integer', default: 100, maximum: 1000 }
              },
              required: ['query']
            }
          },
          {
            name: 'get_file_comments',
            description: 'Retrieve all comments and ghost markers for a file',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: { type: 'string' },
                includeOrphaned: { type: 'boolean', default: true }
              },
              required: ['filePath']
            }
          },
          {
            name: 'move_comment',
            description: 'Move a comment to a different file or line',
            inputSchema: {
              type: 'object',
              properties: {
                sourceFile: { type: 'string' },
                targetFile: { type: 'string' },
                commentId: { type: 'string', pattern: '^c_\\d+$' },
                targetLine: { type: 'integer', minimum: 1 }
              },
              required: ['sourceFile', 'targetFile', 'commentId', 'targetLine']
            }
          },
          {
            name: 'export_comments',
            description: 'Export comments as JSON, Markdown, or AI training data',
            inputSchema: {
              type: 'object',
              properties: {
                format: { type: 'string', enum: ['json', 'markdown', 'jsonl'] },
                filePath: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    includeSourceContext: { type: 'boolean' },
                    contextLines: { type: 'integer', minimum: 0, maximum: 20, default: 3 }
                  }
                }
              },
              required: ['format']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.error(`[MCP Server] Tool call: ${name}`);

      switch (name) {
        case 'add_comment':
          return await this.toolsHandler.handleAddComment(args);
        case 'edit_comment':
          return await this.toolsHandler.handleEditComment(args);
        case 'delete_comment':
          return await this.toolsHandler.handleDeleteComment(args);
        case 'search_comments':
          return await this.toolsHandler.handleSearchComments(args);
        case 'get_file_comments':
          return await this.toolsHandler.handleGetFileComments(args);
        case 'move_comment':
          return await this.toolsHandler.handleMoveComment(args);
        case 'export_comments':
          return await this.toolsHandler.handleExportComments(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.resourcesHandler.listResources();
      return { resources };
    });

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      console.error(`[MCP Server] Resource read: ${uri}`);

      const contents = await this.resourcesHandler.readResource(uri);
      return { contents: [contents] };
    });
  }


  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('[MCP Server] Started successfully');
    console.error('[MCP Server] Listening on stdio...');
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new PairedCommentsMCPServer();
    await server.start();
  } catch (error) {
    console.error('[MCP Server] Fatal error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('[MCP Server] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[MCP Server] Shutting down...');
  process.exit(0);
});

// Start server
main();
