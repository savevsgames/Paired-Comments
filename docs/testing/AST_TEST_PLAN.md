# AST-Based Ghost Markers Test Plan (v2.0.5)

**Created:** 2025-10-17
**Status:** Ready for Testing
**Priority:** CRITICAL

---

## Overview

This test plan validates the AST-based ghost marker implementation (v2.0.5). The goal is to achieve **>95% success rate** for tracking comments through code refactorings.

## Test Files

- **`test-samples/ast-test.js`** - JavaScript file with various symbol types
- **`test-samples/ast-test.js.comments`** - v2.0.5 format with AST anchors
- **`test-samples/ghost-markers-demo.js`** - Original v2.0 test file (for migration testing)

---

## Quick Start (5 Minutes)

### 1. Open Test File
1. Press `F5` to launch Extension Development Host
2. Open `test-samples/ast-test.js`
3. Verify gutter icons appear at lines: 12, 29, 51, 59, 99

### 2. Test Symbol Move
1. **Cut** the `calculateTotal` function (lines 12-14)
2. **Paste** it at the end of the file (after line 118)
3. **Expected:** Gutter icon should move with the function
4. **Verify:** Hover over icon - should still show the TODO comment

### 3. Test Migration
1. Open `test-samples/ghost-markers-demo.js`
2. Check console for migration message: `[Migration] Migrating v2.0 → v2.0.5...`
3. Open `.comments` file - should now have `version: "2.0.5"` and `astAnchor` fields

---

## Detailed Test Scenarios

### Test 1: Function Move (Top-Level)

**Symbol:** `calculateTotal` function
**Initial Line:** 12
**Comment:** "TODO: This function should handle tax calculation as well"

**Steps:**
1. Open `ast-test.js`
2. Locate `calculateTotal` function (line 12)
3. Cut the entire function (3 lines)
4. Scroll to bottom of file
5. Paste after line 118

**Expected Results:**
- ✅ Comment moves with function to new location
- ✅ Gutter icon appears at new location
- ✅ Hover shows correct comment text
- ✅ Console logs: `[GhostMarker] AST resolved: marker moved from line 12 → [new line]`
- ✅ `.comments` file updated with new line number

**Success Criteria:**
- Comment tracks function automatically
- No manual intervention needed
- Reconciliation status: `auto-fixed` with reason `ast-symbol-moved`

---

### Test 2: Method Move (Within Class)

**Symbol:** `ShoppingCart.addItem` method
**Initial Line:** 29
**Comment:** "FIXME: Need to validate item schema before adding"

**Steps:**
1. Locate `addItem` method in `ShoppingCart` class (line 29)
2. Cut the method (lines 29-32)
3. Paste it after `checkout` method (after line 43)

**Expected Results:**
- ✅ Comment follows method to new position within class
- ✅ AST path `["ShoppingCart", "addItem"]` still resolves correctly
- ✅ Console logs successful move

**Success Criteria:**
- Method reordering doesn't break tracking
- Comment appears at correct line in reordered class

---

### Test 3: Function Rename

**Symbol:** `validateEmail` arrow function
**Initial Line:** 59
**Comment:** "QUESTION: Should we use a more robust email validation library?"

**Steps:**
1. Locate `validateEmail` function (line 59)
2. Rename `validateEmail` → `checkEmailFormat`
3. Save file

**Expected Results:**
- ⚠️ Comment may need manual review (AST path changed)
- ✅ Line-based fallback keeps comment at same line
- ⚠️ Console logs: `ast-symbol-not-found` (expected)

**Success Criteria:**
- Comment doesn't disappear
- Falls back to line-based tracking gracefully
- User can manually update AST anchor if needed

**Note:** Function renames break AST paths - this is expected behavior. Future enhancement: detect renames via fuzzy matching.

---

### Test 4: Nested Function Tracking

**Symbol:** `createDiscount > applyDiscount` (nested function)
**Initial Line:** 51
**Comment:** "NOTE: This nested function demonstrates AST tracking of inner functions"

**Steps:**
1. Locate outer function `createDiscount` (line 48)
2. Cut entire outer function (lines 48-56)
3. Paste at end of file

**Expected Results:**
- ✅ Comment moves with outer function
- ✅ Nested symbol path `["createDiscount", "applyDiscount"]` resolves correctly
- ✅ Offset calculation correct (line 51 relative to line 48)

**Success Criteria:**
- Nested function tracking works
- Relative offset preserved

---

### Test 5: Multiple Comments on Same Symbol

**Symbol:** `UserManager.addUser` method
**Initial Line:** 99
**Comments:**
- "STAR: Critical user management logic..."
- "WARNING: This method throws errors..."

**Steps:**
1. Locate `addUser` method in `UserManager` class (line 99)
2. Cut the method (lines 99-110)
3. Move to different position in class

**Expected Results:**
- ✅ Both comments move together
- ✅ Single ghost marker with 2 comment IDs
- ✅ Hover shows both comments with separator

**Success Criteria:**
- Multiple comments tracked as single marker
- All comments stay together

---

### Test 6: Migration from v2.0 to v2.0.5

**File:** `ghost-markers-demo.js` (currently v2.0)

**Steps:**
1. Open `ghost-markers-demo.js` in Extension Development Host
2. Open Debug Console
3. Look for migration logs

**Expected Logs:**
```
[FileSystemManager] Successfully loaded .comments file
  Version: 2.0
[Migration] Migrating v2.0 → v2.0.5...
[Migration] Added AST anchor to marker at line 10: calculateSum
[Migration] Added AST anchor to marker at line 15: UserManager
[Migration] Saving migrated file (2.0 → 2.0.5)
```

**Expected Results:**
- ✅ File auto-migrates on first load
- ✅ `.comments` file version changes to "2.0.5"
- ✅ All ghost markers gain `astAnchor` fields
- ✅ Existing comments preserved
- ✅ No data loss

**Verification:**
1. Open `.comments` file
2. Check version field: `"version": "2.0.5"`
3. Check ghost markers have `astAnchor` fields
4. Check all comments still present

---

### Test 7: Line-Based Fallback (Non-JS File)

**File:** Create `test.py` (Python file - AST not supported yet)

**Steps:**
1. Create new file `test-samples/test.py`:
```python
def hello():
    print("Hello World")

def goodbye():
    print("Goodbye")
```
2. Add comment on line 1 (the `hello` function)
3. Move `hello` function to line 4

**Expected Results:**
- ⚠️ AST not supported, uses line-based fallback
- ⚠️ Comment may drift (line-based has limitations)
- ✅ Console logs: `[AST] Language python not supported, use line-based fallback`

**Success Criteria:**
- Extension doesn't crash on unsupported languages
- Falls back gracefully to v2.0 behavior

---

### Test 8: Class Rename

**Symbol:** `ShoppingCart` class
**Initial Line:** 21

**Steps:**
1. Rename class `ShoppingCart` → `Cart`
2. Save file

**Expected Results:**
- ⚠️ AST paths for methods may break
- ✅ Line-based fallback maintains positions
- ⚠️ Methods inside class may show `ast-symbol-not-found`

**Success Criteria:**
- No crashes
- Comments don't disappear
- Fallback works

---

### Test 9: Insert Lines Above Symbol

**Symbol:** `calculateTotal` function (line 12)

**Steps:**
1. Go to line 11 (before `calculateTotal`)
2. Insert 5 blank lines
3. Wait 500ms (debounce delay)

**Expected Results:**
- ✅ Comment automatically shifts down 5 lines (line 12 → 17)
- ✅ AST anchor still resolves correctly
- ✅ Console logs position update

**Success Criteria:**
- Simple line insertions handled automatically
- No drift detected

---

### Test 10: Delete Symbol

**Symbol:** `formatCurrency` function (line 17)

**Steps:**
1. Delete entire `formatCurrency` function
2. Save file

**Expected Results:**
- ⚠️ Console logs: `ast-symbol-not-found`
- ⚠️ Reconciliation status: `needs-manual-fix`
- ✅ Comment marked for review (doesn't crash)

**Success Criteria:**
- Deleted symbols detected gracefully
- User notified (via console for now, UI in future)
- No data corruption

---

### Test 11: Copy/Paste Symbol

**Symbol:** `calculateTotal` function

**Steps:**
1. **Copy** `calculateTotal` function (don't cut)
2. **Paste** at end of file
3. Now you have 2 identical functions

**Expected Results:**
- ✅ Original comment stays with original function
- ✅ AST resolves to first occurrence
- ⚠️ If pasted function is renamed, new comments can be added

**Success Criteria:**
- No duplicate comments created
- Original comment tracks original function

---

### Test 12: Refactor: Extract Method

**Symbol:** Extract code from `addItem` method

**Steps:**
1. In `addItem` method, select `this.items.push(item);`
2. Use refactoring tool: "Extract to new method"
3. New method: `pushItem(item)`

**Expected Results:**
- ✅ Original comment stays on `addItem`
- ✅ New method has no comment (expected)
- ✅ AST anchor for `addItem` still resolves

**Success Criteria:**
- Refactorings don't break existing comments
- Comments stay on original symbols

---

## Performance Tests

### Test 13: Large File (1000+ lines)

**Steps:**
1. Create `large-file.js` with 1000+ lines of code
2. Add 50 comments with ghost markers
3. Measure symbol resolution time

**Expected Results:**
- ✅ Symbol resolution < 100ms per marker
- ✅ No lag when opening file
- ✅ Cache helps with repeated resolutions

**Success Criteria:**
- Performance acceptable for large files
- No noticeable delays

---

### Test 14: Symbol Cache

**Steps:**
1. Open `ast-test.js`
2. Check console for symbol provider calls
3. Edit file (add blank line)
4. Check if symbols are re-fetched

**Expected Results:**
- ✅ Symbols cached for 5 seconds
- ✅ Cache invalidated on document changes
- ✅ No redundant symbol provider calls

**Success Criteria:**
- Caching works correctly
- Performance improved

---

## Edge Cases

### Test 15: Ambiguous Symbol Names

**Setup:**
```javascript
function calculate() { ... }
class Helper {
  calculate() { ... }
}
```

**Expected Results:**
- ⚠️ AST resolver may find multiple matches
- ⚠️ Confidence: `ambiguous`
- ✅ Uses first match with warning

---

### Test 16: Empty Lines / Comments-Only Lines

**Steps:**
1. Add comment on a blank line (line 10)
2. Add comment on a line with only `// comment text`

**Expected Results:**
- ⚠️ AST anchor: `null` (no symbol)
- ✅ Falls back to line-based tracking
- ✅ Console: `No symbol found at line X, using line-based fallback`

**Success Criteria:**
- Non-symbolic lines handled gracefully
- Fallback works

---

## Success Metrics

### Overall Success Rate: >95%

**Passing Criteria:**
- ✅ 12/16 core tests pass (Tests 1-12)
- ✅ Performance acceptable (Tests 13-14)
- ✅ Edge cases handled gracefully (Tests 15-16)

**Critical Tests (Must Pass):**
- Test 1: Function Move ✅
- Test 2: Method Move ✅
- Test 4: Nested Function ✅
- Test 6: Migration v2.0 → v2.0.5 ✅

**Expected Failures (Acceptable):**
- Test 3: Function Rename (AST path changes - expected)
- Test 8: Class Rename (AST path changes - expected)
- Test 10: Delete Symbol (symbol gone - expected)

---

## Manual Testing Checklist

### Before Testing
- [ ] Extension compiled successfully (`npm run compile`)
- [ ] Test files created in `test-samples/`
- [ ] Extension Development Host ready to launch

### Core Functionality
- [ ] Test 1: Function Move
- [ ] Test 2: Method Move
- [ ] Test 4: Nested Function
- [ ] Test 5: Multiple Comments
- [ ] Test 6: Migration v2.0 → v2.0.5

### Fallback & Edge Cases
- [ ] Test 7: Non-JS File (Python)
- [ ] Test 9: Insert Lines Above
- [ ] Test 10: Delete Symbol
- [ ] Test 16: Empty Lines

### Performance
- [ ] Test 13: Large File
- [ ] Test 14: Symbol Cache

### Final Verification
- [ ] No crashes or errors
- [ ] Console logs look correct
- [ ] `.comments` files updated properly
- [ ] Gutter icons appear correctly
- [ ] Hover previews work

---

## Debugging Tips

### Enable Verbose Logging
All AST operations log to console with `[AST]`, `[GhostMarker]`, or `[Migration]` prefixes.

### Check Symbol Tree
Add this to Debug Console:
```javascript
astManager.getSymbolTree(document)
```

### Inspect Ghost Marker State
Check `.comments` file directly to see:
- Current line numbers
- AST anchor paths
- Last verified timestamps

### Common Issues

**Issue:** Comment doesn't move with function
- **Check:** Is language supported? (JS/TS only for now)
- **Check:** Does symbol have a name? (Anonymous functions not tracked)
- **Check:** Console for `ast-symbol-not-found` errors

**Issue:** Migration doesn't run
- **Check:** File already at v2.0.5?
- **Check:** Console for migration logs
- **Check:** File permissions

**Issue:** Gutter icons not showing
- **Check:** DecorationManager loaded?
- **Check:** Ghost markers in `.comments` file?
- **Check:** File opened in correct workspace?

---

## Next Steps After Testing

If tests pass (>95% success rate):
1. ✅ Mark v2.0.5 as stable
2. ✅ Update ROADMAP.md
3. ✅ Update README.md with AST features
4. ✅ Proceed to v2.1 (Params + AI Metadata)

If tests fail (<95% success rate):
1. ⚠️ Review failed test logs
2. ⚠️ Fix critical issues
3. ⚠️ Re-test
4. ⚠️ Consider rollback plan (see AST_REFACTOR_PLAN.md)

---

**Last Updated:** 2025-10-17
**Tester:** Greg + Claude Code
**Status:** 🧪 Ready for Testing
