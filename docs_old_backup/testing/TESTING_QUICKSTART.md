# Ghost Markers Testing - Quick Start

**Ready to test v2.0 Ghost Markers? Follow these steps!**

---

## Setup (2 minutes)

### 1. Compile the Extension
```bash
npm run compile
```

### 2. Launch Extension Development Host
1. Open this project in VS Code
2. Press **F5** (or Run > Start Debugging)
3. New VS Code window opens with extension loaded

### 3. Open Test File
In the Extension Development Host window:
1. Open `test-samples/ghost-markers-demo.js`
2. Ghost markers should load automatically!

---

## What You Should See ✨

### Gutter Icons
Look at the left gutter (line numbers area):
- Line 10: 🔵 **NOTE** (blue circle with "N")
- Line 15: 🟠 **TODO** (orange circle with "T")
- Line 20: 🔴 **FIXME** (red circle with "F")
- Line 29: 🟡 **WARNING** + **QUESTION** (2 comments on one line!)
- Line 35: ⭐ **STAR** (gold circle with "S")

### Hover Previews
Hover over any gutter icon to see the comment!

---

## Quick Tests (10 Minutes)

### ✅ Test 1: Insert Lines Above (3 min)

**Goal:** Watch ghost markers automatically move!

1. Place cursor at **line 1** (before all comments)
2. Press `Enter` 5 times (insert 5 blank lines)
3. **Watch the magic:** Ghost markers shift down!
   - Line 10 → Line 15
   - Line 15 → Line 20
   - Line 20 → Line 25
   - Line 29 → Line 34
   - Line 35 → Line 40
4. Gutter icons move with the code! ✨

**Expected:** All ghost markers automatically track the code movement.

---

### ✅ Test 2: Delete Those Lines (2 min)

1. Select lines 1-5 (the blank lines you just added)
2. Press `Delete`
3. **Watch:** Ghost markers shift back up to original positions!

**Expected:** Ghost markers return to lines 10, 15, 20, 29, 35.

---

### ✅ Test 3: Add a New Comment (3 min)

1. Place cursor on **line 56**: `document.addEventListener('DOMContentLoaded', () => {`
2. Press **`Ctrl+Alt+P A`** (or `Cmd+Alt+P A` on Mac)
3. Enter comment: `TODO: Add error handling for missing button`
4. Press Enter
5. **See:** New gutter icon appears on line 56!

**Expected:** New TODO icon (orange) appears. Hover shows your comment.

---

### ✅ Test 4: Move a Function (4 min)

**Goal:** Test 3-line fingerprint reconciliation!

1. Select lines 35-50 (entire `processPayment` function)
2. **Cut** (`Ctrl+X`)
3. Go to line 90 (bottom of file)
4. **Paste** (`Ctrl+V`)
5. **Wait 1 second** (for verification cycle)
6. **Look at line 90** - Ghost marker followed the function! 🎉

**Expected:** STAR icon moves from line 35 to line 90 automatically.

---

## Advanced Tests (If You Have Time)

### 🟡 Test 5: Edit Line Content

1. Go to line 10: `function calculateSum(a, b) {`
2. Change to: `function calculateSum(a, b, c) {`
3. Save file
4. Ghost marker detects content changed (hash mismatch)
5. Check Developer Tools console for verification logs

---

### 🟡 Test 6: Paired Comments View

1. Press **`Ctrl+Alt+P O`** to open side-by-side view
2. Left pane: source code with ghost markers
3. Right pane: `.comments` file (JSON)
4. Edit code in left pane
5. Watch ghost markers update in real-time!

---

## Check the .comments File

Open `test-samples/ghost-markers-demo.js.comments` to see the v2.0 format:

```json
{
  "version": "2.0",
  "ghostMarkers": [
    {
      "id": "gm-test-001",
      "line": 10,
      "commentIds": ["c1"],
      "lineHash": "...",
      "lineText": "function calculateSum(a, b) {",
      "prevLineText": "// Test 1: Simple function",
      "nextLineText": "return a + b;"
    }
  ],
  "comments": [
    {
      "id": "c1",
      "ghostMarkerId": "gm-test-001",
      "text": "Basic utility function..."
    }
  ]
}
```

Notice:
- Each comment has a `ghostMarkerId`
- Ghost markers have `lineHash` for verification
- `prevLineText` and `nextLineText` for 3-line fingerprinting

---

## Debugging Tips

### Open Developer Tools
1. In Extension Development Host: `Help > Toggle Developer Tools`
2. Check Console tab for ghost marker logs
3. Look for verification cycle messages

### Enable Verbose Logging
Add this to your settings.json:
```json
{
  "pairedComments.debug": true
}
```

### Check for Errors
- Red squiggles in gutter = ghost marker error
- Missing icon = ghost marker not loaded
- Check Console for error messages

---

## What If Something Breaks?

### Ghost marker doesn't move?
- Wait 500ms (debounce delay)
- Check Console for verification logs
- Make sure file is saved

### Gutter icon missing?
- Check `.comments` file exists
- Verify `version: "2.0"` in .comments file
- Try closing/reopening file

### Comment not showing on hover?
- Check `commentIds` array in ghost marker
- Verify comment has matching `ghostMarkerId`
- Look for typos in IDs

---

## Report Issues

Found a bug? Document:

1. **What you did** (exact steps)
2. **What you expected** (should happen)
3. **What actually happened** (did happen)
4. **Screenshot** (if visual)
5. **Console logs** (any errors)

Then tell me and I'll help fix it! 🛠️

---

## Next Steps After Testing

Once you've tested Ghost Markers:

1. ✅ Mark tests as passed/failed in [GHOST_MARKERS_TEST_PLAN.md](docs/testing/GHOST_MARKERS_TEST_PLAN.md)
2. 📝 Document any issues found
3. 🎯 Decide: Ready for v2.1, or fix bugs first?
4. 🚀 Plan next phase based on results!

---

## Full Test Plan

For comprehensive testing, see:
**[docs/testing/GHOST_MARKERS_TEST_PLAN.md](docs/testing/GHOST_MARKERS_TEST_PLAN.md)**

That has 14 detailed test scenarios covering:
- Basic functionality
- Tracking through edits
- Drift detection
- Reconciliation
- Performance
- Edge cases

---

**Happy Testing! 🎉**

You're about to see Ghost Markers in action - the killer feature that makes Paired Comments production-ready!
