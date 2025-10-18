# Range Comments - Design Specification

**Milestone:** v2.0.6
**Status:** 🚧 Design Phase
**Date:** October 18, 2025

---

## Overview

Enable comments that span multiple lines (e.g., lines 1-10) instead of single lines, with support for inline comment export/import for sharing with non-extension users.

**User Request:**
> "How do i make this a range comment? ie lines 1-10"

---

## Design Decisions (Finalized)

### 1. Range Selection Method ✅

**Chosen: Option A - Selection-Based**

**User Workflow:**
1. User selects lines 10-15 in editor
2. Presses `Ctrl+Alt+P A` (Add Comment)
3. Form auto-detects range: "Adding comment to lines 10-15"
4. User types comment text and selects tag
5. Extension creates ghost marker at line 10 (start line) with range metadata

**Rationale:**
- Natural workflow (select code, add comment)
- Maps cleanly to inline export (start/end markers)
- Consistent with inline import detection

---

### 2. Visual Indicators ✅

**Gutter Icons:**

**Single-Line Comments (Current):**
- Single icon with tag color (e.g., 🔵 N for NOTE, 🟠 T for TODO)

**Range Comments (NEW):**

**Start Line:**
- **Two-letter code** indicating tag + "START"
- Examples:
  - `TS` = TODO START (orange, larger icon)
  - `NS` = NOTE START (blue, larger icon)
  - `FS` = FIXME START (red, larger icon)
  - `SS` = STAR START (gold, larger icon)

**End Line:**
- **Two-letter code** indicating tag + "END"
- Examples:
  - `TE` = TODO END (orange, smaller icon or different border)
  - `NE` = NOTE END (blue, smaller icon)
  - `FE` = FIXME END (red, smaller icon)
  - `SE` = STAR END (gold, smaller icon)

**Visual Distinction:**
- Start icon: Larger or thicker border
- End icon: Smaller or thinner border
- Same color family as tag

**Range Highlight:**
- Lines between start and end: Subtle greyed-out text or faint background tint
- User setting: Toggle range highlighting on/off

**Hover Preview:**
- Hover over start icon: "TODO (lines 10-15): Payment processing block"
- Hover over end icon: "TODO (end of range)"

---

### 3. Inline Comment Syntax ✅

**Philosophy: Full metadata by default (easy to remove later, hard to add)**

#### Single-Line Comment
```javascript
const total = calculateTotal(items);  //@paired-comment {"id":"c1","tag":"TODO","text":"This needs validation","author":"Greg","created":"2025-10-18T10:30:00Z"}
```

#### Range Comment
```javascript
//@paired-comment-range-start {"id":"c1","tag":"TODO","text":"Payment processing block","author":"Greg","created":"2025-10-18T10:30:00Z"}
function processPayment(order) {
  validateOrder(order);
  chargeCard(order.total);
  sendConfirmation(order.email);
}
//@paired-comment-range-end {"id":"c1"}
```

**JSON Object Schema:**
```typescript
interface InlineCommentMetadata {
  id: string;                    // Required - comment ID
  tag?: string;                  // Optional - TODO, FIXME, NOTE, etc.
  text?: string;                 // Optional - full comment text
  author?: string;               // Optional - comment author
  created?: string;              // Optional - ISO 8601 timestamp
  updated?: string;              // Optional - last update timestamp
  hash?: string;                 // Optional - content hash for verification

  // Future fields (v2.1+)
  params?: Record<string, any>;  // Dynamic parameters
  aiMeta?: Record<string, any>;  // AI metadata
  output?: Record<string, any>;  // Runtime output capture
}
```

**Export Format Options:**

**Full (Default):**
```json
{"id":"c1","tag":"TODO","text":"This needs validation","author":"Greg","created":"2025-10-18T10:30:00Z"}
```

**Minimal (Future - v2.0.7):**
```json
{"id":"c1"}
```

**Balanced (Future - v2.0.7):**
```json
{"id":"c1","tag":"TODO"}
```

---

### 4. Import Behavior ✅

**When importing from inline comments:**

**Option: Keep inline markers as backup (Default)**
- Parse `//@paired-comment` markers
- Create `.comments` file
- Leave inline comments in source (greyed out by extension)
- User can manually remove later if desired

**Option: Remove inline markers (Clean import)**
- Parse `//@paired-comment` markers
- Create `.comments` file
- Remove all inline markers from source
- Cleaner code, but inline backup lost

**Setting:** `pairedComments.removeInlineMarkersOnImport` (default: `false`)

**Visual Treatment After Import:**
- Inline markers dimmed/greyed out by extension decoration
- Gutter icons appear (primary UI)
- User sees clean code + gutter icons, inline markers fade into background

---

## Schema Changes

### Updated Comment Interface
```typescript
interface Comment {
  id: string;

  // Range support (NEW)
  line: number;              // For backwards compat (always equals startLine)
  startLine?: number;        // NEW - Range start (optional, defaults to line)
  endLine?: number;          // NEW - Range end (optional, if undefined = single line)

  text: string;
  tag?: string;
  author: string;
  created: string;
  updated: string;
  ghostMarkerId: string;

  // Future (v2.1+)
  params?: Record<string, any>;
  aiMeta?: Record<string, any>;
  output?: Record<string, any>;
}
```

### Ghost Marker Updates
```typescript
interface GhostMarker {
  id: string;
  line: number;              // Always tracks START line of range
  commentIds: string[];
  lineHash: string;
  lineText: string;
  prevLineText: string;
  nextLineText: string;
  lastVerified: string;

  // Range support (NEW)
  endLine?: number;          // NEW - If present, this is a range marker

  astAnchor?: ASTAnchor;
}
```

---

## Implementation Plan

### Phase 1: Range Comments Core (v2.0.6) - 1 week

#### Day 1-2: Schema & Backend
- [ ] Update `src/types.ts` with `startLine`, `endLine`
- [ ] Update `GhostMarkerManager` to track range
  - Start line gets ghost marker
  - End line tracked in marker metadata
  - AST anchor on start line
- [ ] Update `CommentManager` CRUD for ranges
- [ ] Backwards compatibility (existing comments default to single line)

#### Day 3-4: UI & Visual Indicators
- [ ] Update `DecorationManager`
  - Two-letter gutter icons (TS/TE, NS/NE, etc.)
  - Start icon: larger/thicker border
  - End icon: smaller/thinner border
- [ ] Range highlighting (optional greyed-out lines)
- [ ] Hover previews showing "Lines X-Y"
- [ ] Selection detection in add comment command

#### Day 5: Form UI
- [ ] Update add comment form
  - Auto-detect selection → show "Adding comment to lines X-Y"
  - Manual override (change start/end if needed)
- [ ] Validation (endLine > startLine)

#### Day 6-7: Testing & Polish
- [ ] Unit tests for range tracking
- [ ] Integration tests (cut/paste ranges)
- [ ] Edge cases (partial cut, nested ranges?)
- [ ] Documentation updates

**Deliverable:** Range comments working in `.comments` files, visual indicators complete

---

### Phase 2: Inline Comment Export (v2.0.7) - 3 days

#### Export Command Implementation
- [ ] New command: `Ctrl+Alt+P Ctrl+Alt+X` - "Export as Inline Comments"
- [ ] Format selection dialog (Full/Minimal/Balanced)
- [ ] JSON object generation from comments
- [ ] Insert `//@paired-comment` for single lines
- [ ] Insert `//@paired-comment-range-start` and `//@paired-comment-range-end` for ranges
- [ ] Output options:
  - New file (`.inline.js`)
  - Clipboard
  - Replace current file (with backup)

**Deliverable:** Can export `.comments` to inline markers

---

### Phase 3: Inline Comment Import (v2.0.8) - 3 days

#### Import Command Implementation
- [ ] New command: `Ctrl+Alt+P Ctrl+Alt+I` - "Import from Inline Comments"
- [ ] Scan file for `//@paired-comment` patterns (regex)
- [ ] Parse JSON objects from inline markers
- [ ] Detect range pairs (match start/end by ID)
- [ ] Create `.comments` file from extracted data
- [ ] Option: Remove or dim inline markers
- [ ] Validation (malformed JSON, mismatched ranges)

**Deliverable:** Can import inline markers to `.comments` files

---

### Phase 4: Visibility Toggle (v2.0.9) - 2 days

#### Hide/Show Inline Comments
- [ ] New command: `Ctrl+Alt+P H` - "Toggle Inline Comments Visibility"
- [ ] Decoration to dim/hide `//@paired-comment {...}` text
- [ ] Gutter icons always visible (primary UI)
- [ ] User setting: `pairedComments.hideInlineMarkers` (default: `true`)
- [ ] Status bar indicator: "Inline markers: Hidden/Visible"

**Deliverable:** Clean code view with inline markers hidden

---

## UI Mockups

### Range Comment - Visual Example

**Before (no comment):**
```javascript
10  function processPayment(order) {
11    validateOrder(order);
12    chargeCard(order.total);
13    sendConfirmation(order.email);
14  }
```

**After (range comment added - lines 10-14):**
```javascript
10  TS  function processPayment(order) {      [greyed out]
11      validateOrder(order);                  [greyed out]
12      chargeCard(order.total);               [greyed out]
13      sendConfirmation(order.email);         [greyed out]
14  TE  }                                      [greyed out]
```

**Gutter Icons:**
- Line 10: `TS` (TODO START - orange, larger/thicker border)
- Line 14: `TE` (TODO END - orange, smaller/thinner border)

**Hover on TS:**
```
💬 TODO Comment (lines 10-14)
"Payment processing block - needs error handling"
Author: Greg
Created: Oct 18, 2025

[Click to edit] [Click to delete]
```

**Hover on TE:**
```
💬 TODO Comment (end of range)
Lines 10-14

[Jump to start]
```

---

### Exported Inline Comment

**Full Export (Default):**
```javascript
//@paired-comment-range-start {"id":"c1","tag":"TODO","text":"Payment processing block - needs error handling","author":"Greg","created":"2025-10-18T10:30:00Z"}
function processPayment(order) {
  validateOrder(order);
  chargeCard(order.total);
  sendConfirmation(order.email);
}
//@paired-comment-range-end {"id":"c1"}
```

**Minimal Export (Future):**
```javascript
//@paired-comment-range-start {"id":"c1"}
function processPayment(order) {
  validateOrder(order);
  chargeCard(order.total);
  sendConfirmation(order.email);
}
//@paired-comment-range-end {"id":"c1"}
```

---

## Partial Cut/Paste Behavior (Deferred to v2.0.6.1)

**Scenario:** Range comment on lines 1-10, user cuts lines 5-8

**Decision: Keep it simple for v2.0.6**
- Comment stays at original start (lines 1-10 → adjusts to 1-7 after cut)
- End line auto-adjusts based on document changes
- If end line is deleted → convert to single-line comment (just start line)

**Future (v2.0.6.1): Smart splitting**
- Detect partial cut
- Offer UI: "Keep comment on remaining lines?" or "Split into two comments?"
- User chooses behavior

---

## Edge Cases

### 1. Nested Ranges
**Scenario:** Comment A on lines 1-10, Comment B on lines 3-5

**Behavior:**
- Both allowed (overlapping ranges are valid)
- Visual: Multiple gutter icons stack vertically
- Hover shows all comments for that line

### 2. Range Spans Function Boundary
**Scenario:** Range starts in one function, ends in another

**Behavior:**
- Allowed (user might be commenting on multiple functions)
- AST anchor on start line (tracks first function)
- Warning in UI: "Range spans multiple symbols"

### 3. Empty Range (startLine === endLine)
**Behavior:**
- Convert to single-line comment automatically
- No start/end markers, just single icon

### 4. Invalid Range (endLine < startLine)
**Behavior:**
- Validation error in form: "End line must be >= start line"
- Cannot save until fixed

---

## Future Enhancements (Post-v2.1)

### AI-Assisted Range Detection
- Suggest ranges based on code structure (entire function, class, etc.)
- "Comment this function" → Auto-selects function body

### Range Templates
- Common patterns: "Function", "Class", "Try/Catch Block"
- One-click range selection

### Multi-Range Comments
- Single comment spanning multiple disconnected ranges
- Example: Comment on lines 10-15 AND 30-35
- Schema: `ranges: [{start: 10, end: 15}, {start: 30, end: 35}]`

---

## Success Metrics

### v2.0.6 (Range Comments Core)
- ✅ User can select lines and create range comment
- ✅ Gutter icons show start (TS/NS/etc.) and end (TE/NE/etc.)
- ✅ Range tracking works through cut/paste
- ✅ AST anchors to start line
- ✅ Backwards compatible with single-line comments

### v2.0.7 (Inline Export)
- ✅ Can export range comments to inline markers
- ✅ JSON format is parseable and human-readable
- ✅ Full metadata included by default

### v2.0.8 (Inline Import)
- ✅ Can import inline markers back to `.comments` files
- ✅ Range pairs detected and matched correctly
- ✅ Malformed JSON handled gracefully

### v2.0.9 (Visibility Toggle)
- ✅ Inline markers can be hidden/shown
- ✅ Code looks clean with markers hidden
- ✅ Gutter icons remain primary UI

---

## Dependencies

**Blocked By:**
- ✅ AST foundation (v2.0.5) - COMPLETE

**Blocks:**
- ⚠️ Params & AI Metadata (v2.1) - Range affects complexity/token counting
- ⚠️ Output Capture (v2.2) - Range affects output scope

---

## Related Documentation

- [Roadmap](../ROADMAP.md) - Overall project plan
- [Features](../FEATURES.md) - Feature documentation
- [Architecture](../ARCHITECTURE.md) - Technical architecture
- [Current Milestone](./CURRENT.md) - AST checkpoint status

---

**Status:** ✅ Design Complete - Ready for Implementation
**Next Steps:** Begin Phase 1 implementation (Range Comments Core)
**Target Completion:** November 2025 (1 week)
