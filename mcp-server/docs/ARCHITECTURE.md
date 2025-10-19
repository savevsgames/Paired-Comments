# MCP Server Architecture

**Version:** 0.1.0
**Status:** 📋 Planning Phase
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Communication Patterns](#communication-patterns)
3. [Data Flow](#data-flow)
4. [Component Design](#component-design)
5. [State Management](#state-management)
6. [Event System](#event-system)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ VS Code Ext   │  │ Claude Desktop│  │  GPT (API)    │   │
│  │  (MCP Client) │  │  (MCP Client) │  │  (MCP Client) │   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘   │
└──────────┼──────────────────┼──────────────────┼───────────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                   JSON-RPC over stdio/HTTP
                              │
┌──────────────────────────────▼──────────────────────────────┐
│                    MCP Server Core                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Protocol Layer                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │ Request  │  │ Response │  │  Error   │         │    │
│  │  │ Handler  │  │ Builder  │  │ Handler  │         │    │
│  │  └──────────┘  └──────────┘  └──────────┘         │    │
│  └────────────────────────────────────────────────────┘    │
│                              │                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Service Layer (Business Logic)            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │ Comment  │  │ Search   │  │ Export   │         │    │
│  │  │ Service  │  │ Service  │  │ Service  │         │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │    │
│  │       │             │             │                 │    │
│  │  ┌────┴─────────────┴─────────────┴─────┐         │    │
│  │  │         Event Bus (Pub/Sub)           │         │    │
│  │  └────┬─────────────┬─────────────┬──────┘         │    │
│  └───────┼─────────────┼─────────────┼────────────────┘    │
│          │             │             │                      │
│  ┌───────▼─────────────▼─────────────▼────────────────┐    │
│  │         Data Access Layer                           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │   File   │  │   AST    │  │  Cache   │         │    │
│  │  │  System  │  │  Parser  │  │  Manager │         │    │
│  │  └──────────┘  └──────────┘  └──────────┘         │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                   Storage Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ .comments    │  │ Source Code  │  │  Cache DB    │       │
│  │   Files      │  │   Files      │  │  (Redis?)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns** - Clear boundaries between protocol, business logic, and data access
2. **Stateless Operations** - Each request is independent (state managed in .comments files)
3. **Event-Driven** - Async communication via event bus for real-time sync
4. **Type Safety** - Full TypeScript with strict mode
5. **Testability** - Dependency injection for all services
6. **Extensibility** - Plugin architecture for new export formats, search algorithms

---

## Communication Patterns

### 1. JSON-RPC Protocol

The MCP server uses JSON-RPC 2.0 for all client-server communication:

```typescript
// Request Format
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "add_comment",
    "arguments": {
      "filePath": "src/app.ts",
      "line": 42,
      "text": "TODO: Refactor this function",
      "tag": "TODO",
      "author": "claude"
    }
  }
}

// Success Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "commentId": "c_1730000000000",
    "ghostMarkerId": "gm_1730000000001",
    "message": "Comment added successfully"
  }
}

// Error Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params: filePath is required",
    "data": {
      "field": "filePath",
      "expected": "string"
    }
  }
}
```

### 2. Transport Layers

#### stdio (Default for Claude Desktop)
```typescript
process.stdin.on('data', (chunk) => {
  const message = JSON.parse(chunk.toString());
  handleRequest(message);
});

function sendResponse(response: JSONRPCResponse) {
  process.stdout.write(JSON.stringify(response) + '\n');
}
```

#### HTTP/WebSocket (Future for VS Code Extension)
```typescript
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/jsonrpc') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const message = JSON.parse(body);
      const response = handleRequest(message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    });
  }
});
```

### 3. Request Lifecycle

```
Client Request → Protocol Handler → Service Layer → Data Access → Storage
                                                                       │
Client Response ← Protocol Handler ← Service Layer ← Data Access ← ───┘
                       │
                   Event Bus (async)
                       │
                       ├──→ VS Code Extension (sync UI)
                       ├──→ Cache Invalidation
                       └──→ Search Index Update
```

---

## Data Flow

### Comment Creation Flow

```
┌─────────┐     add_comment()      ┌─────────────┐
│ Claude  │──────────────────────→ │   MCP       │
│ Desktop │                         │   Server    │
└─────────┘                         └──────┬──────┘
                                           │
                                           │ 1. Validate params
                                           │
                                    ┌──────▼──────┐
                                    │  Comment    │
                                    │  Service    │
                                    └──────┬──────┘
                                           │
                                           │ 2. Generate IDs
                                           │    (commentId, ghostMarkerId)
                                           │
                                    ┌──────▼──────┐
                                    │     AST     │
                                    │   Parser    │
                                    └──────┬──────┘
                                           │
                                           │ 3. Resolve symbol anchor
                                           │    (function/class name)
                                           │
                                    ┌──────▼──────┐
                                    │    File     │
                                    │   System    │
                                    └──────┬──────┘
                                           │
                                           │ 4. Read .comments file
                                           │ 5. Append new comment
                                           │ 6. Write back to disk
                                           │
                                    ┌──────▼──────┐
                                    │  Event Bus  │
                                    └──────┬──────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
                ┌───────▼───────┐  ┌───────▼───────┐  ┌──────▼──────┐
                │   VS Code     │  │ Search Index  │  │    Cache    │
                │  Extension    │  │    Update     │  │ Invalidate  │
                └───────────────┘  └───────────────┘  └─────────────┘
```

### Comment Search Flow

```
┌─────────┐  search_comments()     ┌─────────────┐
│  Claude │──────────────────────→ │   MCP       │
│ Desktop │  {query: "TODO",        │   Server    │
└─────────┘   filters: {tag}}       └──────┬──────┘
                                           │
                                    ┌──────▼──────┐
                                    │   Search    │
                                    │   Service   │
                                    └──────┬──────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                ┌───────▼───────┐                    ┌────────▼────────┐
                │ Check Cache   │                    │  Full Scan      │
                │ (Fast Path)   │                    │  (Slow Path)    │
                └───────┬───────┘                    └────────┬────────┘
                        │                                     │
                   Cache Hit?                            Cache Miss
                        │                                     │
                        └──────────────┬──────────────────────┘
                                       │
                                ┌──────▼──────┐
                                │  Relevance  │
                                │   Scoring   │
                                └──────┬──────┘
                                       │
                                ┌──────▼──────┐
                                │   Return    │
                                │  Results    │
                                └─────────────┘
```

---

## Component Design

### Core Services

#### 1. CommentService
**Responsibility:** CRUD operations for comments

```typescript
interface CommentService {
  // Create
  addComment(params: AddCommentParams): Promise<CommentResult>;

  // Read
  getComment(filePath: string, commentId: string): Promise<Comment | null>;
  getFileComments(filePath: string): Promise<CommentFile>;

  // Update
  editComment(filePath: string, commentId: string, text: string): Promise<void>;
  moveComment(params: MoveCommentParams): Promise<void>;

  // Delete
  deleteComment(filePath: string, commentId: string): Promise<void>;
}

class CommentServiceImpl implements CommentService {
  constructor(
    private fileSystem: FileSystemManager,
    private astParser: ASTParser,
    private eventBus: EventBus
  ) {}

  async addComment(params: AddCommentParams): Promise<CommentResult> {
    // 1. Generate IDs
    const commentId = `c_${Date.now()}`;
    const ghostMarkerId = `gm_${Date.now() + 1}`;

    // 2. Parse AST to find symbol anchor
    const anchor = await this.astParser.findSymbolAtLine(
      params.filePath,
      params.line
    );

    // 3. Create comment object
    const comment: Comment = {
      id: commentId,
      text: params.text,
      tag: params.tag,
      author: params.author,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    // 4. Create ghost marker
    const ghostMarker: GhostMarker = {
      id: ghostMarkerId,
      commentId,
      line: params.line,
      anchor: anchor?.name,
      anchorType: anchor?.type,
    };

    // 5. Save to file
    await this.fileSystem.addComment(params.filePath, comment, ghostMarker);

    // 6. Emit event for real-time sync
    this.eventBus.emit('comment:added', {
      filePath: params.filePath,
      comment,
      ghostMarker,
    });

    return { commentId, ghostMarkerId };
  }
}
```

#### 2. SearchService
**Responsibility:** Multi-field search with relevance scoring

```typescript
interface SearchService {
  search(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  indexComments(filePath: string): Promise<void>;
}

interface SearchFilters {
  tag?: CommentTag;
  author?: string;
  dateRange?: { start: string; end: string };
  filePath?: string;
  hasAIMetadata?: boolean;
}

class SearchServiceImpl implements SearchService {
  constructor(
    private fileSystem: FileSystemManager,
    private cacheManager: CacheManager
  ) {}

  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    // 1. Check cache
    const cacheKey = this.getCacheKey(query, filters);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // 2. Scan all .comments files
    const allFiles = await this.fileSystem.getAllCommentFiles();

    // 3. Filter and score
    const results = allFiles
      .flatMap(file => this.scoreComments(file, query, filters))
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Top 100 results

    // 4. Cache results
    await this.cacheManager.set(cacheKey, results, 60); // 60s TTL

    return results;
  }

  private scoreComments(
    file: CommentFile,
    query: string,
    filters?: SearchFilters
  ): SearchResult[] {
    // TF-IDF scoring algorithm
    // ...
  }
}
```

#### 3. ExportService
**Responsibility:** Export comments to various formats

```typescript
interface ExportService {
  exportAsJSON(filePath?: string): Promise<string>;
  exportAsMarkdown(filePath?: string): Promise<string>;
  exportAsTrainingData(format: 'jsonl' | 'parquet'): Promise<Buffer>;
}

class ExportServiceImpl implements ExportService {
  async exportAsTrainingData(format: 'jsonl'): Promise<Buffer> {
    const allFiles = await this.fileSystem.getAllCommentFiles();

    const trainingExamples = allFiles.flatMap(file => {
      return file.comments.map(comment => ({
        prompt: `Analyze this code:\n${this.getSourceContext(file, comment)}`,
        completion: comment.text,
        metadata: {
          tag: comment.tag,
          author: comment.author,
          aiMeta: comment.aiMeta,
        },
      }));
    });

    // Convert to JSONL (one JSON object per line)
    const jsonl = trainingExamples
      .map(ex => JSON.stringify(ex))
      .join('\n');

    return Buffer.from(jsonl);
  }
}
```

---

## State Management

### Stateless Server Design

The MCP server is **stateless** - all persistent state lives in `.comments` files on disk.

```typescript
// ❌ BAD: Server maintains state
class BadCommentService {
  private comments = new Map<string, Comment[]>(); // In-memory state

  async addComment(params: AddCommentParams) {
    this.comments.set(params.filePath, [...]); // State in RAM
  }
}

// ✅ GOOD: Filesystem is source of truth
class GoodCommentService {
  async addComment(params: AddCommentParams) {
    const file = await fs.readFile(`${params.filePath}.comments`);
    const data = JSON.parse(file);
    data.comments.push(newComment);
    await fs.writeFile(`${params.filePath}.comments`, JSON.stringify(data));
  }
}
```

### Caching Strategy

```typescript
interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}

// Cache invalidation on file changes
eventBus.on('comment:added', ({ filePath }) => {
  cacheManager.invalidate(`search:*`); // Invalidate all searches
  cacheManager.invalidate(`file:${filePath}`); // Invalidate file cache
});
```

---

## Event System

### Event Bus Architecture

```typescript
type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface EventBus {
  on<T>(event: string, handler: EventHandler<T>): void;
  off<T>(event: string, handler: EventHandler<T>): void;
  emit<T>(event: string, data: T): Promise<void>;
}

class EventBusImpl implements EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  async emit<T>(event: string, data: T): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Run handlers in parallel
    await Promise.all(
      Array.from(handlers).map(handler => handler(data))
    );
  }
}
```

### Event Types

```typescript
// Comment events
'comment:added' → { filePath, comment, ghostMarker }
'comment:updated' → { filePath, commentId, newText }
'comment:deleted' → { filePath, commentId }
'comment:moved' → { sourceFile, targetFile, commentId }

// File events
'file:changed' → { filePath, changeType: 'modified' | 'deleted' | 'renamed' }
'file:indexed' → { filePath, commentCount }

// Sync events (for VS Code extension)
'sync:request' → { filePath }
'sync:response' → { filePath, commentFile }
```

---

## Security Considerations

### 1. File System Access Control

```typescript
class FileSystemManager {
  constructor(private workspaceRoot: string) {}

  private validatePath(filePath: string): void {
    const resolved = path.resolve(this.workspaceRoot, filePath);

    // Prevent directory traversal attacks
    if (!resolved.startsWith(this.workspaceRoot)) {
      throw new Error('Access denied: Path outside workspace');
    }

    // Prevent access to sensitive files
    const forbidden = ['.env', '.git', 'node_modules'];
    if (forbidden.some(dir => resolved.includes(dir))) {
      throw new Error('Access denied: Forbidden path');
    }
  }

  async readFile(filePath: string): Promise<string> {
    this.validatePath(filePath);
    return fs.readFile(path.join(this.workspaceRoot, filePath), 'utf-8');
  }
}
```

### 2. Input Validation

```typescript
import { z } from 'zod';

const AddCommentSchema = z.object({
  filePath: z.string().min(1).max(500),
  line: z.number().int().positive(),
  text: z.string().min(1).max(10000),
  tag: z.enum(['TODO', 'FIXME', 'NOTE', 'STAR', 'QUESTION']),
  author: z.string().min(1).max(100),
});

function validateAddComment(params: unknown): AddCommentParams {
  return AddCommentSchema.parse(params); // Throws if invalid
}
```

### 3. Rate Limiting (Future)

```typescript
class RateLimiter {
  private requests = new Map<string, number[]>();

  async checkLimit(clientId: string, limit: number, window: number): Promise<void> {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];

    // Remove old timestamps outside window
    const recent = timestamps.filter(ts => now - ts < window);

    if (recent.length >= limit) {
      throw new Error('Rate limit exceeded');
    }

    recent.push(now);
    this.requests.set(clientId, recent);
  }
}
```

---

## Performance Optimization

### 1. Lazy Loading

```typescript
class ASTParser {
  private cache = new Map<string, AST>();

  async parse(filePath: string): Promise<AST> {
    // Only parse if not cached
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    const source = await fs.readFile(filePath, 'utf-8');
    const ast = await this.parseSource(source);
    this.cache.set(filePath, ast);

    return ast;
  }
}
```

### 2. Batch Operations

```typescript
interface BatchOperation {
  type: 'add' | 'edit' | 'delete';
  params: any;
}

async function executeBatch(operations: BatchOperation[]): Promise<void> {
  // Group operations by file
  const byFile = groupBy(operations, op => op.params.filePath);

  // Process each file once (avoid multiple reads/writes)
  for (const [filePath, ops] of byFile) {
    const file = await readCommentFile(filePath);

    for (const op of ops) {
      switch (op.type) {
        case 'add': file.comments.push(op.params); break;
        case 'edit': /* ... */; break;
        case 'delete': /* ... */; break;
      }
    }

    await writeCommentFile(filePath, file);
  }
}
```

### 3. Streaming Large Exports

```typescript
import { Readable } from 'stream';

async function exportAsJSONLStream(): Promise<Readable> {
  const stream = new Readable({ objectMode: true });

  // Stream results instead of loading all into memory
  const files = await getAllCommentFiles();

  for (const file of files) {
    for (const comment of file.comments) {
      stream.push(JSON.stringify(comment) + '\n');
    }
  }

  stream.push(null); // End stream
  return stream;
}
```

---

## Next Steps

1. ✅ Architecture defined
2. ⏭️ Implement protocol layer ([PROTOCOL_SPEC.md](./PROTOCOL_SPEC.md))
3. ⏭️ Implement service layer
4. ⏭️ Add comprehensive tests
5. ⏭️ Performance benchmarking

---

**Status:** Planning Complete
**Next:** Protocol Specification
