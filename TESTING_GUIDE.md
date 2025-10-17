# AST Ghost Marker Testing Guide

## Latest Fixes Applied (Ready to Test)

### What Was Fixed:
1. **Progressive Symbol Provider Retry** - 3 retries with increasing delays (200ms, 300ms, 400ms)
2. **Priority Verification Timing** - 100ms delay instead of immediate (0ms) or normal (500ms)
3. **Explicit Decoration Refresh** - Gutter icon now refreshes after AST resolves new position

### Expected Behavior:
When you cut and paste a function, the gutter icon should:
1. Detect the marker is in deleted range
2. Show popup: "🚨 Ghost marker in deleted range - running AST verification..."
3. Wait 100ms for document to settle
4. Retry Symbol Provider up to 3 times if needed (max 900ms total wait)
5. Resolve symbol to new location
6. **Move gutter icon to new line**

---

## Test Procedure

### Step 1: Launch Extension Development Host
1. Close any existing Extension Development Host window
2. Press **F5** in VS Code to launch with latest fixes
3. Wait for extension to activate

### Step 2: Open Developer Tools
1. In the **Extension Development Host** window (not main VS Code)
2. Press **Ctrl+Shift+I** to open Developer Tools
3. Click the **Console** tab
4. You should see the startup banner:
   ```
   ═══════════════════════════════════════════════════════════
   🚀 PAIRED COMMENTS EXTENSION ACTIVATED - v2.0.5 AST
   ═══════════════════════════════════════════════════════════
   ```

### Step 3: Open Test File
1. Open `test-samples/ast-test.js`
2. Verify `calculateTotal` is at line 13 (clean state)

### Step 4: Add a Comment
1. Place cursor on line 13 (`function calculateTotal(items) {`)
2. Press **Ctrl+Shift+C** (or run command "Paired Comments: Add Comment")
3. Add a test comment like: `"Test comment for cut/paste tracking"`
4. Save and close the `.comments` file
5. Verify gutter icon appears at line 13

### Step 5: Perform Cut/Paste Test
1. Select lines 13-15 (entire `calculateTotal` function)
2. Press **Ctrl+X** to cut
3. Go to end of file (after line 118)
4. Press **Enter** to create a new line
5. Press **Ctrl+V** to paste

### Step 6: Observe Console Logs
Watch the Developer Tools Console for this sequence:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[GhostMarkerManager] Document changed: ...ast-test.js
[GhostMarkerManager] Changes: 1

[GhostMarkerManager] Markers BEFORE update:
  - Marker gm-...: line 13, text: "function calculateTotal(items) {"

⚠️ WARNING: Marker at line 13 is INSIDE change range 13-15!
   Marker text: "function calculateTotal(items) {"
   This marker needs IMMEDIATE AST resolution!

[GhostMarkerManager] 🚨 Markers in deleted range - triggering PRIORITY verification!
(Popup should appear: "🚨 Ghost marker in deleted range...")

[GhostMarkerManager] Running priority verification after document settled...

[AST] 🔍 Resolving anchor: calculateTotal (kind: Function, offset: 0)
[AST] Requesting symbols for ast-test.js...

[AST] ⚠️ No symbols returned from VS Code Symbol Provider
[AST] Retry 1/3: Waiting 200ms for language server...
[AST] ✓ Retry 1 successful! Found 7 symbols

[AST] Searching for symbol path: [calculateTotal]
[AST] Found 1 matching symbol(s)
[AST] ✅ Symbol found at line 119 (symbol starts at 119, offset: 0)

[GhostMarker] AST resolved: marker moved from line 13 → 119
[GhostMarker] Refreshing decoration at new location (line 119)

[GhostMarkerManager] Result: auto-fixed - ast-symbol-moved
[GhostMarkerManager] Marker moved: 13 → 119
```

### Step 7: Verify Success
✅ **Success Criteria**:
- [ ] Popup appeared: "🚨 Ghost marker in deleted range..."
- [ ] Console shows AST retry succeeded (Retry 1, 2, or 3)
- [ ] Console shows "Symbol found at line 119"
- [ ] Console shows "Refreshing decoration at new location (line 119)"
- [ ] **Gutter icon appears at line 119** (new location of `calculateTotal`)

❌ **Failure Indicators**:
- Gutter icon stays at old location (line 13)
- Gutter icon disappears completely
- Console shows "❌ Failed after 3 retries"
- Console shows "falling back to line-based"

---

## Additional Test Cases

### Test 2: Function Rename
1. Rename `calculateTotal` to `calculateSum`
2. Expected: Comment should become "needs-manual-fix" (symbol name changed)

### Test 3: Move Within File (No Cut/Paste)
1. Cut `formatCurrency` from line 18
2. Paste at line 30 (between other functions)
3. Expected: Same AST resolution behavior

### Test 4: Nested Function
1. Add comment to inner function `applyDiscount` (line 53)
2. Move entire `createDiscount` function
3. Expected: Nested symbol should still be tracked

---

## Troubleshooting

### If Symbol Provider Still Returns Empty:
- Check if TypeScript/JavaScript language server is running
- Try waiting longer (increase retry delays in `ASTAnchorManager.ts`)
- Check VS Code OUTPUT panel → "TypeScript" or "JavaScript Language Features"

### If Gutter Icon Doesn't Refresh:
- Check console for "Refreshing decoration at new location"
- Verify `applyDecoration()` is being called in `verifyMarkerWithAST()`
- Try manually refreshing decorations (close/reopen file)

### If Tests Keep Failing:
- Consider alternative approach: Track paste events separately
- Evaluate if Symbol Provider is reliable enough for real-time tracking
- May need hybrid approach with different strategies for different scenarios

---

## Next Steps After Testing

### If Tests Pass ✅:
- Move to Phase 5: Documentation & Cleanup
- Update ROADMAP.md with v2.0.5 completion
- Remove debug logging
- Update README.md with AST tracking feature

### If Tests Fail ❌:
- Gather console logs and share findings
- Evaluate Symbol Provider reliability
- Consider fallback strategies
- Update AST_REFACTOR_PLAN.md with new issues

---

## Quick Reset Command

If you need to reset the test file between attempts:

```bash
git checkout test-samples/ast-test.js
```

This restores `calculateTotal` to line 13.
