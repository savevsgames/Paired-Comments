# MCP API Reference

**Version:** 0.1.0
**Status:** 📋 Planning Phase
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [TypeScript Type Definitions](#typescript-type-definitions)
2. [Tools API](#tools-api)
3. [Resources API](#resources-api)
4. [Prompts API](#prompts-api)
5. [Code Examples](#code-examples)

---

## TypeScript Type Definitions

### Core Types

```typescript
// Comment Tag Types
type CommentTag = 'TODO' | 'FIXME' | 'NOTE' | 'STAR' | 'QUESTION';

// Comment Interface
interface Comment {
  id: string;                    // Format: "c_{timestamp}"
  text: string;                  // Comment content
  tag: CommentTag;               // Tag category
  author: string;                // Author name
  created: string;               // ISO 8601 timestamp
  updated: string;               // ISO 8601 timestamp
  aiMeta?: AIMetadata;           // Optional AI metadata
  params?: ParamMetadata[];      // Optional params documentation
}

// AI Metadata
interface AIMetadata {
  model: string;                 // e.g., "claude-sonnet-4.5"
  confidence: number;            // 0.0 - 1.0
  reasoning?: string;            // Why AI suggested this comment
  enrichedAt: string;            // ISO 8601 timestamp
}

// Parameter Metadata (for functions)
interface ParamMetadata {
  name: string;                  // Parameter name
  type?: string;                 // Inferred or explicit type
  description?: string;          // Parameter description
  example?: string;              // Example value
}

// Ghost Marker (Anchor)
interface GhostMarker {
  id: string;                    // Format: "gm_{timestamp}"
  commentId: string;             // Associated comment ID
  line: number;                  // Current line number
  anchor?: string;               // Symbol name (function/class/variable)
  anchorType?: AnchorType;       // Type of symbol
  originalLine: number;          // Line when comment was created
  isOrphaned?: boolean;          // True if anchor no longer exists
}

type AnchorType =
  | 'function'
  | 'class'
  | 'method'
  | 'variable'
  | 'interface'
  | 'type'
  | 'import';

// Comment File (Stored as .comments)
interface CommentFile {
  version: string;               // Schema version (e.g., "2.1.0")
  filePath: string;              // Source file path
  comments: Comment[];           // Array of comments
  ghostMarkers: GhostMarker[];   // Array of ghost markers
  metadata?: FileMetadata;       // Optional file metadata
}

interface FileMetadata {
  language?: string;             // Source language (ts, js, py, etc.)
  lastSync?: string;             // Last sync timestamp
  totalComments?: number;        // Comment count
}
```

### Tool Parameter Types

```typescript
// add_comment parameters
interface AddCommentParams {
  filePath: string;
  line: number;
  text: string;
  tag: CommentTag;
  author?: string;
  aiMeta?: AIMetadata;
}

interface AddCommentResult {
  commentId: string;
  ghostMarkerId: string;
  message: string;
}

// edit_comment parameters
interface EditCommentParams {
  filePath: string;
  commentId: string;
  text: string;
}

// delete_comment parameters
interface DeleteCommentParams {
  filePath: string;
  commentId: string;
}

// search_comments parameters
interface SearchCommentParams {
  query: string;
  filters?: SearchFilters;
  limit?: number;
}

interface SearchFilters {
  tag?: CommentTag;
  author?: string;
  filePath?: string;
  hasAIMetadata?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface SearchResult {
  comment: Comment;
  ghostMarker: GhostMarker;
  filePath: string;
  score: number;                 // Relevance score (0-1)
}

// move_comment parameters
interface MoveCommentParams {
  sourceFile: string;
  targetFile: string;
  commentId: string;
  targetLine: number;
}

// export_comments parameters
interface ExportCommentsParams {
  format: 'json' | 'markdown' | 'jsonl' | 'parquet';
  filePath?: string;
  options?: ExportOptions;
}

interface ExportOptions {
  includeSourceContext?: boolean;
  contextLines?: number;         // Lines before/after (default: 3)
}
```

---

## Tools API

### add_comment

Add a new comment to a source file.

**Signature:**
```typescript
function add_comment(params: AddCommentParams): Promise<AddCommentResult>
```

**Parameters:**
- `filePath` (string, required) - Relative path from workspace root
- `line` (number, required) - Line number (1-indexed)
- `text` (string, required) - Comment text (1-10000 chars)
- `tag` (CommentTag, required) - One of: TODO, FIXME, NOTE, STAR, QUESTION
- `author` (string, optional) - Author name (default: "ai")
- `aiMeta` (AIMetadata, optional) - AI enrichment metadata

**Returns:**
```typescript
{
  commentId: string;        // e.g., "c_1730000000000"
  ghostMarkerId: string;    // e.g., "gm_1730000000001"
  message: string;          // Success message
}
```

**Errors:**
- `-32001`: File not found
- `-32003`: Invalid file path
- `-32005`: Invalid line number
- `-32006`: AST parse error

**Example:**
```typescript
const result = await add_comment({
  filePath: "src/app.ts",
  line: 42,
  text: "TODO: Add input validation",
  tag: "TODO",
  author: "claude",
  aiMeta: {
    model: "claude-sonnet-4.5",
    confidence: 0.95,
    reasoning: "Missing validation could lead to runtime errors"
  }
});

console.log(result.commentId); // "c_1730000000000"
```

---

### edit_comment

Edit the text of an existing comment.

**Signature:**
```typescript
function edit_comment(params: EditCommentParams): Promise<void>
```

**Parameters:**
- `filePath` (string, required) - Path to source file
- `commentId` (string, required) - Comment ID (format: "c_{timestamp}")
- `text` (string, required) - New comment text

**Returns:** `void` (success indicated by no error)

**Errors:**
- `-32001`: File not found
- `-32002`: Comment not found
- `-32003`: Invalid file path

**Example:**
```typescript
await edit_comment({
  filePath: "src/app.ts",
  commentId: "c_1730000000000",
  text: "TODO: Add input validation using Zod schema"
});
```

---

### delete_comment

Delete a comment and its associated ghost marker.

**Signature:**
```typescript
function delete_comment(params: DeleteCommentParams): Promise<void>
```

**Parameters:**
- `filePath` (string, required) - Path to source file
- `commentId` (string, required) - Comment ID to delete

**Returns:** `void`

**Errors:**
- `-32001`: File not found
- `-32002`: Comment not found

**Example:**
```typescript
await delete_comment({
  filePath: "src/app.ts",
  commentId: "c_1730000000000"
});
```

---

### search_comments

Search comments across the workspace.

**Signature:**
```typescript
function search_comments(params: SearchCommentParams): Promise<SearchResult[]>
```

**Parameters:**
- `query` (string, required) - Search query (supports regex)
- `filters` (SearchFilters, optional) - Filter criteria
- `limit` (number, optional) - Max results (default: 100, max: 1000)

**Returns:**
```typescript
Array<{
  comment: Comment;
  ghostMarker: GhostMarker;
  filePath: string;
  score: number;
}>
```

**Example:**
```typescript
const results = await search_comments({
  query: "validation",
  filters: {
    tag: "TODO",
    hasAIMetadata: true,
    dateRange: {
      start: "2025-10-01T00:00:00Z",
      end: "2025-10-31T23:59:59Z"
    }
  },
  limit: 50
});

results.forEach(result => {
  console.log(`${result.filePath}:${result.ghostMarker.line}`);
  console.log(`  ${result.comment.text}`);
  console.log(`  Score: ${result.score}`);
});
```

---

### get_file_comments

Get all comments for a specific file.

**Signature:**
```typescript
function get_file_comments(
  filePath: string,
  includeOrphaned?: boolean
): Promise<CommentFile>
```

**Parameters:**
- `filePath` (string, required) - Path to source file
- `includeOrphaned` (boolean, optional) - Include orphaned comments (default: true)

**Returns:** `CommentFile` object

**Example:**
```typescript
const commentFile = await get_file_comments("src/app.ts");

console.log(`Total comments: ${commentFile.comments.length}`);
console.log(`Ghost markers: ${commentFile.ghostMarkers.length}`);

commentFile.comments.forEach(comment => {
  console.log(`- [${comment.tag}] ${comment.text}`);
});
```

---

### move_comment

Move a comment to a different file or line.

**Signature:**
```typescript
function move_comment(params: MoveCommentParams): Promise<void>
```

**Parameters:**
- `sourceFile` (string, required) - Current file
- `targetFile` (string, required) - Destination file
- `commentId` (string, required) - Comment ID to move
- `targetLine` (number, required) - New line number

**Returns:** `void`

**Example:**
```typescript
await move_comment({
  sourceFile: "src/app.ts",
  targetFile: "src/services/app-service.ts",
  commentId: "c_1730000000000",
  targetLine: 25
});
```

---

### export_comments

Export comments to various formats.

**Signature:**
```typescript
function export_comments(params: ExportCommentsParams): Promise<string>
```

**Parameters:**
- `format` ('json' | 'markdown' | 'jsonl' | 'parquet', required)
- `filePath` (string, optional) - Export single file only
- `options` (ExportOptions, optional) - Export options

**Returns:** Exported data as string (or base64 for binary formats)

**Example (JSON):**
```typescript
const json = await export_comments({
  format: "json"
});

const data = JSON.parse(json);
console.log(`Exported ${data.files.length} files`);
```

**Example (Markdown):**
```typescript
const markdown = await export_comments({
  format: "markdown",
  filePath: "src/app.ts"
});

console.log(markdown);
// # Comments for src/app.ts
// ## TODO Comments
// - Line 42: Add input validation
// ...
```

**Example (Training Data):**
```typescript
const jsonl = await export_comments({
  format: "jsonl",
  options: {
    includeSourceContext: true,
    contextLines: 5
  }
});

// Each line is a training example
jsonl.split('\n').forEach(line => {
  const example = JSON.parse(line);
  console.log(example.prompt);
  console.log(example.completion);
});
```

---

## Resources API

Resources provide read-only access to comment data via URI patterns.

### resource://workspace/all

Get all comments across the workspace.

**URI:** `comment://workspace/all`

**Response:**
```typescript
{
  files: Array<{
    filePath: string;
    comments: Comment[];
    ghostMarkers: GhostMarker[];
  }>;
  totalComments: number;
  totalFiles: number;
}
```

**Example:**
```typescript
const resource = await readResource("comment://workspace/all");
const data = JSON.parse(resource.text);

console.log(`Total comments: ${data.totalComments}`);
console.log(`Across ${data.totalFiles} files`);
```

---

### resource://workspace/{filePath}.comments

Get comments for a specific file.

**URI:** `comment://workspace/src/app.ts.comments`

**Response:** `CommentFile` object

---

### resource://workspace/tags/{tag}

Get all comments with a specific tag.

**URI:** `comment://workspace/tags/TODO`

**Response:**
```typescript
{
  tag: CommentTag;
  comments: Array<{
    filePath: string;
    comment: Comment;
    ghostMarker: GhostMarker;
  }>;
  totalCount: number;
}
```

---

### resource://workspace/orphaned

Get all orphaned comments (anchors no longer exist).

**URI:** `comment://workspace/orphaned`

**Response:**
```typescript
{
  orphanedComments: Array<{
    filePath: string;
    comment: Comment;
    ghostMarker: GhostMarker;
    reason: string; // Why orphaned
  }>;
  totalCount: number;
}
```

---

### resource://workspace/ai-enriched

Get all AI-enriched comments.

**URI:** `comment://workspace/ai-enriched`

**Response:**
```typescript
{
  comments: Array<{
    filePath: string;
    comment: Comment & { aiMeta: AIMetadata };
    ghostMarker: GhostMarker;
  }>;
  totalCount: number;
  models: string[]; // List of AI models used
}
```

---

## Prompts API

Prompts are pre-built workflows that return conversation starters.

### review_code

Generate a prompt for code review.

**Arguments:**
- `filePath` (string, required) - File to review
- `focus` ('security' | 'performance' | 'maintainability' | 'all', optional)

**Returns:** System prompt for AI code review

**Example:**
```typescript
const prompt = await getPrompt("review_code", {
  filePath: "src/services/auth.ts",
  focus: "security"
});

// Returns:
// "Review this code for security issues and suggest TODO/FIXME comments:
//  [source code]
//  Focus on: authentication vulnerabilities, input validation, ..."
```

---

### explain_complexity

Generate a prompt for explaining complex code.

**Arguments:**
- `filePath` (string, required)
- `complexityThreshold` (number, optional, default: 10)

**Returns:** Prompt to add NOTE comments explaining complex functions

---

### training_export

Generate a prompt for exporting training data.

**Arguments:**
- `includeContext` (boolean, optional, default: true)

**Returns:** Instructions for exporting comments as AI training dataset

---

### fix_orphans

Generate a prompt for fixing orphaned comments.

**Arguments:**
- `filePath` (string, optional) - Specific file, or all files if omitted

**Returns:** Prompt to re-anchor orphaned comments

---

## Code Examples

### Complete Workflow: Review Code and Add Comments

```typescript
import { MCPClient } from '@paired-comments/mcp-client';

const client = new MCPClient({
  serverCommand: 'npx',
  serverArgs: ['-y', '@paired-comments/mcp-server'],
  workspacePath: '/path/to/project'
});

async function reviewAndAnnotate(filePath: string) {
  // 1. Get review prompt
  const prompt = await client.getPrompt('review_code', {
    filePath,
    focus: 'security'
  });

  // 2. Send prompt to Claude (or GPT)
  const aiResponse = await claude.sendMessage(prompt.messages[0].content.text);

  // 3. Parse AI response for suggested comments
  const suggestions = parseAISuggestions(aiResponse);

  // 4. Add comments via MCP
  for (const suggestion of suggestions) {
    await client.callTool('add_comment', {
      filePath,
      line: suggestion.line,
      text: suggestion.text,
      tag: suggestion.tag,
      author: 'claude',
      aiMeta: {
        model: 'claude-sonnet-4.5',
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning
      }
    });
  }

  console.log(`Added ${suggestions.length} comments to ${filePath}`);
}

await reviewAndAnnotate('src/services/auth.ts');
```

---

### Search and Export Training Data

```typescript
async function exportSecurityTrainingData() {
  // 1. Search for security-related comments
  const results = await client.callTool('search_comments', {
    query: 'security|vulnerability|auth|validation',
    filters: {
      tag: 'FIXME',
      hasAIMetadata: true
    },
    limit: 500
  });

  console.log(`Found ${results.length} security comments`);

  // 2. Export as JSONL training data
  const jsonl = await client.callTool('export_comments', {
    format: 'jsonl',
    options: {
      includeSourceContext: true,
      contextLines: 10
    }
  });

  // 3. Save to file
  await fs.writeFile('security-training-data.jsonl', jsonl);

  console.log('Training data exported!');
}
```

---

### Real-Time Sync with VS Code Extension

```typescript
async function syncWithExtension() {
  // Subscribe to resource changes
  await client.subscribe('comment://workspace/src/app.ts.comments');

  // Listen for updates
  client.on('resource:updated', async (uri) => {
    console.log(`Comments updated: ${uri}`);

    // Read updated resource
    const resource = await client.readResource(uri);
    const commentFile = JSON.parse(resource.text);

    // Update UI in VS Code
    vscode.window.showInformationMessage(
      `${commentFile.comments.length} comments in ${commentFile.filePath}`
    );
  });
}
```

---

## Next Steps

1. ✅ API Reference complete
2. ⏭️ VS Code Extension Integration Guide
3. ⏭️ Deployment and packaging documentation

---

**Status:** Planning Complete
**Next:** Integration Guide
