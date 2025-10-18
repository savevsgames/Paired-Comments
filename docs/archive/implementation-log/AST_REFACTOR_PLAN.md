# AST-Based Ghost Markers Refactor Plan (v2.0.5)

**Status:** 🚧 In Progress
**Start Date:** 2025-10-17
**Target Completion:** 2 weeks
**Priority:** CRITICAL - Line-based ghost markers failed testing

---

## Executive Summary

**Problem:** Line-based ghost markers (v2.0) failed testing with <95% success rate. Only basic line insertion/deletion worked; cut/paste, reconciliation, and drift detection all failed.

**Solution:** Implement AST-based anchoring that tracks code semantically using VS Code's built-in Symbol Provider API.

**Impact:** This is a foundational change that will make ghost markers production-ready and enable reliable comment tracking through refactorings.

---

## Table of Contents

1. [Why AST?](#why-ast)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Phases](#implementation-phases)
4. [File Format Changes](#file-format-changes)
5. [API Design](#api-design)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)
8. [Progress Tracking](#progress-tracking)

---

## Why AST?

### Test Results from v2.0
- ✅ Insert/delete lines: Works (basic line number shifting)
- ❌ Cut/paste functions: FAILS (no reconciliation)
- ❌ Copy/paste code: FAILS (not implemented)
- ❌ Drift detection: FAILS (hashes don't match after edits)
- ❌ Rename functions: FAILS (line-based can't track semantic changes)

### What AST Solves
- **Semantic Tracking:** Track "UserManager.addUser method" instead of "line 20"
- **Survives Refactoring:** Function moves, renames, file reorganization
- **Deterministic:** Two identical code structures = same AST path
- **Built-in Support:** VS Code Symbol Provider = zero dependencies

### Example: AST vs Line-Based

**Scenario:** Move `addUser` method from line 20 to line 50

```javascript
// Before
class UserManager {        // Line 15
  constructor() { ... }    // Line 16
  addUser(user) { ... }    // Line 20 ← Comment here
}

// After (refactored - moved method down)
class UserManager {        // Line 15
  constructor() { ... }    // Line 16
  removeUser(id) { ... }   // Line 20 ← New method added
  // ... more methods ...
  addUser(user) { ... }    // Line 50 ← Method moved
}
```

**Line-based result:** Comment stuck on line 20 (wrong location!)
**AST-based result:** Comment follows `["UserManager", "addUser"]` to line 50 ✅

---

## Architecture Overview

### Current Architecture (v2.0 - Line-based)

```
┌─────────────────────────────────────────────────────────────┐
│ GhostMarkerManager                                          │
│  - Creates decorations at line numbers                      │
│  - Listens to document changes                              │
│  - Shifts line numbers up/down (basic only)                 │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ .comments File (v2.0)                                       │
│  {                                                          │
│    "ghostMarkers": [{                                       │
│      "line": 20,                                            │
│      "lineHash": "sha256...",                               │
│      "lineText": "addUser(user) {"                          │
│    }]                                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### New Architecture (v2.0.5 - AST-based)

```
┌─────────────────────────────────────────────────────────────┐
│ ASTAnchorManager (NEW)                                      │
│  - Uses VS Code Document Symbol Provider                   │
│  - Tracks symbols by path: ["UserManager", "addUser"]      │
│  - Resolves symbol paths to current line numbers           │
│  - Fallback to line-based for non-JS/TS files              │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ GhostMarkerManager (MODIFIED)                               │
│  - Delegates anchor resolution to ASTAnchorManager         │
│  - Creates decorations at resolved line numbers            │
│  - Handles anchor drift detection                          │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ .comments File (v2.0.5)                                     │
│  {                                                          │
│    "version": "2.0.5",                                      │
│    "ghostMarkers": [{                                       │
│      "line": 20,              ← Current line (cache)       │
│      "astAnchor": {           ← NEW                         │
│        "symbolPath": ["UserManager", "addUser"],           │
│        "symbolKind": "Method",                              │
│        "containerName": "UserManager"                       │
│      },                                                     │
│      "lineHash": "sha256...", ← Kept for verification      │
│      "lineText": "addUser(user) {"                          │
│    }]                                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-3)

**Goal:** Build ASTAnchorManager and integrate with VS Code Symbol Provider

**Tasks:**
- [ ] Create `src/core/ASTAnchorManager.ts`
- [ ] Implement `getSymbolAtLine(document, line)` using Symbol Provider
- [ ] Implement `resolveSymbolPath(document, symbolPath)` to find current line
- [ ] Add symbol path generation logic
- [ ] Write unit tests for AST resolution

**Files to Create:**
- `src/core/ASTAnchorManager.ts`
- `src/types/ast.ts` (AST-specific types)

**Files to Modify:**
- `src/types/index.ts` (add ASTAnchor interface)

**Acceptance Criteria:**
- ✅ Can extract symbol path from a line number
- ✅ Can resolve symbol path back to current line number
- ✅ Handles nested symbols (class → method → inner function)
- ✅ Returns null for non-symbolic locations (blank lines, comments)

---

### Phase 2: File Format Migration (Days 4-5)

**Goal:** Update file format to v2.0.5 and add migration logic

**Tasks:**
- [ ] Update `CommentFile` interface with `astAnchor` field
- [ ] Create migration function: v2.0 → v2.0.5
- [ ] Update `FileSystemManager` to handle v2.0.5 format
- [ ] Add backward compatibility (can still read v2.0)
- [ ] Test migration with existing test files

**Files to Modify:**
- `src/types/index.ts` (GhostMarker interface)
- `src/io/FileSystemManager.ts` (version detection + migration)

**Migration Logic:**
```typescript
function migrateV20ToV205(commentFile: CommentFileV20): CommentFileV205 {
  // For each ghost marker:
  //   1. Find symbol at marker.line
  //   2. Generate symbol path
  //   3. Add astAnchor field
  //   4. Keep line + lineHash for verification
  // Return upgraded file
}
```

**Acceptance Criteria:**
- ✅ Existing v2.0 .comments files auto-migrate to v2.0.5
- ✅ No data loss during migration
- ✅ Can read both v2.0 and v2.0.5 files

---

### Phase 3: Ghost Marker Integration (Days 6-8)

**Goal:** Integrate ASTAnchorManager into GhostMarkerManager

**Tasks:**
- [ ] Modify `GhostMarkerManager` to use ASTAnchorManager
- [ ] Update `createGhostMarker()` to generate AST anchors
- [ ] Update `reconcileMarkers()` to use AST resolution
- [ ] Implement hybrid approach (AST for JS/TS, line fallback for others)
- [ ] Update decoration rendering to use resolved positions

**Files to Modify:**
- `src/core/GhostMarkerManager.ts`

**Hybrid Strategy:**
```typescript
function resolveMarkerPosition(marker: GhostMarker, document: TextDocument): number {
  // If AST anchor exists and document is JS/TS:
  //   - Resolve symbol path to current line
  //   - Verify line hash (optional warning if mismatch)
  //   - Return resolved line
  // Else:
  //   - Use marker.line (line-based fallback)
  //   - Verify line hash
  //   - Return line or null if drift detected
}
```

**Acceptance Criteria:**
- ✅ Ghost markers track code through function moves
- ✅ Ghost markers track code through function renames
- ✅ Fallback works for non-JS/TS files (Python, Markdown, etc.)
- ✅ Decorations appear at correct locations after refactoring

---

### Phase 4: Testing & Validation (Days 9-11)

**Goal:** Comprehensive testing to ensure >95% success rate

**Test Scenarios:**

#### JS/TS AST Tests
1. **Function Move** - Move function up/down in file
2. **Function Rename** - Rename function, comment follows
3. **Method Move** - Move class method to different position
4. **Class Rename** - Rename class, comments on methods follow
5. **File Reorganization** - Reorder multiple functions
6. **Nested Symbols** - Comment on inner function, move outer function
7. **Insert Code** - Add new methods above/below commented method

#### Fallback Tests
8. **Python File** - Line-based fallback works
9. **Markdown File** - Line-based fallback works
10. **Plain Text** - Line-based fallback works

#### Edge Cases
11. **Symbol Deleted** - Comment becomes orphaned (drift warning)
12. **Symbol Duplicated** - Multiple symbols with same name
13. **Ambiguous Path** - Multiple classes with same method name
14. **Empty Line** - Comment on blank line (uses line-based)

**Files to Create:**
- `test-samples/ast-refactor-test.js`
- `test-samples/ast-refactor-test.js.comments`
- `docs/testing/AST_TEST_PLAN.md`

**Acceptance Criteria:**
- ✅ >95% success rate across all scenarios
- ✅ All 14 test scenarios pass
- ✅ Performance <100ms for symbol resolution
- ✅ No regressions in existing features

---

### Phase 5: Documentation & Cleanup (Days 12-14)

**Goal:** Document changes, update roadmap, prepare for release

**Tasks:**
- [ ] Update ROADMAP.md with v2.0.5 completion
- [ ] Update README.md with AST anchoring explanation
- [ ] Create docs/technical/AST_ANCHORING.md (technical deep-dive)
- [ ] Update GHOST_MARKERS_TEST_PLAN.md with AST tests
- [ ] Update PROJECT_STATUS.md
- [ ] Remove debug logging
- [ ] Code cleanup and refactoring

**Documentation to Create:**
- `docs/technical/AST_ANCHORING.md` - How AST anchoring works
- `docs/technical/SYMBOL_PROVIDER_GUIDE.md` - Using VS Code Symbol Provider

**Acceptance Criteria:**
- ✅ All documentation updated
- ✅ Roadmap reflects v2.0.5 completion
- ✅ Technical docs explain AST approach
- ✅ Code is clean and production-ready

---

## File Format Changes

### v2.0 Format (Current - Line-based)

```json
{
  "file": "test-samples/ghost-markers-demo.js",
  "version": "2.0",
  "ghostMarkers": [
    {
      "id": "gm-test-001",
      "line": 10,
      "commentIds": ["c1"],
      "lineHash": "d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9",
      "lineText": "function calculateSum(a, b) {",
      "prevLineText": "// Test 1: Simple function",
      "nextLineText": "return a + b;",
      "lastVerified": "2025-10-17T12:00:00Z"
    }
  ],
  "comments": [...]
}
```

### v2.0.5 Format (New - AST-based)

```json
{
  "file": "test-samples/ghost-markers-demo.js",
  "version": "2.0.5",
  "ghostMarkers": [
    {
      "id": "gm-test-001",
      "line": 10,
      "commentIds": ["c1"],

      "astAnchor": {
        "symbolPath": ["calculateSum"],
        "symbolKind": "Function",
        "containerName": null,
        "offset": 0
      },

      "lineHash": "d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8a9",
      "lineText": "function calculateSum(a, b) {",
      "prevLineText": "// Test 1: Simple function",
      "nextLineText": "return a + b;",
      "lastVerified": "2025-10-17T12:00:00Z"
    },
    {
      "id": "gm-test-002",
      "line": 20,
      "commentIds": ["c2"],

      "astAnchor": {
        "symbolPath": ["UserManager", "addUser"],
        "symbolKind": "Method",
        "containerName": "UserManager",
        "offset": 0
      },

      "lineHash": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      "lineText": "addUser(user) {",
      "prevLineText": "}",
      "nextLineText": "this.users.push(user);",
      "lastVerified": "2025-10-17T12:00:00Z"
    }
  ],
  "comments": [...]
}
```

### Key Differences

| Field | v2.0 | v2.0.5 | Notes |
|-------|------|--------|-------|
| `version` | "2.0" | "2.0.5" | Version identifier |
| `astAnchor` | ❌ Not present | ✅ New field | AST symbol path |
| `line` | ✅ Primary anchor | ✅ Cache only | Now just a cached value |
| `lineHash` | ✅ Verification | ✅ Verification | Still used for drift detection |

---

## API Design

### ASTAnchor Interface

```typescript
/**
 * AST-based anchor for tracking code semantically
 */
export interface ASTAnchor {
  /**
   * Symbol path from root to target
   * Example: ["UserManager", "addUser"] = UserManager.addUser method
   */
  symbolPath: string[];

  /**
   * VS Code symbol kind (Function, Method, Class, etc.)
   */
  symbolKind: string;

  /**
   * Container name (parent symbol)
   * Example: "UserManager" for a method inside UserManager class
   */
  containerName: string | null;

  /**
   * Line offset within the symbol (0 = first line of symbol)
   * Allows comments on specific lines within a function
   */
  offset: number;
}
```

### ASTAnchorManager API

```typescript
export class ASTAnchorManager {
  /**
   * Create an AST anchor for a specific line in a document
   * Returns null if no symbol found at that line
   */
  async createAnchor(
    document: vscode.TextDocument,
    line: number
  ): Promise<ASTAnchor | null>;

  /**
   * Resolve an AST anchor to current line number
   * Returns null if symbol no longer exists (deleted/renamed ambiguously)
   */
  async resolveAnchor(
    document: vscode.TextDocument,
    anchor: ASTAnchor
  ): Promise<number | null>;

  /**
   * Check if AST anchoring is supported for this file type
   */
  isSupported(document: vscode.TextDocument): boolean;

  /**
   * Get all symbols in a document (for debugging)
   */
  async getAllSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]>;
}
```

### Integration with GhostMarkerManager

```typescript
// Before (v2.0 - line-based)
async createGhostMarker(sourceUri: vscode.Uri, line: number): Promise<GhostMarker> {
  const marker: GhostMarker = {
    id: generateId(),
    line: line,
    commentIds: [],
    lineHash: await this.hashLine(document, line),
    lineText: document.lineAt(line - 1).text,
    // ...
  };
  return marker;
}

// After (v2.0.5 - AST-based)
async createGhostMarker(sourceUri: vscode.Uri, line: number): Promise<GhostMarker> {
  const document = await vscode.workspace.openTextDocument(sourceUri);

  // Try to create AST anchor
  const astAnchor = await this.astManager.createAnchor(document, line);

  const marker: GhostMarker = {
    id: generateId(),
    line: line,
    commentIds: [],
    astAnchor: astAnchor, // NEW - may be null for non-symbolic lines
    lineHash: await this.hashLine(document, line),
    lineText: document.lineAt(line - 1).text,
    // ...
  };
  return marker;
}
```

---

## Testing Strategy

### Unit Tests

**File:** `src/test/suite/ASTAnchorManager.test.ts`

```typescript
describe('ASTAnchorManager', () => {
  describe('createAnchor', () => {
    it('should create anchor for top-level function');
    it('should create anchor for class method');
    it('should create anchor for nested function');
    it('should return null for blank line');
    it('should return null for comment line');
    it('should handle offset within function body');
  });

  describe('resolveAnchor', () => {
    it('should resolve function after move');
    it('should resolve method after class rename');
    it('should return null for deleted symbol');
    it('should handle ambiguous symbol names');
  });

  describe('isSupported', () => {
    it('should support JavaScript files');
    it('should support TypeScript files');
    it('should not support Python files (fallback)');
    it('should not support plain text files (fallback)');
  });
});
```

### Integration Tests

**File:** `src/test/suite/GhostMarkerIntegration.test.ts`

```typescript
describe('Ghost Markers with AST', () => {
  it('should track comment through function move');
  it('should track comment through function rename');
  it('should track comment through class refactor');
  it('should fall back to line-based for unsupported files');
  it('should migrate v2.0 to v2.0.5 on file load');
});
```

### Manual Testing

See `docs/testing/AST_TEST_PLAN.md` for comprehensive manual test scenarios.

---

## Rollback Plan

### If AST Fails (<95% success rate)

**Option A: Revert to v2.0**
- Remove `astAnchor` field from file format
- Revert GhostMarkerManager changes
- Keep line-based tracking
- **Impact:** Ghost markers remain unreliable for refactorings

**Option B: Hybrid Approach**
- Keep AST for simple cases (top-level functions)
- Use line-based for complex cases (nested symbols)
- Add configuration option to disable AST
- **Impact:** Reduced reliability but better than pure line-based

**Option C: Delay Feature**
- Mark ghost markers as "experimental"
- Add warning in UI
- Continue development in separate branch
- **Impact:** Honest about limitations, buy more dev time

### Rollback Procedure

1. Checkout previous commit before AST refactor
2. Keep v2.0.5 file format reader (backward compatibility)
3. Add downgrade migration: v2.0.5 → v2.0 (strip astAnchor field)
4. Update documentation with rollback notes
5. Release as v2.0.1 (bug fix release)

---

## Progress Tracking

### Phase Checklist

- [ ] **Phase 1:** Core Infrastructure (Days 1-3)
- [ ] **Phase 2:** File Format Migration (Days 4-5)
- [ ] **Phase 3:** Ghost Marker Integration (Days 6-8)
- [ ] **Phase 4:** Testing & Validation (Days 9-11)
- [ ] **Phase 5:** Documentation & Cleanup (Days 12-14)

### Phase Completion Status

- [x] **Phase 1:** Core Infrastructure ✅ COMPLETE
- [x] **Phase 2:** File Format Migration ✅ COMPLETE
- [x] **Phase 3:** Ghost Marker Integration ✅ COMPLETE
- [ ] **Phase 4:** Testing & Validation 🧪 IN PROGRESS (debugging)
- [ ] **Phase 5:** Documentation & Cleanup

### Daily Log

#### Day 1 (2025-10-17)
- [x] Created AST_REFACTOR_PLAN.md
- [x] Completed Phase 1: ASTAnchorManager implementation
- [x] Completed Phase 2: File format migration to v2.0.5
- [x] Completed Phase 3: Ghost marker integration
- [x] Created test files and test plan
- [x] Started Phase 4: Testing and debugging
- **Status:** All phases complete, now debugging cut/paste tracking

---

## Implementation Changelog

### 2025-10-17 - Testing Phase Issues & Fixes

#### Issue #1: Symbol Provider Returns Empty During Document Edits
**Problem:** When cutting/pasting code, VS Code's Symbol Provider returns no symbols because document is in transitional state.

**Symptoms:**
- Cut function → AST verification runs → no symbols found → falls back to line-based
- Marker doesn't move to pasted location

**Root Cause:** Symbol Provider needs time to parse document after edits, initial 100ms retry was insufficient.

**Fix Applied:**
```typescript
// ASTAnchorManager.ts - getAllSymbols()
// Changed from: Single 100ms retry
// Changed to: 3 retries with progressive delays (200ms, 300ms, 400ms)
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  const waitTime = 200 + (i * 100); // Progressive backoff
  await new Promise(resolve => setTimeout(resolve, waitTime));
  // Retry symbol provider...
}
```

**Files Modified:**
- `src/core/ASTAnchorManager.ts` - Added progressive retry logic

---

#### Issue #2: Immediate Verification Runs Before Document Settles
**Problem:** When marker detected in deleted range, verification triggered immediately while document still being edited.

**Symptoms:**
- Popup shows "🚨 Ghost marker in deleted range..."
- But AST verification fails because document in flux

**Fix Applied:**
```typescript
// GhostMarkerManager.ts - updateMarkerPositions()
// Changed from: Immediate verification (0ms)
// Changed to: Priority verification (100ms delay)
this.verificationTimer = setTimeout(() => {
  console.log('[GhostMarkerManager] Running priority verification after document settled...');
  void this.verifyMarkers(event.document);
}, 100); // Let document settle before verification
```

**Files Modified:**
- `src/core/GhostMarkerManager.ts` - Changed immediate to delayed priority verification

---

#### Issue #3: Decoration Not Refreshing After AST Resolution
**Problem:** AST successfully resolved marker to new location, but gutter icon didn't move.

**Symptoms:**
- Console shows: `[AST] Symbol found at line 120`
- Console shows: `[GhostMarker] Marker moved: 13 → 120`
- But gutter icon still at line 13

**Fix Applied:**
```typescript
// GhostMarkerManager.ts - verifyMarkerWithAST()
// Added explicit decoration refresh after marker moves
if (editor && editor.document === document) {
  console.log(`[GhostMarker] Refreshing decoration at new location (line ${newLine})`);
  this.applyDecoration(editor, markerState);
}
```

**Files Modified:**
- `src/core/GhostMarkerManager.ts` - Added decoration refresh after AST resolution

---

#### Enhanced Logging Added

To aid debugging, comprehensive logging was added throughout the AST system:

**ASTAnchorManager:**
- Symbol resolution attempts with detailed paths
- Retry attempts with timing information
- Success/failure indicators with emojis

**GhostMarkerManager:**
- Document change events with before/after marker positions
- Detection of markers in deleted ranges
- Verification timing and results

**Console Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[GhostMarkerManager] Document changed: ast-test.js
[GhostMarkerManager] Markers BEFORE update:
  - Marker gm-ast-001: line 13, text: "function calculateTotal(items) {"
⚠️ WARNING: Marker at line 13 is INSIDE change range 13-15!
🚨 Markers in deleted range - triggering PRIORITY verification!
[AST] 🔍 Resolving anchor: calculateTotal
[AST] Retry 1/3: Waiting 200ms for language server...
[AST] ✓ Retry 1 successful! Found 7 symbols
[AST] ✅ Symbol found at line 120
[GhostMarker] Refreshing decoration at new location (line 120)
```

**Files Modified:**
- `src/core/ASTAnchorManager.ts` - Added detailed resolution logging
- `src/core/GhostMarkerManager.ts` - Added change detection and verification logging
- `src/extension.ts` - Added startup banner

---

### Testing Status

**Current Status:** 🧪 In Progress

**What Works:**
- ✅ Extension activates and loads
- ✅ File migration v2.0 → v2.0.5 works
- ✅ AST anchors created successfully
- ✅ Symbol Provider retry logic works
- ✅ Scroll synchronization works
- ✅ Comment navigation works

**What's Being Debugged:**
- ⚠️ Cut/paste function tracking (symbols not available during edit)
- ⚠️ Decoration refresh timing

**Next Steps:**
1. Test with longer delays to see if symbols become available
2. Consider alternative approach: track paste events separately
3. Evaluate if Symbol Provider is reliable enough for real-time tracking

---

### Technical Decisions Made

#### Decision: Progressive Retry Strategy
**Context:** Symbol Provider unreliable during active document editing

**Options Considered:**
1. Single retry with fixed delay
2. Event-based waiting (onDidChangeTextDocument complete)
3. Progressive retry with backoff

**Decision:** Option 3 - Progressive retry with 200/300/400ms delays

**Rationale:**
- No event for "document edit complete"
- Fixed delay might be too short or unnecessarily long
- Progressive backoff balances responsiveness vs reliability

---

#### Decision: Priority Verification (100ms) vs Immediate (0ms)
**Context:** Markers in deleted range need quick verification, but document needs time to settle

**Decision:** 100ms priority delay (faster than normal 500ms debounce, slower than immediate)

**Rationale:**
- 0ms too fast - document still in flux
- 500ms too slow - user expects quick response
- 100ms sweet spot - document settled, still feels responsive

---

---

## References

- [VS Code Symbol Provider API](https://code.visualstudio.com/api/references/vscode-api#DocumentSymbolProvider)
- [VS Code DocumentSymbol](https://code.visualstudio.com/api/references/vscode-api#DocumentSymbol)
- [TypeScript AST Handbook](https://basarat.gitbook.io/typescript/overview)
- Project ROADMAP.md - Phase 2.0.5
- Ghost Markers v2.0 Test Results

---

## Notes & Decisions

### Why Not Use a Full AST Parser?
- **Complexity:** Would need separate parsers for each language
- **Dependencies:** Heavy npm packages (Babel, TypeScript compiler, etc.)
- **Performance:** Parsing entire files on every edit
- **Built-in Alternative:** VS Code Symbol Provider does 90% of what we need

### Why Keep Line Numbers?
- **Performance:** Cached line number = instant decoration rendering
- **Backward Compatibility:** Can still read v1.0/v2.0 files
- **Fallback:** If AST resolution fails, use cached line number
- **Verification:** Compare cached line with resolved line to detect drift

### Symbol Path vs AST Node IDs
- **Symbol Path:** Human-readable, survives renames (if we update path)
- **AST Node IDs:** Fragile, breaks on any code change
- **Decision:** Use symbol paths for robustness

---

**Last Updated:** 2025-10-17
**Document Owner:** Greg + Claude Code
**Status:** 🚧 Active Development
