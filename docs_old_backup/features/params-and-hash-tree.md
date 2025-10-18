# Params & Hash Tree Architecture (v2.1)

**Status:** 📋 Design Phase
**Target Version:** v2.1
**Dependencies:** v2.0 Ghost Markers
**Last Updated:** 2025-01-XX

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Core Concepts](#core-concepts)
4. [Architecture](#architecture)
5. [Data Structures](#data-structures)
6. [Use Cases](#use-cases)
7. [Implementation Plan](#implementation-plan)
8. [Privacy & Export](#privacy--export)
9. [Community Standards](#community-standards)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Params & Hash Tree system extends Paired Comments with:

1. **Dynamic Parameters (`params`)** - Variables that auto-update with code changes
2. **AI Metadata (`aiMeta`)** - Structured metadata for AI/ML workflows
3. **Output Capture (`output`)** - Capture and store runtime values like Jupyter notebooks
4. **Hash Tree Architecture** - Merkle tree-like change detection for all comment state
5. **Built-in Helpers** - Token estimation, complexity calculation, chunking utilities
6. **Privacy Controls** - Fine-grained field exclusion for exports

This makes Paired Comments a powerful platform for:
- AI-assisted development
- Code analysis and metrics
- Training data curation
- Dynamic documentation
- Runtime debugging and testing
- Enterprise compliance

---

## Problem Statement

### Current Limitations

1. **Static Comments**: Comments don't update when referenced code changes
2. **Manual Metadata**: Developers manually track complexity, tokens, dependencies
3. **No AI Integration**: No standardized way to store AI-relevant metadata
4. **Inflexible Format**: Can't extend comments for industry-specific needs
5. **Privacy Issues**: No way to exclude sensitive fields from exports

### Goals

✅ **Dynamic Comments** - Variables that auto-update (e.g., function names, line counts)
✅ **AI-Friendly** - Store tokens, complexity, embeddings for AI consumption
✅ **Extensible** - Free-form JSON allows any industry to add custom metadata
✅ **Efficient** - Hash tree detects changes without re-scanning entire file
✅ **Private** - Fine-grained control over what gets exported/shared

---

## Core Concepts

### 1. Dynamic Parameters

**Problem**: Comments reference code that changes
```javascript
// Old comment: "The processUserData function handles authentication"
// Code changes: Function renamed to handleUserAuth
// Comment is now outdated!
```

**Solution**: Variable interpolation
```json
{
  "text": "The ${functionName} function handles ${operationType}",
  "params": {
    "functionName": {
      "value": "handleUserAuth",
      "type": "dynamic",
      "source": "function.name",
      "updateRule": "track-parent-function"
    },
    "operationType": {
      "value": "authentication",
      "type": "static"
    }
  }
}
```

**Display**: "The handleUserAuth function handles authentication"

### 2. AI Metadata

**Problem**: AI tools need context about code (tokens, complexity, dependencies)

**Solution**: Structured metadata
```json
{
  "aiMeta": {
    "tokenEstimate": 450,
    "complexity": 8,
    "codeType": "async-function",
    "lineRange": { "start": 45, "end": 151 },
    "chunkBoundary": true,
    "isolatable": true,
    "dependencies": ["express", "bcrypt", "jwt"],
    "generatedBy": "claude",
    "trainingLabel": "authentication"
  }
}
```

### 3. Output Capture (Foundation in v2.1, Complete in v2.2)

**Problem**: Runtime values are invisible - developers can't see what functions actually returned

**Solution**: Capture and store runtime outputs like Jupyter notebooks

```json
{
  "line": 42,
  "text": "API call to ${endpoint} returned ${statusCode}",
  "params": {
    "endpoint": { "value": "/users", "type": "static" },
    "statusCode": { "value": 200, "type": "computed", "source": "output.value.status" }
  },
  "output": {
    "capturedAt": "2025-10-17T10:30:00Z",
    "value": {
      "status": 200,
      "data": { "id": 123, "name": "John", "created": "2025-10-17T10:30:00Z" }
    },
    "type": "object",
    "captureMethod": "manual",
    "variableName": "response"
  }
}
```

**Display in Hover**:
```
📝 Comment by Greg
API call to /users returned 200

📤 Last Output (10/17/2025 10:30 AM):
{
  status: 200,
  data: { id: 123, name: "John", ... }
}
```

**Use Cases**:
- 🐛 **Debugging** - See what values looked like when code last ran
- 📝 **Documentation** - Show real example outputs, not hypothetical
- ✅ **Testing** - Capture expected outputs for regression detection
- 🎓 **Learning** - Understand what functions actually return
- 🤖 **AI Training** - Real input/output pairs for ML datasets

**v2.1 (Foundation)**: Basic manual capture from clipboard, simple display
**v2.2 (Complete)**: Templates, debug adapter integration, history, comparison

### 4. Hash Tree Architecture

**Problem**: How do we know when params need updating without scanning entire file?

**Solution**: Merkle tree-like hash structure
```
fileHash (root)
  └── ghostMarker1Hash
       ├── comment1Hash
       │    ├── contentHash
       │    └── paramsHash
       │         ├── param1: sourceHash + valueHash
       │         └── param2: sourceHash + valueHash
       └── comment2Hash
```

**On document change**:
1. Recalculate `fileHash` (fast, just combines child hashes)
2. If mismatch → traverse tree to find what changed
3. Only update affected params/markers
4. O(log n) instead of O(n) for change detection

---

## Architecture

### High-Level Flow

```
┌─────────────────┐
│ User Edits Code │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Document Change Event   │
│ (debounced 500ms)       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ HashTreeManager         │
│ - Recalculate fileHash  │
│ - Compare with cached   │
└────────┬────────────────┘
         │
         ├─ No Change → Done ✓
         │
         └─ Change Detected
                  │
                  ▼
         ┌────────────────────┐
         │ Find Changed Nodes │
         │ (traverse tree)    │
         └────────┬───────────┘
                  │
      ┏━━━━━━━━━━━┻━━━━━━━━━━━┓
      ▼                        ▼
┌──────────────┐      ┌─────────────────┐
│ Marker Drift │      │ Param Drift     │
│ (Ghost       │      │ (Source code    │
│  Marker      │      │  changed)       │
│  reconcile)  │      └────────┬────────┘
└──────────────┘               │
                               ▼
                      ┌─────────────────┐
                      │ ParamManager    │
                      │ - Re-evaluate   │
                      │ - Update value  │
                      │ - Update hash   │
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Update Display  │
                      │ - Gutter icons  │
                      │ - Hover text    │
                      └─────────────────┘
```

### Component Breakdown

#### **HashTreeManager**
- Builds and maintains hash tree
- Efficient change detection
- Triggers update cascade
- Optional: Store history for undo/redo

#### **ParamManager**
- Evaluates param sources
- Updates param values
- Handles interpolation
- Manages update rules

#### **AIHelpers** (Utility Library)
- `estimateTokens()` - tiktoken integration
- `calculateComplexity()` - Cyclomatic complexity
- `detectCodeType()` - AST-based detection
- `findChunkBoundaries()` - Logical code sections
- `extractDependencies()` - Import analysis
- `semanticHash()` - Content-aware hashing

#### **PrivacyManager**
- Loads `.commentsrc` config
- Filters fields on export
- Supports wildcards and nested paths

---

## Data Structures

### Extended Comment Schema (v2.1)

```typescript
export interface Comment {
  // v1.0 fields
  id: string;
  line: number;
  text: string;
  author: string;
  created: string;
  updated: string;
  tag?: CommentTag;
  status?: CommentStatus;

  // v2.0 fields (Ghost Markers)
  ghostMarkerId?: string;

  // v2.1 NEW: Dynamic Parameters
  params?: {
    [paramName: string]: CommentParam;
  };

  // v2.1 NEW: AI Metadata
  aiMeta?: AIMetadata;

  // v2.1 NEW: Output Capture (Foundation)
  output?: CommentOutput;

  // v2.2: Output History
  outputHistory?: CommentOutput[];
}
```

### CommentParam

```typescript
export interface CommentParam {
  /** Current value of the parameter */
  value: string | number | boolean;

  /** How this parameter is maintained */
  type: "static" | "dynamic" | "computed";

  /** Where the value comes from (for dynamic/computed) */
  source?: string;

  /** Rule for when/how to update */
  updateRule?: string;

  /** Last time this param was verified/updated */
  lastUpdated?: string;

  /** Hash of the source code this param tracks */
  sourceHash?: string;

  /** Hash of the current value */
  valueHash?: string;
}
```

**Parameter Types:**

1. **Static** - Set once, never changes
   ```json
   {
     "type": "static",
     "value": "authentication"
   }
   ```

2. **Dynamic** - Tracks code, updates automatically
   ```json
   {
     "type": "dynamic",
     "value": "handleUserAuth",
     "source": "function.name",
     "updateRule": "track-parent-function",
     "sourceHash": "a3f9c2b1..."
   }
   ```

3. **Computed** - Calculated from other data
   ```json
   {
     "type": "computed",
     "value": 450,
     "source": "aiMeta.tokenEstimate",
     "updateRule": "recalculate-on-change"
   }
   ```

### AIMetadata

```typescript
export interface AIMetadata {
  /** Estimated token count for code range */
  tokenEstimate?: number;

  /** Cyclomatic complexity score */
  complexity?: number;

  /** Semantic hash (content-aware, ignores whitespace) */
  semanticHash?: string;

  /** Programming language/framework */
  language?: string;

  /** Code structure type */
  codeType?: 'function' | 'class' | 'method' | 'loop' | 'conditional' | 'import' | 'module' | 'unknown';

  /** Line range for this code section */
  lineRange?: {
    start: number;
    end: number;
  };

  /** Marks logical chunk boundary for AI analysis */
  chunkBoundary?: boolean;

  /** Type of chunk */
  chunkType?: 'function' | 'class' | 'module' | 'section' | 'file';

  /** Human-readable chunk description */
  chunkDescription?: string;

  /** Can this code be analyzed in isolation? */
  isolatable?: boolean;

  /** What context is required for understanding */
  contextRequired?: string[];

  /** External dependencies (imports/modules) */
  dependencies?: string[];

  /** Who/what generated this code */
  generatedBy?: 'human' | 'gpt-4' | 'claude' | 'copilot' | string;

  /** AI confidence score (0-1) */
  confidence?: number;

  /** Label for training/fine-tuning */
  trainingLabel?: string;

  /** Vector embedding (for semantic search) */
  embedding?: number[];

  /** Free-form metadata (extensible) */
  [key: string]: unknown;
}
```

### CommentOutput

```typescript
export interface CommentOutput {
  /** When this output was captured */
  capturedAt: string;

  /** The captured value (serialized to JSON) */
  value: unknown;

  /** Type of the captured value */
  type: 'primitive' | 'object' | 'array' | 'error' | 'promise' | 'function' | 'custom';

  /** Was this value truncated due to size? */
  truncated: boolean;

  /** Original size before truncation (bytes) */
  originalSize?: number;

  /** How was this output captured? */
  captureMethod: 'manual' | 'clipboard' | 'debug-adapter' | 'auto-inject';

  /** Variable name that was captured */
  variableName?: string;

  /** Execution context when captured */
  context?: {
    file: string;
    line: number;
    function?: string;
    stackTrace?: string[];
  };

  /** Assertions on the output (v2.2) */
  assertions?: OutputAssertion[];
}

export interface OutputAssertion {
  /** JSON path to check (e.g., "data.user.id") */
  path: string;

  /** Expected value or condition */
  equals?: unknown;
  type?: string;
  exists?: boolean;
  gt?: number;
  lt?: number;

  /** Did the assertion pass? */
  passed: boolean;

  /** Failure message if any */
  message?: string;
}
```

**Output Types**:
- **primitive**: string, number, boolean, null
- **object**: Plain objects, JSON-serializable
- **array**: Arrays of any type
- **error**: Error objects with stack traces
- **promise**: Promises (shows resolved/rejected state)
- **function**: Function signatures
- **custom**: Custom serialization for special types

### Hash Tree Structure

```typescript
export interface CommentHashTree {
  /** Root hash of entire file state */
  fileHash: string;

  /** Last verification timestamp */
  lastVerified: string;

  /** Hash tree for all ghost markers */
  ghostMarkers: {
    [markerId: string]: GhostMarkerHashNode;
  };
}

export interface GhostMarkerHashNode {
  /** Hash of marker position + line content */
  markerHash: string;

  /** Comments anchored to this marker */
  comments: {
    [commentId: string]: CommentHashNode;
  };
}

export interface CommentHashNode {
  /** Hash of comment text and metadata */
  contentHash: string;

  /** Hash of all params combined */
  paramsHash?: string;

  /** Individual param hashes */
  params?: {
    [paramName: string]: ParamHashNode;
  };

  /** Hash of aiMeta (optional) */
  aiMetaHash?: string;
}

export interface ParamHashNode {
  /** Hash of the param's current value */
  valueHash: string;

  /** Hash of the source code this param tracks */
  sourceHash?: string;
}
```

### Variable Interpolation Syntax

Context-aware per language:

```typescript
export const VARIABLE_SYNTAX: Record<string, { open: string; close: string }> = {
  javascript: { open: '${', close: '}' },
  typescript: { open: '${', close: '}' },
  python: { open: '{', close: '}' },
  rust: { open: '{', close: '}' },
  php: { open: '$', close: '' },
  ruby: { open: '#{', close: '}' },
  shell: { open: '${', close: '}' },
  go: { open: '{{', close: '}}' },
  handlebars: { open: '{{', close: '}}' },
  default: { open: '${', close: '}' }
};
```

**Override in `.commentsrc`:**
```json
{
  "variableSyntax": {
    "open": "{{",
    "close": "}}"
  }
}
```

---

## Use Cases

### 1. Dynamic Documentation

**Scenario**: Function names change frequently during refactoring

```json
{
  "line": 45,
  "text": "The ${functionName} takes ${paramCount} parameters and returns ${returnType}",
  "params": {
    "functionName": {
      "value": "processUserData",
      "type": "dynamic",
      "source": "function.name",
      "updateRule": "track-parent-function"
    },
    "paramCount": {
      "value": 3,
      "type": "computed",
      "source": "function.parameters.length",
      "updateRule": "count-parameters"
    },
    "returnType": {
      "value": "Promise<User>",
      "type": "dynamic",
      "source": "function.returnType",
      "updateRule": "track-return-type"
    }
  }
}
```

**Display**: "The processUserData takes 3 parameters and returns Promise<User>"

**After Refactoring**:
- Function renamed to `handleUser`
- Added 4th parameter
- Params auto-update!

**New Display**: "The handleUser takes 4 parameters and returns Promise<User>"

---

### 2. AI-Assisted Code Review

**Scenario**: AI estimates review time based on complexity and tokens

```json
{
  "line": 120,
  "text": "TODO: Review this ${codeType} (~${tokens} tokens, complexity ${complexity})",
  "tag": "TODO",
  "params": {
    "codeType": {
      "value": "async function",
      "type": "computed",
      "source": "aiMeta.codeType"
    },
    "tokens": {
      "value": 450,
      "type": "computed",
      "source": "aiMeta.tokenEstimate"
    },
    "complexity": {
      "value": 8,
      "type": "computed",
      "source": "aiMeta.complexity"
    }
  },
  "aiMeta": {
    "tokenEstimate": 450,
    "complexity": 8,
    "codeType": "async-function",
    "lineRange": { "start": 120, "end": 226 },
    "dependencies": ["database", "validator", "logger"],
    "chunkBoundary": true,
    "isolatable": false,
    "contextRequired": ["UserModel", "imports"]
  }
}
```

**AI sees**:
- "This is 106 lines, ~450 tokens"
- "Medium complexity (8/10)"
- "Not isolatable - needs UserModel and imports"
- "Review estimate: 10-15 minutes"

---

### 3. Training Data Curation

**Scenario**: Label code examples for ML fine-tuning

```json
{
  "line": 1,
  "text": "Example of error handling pattern",
  "aiMeta": {
    "trainingLabel": "error-handling",
    "codeType": "function",
    "language": "typescript",
    "tokenEstimate": 320,
    "complexity": 5,
    "generatedBy": "human",
    "confidence": 1.0,
    "chunkBoundary": true,
    "chunkType": "function",
    "lineRange": { "start": 1, "end": 45 },
    "isolatable": true,
    "semanticHash": "b7e3d9f2...",
    "dependencies": ["express"]
  }
}
```

**Use Case**: Export all comments with `trainingLabel` for dataset creation

---

### 4. Smart Code Chunking

**Scenario**: Large file (2000+ lines), AI needs specific section

```json
{
  "line": 450,
  "text": "Authentication module - ${lines} lines, ${tokens} tokens",
  "params": {
    "lines": {
      "value": 106,
      "type": "computed",
      "source": "aiMeta.lineRange",
      "updateRule": "count-lines-in-range"
    },
    "tokens": {
      "value": 450,
      "type": "computed",
      "source": "aiMeta.tokenEstimate"
    }
  },
  "aiMeta": {
    "tokenEstimate": 450,
    "lineRange": { "start": 450, "end": 556 },
    "chunkBoundary": true,
    "chunkType": "module",
    "chunkDescription": "User authentication and session management",
    "isolatable": true,
    "dependencies": ["bcrypt", "jwt", "redis"],
    "contextRequired": ["UserModel", "SessionStore"]
  }
}
```

**AI Agent Workflow**:
1. Scans file for chunk boundaries (via `chunkBoundary: true`)
2. Reads only relevant sections (lines 450-556)
3. Fetches required context (UserModel, SessionStore)
4. Saves ~1500 lines of unnecessary context!

---

### 5. Enterprise Compliance

**Scenario**: Track who generated code, calculate API costs

```json
{
  "line": 200,
  "text": "FIXME: Review AI-generated code",
  "tag": "FIXME",
  "aiMeta": {
    "generatedBy": "gpt-4",
    "confidence": 0.87,
    "tokenEstimate": 620,
    "lineRange": { "start": 200, "end": 285 },
    "complexity": 12,
    "dependencies": ["stripe", "email-service"]
  }
}
```

**Compliance Report**:
- AI-generated code: 620 tokens
- Confidence: 87% (flag for review if < 90%)
- High complexity: 12 (requires senior review)
- External API calls: stripe, email-service

---

### 6. Runtime Output Capture & Debugging (v2.1 Foundation, v2.2 Complete)

**Scenario**: Developer debugging authentication bug, captures runtime output

```typescript
// Line 45
async function authenticateUser(email: string, password: string) {
  const user = await db.users.findOne({ email });
  const valid = await bcrypt.compare(password, user.passwordHash);
  return { success: valid, user: valid ? user : null };
}
```

**Step 1: Capture Output (v2.1 - Manual)**
```json
{
  "line": 45,
  "text": "authenticateUser() returned ${resultType} - BUG: leaks user data on failure!",
  "tag": "FIXME",
  "params": {
    "resultType": {
      "value": "object",
      "type": "computed",
      "source": "output.type"
    }
  },
  "output": {
    "capturedAt": "2025-10-17T11:00:00Z",
    "value": {
      "success": false,
      "user": { "id": 123, "email": "test@example.com", "passwordHash": "..." }
    },
    "type": "object",
    "captureMethod": "manual",
    "variableName": "result"
  },
  "aiMeta": {
    "complexity": 6,
    "tokenEstimate": 280,
    "codeType": "async-function"
  }
}
```

**Step 2: Fix Bug and Re-capture**
```json
{
  "output": {
    "capturedAt": "2025-10-17T11:05:00Z",
    "value": {
      "success": false,
      "user": null  // ← FIXED!
    },
    "captureMethod": "manual"
  },
  "outputHistory": [
    {
      "capturedAt": "2025-10-17T11:00:00Z",
      "value": { "success": false, "user": { "id": 123, "email": "..." } }  // ← Before fix
    }
  ]
}
```

**Step 3: View Diff (v2.2)**
```diff
{
  success: false,
- user: { id: 123, email: "test@example.com", passwordHash: "..." }
+ user: null
}
```

**Use Cases for Output Capture**:
- 🐛 **Debugging**: See actual return values when bugs occurred
- 📝 **Documentation**: Real examples instead of hypothetical ones
- ✅ **Testing**: Regression detection via output comparison
- 🎓 **Learning**: Understand what functions actually return
- 🤖 **AI Training**: Real input/output pairs for ML datasets
- 🔒 **Security**: Detect data leaks (e.g., user data on failed auth)

**Microsoft Acquisition Value** 😉:
- Real code → output training data
- Bug patterns with before/after fixes
- API response catalog from thousands of developers
- Function behavior examples with edge cases

---

## Implementation Plan

### Phase 1: Schema & Validation (Week 1)

**Tasks**:
1. ✅ Add `params`, `aiMeta`, and `output` to `Comment` interface
2. ✅ Update `CommentFile` schema to v2.1
3. ✅ Update validation to allow free-form JSON in these fields
4. ✅ Update all managers to preserve params/aiMeta/output
5. ✅ Basic serialization utilities for output capture
6. ✅ Write migration guide (v2.0 → v2.1)

**Files Modified**:
- `src/types.ts` - Add new interfaces (CommentParam, AIMetadata, CommentOutput)
- `src/io/FileSystemManager.ts` - Update validation
- `src/core/CommentManager.ts` - Preserve new fields
- `src/utils/serialization.ts` - JSON serialization helpers (NEW)

**Testing**:
- Create comment with `params`, `aiMeta`, and `output`
- Save and reload
- Verify all fields preserved

---

### Phase 2: Hash Tree Architecture (Week 2)

**Tasks**:
1. Create `HashTreeManager` class
2. Build hash tree on file load
3. Implement change detection algorithm
4. Wire into ghost marker verification cycle
5. Add debounced update trigger

**New Files**:
- `src/core/HashTreeManager.ts` (350+ lines)
- `src/utils/hashing.ts` (hash utilities)

**Integration Points**:
- Hook into `GhostMarkerManager.onDocumentChange()`
- Share 500ms debounce timer
- Trigger param updates on hash mismatch

**Testing**:
- Edit code, verify only changed params update
- Measure performance (should be < 50ms for 1000-line files)
- Test with multiple markers per file

---

### Phase 3: Param Manager & Interpolation (Week 3)

**Tasks**:
1. Create `ParamManager` class
2. Implement variable interpolation engine
3. Context-aware syntax per language
4. Support update rules (track function name, count lines, etc.)
5. Display interpolated text in decorations

**New Files**:
- `src/core/ParamManager.ts` (400+ lines)
- `src/utils/interpolation.ts` (interpolation engine)

**Update Rules (MVP)**:
- `track-parent-function` - Follow function name
- `count-lines-in-range` - Count lines in aiMeta.lineRange
- `recalculate-on-change` - Re-evaluate computed values

**UI Changes**:
- Hover shows interpolated text (rendered)
- .comments file shows raw template + params

**Testing**:
- Rename function, verify param updates
- Add/remove lines, verify line counts update
- Test all variable syntaxes (JS, Python, etc.)

---

### Phase 4: AI Helpers (Week 4)

**Tasks**:
1. Create `AIHelpers` utility class
2. Integrate tiktoken for token estimation
3. Implement cyclomatic complexity calculator
4. AST-based code type detection
5. Logical chunk boundary detection
6. Dependency extraction

**New Files**:
- `src/utils/aiHelpers.ts` (600+ lines)
- `package.json` - Add dependencies (tiktoken, etc.)

**Built-in Helpers**:
```typescript
class AIHelpers {
  static estimateTokens(code: string, model?: string): number;
  static calculateComplexity(code: string, language: string): number;
  static detectCodeType(code: string, language: string): CodeType;
  static findChunkBoundaries(document: vscode.TextDocument): ChunkBoundary[];
  static extractDependencies(code: string, language: string): string[];
  static semanticHash(code: string, language: string): string;
  static chunkFile(document: vscode.TextDocument, maxTokens: number): CodeChunk[];
}
```

**Commands (Optional)**:
- "Paired Comments: Estimate Tokens" - Add token estimate to comment
- "Paired Comments: Calculate Complexity" - Add complexity score
- "Paired Comments: Auto-Chunk File" - Create chunk boundary markers

**Testing**:
- Token estimation accuracy (compare with tiktoken)
- Complexity for various code patterns
- Chunk detection on real-world files

---

### Phase 5: Privacy & Export (Week 5)

**Tasks**:
1. Create `.commentsrc` configuration format
2. Implement `PrivacyManager` class
3. Field exclusion with wildcard support
4. Export command with privacy filtering
5. Settings UI for privacy controls

**New Files**:
- `src/io/PrivacyManager.ts` (300+ lines)
- `.commentsrc.example` (example config)

**`.commentsrc` Format**:
```json
{
  "version": "2.1",
  "export": {
    "exclude": {
      "author": true,
      "aiMeta": {
        "embedding": true,
        "generatedBy": false
      },
      "params": {
        "*": false
      }
    }
  },
  "variableSyntax": {
    "open": "${",
    "close": "}"
  }
}
```

**Commands**:
- "Paired Comments: Export (Filtered)" - Export with privacy
- "Paired Comments: Configure Privacy" - Open .commentsrc

**Testing**:
- Export with various exclusion rules
- Verify excluded fields not in output
- Test wildcard patterns

---

### Phase 5.5: Output Capture Foundation (Week 5.5) - v2.1 Completion

**Tasks**:
1. Implement basic manual output capture
2. Add "Paired Comments: Capture Output from Clipboard" command
3. Display captured output in hover preview
4. Basic privacy filtering for output values
5. Update DecorationManager to show output indicator

**New Files**:
- `src/utils/outputCapture.ts` (200+ lines) - Serialization and capture utilities

**Commands**:
- "Paired Comments: Capture Output from Clipboard" - `Ctrl+Alt+P Ctrl+Alt+O`
  - User copies value (JSON or plain text)
  - Command pastes into comment.output
  - Auto-detects type (object, array, primitive, error)

**UI Changes**:
- Hover preview shows `📤 Last Output:` section
- Display captured value with syntax highlighting
- Show capture timestamp
- Truncate large values (> 1KB)

**Testing**:
- Capture various data types (object, array, string, number)
- Verify truncation for large values
- Test hover display
- Verify privacy filters work on output

**Notes**:
- This is the **foundation** for v2.2 output capture features
- Keeps v2.1 manageable while validating the concept
- Users can start experimenting with manual capture
- Schema is ready for v2.2 debug adapter integration

---

### Phase 6: Documentation & Polish (Week 6)

**Tasks**:
1. Update README with v2.1 features
2. Create examples for common use cases
3. API documentation for helpers
4. Video tutorial (optional)
5. Community templates for aiMeta schemas

**Documentation**:
- `docs/params-usage.md` - How to use params
- `docs/ai-metadata-guide.md` - AI metadata best practices
- `docs/hash-tree-internals.md` - Architecture deep-dive
- `docs/privacy-export.md` - Privacy controls guide

**Example Templates**:
- `templates/ai-training.json` - For ML datasets
- `templates/code-review.json` - For review workflows
- `templates/token-tracking.json` - For API cost estimation

---

## Privacy & Export

### Configuration: `.commentsrc`

**Location**: Project root

**Format**:
```json
{
  "version": "2.1",

  "export": {
    "exclude": {
      // Exclude entire fields
      "author": true,

      // Nested exclusion
      "aiMeta": {
        "embedding": true,      // Exclude embeddings (large)
        "generatedBy": true,    // Exclude AI attribution
        "confidence": false     // Include confidence
      },

      // Wildcard support
      "params": {
        "*": false,             // Include all by default
        "apiKey": true,         // Except API keys
        "secret*": true         // And anything starting with "secret"
      }
    }
  },

  "variableSyntax": {
    "open": "${",
    "close": "}"
  },

  "aiHelpers": {
    "tokenModel": "gpt-4",     // Default model for token estimation
    "autoChunk": true,          // Auto-detect chunk boundaries
    "maxChunkTokens": 2000      // Max tokens per chunk
  }
}
```

### Export Flow

```
User runs: "Paired Comments: Export (Filtered)"
              ↓
┌─────────────────────────────┐
│ Load .commentsrc            │
│ (or use defaults)           │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ Read .comments file         │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ For each comment:           │
│ - Check exclusion rules     │
│ - Remove excluded fields    │
│ - Keep allowed fields       │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ Write filtered output       │
│ (filename: .comments.export)│
└─────────────────────────────┘
```

### Example: Exclude Sensitive Data

**Before Export** (.comments):
```json
{
  "comments": [
    {
      "id": "abc-123",
      "line": 45,
      "text": "TODO: Review authentication",
      "author": "john.doe@company.com",
      "params": {
        "apiKey": {
          "value": "sk-12345...",
          "type": "static"
        }
      },
      "aiMeta": {
        "embedding": [0.123, 0.456, ...],
        "generatedBy": "gpt-4",
        "confidence": 0.92
      }
    }
  ]
}
```

**After Export** (.comments.export):
```json
{
  "comments": [
    {
      "id": "abc-123",
      "line": 45,
      "text": "TODO: Review authentication",
      "aiMeta": {
        "confidence": 0.92
      }
    }
  ]
}
```

**Excluded**:
- `author` (PII)
- `params.apiKey` (sensitive)
- `aiMeta.embedding` (large, not needed)
- `aiMeta.generatedBy` (internal info)

---

## Community Standards

### Philosophy

Start **open-ended**, let the community experiment, then standardize popular patterns.

### Phase 1: Open Experimentation (v2.1 Launch)

- No enforced schemas
- Free-form JSON in `aiMeta` and `params`
- Users innovate and share patterns
- Collect feedback on common use cases

### Phase 2: Emerging Patterns (3-6 months post-launch)

- Identify popular aiMeta structures
- Create "blessed" templates for common industries
- Wiki/forum for sharing schemas
- Community voting on standards

### Phase 3: Standard Schemas (1 year post-launch)

**Example Standard Schemas:**

1. **AI Training Standard** (`aiMeta.schema = "ai-training-v1"`)
   ```json
   {
     "aiMeta": {
       "schema": "ai-training-v1",
       "trainingLabel": "error-handling",
       "language": "typescript",
       "complexity": 5,
       "generatedBy": "human",
       "confidence": 1.0,
       "isolatable": true
     }
   }
   ```

2. **Code Review Standard** (`aiMeta.schema = "code-review-v1"`)
   ```json
   {
     "aiMeta": {
       "schema": "code-review-v1",
       "tokenEstimate": 450,
       "complexity": 8,
       "reviewEstimate": "15min",
       "criticalPath": false,
       "securitySensitive": true
     }
   }
   ```

3. **Token Tracking Standard** (`aiMeta.schema = "token-tracking-v1"`)
   ```json
   {
     "aiMeta": {
       "schema": "token-tracking-v1",
       "tokenEstimate": 450,
       "model": "gpt-4",
       "costEstimate": 0.027,
       "chunkBoundary": true,
       "contextRequired": ["UserModel"]
     }
   }
   ```

### Phase 4: QOL Improvements (18+ months post-launch)

- Command palette: "Use Schema: AI Training"
- Auto-populate fields based on schema
- Validation for standard schemas
- Marketplace for community schemas

---

## Future Enhancements

### v2.2+: Advanced Features

1. **Collaborative Editing**
   - Sync hash trees across machines
   - Real-time param updates for team
   - Conflict resolution UI

2. **Param History & Undo**
   - Store hash tree history
   - Rewind to previous state
   - Diff view for param changes

3. **Smart Param Sources**
   - More update rules (track variable, count calls, etc.)
   - AST-based extraction
   - Cross-file references

4. **AI Agent Integration**
   - API for AI agents to query metadata
   - Auto-chunking for context windows
   - Token budget optimization

5. **Advanced Privacy**
   - Encryption for sensitive fields
   - Field-level permissions
   - Audit logs for exports

6. **Community Marketplace**
   - Share/discover aiMeta schemas
   - Rating and reviews
   - Industry-specific packs

---

## Technical Considerations

### Performance

- **Hash Calculation**: O(1) per node, O(n) worst case
- **Change Detection**: O(log n) with binary tree structure
- **Memory**: ~50 bytes per param, ~200 bytes per comment
- **Target**: < 50ms for 1000-line files

### Compatibility

- **v1.0 Files**: Read-only, no params/aiMeta
- **v2.0 Files**: Ghost markers work, params optional
- **v2.1 Files**: Full feature support

### Edge Cases

1. **Circular Dependencies**: Param A tracks Param B tracks Param A
   - Detection: Track evaluation stack
   - Mitigation: Error message, mark as "circular"

2. **Invalid Sources**: `source: "function.name"` but no parent function
   - Mitigation: Mark param as "unavailable", don't update

3. **Large Embeddings**: 1000+ element vectors
   - Mitigation: Warn if embedding > 10KB, suggest exclusion

4. **Rapid Edits**: User types fast, many hash recalculations
   - Mitigation: Debounce to 500ms, queue updates

5. **Merge Conflicts**: Two users edit .comments file
   - Mitigation: Show conflict UI, allow manual resolution

---

## Migration Guide

### v2.0 → v2.1

**Automatic Migration**:
- Existing comments work as-is
- No action required
- `params` and `aiMeta` are optional

**Opt-In Features**:
1. Add params to existing comments
2. Run "Estimate Tokens" command to add aiMeta
3. Enable hash tree tracking (auto-enabled by default)

**Breaking Changes**:
- None! Fully backwards compatible

---

## Conclusion

The Params & Hash Tree system transforms Paired Comments from a simple annotation tool into a **powerful platform for AI-assisted development**. By combining:

- **Dynamic parameters** (auto-updating variables)
- **AI metadata** (tokens, complexity, embeddings)
- **Output capture** (runtime values like Jupyter notebooks)
- **Hash tree architecture** (efficient change detection)
- **Built-in helpers** (token estimation, chunking)
- **Privacy controls** (fine-grained exports)

...we enable entirely new workflows:

✅ Dynamic documentation that never goes stale
✅ AI agents that understand code structure
✅ Training datasets with rich metadata (code + real outputs!)
✅ Token-aware context management
✅ Runtime debugging with captured values
✅ Regression detection via output comparison
✅ Enterprise compliance and audit trails

All while remaining **backwards compatible**, **extensible**, and **privacy-conscious**.

**Special Note on Output Capture**:
- **v2.1** provides the foundation (manual capture, basic display)
- **v2.2** delivers the full power (templates, debug integration, history, comparison)
- This phased approach keeps v2.1 focused while validating the concept

---

**Next Steps**: Review this design, gather feedback, then begin implementation in v2.1!
