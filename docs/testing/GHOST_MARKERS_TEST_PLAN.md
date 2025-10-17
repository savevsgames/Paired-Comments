# Ghost Markers Test Plan

**Version:** 2.0
**Date:** October 17, 2025
**Status:** Ready for Testing

---

## Overview

This document provides a comprehensive test plan for the Ghost Markers system (v2.0). Ghost Markers are the core feature that enables automatic line tracking, making Paired Comments reliable through code changes.

---

## Test Environment Setup

### Prerequisites
1. VS Code with Extension Development Host
2. Paired Comments extension compiled (`npm run compile`)
3. Test files in `test-samples/` directory

### Quick Start
1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. Open `test-samples/ghost-markers-demo.js` in the new window
4. Ghost markers should load automatically from `.comments` file

---

## Test Scenarios

### 🟢 Test 1: Basic Ghost Marker Display

**Goal:** Verify ghost markers load and display correctly

**Steps:**
1. Open `ghost-markers-demo.js` in Extension Development Host
2. Check gutter icons appear on lines: 10, 15, 20, 29, 35
3. Hover over gutter icons to see comment previews

**Expected Results:**
- ✅ Gutter icons visible on commented lines
- ✅ Hover shows correct comment text
- ✅ Tag colors match (NOTE=blue, TODO=orange, FIXME=red, etc.)
- ✅ Line 29 shows 2 comments (WARNING + QUESTION)

**Pass Criteria:**
- All 5 ghost markers display correctly
- Hover previews show accurate information
- Multiple comments on same line handled properly

---

### 🟢 Test 2: Ghost Marker Creation

**Goal:** Create new ghost marker and verify it tracks correctly

**Steps:**
1. Open `ghost-markers-demo.js`
2. Place cursor on line 56 (`document.addEventListener...`)
3. Press `Ctrl+Alt+P A` to add comment
4. Enter: "TODO: Add error handling for missing button"
5. Save file
6. Check `.comments` file for new ghost marker

**Expected Results:**
- ✅ New ghost marker created with correct line number
- ✅ Ghost marker has `lineHash`, `lineText`, `prevLineText`, `nextLineText`
- ✅ Comment linked to ghost marker via `ghostMarkerId`
- ✅ Gutter icon appears immediately
- ✅ File saved with v2.0 format

**Pass Criteria:**
- Ghost marker persists after reload
- All hash fields populated correctly
- Comment displays when hovering

---

### 🟡 Test 3: Insert Lines Above (Ghost Marker Tracking)

**Goal:** Verify ghost markers move with code when lines inserted above

**Steps:**
1. Open `ghost-markers-demo.js`
2. Note current line numbers of ghost markers (10, 15, 20, 29, 35)
3. Place cursor at line 5 (before first ghost marker)
4. Press `Enter` 3 times to insert blank lines
5. Wait 500ms for verification cycle
6. Check ghost marker line numbers

**Expected Results:**
- ✅ Ghost markers automatically shift down by 3 lines
- ✅ New line numbers: 13, 18, 23, 32, 38
- ✅ Gutter icons move to new positions
- ✅ No manual intervention required
- ✅ `.comments` file updates with new line numbers

**Pass Criteria:**
- Ghost markers track code movement
- Line numbers update correctly
- Hash verification passes (content unchanged)

---

### 🟡 Test 4: Delete Lines Above (Ghost Marker Tracking)

**Goal:** Verify ghost markers move when lines deleted above

**Steps:**
1. Open `ghost-markers-demo.js`
2. Note current line numbers
3. Delete lines 5-8 (4 lines total)
4. Wait 500ms for verification
5. Check ghost marker positions

**Expected Results:**
- ✅ Ghost markers shift up by 4 lines
- ✅ Gutter icons move immediately
- ✅ Comments still associated with correct code
- ✅ No drift warnings

**Pass Criteria:**
- Automatic position updates
- Hash verification passes
- No data loss

---

### 🟠 Test 5: Edit Line Content (Hash Mismatch Detection)

**Goal:** Verify drift detection when line content changes

**Steps:**
1. Open `ghost-markers-demo.js`
2. Go to line 10: `function calculateSum(a, b) {`
3. Change to: `function calculateSum(a, b, c) {`
4. Save file
5. Wait for verification cycle
6. Check for drift notification

**Expected Results:**
- ✅ Hash mismatch detected
- ✅ User notified of drift (warning or UI indicator)
- ✅ Line hash updated to new value
- ✅ Ghost marker remains on line 10
- ✅ Comment still displays

**Pass Criteria:**
- Drift detected within 500ms
- User aware of content change
- Ghost marker doesn't break

---

### 🟠 Test 6: Whitespace-Only Changes (Auto-Fix)

**Goal:** Verify auto-fix for whitespace changes

**Steps:**
1. Open `ghost-markers-demo.js`
2. Go to line 15: `class UserManager {`
3. Add spaces: `  class UserManager {` (indent by 2 spaces)
4. Save file
5. Wait for verification

**Expected Results:**
- ✅ Hash mismatch detected
- ✅ Auto-fixed (whitespace-only change recognized)
- ✅ New hash stored
- ✅ `lastVerified` timestamp updated
- ✅ No user intervention needed

**Pass Criteria:**
- Status = `auto-fixed`
- Reason = `whitespace-change`
- Ghost marker still functional

---

### 🔴 Test 7: 3-Line Fingerprint Reconciliation (Code Movement)

**Goal:** Verify auto-reconciliation when code moves

**Setup:**
1. Open `ghost-markers-demo.js`
2. Note line 35: `function processPayment(order) {` has ghost marker

**Steps:**
1. Cut lines 35-50 (entire `processPayment` function)
2. Move to line 60 (after other functions)
3. Paste
4. Save file
5. Wait for verification (500ms)

**Expected Results:**
- ✅ Ghost marker detects drift (hash at line 35 doesn't match)
- ✅ 3-line fingerprint search executes
- ✅ Function found at new location (line 60)
- ✅ Ghost marker automatically moves to line 60
- ✅ Status = `auto-fixed`, Reason = `found-drift`
- ✅ `.comments` file updated

**Pass Criteria:**
- Auto-reconciliation successful
- Ghost marker tracks function to new position
- Comment still visible on correct line
- No manual fix needed

---

### 🔴 Test 8: Partial Match (Needs Review)

**Goal:** Verify "needs review" status when only 1-line matches

**Setup:**
1. Create ghost marker on line with unique content
2. Change the lines above/below it (break 3-line fingerprint)
3. Save file

**Expected Results:**
- ✅ 3-line fingerprint fails
- ✅ 1-line match found
- ✅ Status = `needs-review`
- ✅ Reason = `partial-match`
- ✅ `suggestedLine` provided
- ✅ User prompted to confirm

**Pass Criteria:**
- System detects ambiguity
- Suggests most likely match
- User can approve or reject

---

### 🔴 Test 9: No Match Found (Manual Fix Required)

**Goal:** Verify manual fix UI when reconciliation fails

**Steps:**
1. Open `ghost-markers-demo.js`
2. Go to line with ghost marker
3. Completely rewrite the line (make it unrecognizable)
4. Delete surrounding lines too
5. Save file

**Expected Results:**
- ✅ Hash mismatch detected
- ✅ 3-line fingerprint search fails
- ✅ 1-line search fails
- ✅ Status = `needs-manual-fix`
- ✅ Reason = `no-match-found`
- ✅ UI shows conflict resolution options:
  - Auto-search (broader search)
  - Manual select line
  - Delete comment

**Pass Criteria:**
- User presented with clear options
- Can choose to keep/delete comment
- No data loss without confirmation

---

### 🟢 Test 10: Multiple Edits in Quick Succession

**Goal:** Verify debouncing works correctly

**Steps:**
1. Open `ghost-markers-demo.js`
2. Make rapid edits (type quickly, insert/delete lines)
3. Don't wait between edits
4. After 2 seconds of inactivity, check verification

**Expected Results:**
- ✅ Verification doesn't run on every keystroke
- ✅ Debounce delay = 500ms
- ✅ Final verification runs after typing stops
- ✅ All changes processed correctly

**Pass Criteria:**
- Performance remains smooth
- No lag during typing
- Verification runs once after edits complete

---

### 🟢 Test 11: File Format Migration (v1.0 → v2.0)

**Goal:** Verify old .comments files upgrade to v2.0

**Setup:**
1. Create a v1.0 `.comments` file (no `ghostMarkers` array)

**Test v1.0 File:**
```json
{
  "file": "test.js",
  "version": "1.0",
  "comments": [
    {
      "id": "c1",
      "line": 10,
      "text": "TODO: Add validation",
      "author": "Greg",
      "tag": "TODO",
      "created": "2025-10-17T12:00:00Z",
      "updated": "2025-10-17T12:00:00Z"
    }
  ]
}
```

**Steps:**
1. Open file with v1.0 `.comments`
2. Extension should detect v1.0 format
3. Run migration command (if needed) or auto-migrate
4. Check `.comments` file after save

**Expected Results:**
- ✅ v1.0 file detected
- ✅ Ghost markers created for all comments
- ✅ `version` changed to `2.0`
- ✅ `ghostMarkers` array added
- ✅ Each comment gets `ghostMarkerId`
- ✅ Hash, context, timestamps populated
- ✅ Backwards compatible (old clients can still read basic data)

**Pass Criteria:**
- Migration is automatic or one-click
- No data loss
- v2.0 features work immediately

---

### 🟡 Test 12: Large File Performance

**Goal:** Verify performance with many ghost markers

**Setup:**
1. Create file with 100+ comments
2. Add ghost markers for all

**Steps:**
1. Open large file
2. Measure load time
3. Make edits
4. Measure verification time

**Expected Results:**
- ✅ Load time < 500ms
- ✅ Verification time < 50ms per change
- ✅ UI remains responsive
- ✅ No noticeable lag

**Pass Criteria:**
- Performance metrics met
- Scales to 1000+ line files

---

### 🟢 Test 13: Paired Comments View Integration

**Goal:** Verify ghost markers work in split view

**Steps:**
1. Open `ghost-markers-demo.js`
2. Press `Ctrl+Alt+P O` to open paired view
3. Edit code in left pane
4. Watch right pane (comments view)

**Expected Results:**
- ✅ Comments update when ghost markers move
- ✅ Scroll sync maintained
- ✅ Gutter icons show in both panes
- ✅ No synchronization issues

**Pass Criteria:**
- Paired view stays synchronized
- Ghost markers visible in both panes

---

### 🟡 Test 14: Multi-File Editing

**Goal:** Verify ghost markers work across multiple files

**Steps:**
1. Open 3 files with ghost markers
2. Edit all 3 files rapidly
3. Switch between files
4. Check ghost markers in each file

**Expected Results:**
- ✅ Each file's ghost markers tracked independently
- ✅ No cross-file interference
- ✅ Decorations cleared when switching files
- ✅ Memory usage stable

**Pass Criteria:**
- Multi-file editing works smoothly
- No memory leaks

---

## Test Results Template

### Test Result Format

```markdown
## Test X: [Test Name]

**Date:** [Date]
**Tester:** [Name]
**Status:** ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

### Results
- [Describe what happened]

### Issues Found
- [List any bugs or unexpected behavior]

### Notes
- [Additional observations]
```

---

## Known Issues & Limitations

### Current Limitations (v2.0)
1. **No conflict resolution UI yet** - Manual fixes require editing `.comments` file
2. **No undo/redo for ghost marker moves** - Edits are immediate
3. **No visual diff viewer** - Can't see before/after of reconciliation
4. **Limited to ±10 lines search radius** - Very large code movements may fail

### Planned Fixes (v2.1+)
- Conflict resolution dialog (v2.1)
- Visual diff for drift detection (v2.1)
- Configurable search radius (v2.1)
- Ghost marker history/undo (v2.2)

---

## Success Criteria

To consider Ghost Markers production-ready:

### Core Functionality
- ✅ Ghost markers create correctly
- ✅ Ghost markers track code through edits
- ✅ Hash verification detects changes
- ✅ Whitespace changes auto-fix
- ✅ 3-line fingerprint reconciliation works

### Performance
- ✅ <50ms verification per change
- ✅ <500ms load time for 100+ markers
- ✅ No UI lag during editing

### Reliability
- ✅ <1% false positives (incorrect drift detection)
- ✅ >95% auto-reconciliation success rate
- ✅ Zero data loss during migration

### User Experience
- ✅ Seamless integration with existing commands
- ✅ Clear visual feedback (gutter icons, hover)
- ✅ No manual intervention needed in 95%+ cases

---

## Test Execution Checklist

### Pre-Testing
- [ ] Compile extension (`npm run compile`)
- [ ] Launch Extension Development Host (F5)
- [ ] Verify test files exist in `test-samples/`

### Core Tests (Must Pass)
- [ ] Test 1: Basic Display
- [ ] Test 2: Creation
- [ ] Test 3: Insert Lines Above
- [ ] Test 4: Delete Lines Above
- [ ] Test 5: Edit Line Content
- [ ] Test 11: File Format Migration

### Advanced Tests (Should Pass)
- [ ] Test 6: Whitespace Auto-Fix
- [ ] Test 7: 3-Line Reconciliation
- [ ] Test 10: Rapid Edits (Debouncing)
- [ ] Test 13: Paired View Integration

### Edge Cases (Nice to Pass)
- [ ] Test 8: Partial Match
- [ ] Test 9: No Match Found
- [ ] Test 12: Large File Performance
- [ ] Test 14: Multi-File Editing

### Post-Testing
- [ ] Document all failures
- [ ] File GitHub issues for bugs
- [ ] Update ROADMAP.md status
- [ ] Prepare for v2.1 planning

---

## Quick Testing Guide (30 Minutes)

If you have limited time, run these critical tests:

1. **Basic Test** (5 min)
   - Open `ghost-markers-demo.js`
   - Verify gutter icons appear
   - Hover to see comments

2. **Tracking Test** (10 min)
   - Insert 5 blank lines at top of file
   - Verify all ghost markers shift down
   - Delete those lines
   - Verify they shift back up

3. **Reconciliation Test** (10 min)
   - Cut/paste a function to new location
   - Wait for verification (500ms)
   - Verify ghost marker moved with function

4. **Creation Test** (5 min)
   - Add new comment on a line
   - Verify ghost marker created
   - Reload file
   - Verify ghost marker persists

If all 4 pass, Ghost Markers are working! 🎉

---

## Reporting Issues

When reporting bugs, include:

1. **Test number** - Which test failed?
2. **Steps to reproduce** - Exact sequence
3. **Expected vs. Actual** - What should happen vs. what did
4. **Screenshots** - If visual bug
5. **Console logs** - Check VS Code Developer Tools
6. **`.comments` file** - Before and after state

**File issues at:** [GitHub Issues](https://github.com/yourusername/paired-comments/issues)

---

## Next Steps After Testing

1. **Fix Critical Bugs** - Anything that causes data loss
2. **Document Findings** - Update PROJECT_STATUS.md
3. **Plan v2.1** - Based on learnings from v2.0
4. **User Testing** - Get beta testers to try it
5. **Release v2.0** - When all tests pass!

---

**Good luck testing! 🚀**
