# MCP Protocol Specification

**Version:** 0.1.0
**Status:** 📋 Planning Phase
**MCP Version:** 1.0.0
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [Protocol Overview](#protocol-overview)
2. [Tools Specification](#tools-specification)
3. [Resources Specification](#resources-specification)
4. [Prompts Specification](#prompts-specification)
5. [Error Handling](#error-handling)
6. [Message Formats](#message-formats)

---

## Protocol Overview

### MCP Capabilities

```json
{
  "capabilities": {
    "tools": {
      "listChanged": true
    },
    "resources": {
      "subscribe": true,
      "listChanged": true
    },
    "prompts": {
      "listChanged": false
    }
  }
}
```

### Server Information

```json
{
  "name": "paired-comments-mcp-server",
  "version": "0.1.0",
  "protocolVersion": "1.0.0",
  "vendor": "Paired Comments Team"
}
```

---

## Tools Specification

### 1. add_comment

**Purpose:** Add a new comment to a source file

**Input Schema:**
```json
{
  "name": "add_comment",
  "description": "Add a new paired comment to a source file at a specific line",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Relative path to source file from workspace root",
        "example": "src/app.ts"
      },
      "line": {
        "type": "integer",
        "description": "Line number where comment should be added (1-indexed)",
        "minimum": 1
      },
      "text": {
        "type": "string",
        "description": "Comment text content",
        "minLength": 1,
        "maxLength": 10000
      },
      "tag": {
        "type": "string",
        "enum": ["TODO", "FIXME", "NOTE", "STAR", "QUESTION"],
        "description": "Comment tag category"
      },
      "author": {
        "type": "string",
        "description": "Author name (e.g., 'claude', 'gpt-4', 'user')",
        "default": "ai"
      },
      "aiMeta": {
        "type": "object",
        "description": "Optional AI metadata",
        "properties": {
          "model": { "type": "string" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "reasoning": { "type": "string" }
        }
      }
    },
    "required": ["filePath", "line", "text", "tag"]
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "add_comment",
    "arguments": {
      "filePath": "src/services/auth.ts",
      "line": 42,
      "text": "TODO: Add rate limiting to prevent brute force attacks",
      "tag": "TODO",
      "author": "claude",
      "aiMeta": {
        "model": "claude-sonnet-4.5",
        "confidence": 0.95,
        "reasoning": "Security best practice for authentication endpoints"
      }
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Comment added successfully\n\nComment ID: c_1730000000000\nGhost Marker ID: gm_1730000000001\nFile: src/services/auth.ts:42\nTag: TODO\n\nThe comment has been anchored to the function 'validatePassword' and will track code changes."
      }
    ],
    "isError": false
  }
}
```

**Error Response (Invalid Line):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid line number",
    "data": {
      "filePath": "src/services/auth.ts",
      "line": 999,
      "fileLineCount": 150,
      "suggestion": "Line must be between 1 and 150"
    }
  }
}
```

---

### 2. edit_comment

**Purpose:** Edit the text of an existing comment

**Input Schema:**
```json
{
  "name": "edit_comment",
  "description": "Edit the text content of an existing comment",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Path to source file containing the comment"
      },
      "commentId": {
        "type": "string",
        "description": "Unique comment ID (e.g., 'c_1730000000000')",
        "pattern": "^c_\\d+$"
      },
      "text": {
        "type": "string",
        "description": "New comment text",
        "minLength": 1,
        "maxLength": 10000
      }
    },
    "required": ["filePath", "commentId", "text"]
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "edit_comment",
    "arguments": {
      "filePath": "src/services/auth.ts",
      "commentId": "c_1730000000000",
      "text": "TODO: Implement rate limiting using Redis (max 5 attempts per minute)"
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Comment edited successfully\n\nComment ID: c_1730000000000\nFile: src/services/auth.ts\nUpdated: 2025-10-19T15:30:00.000Z"
      }
    ]
  }
}
```

---

### 3. delete_comment

**Purpose:** Remove a comment from a file

**Input Schema:**
```json
{
  "name": "delete_comment",
  "description": "Delete a comment and its associated ghost marker",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Path to source file"
      },
      "commentId": {
        "type": "string",
        "description": "Comment ID to delete",
        "pattern": "^c_\\d+$"
      }
    },
    "required": ["filePath", "commentId"]
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "delete_comment",
    "arguments": {
      "filePath": "src/services/auth.ts",
      "commentId": "c_1730000000000"
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Comment deleted\n\nComment ID: c_1730000000000\nFile: src/services/auth.ts"
      }
    ]
  }
}
```

---

### 4. search_comments

**Purpose:** Search comments across workspace with filters

**Input Schema:**
```json
{
  "name": "search_comments",
  "description": "Search comments by text query with optional filters",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query (supports regex)",
        "minLength": 1
      },
      "filters": {
        "type": "object",
        "description": "Optional filters to narrow results",
        "properties": {
          "tag": {
            "type": "string",
            "enum": ["TODO", "FIXME", "NOTE", "STAR", "QUESTION"]
          },
          "author": {
            "type": "string"
          },
          "filePath": {
            "type": "string",
            "description": "Filter by specific file or glob pattern"
          },
          "hasAIMetadata": {
            "type": "boolean",
            "description": "Only return AI-enriched comments"
          },
          "dateRange": {
            "type": "object",
            "properties": {
              "start": { "type": "string", "format": "date-time" },
              "end": { "type": "string", "format": "date-time" }
            }
          }
        }
      },
      "limit": {
        "type": "integer",
        "description": "Max results to return",
        "default": 100,
        "maximum": 1000
      }
    },
    "required": ["query"]
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "search_comments",
    "arguments": {
      "query": "rate limit",
      "filters": {
        "tag": "TODO",
        "hasAIMetadata": true
      },
      "limit": 50
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 3 matching comments:\n\n1. 📝 src/services/auth.ts:42 (TODO)\n   \"TODO: Implement rate limiting using Redis (max 5 attempts per minute)\"\n   Author: claude | Created: 2025-10-19T15:00:00.000Z\n   AI: claude-sonnet-4.5 (confidence: 0.95)\n\n2. 📝 src/api/login.ts:18 (TODO)\n   \"TODO: Add rate limiting middleware\"\n   Author: gpt-4 | Created: 2025-10-18T10:00:00.000Z\n\n3. 📝 src/middleware/security.ts:5 (TODO)\n   \"TODO: Configure rate limiter for production\"\n   Author: claude | Created: 2025-10-17T08:00:00.000Z"
      }
    ],
    "metadata": {
      "totalResults": 3,
      "query": "rate limit",
      "filters": {
        "tag": "TODO",
        "hasAIMetadata": true
      }
    }
  }
}
```

---

### 5. get_file_comments

**Purpose:** Get all comments for a specific file

**Input Schema:**
```json
{
  "name": "get_file_comments",
  "description": "Retrieve all comments and ghost markers for a file",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filePath": {
        "type": "string",
        "description": "Path to source file"
      },
      "includeOrphaned": {
        "type": "boolean",
        "description": "Include orphaned comments (anchors no longer exist)",
        "default": true
      }
    },
    "required": ["filePath"]
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_file_comments",
    "arguments": {
      "filePath": "src/services/auth.ts",
      "includeOrphaned": true
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Comments for src/services/auth.ts\n\n📊 Summary:\n- Total comments: 5\n- TODO: 2\n- FIXME: 1\n- NOTE: 2\n- Orphaned: 0\n\n---\n\n1. TODO (Line 42) - c_1730000000000\n   \"Implement rate limiting using Redis (max 5 attempts per minute)\"\n   Author: claude | Anchored to: validatePassword()\n\n2. FIXME (Line 78) - c_1730000000001\n   \"Hash comparison is vulnerable to timing attacks\"\n   Author: claude | Anchored to: comparePasswords()\n\n3. NOTE (Line 15) - c_1730000000002\n   \"This service handles all authentication logic\"\n   Author: user | Anchored to: AuthService class\n\n..."
      }
    ],
    "metadata": {
      "filePath": "src/services/auth.ts",
      "commentCount": 5,
      "orphanedCount": 0
    }
  }
}
```

---

### 6. move_comment

**Purpose:** Move comment from one file/line to another

**Input Schema:**
```json
{
  "name": "move_comment",
  "description": "Move a comment to a different file or line (e.g., after refactoring)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sourceFile": {
        "type": "string",
        "description": "Current file containing the comment"
      },
      "targetFile": {
        "type": "string",
        "description": "Destination file (can be same as source)"
      },
      "commentId": {
        "type": "string",
        "pattern": "^c_\\d+$"
      },
      "targetLine": {
        "type": "integer",
        "description": "New line number in target file",
        "minimum": 1
      }
    },
    "required": ["sourceFile", "targetFile", "commentId", "targetLine"]
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "move_comment",
    "arguments": {
      "sourceFile": "src/services/auth.ts",
      "targetFile": "src/services/security/auth.ts",
      "commentId": "c_1730000000000",
      "targetLine": 25
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ Comment moved successfully\n\nFrom: src/services/auth.ts:42\nTo: src/services/security/auth.ts:25\n\nComment ID: c_1730000000000\nNew anchor: validatePassword() in AuthService"
      }
    ]
  }
}
```

---

### 7. export_comments

**Purpose:** Export comments to various formats

**Input Schema:**
```json
{
  "name": "export_comments",
  "description": "Export comments as JSON, Markdown, or AI training data",
  "inputSchema": {
    "type": "object",
    "properties": {
      "format": {
        "type": "string",
        "enum": ["json", "markdown", "jsonl", "parquet"],
        "description": "Export format"
      },
      "filePath": {
        "type": "string",
        "description": "Optional: Export only specific file (omit for all files)"
      },
      "options": {
        "type": "object",
        "properties": {
          "includeSourceContext": {
            "type": "boolean",
            "description": "Include surrounding code lines",
            "default": false
          },
          "contextLines": {
            "type": "integer",
            "description": "Lines of context before/after",
            "default": 3,
            "minimum": 0,
            "maximum": 20
          }
        }
      }
    },
    "required": ["format"]
  }
}
```

**Example Request (AI Training Data):**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "export_comments",
    "arguments": {
      "format": "jsonl",
      "options": {
        "includeSourceContext": true,
        "contextLines": 5
      }
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "resource",
        "resource": {
          "uri": "export://training-data.jsonl",
          "mimeType": "application/x-ndjson",
          "text": "{\"prompt\":\"Analyze this code:\\n...\\n\",\"completion\":\"TODO: Add rate limiting\",\"metadata\":{\"tag\":\"TODO\",\"author\":\"claude\"}}\n{\"prompt\":\"...\",\"completion\":\"...\",\"metadata\":{...}}\n..."
        }
      }
    ],
    "metadata": {
      "format": "jsonl",
      "totalComments": 150,
      "sizeBytes": 45000
    }
  }
}
```

---

## Resources Specification

### Resource URI Patterns

Resources provide read-only access to comment data.

#### 1. Workspace Comments

**URI:** `comment://workspace/all`
**Description:** All comments across entire workspace
**MIME Type:** `application/json`

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "resources/read",
  "params": {
    "uri": "comment://workspace/all"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "result": {
    "contents": [
      {
        "uri": "comment://workspace/all",
        "mimeType": "application/json",
        "text": "{\"files\":[{\"filePath\":\"src/app.ts\",\"comments\":[...]},{\"filePath\":\"src/auth.ts\",\"comments\":[...]}],\"totalComments\":150}"
      }
    ]
  }
}
```

#### 2. File Comments

**URI:** `comment://workspace/{filePath}.comments`
**Description:** Comments for specific file
**MIME Type:** `application/json`

**Example:** `comment://workspace/src/services/auth.ts.comments`

#### 3. Comments by Tag

**URI:** `comment://workspace/tags/{tag}`
**Description:** All comments with specific tag
**MIME Type:** `application/json`

**Example:** `comment://workspace/tags/TODO`

#### 4. Orphaned Comments

**URI:** `comment://workspace/orphaned`
**Description:** Comments whose anchors no longer exist
**MIME Type:** `application/json`

#### 5. AI-Enriched Comments

**URI:** `comment://workspace/ai-enriched`
**Description:** Comments with AI metadata
**MIME Type:** `application/json`

### Resource Subscriptions

Clients can subscribe to resource changes:

```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "resources/subscribe",
  "params": {
    "uri": "comment://workspace/src/app.ts.comments"
  }
}
```

When the resource changes, server sends notification:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "uri": "comment://workspace/src/app.ts.comments"
  }
}
```

---

## Prompts Specification

Prompts are pre-built workflows that guide AI assistants.

### 1. review_code

**Purpose:** Review code and suggest actionable comments

```json
{
  "name": "review_code",
  "description": "Review code and suggest TODO/FIXME comments for improvements",
  "arguments": [
    {
      "name": "filePath",
      "description": "File to review",
      "required": true
    },
    {
      "name": "focus",
      "description": "Review focus area",
      "required": false,
      "default": "all",
      "enum": ["security", "performance", "maintainability", "all"]
    }
  ]
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "method": "prompts/get",
  "params": {
    "name": "review_code",
    "arguments": {
      "filePath": "src/services/auth.ts",
      "focus": "security"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 20,
  "result": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Review this code for security issues and suggest TODO/FIXME comments:\n\n```typescript\n[Source code from src/services/auth.ts]\n```\n\nFor each issue found:\n1. Identify the specific line number\n2. Explain the security concern\n3. Suggest a TODO or FIXME comment\n4. Provide a brief fix recommendation\n\nFocus on:\n- Authentication vulnerabilities\n- Input validation\n- Cryptographic issues\n- Rate limiting\n- Session management"
        }
      }
    ]
  }
}
```

### 2. explain_complexity

**Purpose:** Add explanatory NOTE comments for complex code

```json
{
  "name": "explain_complexity",
  "description": "Add NOTE comments explaining complex functions/algorithms",
  "arguments": [
    {
      "name": "filePath",
      "description": "File to analyze",
      "required": true
    },
    {
      "name": "complexityThreshold",
      "description": "Cyclomatic complexity threshold",
      "required": false,
      "default": 10
    }
  ]
}
```

### 3. training_export

**Purpose:** Export comments as AI training dataset

```json
{
  "name": "training_export",
  "description": "Export workspace comments as AI training data (JSONL format)",
  "arguments": [
    {
      "name": "includeContext",
      "description": "Include code context around comments",
      "required": false,
      "default": true
    }
  ]
}
```

### 4. fix_orphans

**Purpose:** Re-anchor orphaned comments to correct locations

```json
{
  "name": "fix_orphans",
  "description": "Analyze orphaned comments and suggest new anchor locations",
  "arguments": [
    {
      "name": "filePath",
      "description": "File with orphaned comments (omit for all files)",
      "required": false
    }
  ]
}
```

---

## Error Handling

### Standard JSON-RPC Error Codes

```typescript
enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}
```

### Custom Error Codes

```typescript
enum CustomErrorCode {
  FileNotFound = -32001,
  CommentNotFound = -32002,
  InvalidFilePath = -32003,
  FileAccessDenied = -32004,
  InvalidLineNumber = -32005,
  ASTParseError = -32006,
  CommentFileCorrupted = -32007,
}
```

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "File not found",
    "data": {
      "filePath": "src/missing.ts",
      "suggestion": "Check that the file exists in the workspace",
      "workspaceRoot": "/Users/dev/project"
    }
  }
}
```

### Error Examples

**Comment Not Found:**
```json
{
  "code": -32002,
  "message": "Comment not found",
  "data": {
    "filePath": "src/app.ts",
    "commentId": "c_9999999",
    "suggestion": "Use get_file_comments to list valid comment IDs"
  }
}
```

**Invalid Line Number:**
```json
{
  "code": -32005,
  "message": "Invalid line number",
  "data": {
    "filePath": "src/app.ts",
    "line": 999,
    "fileLineCount": 150,
    "suggestion": "Line must be between 1 and 150"
  }
}
```

**AST Parse Error:**
```json
{
  "code": -32006,
  "message": "Failed to parse source code",
  "data": {
    "filePath": "src/broken.ts",
    "parseError": "Unexpected token '}' at line 42",
    "suggestion": "Fix syntax errors before adding comments"
  }
}
```

---

## Message Formats

### Request Message

```typescript
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: object;
}
```

### Success Response

```typescript
interface JSONRPCSuccess {
  jsonrpc: "2.0";
  id: string | number;
  result: {
    content: Array<{
      type: "text" | "resource";
      text?: string;
      resource?: {
        uri: string;
        mimeType: string;
        text: string;
      };
    }>;
    metadata?: object;
    isError?: false;
  };
}
```

### Error Response

```typescript
interface JSONRPCError {
  jsonrpc: "2.0";
  id: string | number;
  error: {
    code: number;
    message: string;
    data?: object;
  };
}
```

### Notification (No Response Expected)

```typescript
interface JSONRPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: object;
}
```

---

## Next Steps

1. ✅ Protocol specification complete
2. ⏭️ Implement protocol handlers in TypeScript
3. ⏭️ Add integration tests with MCP Inspector
4. ⏭️ Validate against MCP 1.0.0 spec

---

**Status:** Planning Complete
**Next:** API Reference Documentation
