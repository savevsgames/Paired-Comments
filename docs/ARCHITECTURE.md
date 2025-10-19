# Paired Comments - Technical Architecture

**Version:** 2.1.0 (MVP Format - AST-Based + Range Comments)
**Last Updated:** October 19, 2025 (Post-De-Migration)

> **Note:** This document describes the current MVP architecture. All legacy migration code has been removed.
> MVP uses v2.1.0 format exclusively - no backward compatibility with pre-v2.1.0 formats.

---

## System Overview

Paired Comments is a VS Code extension that stores rich annotations in separate `.comments` files using **AST-based automatic line tracking** to keep comments synchronized with code through refactoring.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                VS Code Extension Host                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Extension.ts → Command Handlers                         │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────────────────────────────────┐           │
│  │        GhostMarkerManager (Hybrid)        │           │
│  │  ┌─────────────┐      ┌────────────────┐ │           │
│  │  │   AST       │      │  Line-Based    │ │           │
│  │  │  Tracking   │◀────▶│   Fallback     │ │           │
│  │  │(JS/TS)      │      │ (All Languages)│ │           │
│  │  └─────────────┘      └────────────────┘ │           │
│  └──────────────────────────────────────────┘           │
│         │                    │                            │
│         ▼                    ▼                            │
│  ┌─────────────┐     ┌──────────────┐                   │
│  │ Decoration  │     │  CodeLens    │                   │
│  │  Manager    │     │  Provider    │                   │
│  │(Gutter Icons)     │(Click to Open)│                   │
│  └─────────────┘     └──────────────┘                   │
│                                                           │
│  ┌──────────────────────────────────────────┐           │
│  │        CommentManager (CRUD)              │           │
│  │  - Load/Save comments                     │           │
│  │  - File I/O with caching                  │           │
│  └──────────────────────────────────────────┘           │
│                        │                                  │
└────────────────────────┼──────────────────────────────────┘
                         ▼
                  ┌──────────────┐
                  │ .comments    │
                  │ JSON Files   │
                  └──────────────┘
```

---

## Core Components

### 1. ASTAnchorManager

**Purpose:** Track code structure using VS Code's Symbol Provider API

**Key Features:**
- Uses `vscode.executeDocumentSymbolProvider` (built-in, no dependencies)
- Supports JavaScript, TypeScript (more languages in v2.0.7+)
- Progressive retry strategy (200ms, 300ms, 400ms waits for language server)
- Confidence-based resolution (exact, moved, ambiguous)
- Symbol path tracking (e.g., `["MyClass", "myMethod"]`)

**Code:**
```typescript
export class ASTAnchorManager {
  async getASTAnchor(document, line): Promise<ASTAnchor | null> {
    // Get symbols from VS Code
    const symbols = await vscode.commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    // Find symbol at this line
    const symbol = this.findSymbolAtLine(symbols, line);

    return {
      symbolPath: this.buildSymbolPath(symbol),
      symbolKind: vscode.SymbolKind[symbol.kind],
      offset: document.offsetAt(symbol.range.start)
    };
  }

  async resolveASTAnchor(document, anchor): Promise<number | null> {
    // Search for matching symbol by path
    const symbol = this.findSymbolByPath(symbols, anchor.symbolPath);
    return symbol ? symbol.range.start.line : null;
  }
}
```

---

### 2. GhostMarkerManager (Hybrid Tracking)

**Purpose:** Automatic line tracking with AST (primary) + line-based fallback

**Tracking Strategy:**
1. **AST-based** - For functions, methods, classes (JS/TS)
2. **Line-based** - For standalone lines, comments, unsupported languages
3. **Auto-detection** - Determines best strategy per marker

**Key Features:**
- Document change listeners
- Copy/paste detection → Creates duplicate markers
- Cut/paste detection → Moves marker to new location
- Live UI updates (decorations, CodeLens follow code)

**Code:**
```typescript
export class GhostMarkerManager {
  async verifyMarkerWithAST(marker: GhostMarker): Promise<ReconResult> {
    if (!marker.astAnchor) {
      return this.verifyLine-based(marker); // Fallback
    }

    // Try AST resolution
    const newLine = await this.astManager.resolveASTAnchor(
      document,
      marker.astAnchor
    );

    if (newLine !== null) {
      // AST found symbol → Update marker position
      marker.line = newLine;
      return { status: 'auto-fixed', confidence: 'exact' };
    }

    // AST failed → Fall back to line-based
    return this.verifyLine-based(marker);
  }
}
```

---

### 3. DecorationManager

**Purpose:** Visual indicators (gutter icons, hover previews)

**Key Features:**
- Uses LIVE ghost marker positions (not stale file data)
- Tag-based coloring (TODO orange, FIXME red, etc.)
- Hover shows comment preview
- Updates automatically when code moves

**Code:**
```typescript
export class DecorationManager {
  applyDecorations(editor: vscode.TextEditor) {
    // Get LIVE markers (not file data!)
    const liveMarkers = this.ghostMarkerManager.getMarkers(editor.document.uri);

    for (const marker of liveMarkers) {
      const decoration = this.createDecoration(marker);
      editor.setDecorations(decorationType, [decoration]);
    }
  }
}
```

---

### 4. CodeLensProvider

**Purpose:** "Click to Open" links in editor

**Key Features:**
- Uses LIVE ghost marker positions
- Updates when code moves
- Integrated with VS Code's CodeLens API

**Code:**
```typescript
export class CommentCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document): vscode.CodeLens[] {
    // Get LIVE markers
    const liveMarkers = this.ghostMarkerManager.getMarkers(document.uri);

    return liveMarkers.map(marker => new vscode.CodeLens(
      new vscode.Range(marker.line, 0, marker.line, 0),
      {
        title: `💬 ${commentText} - Click to open`,
        command: 'pairedComments.openAndNavigate',
        arguments: [document.uri, marker.line] // LIVE line number
      }
    ));
  }
}
```

---

## Data Flow

### Cut/Paste Function (AST Tracking)

```
1. User cuts lines 10-15 (function calculateTotal)
2. GhostMarkerManager detects change
   → Marker at line 10 is in deleted range
3. Trigger PRIORITY verification (100ms delay)
4. ASTAnchorManager resolves symbol "calculateTotal"
   → Retry 1: Wait 200ms for Symbol Provider
   → Success! Symbol found at line 120
5. Update marker: line 10 → 120
6. Refresh UI:
   → DecorationManager moves gutter icon to line 120
   → CodeLensProvider updates link to line 120
7. User sees icon at new location!
```

### Copy/Paste Function (Duplicate Detection)

```
1. User copies lines 10-15, pastes at line 50
2. GhostMarkerManager detects +5 lines inserted
3. Check if pasted content matches existing markers
   → Hash "function calculateTotal" matches marker at line 10
4. Create NEW ghost marker:
   → New ID: gm-xyz789
   → Line: 50
   → Same comment IDs as original
   → Same AST anchor (different position)
5. Both markers now exist:
   → Original at line 10
   → Duplicate at line 50
6. Both show same comment when clicked
```

---

## File Format (v2.1.0 - MVP Format)

```json
{
  "version": "2.1.0",
  "ghostMarkers": [
    {
      "id": "gm-abc123",
      "line": 42,
      "endLine": 50,  // NEW in v2.0.6: Range support
      "commentIds": ["c1", "c2"],
      "lineHash": "279296474db90992",
      "lineText": "function calculateTotal(items) {",
      "prevLineText": "// Calculate total price",
      "nextLineText": "  let total = 0;",
      "lastVerified": "2025-10-18T10:30:00Z",

      "astAnchor": {
        "symbolPath": ["calculateTotal"],
        "symbolKind": "Function",
        "offset": 1250,
        "containerName": null
      }
    }
  ],
  "comments": [
    {
      "id": "c1",
      "line": 42,
      "startLine": 42,  // NEW in v2.0.6: Explicit start line
      "endLine": 50,    // NEW in v2.0.6: Explicit end line
      "ghostMarkerId": "gm-abc123",
      "text": "This entire function needs input validation and error handling",
      "tag": "TODO",
      "author": "Greg",
      "created": "2025-10-15T14:20:00Z",
      "updated": "2025-10-15T14:20:00Z"
    }
  ]
}
```

### Range Comments (v2.1.0)

**Single-Line vs Range Comments:**

**Single-line:**
- Ghost marker has `line` only
- Comment has `line` only
- One gutter icon (single letter: `T`, `N`, `F`, etc.)

**Range:**
- Ghost marker has `line` (start) + `endLine` (end)
- Comment has `line`, `startLine`, and `endLine`
- Two gutter icons (two letters: `TS`/`TE`, `NS`/`NE`, etc.)

**Format Compatibility:**
- v2.1.0 ONLY reads v2.1.0 files (no backward compatibility)
- Missing `endLine` field = single-line comment
- No migration support in MVP

---

## Range Comments Deep Dive (v2.1.0)

### Two-Letter Gutter Icons

**Design Decision:** Use two-letter codes to visually distinguish range markers from single-line comments.

**Gutter Icon Codes:**
| Tag | Single | Range Start | Range End | Color |
|-----|---------|-------------|-----------|-------|
| TODO | `T` | `TS` | `TE` | Orange |
| NOTE | `N` | `NS` | `NE` | Blue |
| FIXME | `F` | `FS` | `FE` | Red |
| QUESTION | `Q` | `QS` | `QE` | Purple |
| HACK | `H` | `HS` | `HE` | Dark Orange |
| WARNING | `W` | `WS` | `WE` | Yellow-Orange |
| STAR | `S` | `SS` | `SE` | Gold |
| (none) | `C` | `CS` | `CE` | Blue |

**Visual Specifications:**
```typescript
// Single-line icon
{
  radius: 7px,
  fontSize: 10px,
  stroke: none,
  bold: false
}

// Range start icon (TS, NS, etc.)
{
  radius: 8px,      // Larger!
  fontSize: 7px,    // Smaller text (2 letters)
  stroke: 2px,      // Bold border
  bold: true
}

// Range end icon (TE, NE, etc.)
{
  radius: 7px,      // Same as single-line
  fontSize: 7px,    // Smaller text (2 letters)
  stroke: none,
  bold: false
}
```

**Why these choices:**
- **Start icon larger** - Draws attention to the beginning of the range
- **Start icon has border** - Further visual emphasis
- **End icon smaller** - Subtle marker, doesn't dominate visually
- **Two letters** - Clear distinction from single-line comments

### Range Tracking Logic

**GhostMarkerManager Changes:**

```typescript
// Create range marker
async createMarker(
  document: vscode.TextDocument,
  line: number,
  commentIds: string[],
  endLine?: number  // NEW parameter
): Promise<GhostMarker> {
  const marker: GhostMarker = {
    id: this.generateId(),
    line,
    endLine,  // Optional: undefined = single-line
    commentIds,
    lineHash: this.hashLine(document, line),
    lineText: document.lineAt(line).text,
    // ... other fields
  };

  // If endLine provided, track range
  if (endLine && endLine > line) {
    console.log(`[GhostMarker] Created RANGE marker: lines ${line}-${endLine}`);
  }

  return marker;
}

// Check if line is within range
getMarkerAtLine(uri: vscode.Uri, line: number): GhostMarker | undefined {
  const markers = this.markers.get(uri.toString()) || [];

  return markers.find(m => {
    // Single-line: exact match
    if (!m.endLine) {
      return m.line === line;
    }

    // Range: check if line is within bounds (inclusive)
    return line >= m.line && line <= m.endLine;
  });
}

// Update marker positions on document changes
updateMarkerPositions(edit: vscode.TextDocumentChangeEvent) {
  for (const marker of markers) {
    // Shift start line
    if (marker.line > changeEndLine) {
      marker.line += lineDelta;
    }

    // Shift end line (if range marker)
    if (marker.endLine && marker.endLine > changeEndLine) {
      marker.endLine += lineDelta;
    }
  }
}
```

### DecorationManager Changes

**Decoration Type Initialization:**

```typescript
// Create 3 decoration types per tag:
// 1. Single-line (e.g., "TODO")
// 2. Range start (e.g., "TODO-start")
// 3. Range end (e.g., "TODO-end")

for (const tag of ALL_TAGS) {
  const color = TAG_COLORS[tag];

  // Single-line decoration
  this.decorations.set(`${tag}`, vscode.window.createTextEditorDecorationType({
    gutterIconPath: this.createGutterIcon('T', color, false),
    // ...
  }));

  // Range start decoration (larger, bold)
  this.decorations.set(`${tag}-start`, vscode.window.createTextEditorDecorationType({
    gutterIconPath: this.createGutterIcon('TS', color, true),  // isLarger = true
    // ...
  }));

  // Range end decoration (smaller, no bold)
  this.decorations.set(`${tag}-end`, vscode.window.createTextEditorDecorationType({
    gutterIconPath: this.createGutterIcon('TE', color, false),  // isLarger = false
    // ...
  }));
}
```

**Decoration Application:**

```typescript
applyDecorations(editor: vscode.TextEditor, markers: GhostMarker[]) {
  // Separate single-line from range markers
  const singleMarkers = markers.filter(m => !m.endLine);
  const rangeMarkers = markers.filter(m => m.endLine);

  // Apply single-line decorations (one per marker)
  for (const marker of singleMarkers) {
    const decorationType = this.decorations.get(`${marker.tag}`);
    const range = new vscode.Range(marker.line, 0, marker.line, 0);
    editor.setDecorations(decorationType, [range]);
  }

  // Apply range decorations (TWO per marker)
  for (const marker of rangeMarkers) {
    const tag = marker.tag || 'default';

    // Start decoration
    const startType = this.decorations.get(`${tag}-start`);
    const startRange = new vscode.Range(marker.line, 0, marker.line, 0);
    editor.setDecorations(startType, [startRange]);

    // End decoration
    const endType = this.decorations.get(`${tag}-end`);
    const endRange = new vscode.Range(marker.endLine, 0, marker.endLine, 0);
    editor.setDecorations(endType, [endRange]);
  }
}
```

### Hover Messages (Smart Context)

**Position-Aware Hover:**

```typescript
provideHover(document, position): vscode.Hover | null {
  const line = position.line + 1; // Convert to 1-indexed
  const marker = this.ghostMarkerManager.getMarkerAtLine(document.uri, line);

  if (!marker) return null;

  // Range marker: different hover for start vs end
  if (marker.endLine) {
    if (line === marker.line) {
      // Hovering over START marker
      return new vscode.Hover(`**Range Comment (lines ${marker.line}-${marker.endLine})**\n\n${commentText}`);
    } else {
      // Hovering over END marker
      return new vscode.Hover(`**Range Comment (end)**\n\nLines ${marker.line}-${marker.endLine}`);
    }
  }

  // Single-line marker: standard hover
  return new vscode.Hover(`**Comment**\n\n${commentText}`);
}
```

### Command Structure (S/R/A)

**v2.1.0 Command Architecture:**

```typescript
// Ctrl+Alt+P S - Single-line comment
async function addSingleComment() {
  const line = editor.selection.active.line + 1;
  const text = await vscode.window.showInputBox({
    prompt: `Add single-line comment for line ${line}`,
  });
  await commentManager.addComment(uri, { line, text });
}

// Ctrl+Alt+P R - Range comment
async function addRangeComment() {
  const startLine = editor.selection.active.line + 1;

  // Ask for end line
  const endLineStr = await vscode.window.showInputBox({
    prompt: `Range comment starting at line ${startLine}. Enter end line number:`,
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) return 'Please enter a valid line number';
      if (num <= startLine) return `End line must be greater than ${startLine}`;
      return null;
    }
  });

  const endLine = parseInt(endLineStr);

  // Ask for comment text
  const text = await vscode.window.showInputBox({
    prompt: `Add range comment for lines ${startLine}-${endLine}`,
  });

  await commentManager.addComment(uri, { line: startLine, endLine, text });
}

// Ctrl+Alt+P A - Reserved for future versions (smart add)
async function addComment() {
  void vscode.window.showInformationMessage(
    'Smart Add (Ctrl+Alt+P A) is reserved for future updates. Use:\n' +
    '• Ctrl+Alt+P S for Single-line comments\n' +
    '• Ctrl+Alt+P R for Range comments'
  );
}
```

**Design Rationale:**
- **Explicit commands (S/R)** - Clear user intent, simpler implementation
- **Reserved A command** - Future "smart add" feature (auto-detect or double-tap)
- **Separate code paths** - Easier debugging and maintenance
- **Changed L command** - "List All Comments" moved from S to L (avoid conflict)

### v2.1.0 Format (No Migration Support)

**Schema Requirements:**
1. `COMMENT_FILE_VERSION`: Must be `'2.1.0'`
2. `GhostMarker`: Optional `endLine?: number` for ranges
3. `Comment`: Optional `startLine?: number` and `endLine?: number` for ranges
4. All comments must have `created` and `updated` fields (ISO 8601 timestamps)
5. No `timestamp` field support (pre-v2.1.0 format)

**Migration Removed:**
```typescript
// MVP uses v2.1.0 format only - no migration support
// All legacy migration code removed (211 lines)
// Files must be in v2.1.0 format or will be rejected
// Migration support can be added post-MVP if needed
```

**Helper Functions (types.ts):**
```typescript
// Check if comment/marker is a range
export function isRangeComment(comment: Comment): boolean {
  return comment.endLine !== undefined && comment.endLine > comment.line;
}

export function isRangeMarker(marker: GhostMarker): boolean {
  return marker.endLine !== undefined && marker.endLine > marker.line;
}

// Get gutter codes
export function getRangeGutterCode(tag: CommentTag, isStart: boolean): string {
  const letter = TAG_LETTERS[tag] || 'C';
  return isStart ? `${letter}S` : `${letter}E`;
}

export function getSingleGutterCode(tag: CommentTag): string {
  return TAG_LETTERS[tag] || 'C';
}
```

---

## Performance

### Targets (Achieved in v2.0.5)
- ✅ AST resolution: <100ms (avg ~50ms)
- ✅ Symbol Provider retry: <900ms max (usually 200-400ms)
- ✅ Gutter icon update: <50ms
- ✅ Copy detection: <20ms (hash comparison)

### Optimizations
- **Symbol caching** - Cache symbols for 500ms after retrieval
- **Debounced verification** - 500ms after document changes
- **Priority verification** - 100ms for deleted ranges (urgent)
- **Hash-based matching** - O(1) line comparison for duplicates

---

## VS Code API Integration

### Symbol Provider API
```typescript
const symbols = await vscode.commands.executeCommand(
  'vscode.executeDocumentSymbolProvider',
  document.uri
);
```

**What we get:**
- Functions, methods, classes, interfaces
- Nested symbols (methods inside classes)
- Symbol ranges (start/end positions)
- Symbol kinds (Function, Method, Class, etc.)

**Supported Languages** (via VS Code's built-in language servers):
- JavaScript ✅
- TypeScript ✅
- Python 📋 (Future)
- Go 📋 (Future)
- Rust 📋 (Future)
- Java 📋 (Future)

---

## Testing Strategy

### Unit Tests (Mocha + Chai)
- `contentAnchor.test.ts` - Hash utilities (9 tests passing)
- Future: `ASTAnchorManager.test.ts`, `GhostMarkerManager.test.ts`

### Integration Tests (TBD)
- AST tracking through cut/paste
- Copy detection
- Fallback to line-based

### E2E Tests (TBD)
- Full user workflows
- Multi-file scenarios

**See:** [testing/TESTING_STRATEGY.md](testing/TESTING_STRATEGY.md)

---

## Design Decisions

### Why AST-based tracking?
**Problem:** Line numbers change when code is edited (insert/delete lines)
**Solution:** Track code structure (functions, classes) instead of line numbers
**Result:** Comments survive 95%+ of refactorings vs. ~30% with line-only

### Why hybrid (AST + line-based)?
**AST Limitations:**
- Requires language server support (not all languages)
- Doesn't work for standalone lines (comments, imports)
- Symbol Provider can fail (syntax errors, large files)

**Hybrid Strategy:**
- Use AST when available (functions, methods, classes)
- Fall back to line-based for everything else
- Best of both worlds: robust tracking + universal support

### Why VS Code Symbol Provider (not custom parser)?
**Alternatives Considered:**
- `@babel/parser` - JavaScript only, large dependency
- `typescript` compiler - TypeScript only, very large
- Tree-sitter - Requires native bindings, complex setup

**VS Code Symbol Provider Wins:**
- ✅ Already loaded (zero dependencies)
- ✅ Multi-language (JS, TS, Python, Go, Rust, Java, C++)
- ✅ Battle-tested (used by VS Code's outline view)
- ✅ Fast (optimized by VS Code team)
- ✅ Incremental parsing (updates on change)

---

## Future Enhancements

### Post-MVP: Error Handling & Recovery Improvements
- Enhanced retry strategies
- Better error recovery mechanisms
- More detailed error messages

### Post-MVP: Inline Export/Import
- Export range comments as inline markers
- Import inline comments back to `.comments` files
- Visibility toggle for inline markers

### Post-MVP: Params & AI Metadata (KILLER FEATURE)
- Dynamic parameters (`${functionName}`, `${propCount}`)
- AI metadata (token estimation, complexity scoring)
- Privacy controls (.commentsrc configuration)
- Hash tree architecture for efficient change tracking

### Post-MVP: Output Capture
- Jupyter notebook-style runtime value capture
- Template system for common patterns
- Debug adapter integration

### Post-MVP: Multi-Language AST
- Python support (using Pyright language server)
- Go support (using gopls)
- Rust support (using rust-analyzer)
- Java, C#, C++ support

### Post-MVP: Legacy Migration Support
- Migration from v1.x, v2.0.x formats to v2.1.0
- Backward compatibility for existing users
- Migration tools and documentation

---

## Related Documentation

- [Feature Guide](FEATURES.md) - What each feature does
- [Roadmap](ROADMAP.md) - Future plans
- [Current Milestone](milestones/CURRENT.md) - What we're working on now
- [Testing Strategy](testing/TESTING_STRATEGY.md) - How we test
