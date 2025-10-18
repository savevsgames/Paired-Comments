# Paired Comments - Technical Architecture

**Version:** 0.1.0
**Last Updated:** October 16, 2025
**Status:** In Development

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Core Modules](#core-modules)
4. [Data Flow](#data-flow)
5. [VS Code API Integration](#vs-code-api-integration)
6. [Performance Considerations](#performance-considerations)
7. [Security & Data Integrity](#security--data-integrity)
8. [Extension Points](#extension-points)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────┐         ┌──────────────────┐         │
│  │   Extension   │────────▶│  Command Handler │         │
│  │  Activation   │         │     Registry     │         │
│  └───────────────┘         └──────────────────┘         │
│                                     │                     │
│  ┌──────────────────────────────────┼──────────┐        │
│  │                                  │           │        │
│  ▼                                  ▼           ▼        │
│  ┌─────────────┐      ┌──────────────────┐  ┌────────┐ │
│  │   Paired    │      │     Comment      │  │ Decoration│
│  │    View     │◀────▶│     Manager      │  │ Manager │ │
│  │   Manager   │      │  (CRUD + I/O)    │  └────────┘ │
│  └─────────────┘      └──────────────────┘              │
│         │                      │                         │
│         ▼                      ▼                         │
│  ┌─────────────┐      ┌──────────────────┐             │
│  │   Scroll    │      │   File System    │             │
│  │    Sync     │      │     Manager      │             │
│  │   Manager   │      │  (.comments I/O) │             │
│  └─────────────┘      └──────────────────┘             │
│                                                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │  File System     │
               │  *.comments      │
               │  (JSON files)    │
               └──────────────────┘
```

---

## Architecture Patterns

### 1. **Dependency Injection**
- Managers are instantiated once and shared across the extension
- Singleton pattern for state management
- Constructor injection for testability

### 2. **Event-Driven Architecture**
- VS Code event listeners for file changes, editor changes, scroll events
- Custom event emitters for internal communication
- Reactive updates to UI based on model changes

### 3. **Repository Pattern**
- `CommentRepository` abstracts file system operations
- Clean separation between business logic and I/O
- Easy to mock for testing

### 4. **Command Pattern**
- All user actions are commands
- Centralized command registration
- Supports undo/redo in future iterations

---

## Core Modules

### 1. Extension Entry Point
**File:** `src/extension.ts`

**Responsibilities:**
- Extension activation and deactivation
- Dependency injection container setup
- Command registration
- Event listener initialization

**Key Functions:**
```typescript
export function activate(context: vscode.ExtensionContext): void
export function deactivate(): void
```

---

### 2. Comment Manager
**File:** `src/core/CommentManager.ts`

**Responsibilities:**
- CRUD operations for comments
- In-memory cache of loaded comment files
- Validation of comment data
- Author attribution

**Key Methods:**
```typescript
class CommentManager {
  async loadComments(sourceUri: vscode.Uri): Promise<CommentFile>
  async saveComments(file: CommentFile): Promise<void>
  addComment(fileUri: vscode.Uri, line: number, text: string, author: string): Comment
  updateComment(fileUri: vscode.Uri, commentId: string, text: string): void
  deleteComment(fileUri: vscode.Uri, commentId: string): void
  getCommentsForLine(fileUri: vscode.Uri, line: number): Comment[]
  getCommentById(fileUri: vscode.Uri, commentId: string): Comment | undefined
}
```

**Data Structures:**
```typescript
interface CommentFile {
  file: string;           // Relative path to source file
  version: string;        // Schema version (1.0)
  comments: Comment[];
}

interface Comment {
  id: string;            // UUID v4
  line: number;          // 1-indexed line number
  text: string;          // Comment content
  author: string;        // From git config or OS username
  created: string;       // ISO 8601 timestamp
  updated: string;       // ISO 8601 timestamp
}
```

---

### 3. Paired View Manager
**File:** `src/ui/PairedViewManager.ts`

**Responsibilities:**
- Open source and comments files side-by-side
- Track active paired views
- Manage view lifecycle (open/close)
- Coordinate with ScrollSyncManager

**Key Methods:**
```typescript
class PairedViewManager {
  async openPairedView(sourceUri: vscode.Uri): Promise<void>
  closePairedView(sourceUri: vscode.Uri): void
  isPairedViewOpen(sourceUri: vscode.Uri): boolean
  getCommentsEditor(sourceUri: vscode.Uri): vscode.TextEditor | undefined
}
```

**State Management:**
- Maintains a Map of source URIs to their paired editors
- Handles cleanup when editors are closed
- Ensures only one paired view per source file

---

### 4. Scroll Sync Manager
**File:** `src/ui/ScrollSyncManager.ts`

**Responsibilities:**
- Bidirectional scroll synchronization
- Prevent infinite scroll loops
- Handle edge cases (very long files, empty files)

**Key Methods:**
```typescript
class ScrollSyncManager {
  enableSync(sourceEditor: vscode.TextEditor, commentsEditor: vscode.TextEditor): void
  disableSync(sourceUri: vscode.Uri): void
  toggleSync(sourceUri: vscode.Uri): void
  isSyncEnabled(sourceUri: vscode.Uri): boolean
}
```

**Algorithm:**
```typescript
// Percentage-based scrolling for different file lengths
private syncScrollPosition(fromEditor: vscode.TextEditor, toEditor: vscode.TextEditor): void {
  const fromRange = fromEditor.visibleRanges[0];
  const fromTopLine = fromRange.start.line;
  const fromTotalLines = fromEditor.document.lineCount;

  // Calculate percentage position
  const scrollPercentage = fromTopLine / Math.max(fromTotalLines - 1, 1);

  const toTotalLines = toEditor.document.lineCount;
  const toTargetLine = Math.floor(scrollPercentage * Math.max(toTotalLines - 1, 1));

  // Temporarily disable sync to prevent ping-pong effect
  this.syncEnabled = false;

  toEditor.revealRange(
    new vscode.Range(toTargetLine, 0, toTargetLine + 1, 0),
    vscode.TextEditorRevealType.AtTop
  );

  // Re-enable after a delay
  setTimeout(() => this.syncEnabled = true, 100);
}
```

---

### 5. Decoration Manager
**File:** `src/ui/DecorationManager.ts`

**Responsibilities:**
- Show gutter icons for lines with comments
- Display hover previews
- Update decorations when comments change
- Performance optimization (only decorate visible range)

**Key Methods:**
```typescript
class DecorationManager {
  updateDecorations(editor: vscode.TextEditor, comments: Comment[]): void
  clearDecorations(editor: vscode.TextEditor): void
  refreshDecorations(sourceUri: vscode.Uri): void
}
```

**Decoration Types:**
```typescript
// Gutter icon with hover preview
const commentDecoration = vscode.window.createTextEditorDecorationType({
  gutterIconPath: path.join(__dirname, '../icons/comment.svg'),
  gutterIconSize: '16px',
  overviewRulerColor: 'rgba(100, 150, 255, 0.5)',
  overviewRulerLane: vscode.OverviewRulerLane.Left
});
```

---

### 6. File System Manager
**File:** `src/io/FileSystemManager.ts`

**Responsibilities:**
- Read/write `.comments` files
- Create directories if needed
- Handle file not found, permission errors
- JSON parsing with validation

**Key Methods:**
```typescript
class FileSystemManager {
  async readCommentFile(uri: vscode.Uri): Promise<CommentFile | null>
  async writeCommentFile(uri: vscode.Uri, data: CommentFile): Promise<void>
  async commentFileExists(uri: vscode.Uri): Promise<boolean>
  getCommentFileUri(sourceUri: vscode.Uri): vscode.Uri
}
```

**Path Resolution:**
```typescript
// For source file: src/main.ts
// Comment file: src/main.ts.comments
function getCommentFileUri(sourceUri: vscode.Uri): vscode.Uri {
  return vscode.Uri.file(sourceUri.fsPath + '.comments');
}
```

---

## Data Flow

### Opening Paired View

```
User Action
   │
   ▼
Command: pairedComments.open
   │
   ▼
PairedViewManager.openPairedView()
   │
   ├─▶ FileSystemManager.getCommentFileUri()
   │
   ├─▶ CommentManager.loadComments()
   │      │
   │      └─▶ FileSystemManager.readCommentFile()
   │             │
   │             └─▶ Create file if doesn't exist
   │
   ├─▶ vscode.commands.executeCommand('vscode.openWith')
   │
   ├─▶ ScrollSyncManager.enableSync()
   │
   └─▶ DecorationManager.updateDecorations()
```

### Adding a Comment

```
User Action (Ctrl+Shift+A)
   │
   ▼
Command: pairedComments.addComment
   │
   ▼
Input Box: Get comment text
   │
   ▼
CommentManager.addComment()
   │
   ├─▶ Generate UUID
   ├─▶ Get current timestamp
   ├─▶ Get author from git config
   ├─▶ Add to in-memory cache
   │
   ▼
CommentManager.saveComments()
   │
   └─▶ FileSystemManager.writeCommentFile()
         │
         ▼
      Emit event: comment-added
         │
         ├─▶ DecorationManager.refreshDecorations()
         └─▶ Update comments editor (if open)
```

### Scroll Synchronization

```
User scrolls source file
   │
   ▼
Event: onDidChangeTextEditorVisibleRanges
   │
   ▼
ScrollSyncManager.onScroll()
   │
   ├─▶ Check if sync enabled
   ├─▶ Check if this is the source editor
   ├─▶ Calculate scroll percentage
   │
   ▼
Disable sync temporarily
   │
   ▼
Scroll comments editor to matching percentage
   │
   ▼
Re-enable sync after 100ms
```

---

## VS Code API Integration

### Extension Activation Events

```json
"activationEvents": [
  "onCommand:pairedComments.open",
  "onLanguage:*"  // Activate for any file type
]
```

### Command Contributions

```json
"contributes": {
  "commands": [
    {
      "command": "pairedComments.open",
      "title": "Paired Comments: Open",
      "icon": "$(comment-discussion)"
    },
    {
      "command": "pairedComments.addComment",
      "title": "Paired Comments: Add Comment"
    }
  ]
}
```

### Keybindings

```json
"keybindings": [
  {
    "command": "pairedComments.open",
    "key": "ctrl+shift+c",
    "mac": "cmd+shift+c"
  },
  {
    "command": "pairedComments.addComment",
    "key": "ctrl+shift+a",
    "mac": "cmd+shift+a",
    "when": "editorTextFocus"
  }
]
```

### Context Keys

Custom context keys for conditional UI:
- `pairedComments.viewOpen` - Paired view is active
- `pairedComments.syncEnabled` - Scroll sync is on
- `pairedComments.lineHasComment` - Current line has comment

---

## Performance Considerations

### 1. **Lazy Loading**
- Only load `.comments` files when paired view is opened
- Cache loaded files in memory
- Invalidate cache when file changes on disk

### 2. **Decoration Optimization**
- Only apply decorations to visible range
- Debounce decoration updates (100ms)
- Reuse decoration types (don't recreate)

### 3. **Scroll Sync Throttling**
- 100ms delay to prevent ping-pong effect
- Use percentage-based scrolling (fast calculation)
- Disable sync during programmatic scrolls

### 4. **File I/O**
- Debounce file writes (500ms after last edit)
- Use atomic writes (write to temp file, then rename)
- Handle large comment files (>1000 comments) efficiently

### 5. **Memory Management**
- Clear cache when editors close
- Dispose event listeners properly
- Use WeakMaps for editor-to-state associations

---

## Security & Data Integrity

### 1. **Input Validation**
- Sanitize comment text (prevent JSON injection)
- Validate line numbers (must be positive integers)
- Validate schema version on load

### 2. **Error Handling**
- Graceful degradation if `.comments` file is corrupted
- Show error messages to user, log to console
- Don't crash extension on file I/O errors

### 3. **Data Integrity**
- Validate JSON schema on every load
- Handle concurrent edits (last write wins for MVP)
- Backup old file before overwriting (`.comments.backup`)

### 4. **Permissions**
- Check file permissions before writing
- Handle read-only files gracefully
- Respect workspace trust settings

---

## Extension Points

### Future Extensibility

1. **Comment Providers** (v0.2+)
   - Interface for custom comment sources (DB, API, etc.)
   - Plugin system for 3rd-party integrations

2. **Custom Renderers** (v0.3+)
   - Markdown support in comments
   - Syntax highlighting for code snippets
   - Embedded images/diagrams

3. **Export Formats** (v0.3+)
   - Markdown export
   - HTML documentation
   - PDF reports

4. **Language Server Protocol** (v2.0+)
   - Standard protocol for comment synchronization
   - Cross-editor compatibility
   - Real-time collaboration

---

## Technology Stack

- **Language:** TypeScript 5.x
- **Runtime:** Node.js 18+
- **Framework:** VS Code Extension API 1.80+
- **Testing:** Vitest (unit) + VS Code Test Runner (integration)
- **Linting:** ESLint + Prettier
- **Build:** esbuild (bundled with vsce)

---

## File Size Estimates

| Component | Lines of Code | Complexity |
|-----------|---------------|------------|
| extension.ts | ~100 | Low |
| CommentManager.ts | ~200 | Medium |
| PairedViewManager.ts | ~150 | Medium |
| ScrollSyncManager.ts | ~120 | High |
| DecorationManager.ts | ~100 | Low |
| FileSystemManager.ts | ~150 | Medium |
| Commands (all) | ~300 | Low |
| Types & Interfaces | ~100 | Low |
| **Total** | **~1,200** | **Medium** |

---

## Dependencies

### Production
```json
{
  "vscode": "^1.80.0"  // Provided by VS Code
}
```

### Development
```json
{
  "@types/node": "^20.x",
  "@types/vscode": "^1.80.0",
  "@vscode/test-electron": "^2.3.0",
  "typescript": "^5.3.0",
  "vitest": "^1.0.0",
  "eslint": "^8.54.0",
  "prettier": "^3.1.0",
  "esbuild": "^0.19.0",
  "@vscode/vsce": "^2.22.0"
}
```

---

## Build & Deployment

### Development Build
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Package Extension
```bash
npm run package  # Creates .vsix file
```

### Run Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # Integration tests
```

---

## Questions & Decisions

### Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Use JSON for `.comments` files | Human-readable, easy to parse, git-friendly | 2025-10-16 |
| Percentage-based scroll sync | Handles different file lengths gracefully | 2025-10-16 |
| Single author per comment (MVP) | Simplifies data model, collaboration in v0.2+ | 2025-10-16 |
| No line anchoring (MVP) | Complex AST parsing, post-MVP feature | 2025-10-16 |

---

**Next Steps:** See [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md)
