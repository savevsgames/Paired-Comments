# Test: Ghost Marker Tracking

**Test ID:** 04
**Feature:** AST-based comment tracking
**Priority:** High (Core Feature)
**Estimated Time:** 5 minutes

---

## Prerequisites
- [ ] Extension activated (F5 launched Extension Development Host)
- [ ] File opened: `test-samples/ast-test.js`
- [ ] Comment exists on line 13 (function calculateTotal)

## Test Steps

### Step 1: Verify Initial State
**Action:** Open `ast-test.js`, look for gutter icon on line 13

**Expected:** Blue 'N' icon visible on line 13 (NOTE tag)

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 2: Cut Function
**Action:**
1. Select lines 13-17 (entire calculateTotal function)
2. Press `Ctrl+X` (cut)

**Expected:** Function removed, gutter icon disappears from line 13

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 3: Paste Function at New Location
**Action:**
1. Place cursor on line 50
2. Press `Ctrl+V` (paste)

**Expected:**
- Function pasted at line 50
- Gutter icon appears on line 50 (or 51 if on opening brace)
- No errors in Debug Console (`View` → `Debug Console`)

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 4: Verify Paired View Updated
**Action:** Press `Ctrl+Alt+P`, then `O` to open paired view

**Expected:**
- `.comments` file opens beside source
- Comment shows new line number (50 or 51)
- Text references "calculateTotal" function

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 5: Verify CodeLens Tracking
**Action:** Look for "Click to view comment" CodeLens on line 50

**Expected:**
- CodeLens appears above function signature
- Clicking opens paired view at correct comment

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________


### Step 6: Undo and Verify
**Action:** Press `Ctrl+Z` twice (undo paste, then undo cut)

**Expected:**
- Function returns to original line 13
- Gutter icon returns to line 13
- No duplicate markers

**Result:** [ ] PASS [ ] FAIL

**Notes:** _______________________________________________

---

## Test Summary

**Total Steps:** 6
**Passed:** _____
**Failed:** _____
**Blocked:** _____

**Overall Result:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Tester:** _______________________________________________
**Date:** _______________________________________________
**Time Taken:** _______________________________________________
