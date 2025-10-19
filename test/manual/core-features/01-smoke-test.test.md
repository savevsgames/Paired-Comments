# Test: Extension Smoke Test - Clean Load

**Test ID:** 01
**Feature:** Core - Extension Activation & Basic Comment Creation
**Priority:** High
**Estimated Time:** 5 minutes

---

## Prerequisites
- [ ] Extension compiled (`npm run compile`)
- [ ] Test workspace opened: `test-samples/`
- [ ] Clean test files present: `simple-test.js` and `ast-test.js` (NO .comments files yet)

## Test Steps

### Step 1: Launch Extension Development Host
**Action:** Press F5 in VS Code to launch Extension Development Host

**Expected:**
- Extension Development Host window opens
- No errors in Debug Console
- Extension activates successfully
- Status bar shows no orphaned comments

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 2: Open simple-test.js
**Action:** Open `test-samples/simple-test.js` in the Extension Development Host

**Expected:**
- File opens successfully
- NO CodeLens appears yet (no comments exist)
- No errors in Debug Console

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 3: Add a comment to line 7
**Action:**
1. Click on line 7 (`function add(a, b) {`)
2. Press `Ctrl+Alt+P` then `Ctrl+Alt+A` (Add Comment keybinding)
3. Enter comment text: "Simple addition function for testing"
4. Save the comment

**Expected:**
- Comment dialog appears
- Comment saves successfully
- CodeLens appears on line 7 showing "1 comment - Click for actions"
- File `simple-test.js.comments` is created in test-samples directory
- No errors in Debug Console

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 4: Click the CodeLens
**Action:** Click the CodeLens "1 comment - Click for actions" on line 7

**Expected:**
- Comment actions menu appears
- Shows comment: "Simple addition function for testing"
- Menu shows options: View Details, Edit, Delete, etc.
- No errors in Debug Console
- Comment is NOT marked as orphaned

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 5: Add comments to lines 12 and 17
**Action:**
1. Add comment on line 12: "Multiplication function - straightforward implementation"
2. Add comment on line 17: "TODO: Add more comprehensive error handling"

**Expected:**
- Both comments save successfully
- CodeLens appears on both lines
- No orphan warnings
- No errors in Debug Console

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 6: Toggle Comment Visibility
**Action:** Press `Ctrl+Alt+P` then `Ctrl+Alt+V` (Toggle Visibility)

**Expected:**
- Inline comment decorations toggle on/off
- Comments remain clickable via CodeLens
- No errors in Debug Console

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 7: Check Debug Console
**Action:** Review Debug Console (View → Debug Console)

**Expected:**
- Extension activation message present
- No error messages (red text)
- No warnings about backup files
- No schema validation errors
- No double extension errors (`.comments.comments`)
- No undefined path errors
- No orphan detection false positives

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________

---

## Test Summary

**Total Steps:** 7
**Passed:** ___
**Failed:** ___
**Blocked:** ___

**Overall Result:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Tester:** _______________________________________________
**Date:** _______________________________________________
**Time Taken:** _______________________________________________

---

## Test Files Used

- `test-samples/simple-test.js` - Clean JavaScript file with 3 functions
- `test-samples/simple-test.js.comments` - Will be created by extension

## Notes

- This test creates comments from scratch to avoid hash mismatch issues
- The .comments file should be generated with correct lineHash values
- This tests the real user workflow (adding comments to new files)
