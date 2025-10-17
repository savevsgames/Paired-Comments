# Ghost Markers - Automatic Line Tracking System

**Milestone:** Development Checkpoint v0.2.0
**Status:** Design Phase
**Priority:** Critical - Core Architecture

---

## Overview

Ghost Markers are invisible decorations that anchor comments to specific lines of code and automatically track line number changes as the code is edited. They solve the fundamental problem of **comment drift** - when line numbers in comment files become misaligned with the actual code.

## The Problem

Traditional comment systems store comments with static line numbers:

```json
{
  "line": 42,
  "text": "This calculates the total"
}
```

**What happens when code changes?**
- Insert a line above → Comment now points to wrong line (43 instead of 42)
- Delete a line above → Comment points to wrong content
- Refactor code → Comments become orphaned
- No way to detect drift → Silent corruption of comment data

## The Solution: Ghost Markers

Ghost Markers combine three technologies:

1. **VS Code Decorations** - Auto-move with code edits
2. **Content Anchoring** - Hash-based verification
3. **3-Line Fingerprinting** - Drift detection and auto-reconciliation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ SOURCE FILE (App.js)                                     │
├─────────────────────────────────────────────────────────┤
│ 40: // Import statements                                │
│ 41: import React from 'react';                          │
│ 42: function calculateTotal() { 👻 ← Ghost Marker      │
│ 43:   const total = 0;                                  │
│ 44:   return total;                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ COMMENTS FILE (App.js.comments)                         │
├─────────────────────────────────────────────────────────┤
│ {                                                        │
│   "ghostMarkers": [                                     │
│     {                                                    │
│       "id": "gm-abc123",                                │
│       "line": 42,                                       │
│       "commentIds": ["c1", "c2"],                       │
│       "lineHash": "sha256:7f8e9...",                    │
│       "lineText": "function calculateTotal() {",        │
│       "prevLineText": "import React from 'react';",     │
│       "nextLineText": "  const total = 0;",             │
│       "lastVerified": "2025-10-17T10:00:00Z"            │
│     }                                                    │
│   ],                                                     │
│   "comments": [...]                                     │
│ }                                                        │
└─────────────────────────────────────────────────────────┘
```

## Data Structure

### GhostMarker Type

```typescript
interface GhostMarker {
  /** Unique identifier for this ghost marker */
  id: string;

  /** Current line number (1-indexed) - auto-updated by VS Code decoration */
  line: number;

  /** Array of comment IDs anchored to this line */
  commentIds: string[];

  /** SHA-256 hash (first 16 chars) of the current line text */
  lineHash: string;

  /** Actual text of the current line (for verification) */
  lineText: string;

  /** Text of the line above (for 3-line fingerprinting) */
  prevLineText: string;

  /** Text of the line below (for 3-line fingerprinting) */
  nextLineText: string;

  /** ISO 8601 timestamp of last hash verification */
  lastVerified: string;

  /** VS Code decoration type (internal, not serialized) */
  decoration?: vscode.TextEditorDecorationType;
}
```

### Updated Comment Type

```typescript
interface Comment {
  id: string;
  line: number;  // Kept for backwards compatibility, but ghostMarker.line is source of truth

  // NEW: Reference to ghost marker
  ghostMarkerId?: string;

  // Existing fields...
  text: string;
  author: string;
  created: string;
  updated: string;
  tag?: CommentTag;

  // Range support (comments can span multiple lines in .comments file)
  startLine?: number;
  endLine?: number;

  // Content anchoring (optional, ghost marker provides this)
  lineHash?: string;
  lineText?: string;
}
```

## How It Works

### 1. Creating a Ghost Marker

When a user adds a comment to line 42:

```typescript
// 1. Create ghost marker
const marker: GhostMarker = {
  id: generateId('gm-'),
  line: 42,
  commentIds: ['new-comment-id'],
  lineHash: hashLine(document.lineAt(41).text),  // 0-indexed
  lineText: document.lineAt(41).text.trim(),
  prevLineText: document.lineAt(40).text.trim(),
  nextLineText: document.lineAt(42).text.trim(),
  lastVerified: new Date().toISOString()
};

// 2. Create VS Code decoration (invisible, tracks line movement)
const decoration = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
});

// 3. Apply decoration to track line
editor.setDecorations(decoration, [
  new vscode.Range(new vscode.Position(41, 0), new vscode.Position(41, 0))
]);

// 4. Save to .comments file
commentFile.ghostMarkers.push(marker);
```

### 2. Automatic Line Tracking

VS Code decorations automatically update when code is edited:

```
BEFORE:
41: import React from 'react';
42: function calculateTotal() {  👻 ← Ghost marker at line 42
43:   const total = 0;

USER INSERTS LINE:
41: import React from 'react';
42: import { useState } from 'react';  ← New line inserted
43: function calculateTotal() {  👻 ← VS Code auto-moved decoration to line 43!
44:   const total = 0;
```

**The decoration automatically moves, but we need to verify the content is still correct!**

### 3. Hash Verification (On Document Change)

Every time the document changes, we verify the hash:

```typescript
function onDocumentChange(event: vscode.TextDocumentChangeEvent) {
  const markers = getGhostMarkersForDocument(event.document.uri);

  for (const marker of markers) {
    // Get current line text at marker position
    const currentLineText = event.document.lineAt(marker.line - 1).text;
    const currentHash = hashLine(currentLineText);

    if (currentHash === marker.lineHash) {
      // ✅ Hash matches - all good!
      marker.lastVerified = new Date().toISOString();
    } else {
      // ❌ Hash mismatch - drift detected!
      await reconcileGhostMarker(marker, event.document);
    }
  }
}
```

### 4. Auto-Reconciliation (3-Line Fingerprint)

When hash verification fails, we use the 3-line fingerprint to find where the code moved:

```typescript
async function reconcileGhostMarker(
  marker: GhostMarker,
  document: vscode.TextDocument
): Promise<ReconciliationResult> {

  // Step 1: Check if just whitespace changed (lenient match)
  const currentLine = document.lineAt(marker.line - 1).text;
  if (currentLine.trim() === marker.lineText.trim()) {
    // ✅ Just whitespace changed - update hash and continue
    marker.lineHash = hashLine(currentLine);
    marker.lineText = currentLine.trim();
    return { status: 'auto-fixed', reason: 'whitespace-change' };
  }

  // Step 2: Search nearby lines (±10) for 3-line fingerprint match
  const searchRadius = 10;
  const startLine = Math.max(0, marker.line - searchRadius - 1);
  const endLine = Math.min(document.lineCount - 1, marker.line + searchRadius - 1);

  for (let i = startLine; i <= endLine; i++) {
    const currText = document.lineAt(i).text.trim();
    const prevText = i > 0 ? document.lineAt(i - 1).text.trim() : '';
    const nextText = i < document.lineCount - 1 ? document.lineAt(i + 1).text.trim() : '';

    // Check 3-line fingerprint match
    if (
      currText === marker.lineText &&
      prevText === marker.prevLineText &&
      nextText === marker.nextLineText
    ) {
      // ✅ Found exact 3-line match!
      const newLine = i + 1; // Convert to 1-indexed
      marker.line = newLine;
      marker.lineHash = hashLine(document.lineAt(i).text);
      marker.lastVerified = new Date().toISOString();

      // Update decoration position
      updateDecorationPosition(marker, newLine);

      return {
        status: 'auto-fixed',
        reason: 'found-drift',
        oldLine: marker.line,
        newLine: newLine
      };
    }
  }

  // Step 3: Try 1-line match as fallback
  for (let i = startLine; i <= endLine; i++) {
    const currText = document.lineAt(i).text.trim();
    if (currText === marker.lineText) {
      // ⚠️ Found 1-line match (less confident)
      return {
        status: 'needs-review',
        reason: 'partial-match',
        suggestedLine: i + 1
      };
    }
  }

  // Step 4: Manual intervention required
  return {
    status: 'needs-manual-fix',
    reason: 'no-match-found',
    marker: marker
  };
}
```

### 5. Manual Adjustment UI

When auto-reconciliation fails, show the user:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  Comment Position Conflict Detected                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Comment: "This calculates the total"                    │
│ Expected line 42: function calculateTotal() {           │
│                                                          │
│ But line 42 now contains:                               │
│   import { useState } from 'react';                     │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ [Auto-search nearby]  Search ±20 lines           │    │
│ │ [Manual select]       Pick line manually         │    │
│ │ [Delete comment]      Comment is obsolete        │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Benefits

### 1. Automatic Line Tracking
- ✅ No manual updates needed when code moves
- ✅ Comments stay synchronized with code
- ✅ Works for insert, delete, cut, paste, refactor operations

### 2. Drift Detection
- ✅ Immediate detection when code content changes
- ✅ Hash verification is fast (O(1) per line)
- ✅ No false positives (deterministic)

### 3. Auto-Reconciliation
- ✅ 3-line fingerprint handles code movements
- ✅ Whitespace-tolerant (formatting changes don't break)
- ✅ Search radius is configurable

### 4. One Comment Anchor Per Line
- ✅ Prevents "multiple comments on same line" chaos
- ✅ Gutter icon shows one marker per line
- ✅ Comments can still be multi-line in .comments file
- ✅ Simplifies tracking: `lineCount + commentLineCount = totalLineCount`

### 5. No External Dependencies
- ✅ No ML training data required
- ✅ Works offline/locally
- ✅ No network calls
- ✅ Lightweight (just string hashing)

## Implementation Plan

### Phase 1: Core Infrastructure ✅
- [x] Multi-language comment detection
- [x] Content anchoring utility (hashLine, 3-line fingerprint)
- [x] Extended Comment type with ranges, status, threads

### Phase 2: Ghost Marker System (Current)
- [ ] Create GhostMarker type
- [ ] Create GhostMarkerManager class
- [ ] Integrate with VS Code decorations
- [ ] Add document change listener
- [ ] Implement hash verification
- [ ] Implement auto-reconciliation
- [ ] Create manual adjustment UI

### Phase 3: Integration
- [ ] Update CommentManager to use ghost markers
- [ ] Update DecorationManager for gutter icons
- [ ] Sync ghost markers on file save
- [ ] Migrate existing comments to ghost markers

### Phase 4: Polish
- [ ] Configuration options (search radius, auto-fix behavior)
- [ ] Telemetry (track reconciliation success rate)
- [ ] Performance optimization (batch verification)
- [ ] Testing (unit tests, integration tests)

## Technical Considerations

### Performance

**Hash Verification:**
- Fast: O(1) per ghost marker
- Only runs on document change
- Can be debounced (wait 500ms after typing)

**3-Line Fingerprint Search:**
- Worst case: O(n) where n = search radius * 2 (default: 20 lines)
- Only runs when hash fails (rare)
- Can be cached for multiple markers

**Memory:**
- Each ghost marker: ~300 bytes (text + hash)
- 100 comments = ~30KB
- Negligible impact

### Edge Cases

1. **First/Last Line of File**
   - prevLineText = "" for first line
   - nextLineText = "" for last line

2. **Empty Lines**
   - Hash empty string → stable hash
   - 3-line fingerprint handles blank lines

3. **Duplicate Lines**
   - "const x = 1;" appears 3 times
   - 3-line fingerprint disambiguates

4. **Mass Refactoring**
   - 100 lines moved
   - Auto-reconciliation handles iteratively
   - May need manual review for conflicts

5. **Merge Conflicts**
   - Git merge adds conflict markers
   - Hash verification detects
   - Reconciliation after merge resolution

## Migration Strategy

### Backwards Compatibility

Old .comments files without ghost markers:

```json
{
  "file": "App.js",
  "version": "1.0",
  "comments": [
    { "line": 42, "text": "Old comment" }
  ]
}
```

New .comments files with ghost markers:

```json
{
  "file": "App.js",
  "version": "2.0",
  "ghostMarkers": [
    {
      "id": "gm-abc123",
      "line": 42,
      "commentIds": ["c1"],
      "lineHash": "7f8e9...",
      "lineText": "function calculateTotal() {",
      "prevLineText": "import React from 'react';",
      "nextLineText": "  const total = 0;",
      "lastVerified": "2025-10-17T10:00:00Z"
    }
  ],
  "comments": [
    {
      "id": "c1",
      "line": 42,
      "ghostMarkerId": "gm-abc123",
      "text": "New comment"
    }
  ]
}
```

**Migration Process:**
1. Detect version 1.0 file on load
2. Create ghost marker for each comment
3. Verify hash against current document
4. Flag conflicts for user review
5. Save as version 2.0

## Future Enhancements

### 1. Multi-File Refactoring Detection
- Track when code moves between files
- Suggest moving comments to new file

### 2. Git Integration
- Track ghost markers across branches
- Merge ghost marker positions during PR merges

### 3. AI-Assisted Reconciliation
- Use LLM to suggest comment updates when code changes
- "This comment says X but code now does Y"

### 4. Collaborative Editing
- Real-time ghost marker sync with Live Share
- Conflict resolution for concurrent edits

### 5. Analytics
- Dashboard showing comment drift frequency
- Identify "unstable" code areas (frequent drift)

## References

- [VS Code Decoration API](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions)
- [Academic: Automatic Detection of Outdated Comments (2018)](https://ieeexplore.ieee.org/document/8377652/)
- [Academic: CoCC - Code-Comment Consistency (2024)](https://onlinelibrary.wiley.com/doi/10.1002/smr.2718)
- [Content Anchoring Design](/docs/content-anchoring.md)

---

**Last Updated:** 2025-10-17
**Next Review:** After Phase 2 implementation
