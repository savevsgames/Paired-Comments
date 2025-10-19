# Testing Guide - Range Comments v2.0.6

**Version:** 2.0.6
**Date:** October 18, 2025
**Feature:** Range Comments Core

---

## Quick Start Testing

### 1. Test Single-Line Comment

**Steps:**
1. Open a JavaScript/TypeScript file
2. Click on line 10 (place cursor)
3. Press `Ctrl+Alt+P S` (S = Single)
4. See prompt: `"Add single-line comment for line 10"`
5. Type: `"TODO: This needs refactoring"`
6. Press Enter

**Expected Result:**
- ✅ Comment created successfully
- ✅ Single-letter gutter icon appears (orange `T`)
- ✅ Hover shows comment text
- ✅ `.comments` file created/updated

---

### 2. Test Range Comment (NEW Feature)

**Steps:**
1. Open a JavaScript/TypeScript file
2. **Place cursor on line 24** (start of range)
3. Press `Ctrl+Alt+P R` (R = Range)
4. See prompt: `"Range comment starting at line 24. Enter end line number:"`
5. Type: `27`
6. Press Enter
7. See prompt: `"Add range comment for lines 24-27"`
8. Type: `"TODO: This entire function needs validation"`
9. Press Enter

**Expected Result:**
- ✅ Range comment created successfully
- ✅ Two-letter gutter icons appear:
  - Line 24: **TS** (orange, larger, bold border)
  - Line 27: **TE** (orange, smaller)
- ✅ Hover over TS: Shows full comment + "Range Comment (lines 24-27)"
- ✅ Hover over TE: Shows "Range Comment (end)" with range info
- ✅ `.comments` file contains `endLine: 27`

---

### 3. Test Command Menu

**Steps:**
1. Press `Ctrl+Alt+P Ctrl+Alt+P` (double-tap P)
2. See command menu appear
3. Verify menu shows:
   - **S - Add Single-Line Comment**
   - **R - Add Range Comment**
   - **L - List All Comments** (changed from S)

---

### 4. Test Range Tracking

**Steps:**
1. Create a range comment on lines 24-27 (use `Ctrl+Alt+P R`)
2. Verify TS/TE icons appear
3. **Add 3 blank lines above line 24**
4. Observe gutter icons

**Expected Result:**
- ✅ Both TS and TE icons shift down by 3 lines
- ✅ TS now at line 27
- ✅ TE now at line 30
- ✅ Comment still correct when hovering

---

### 5. Test Reserved "A" Command

**Steps:**
1. Press `Ctrl+Alt+P A`
2. See message: "Smart Add (Ctrl+Alt+P A) is reserved for v2.0.7+..."

**Expected Result:**
- ✅ Message explains to use S or R instead
- ✅ No comment is created

---

### 6. Test Different Tags

**Test each tag:**
- `NOTE: ...` → Blue NS/NE icons
- `FIXME: ...` → Red FS/FE icons
- `QUESTION: ...` → Purple QS/QE icons
- `HACK: ...` → Dark orange HS/HE icons
- `WARNING: ...` → Yellow-orange WS/WE icons
- `STAR: ...` → Gold SS/SE icons

---

## Detailed Testing Scenarios

### Scenario A: Range with AST Tracking

**Setup:**
1. Select entire function (lines 10-15):
   ```javascript
   function calculateTotal(items) {
     const sum = items.reduce((a, b) => a + b.price, 0);
     return sum;
   }
   ```
2. Add range comment: `"TODO: Add tax calculation"`

**Test Cases:**
- [ ] Cut the entire function → Paste it at line 50
  - **Expected:** TS/TE icons move to new location (AST tracking)
- [ ] Add lines inside function (between 11-14)
  - **Expected:** TE icon adjusts to new end line
- [ ] Delete lines inside function
  - **Expected:** TE icon adjusts to new end line

---

### Scenario B: Nested Ranges

**Setup:**
1. Create range comment on lines 10-20
2. Create another range comment on lines 12-15 (nested)

**Test Cases:**
- [ ] Both TS/TE icons visible
- [ ] Correct colors for each tag
- [ ] Hover shows correct comment for each marker

---

### Scenario C: Edge Cases

**Test Cases:**
- [ ] Select single line → Creates single-line comment (not range)
- [ ] Empty selection (just cursor) → Creates single-line comment
- [ ] Select lines in reverse (end before start) → ???
- [ ] Very large range (100+ lines) → Performance OK?

---

## Visual Inspection Checklist

### Gutter Icons

**Single-Line:**
- [ ] Icon is circular with single letter (T, N, F, etc.)
- [ ] Radius: 7 pixels
- [ ] Font size: 10px
- [ ] No border

**Range Start (TS, NS, FS, etc.):**
- [ ] Icon is circular with TWO letters
- [ ] Radius: 8 pixels (larger than single-line)
- [ ] Font size: 7px
- [ ] Has bold border (stroke width 2)
- [ ] Color matches tag

**Range End (TE, NE, FE, etc.):**
- [ ] Icon is circular with TWO letters
- [ ] Radius: 7 pixels (same as single-line)
- [ ] Font size: 7px
- [ ] No border
- [ ] Color matches tag

### Hover Messages

**Single-Line Hover:**
- [ ] Shows "Comment" or "X Comments"
- [ ] Shows author name
- [ ] Shows comment text
- [ ] Shows creation date
- [ ] Shows "Open Comments File" link

**Range Start Hover:**
- [ ] Shows "Range Comment (lines X-Y)"
- [ ] Shows full comment details
- [ ] Shows "Open Comments File" link

**Range End Hover:**
- [ ] Shows "Range Comment (end)"
- [ ] Shows "Lines X-Y"
- [ ] Shows link to jump to start (optional)

---

## File Format Validation

**Open the `.comments` file and verify:**

### Single-Line Comment:
```json
{
  "id": "c1",
  "line": 10,
  "ghostMarkerId": "gm-1",
  "text": "TODO: This needs refactoring",
  "tag": "TODO",
  "author": "Test User",
  "created": "2025-10-18T...",
  "updated": "2025-10-18T..."
}
```

### Range Comment:
```json
{
  "id": "c2",
  "line": 24,
  "startLine": 24,     // Should be present
  "endLine": 27,       // Should be present
  "ghostMarkerId": "gm-2",
  "text": "TODO: This entire function needs validation",
  "tag": "TODO",
  "author": "Test User",
  "created": "2025-10-18T...",
  "updated": "2025-10-18T..."
}
```

### Ghost Marker for Range:
```json
{
  "id": "gm-2",
  "line": 24,
  "endLine": 27,       // Should be present
  "commentIds": ["c2"],
  "lineHash": "...",
  "lineText": "function processPayment(order) {",
  "prevLineText": "",
  "nextLineText": "  validateOrder(order);",
  "lastVerified": "2025-10-18T...",
  "astAnchor": {
    "symbolPath": ["processPayment"],
    "symbolKind": 2,
    "offset": 450
  }
}
```

---

## Known Issues / Expected Behavior

### What SHOULD Work:
- ✅ Selection-based range creation
- ✅ Two-letter gutter icons (TS/TE, NS/NE, etc.)
- ✅ Range tracking through document edits
- ✅ AST tracking for range start line
- ✅ Automatic end line adjustment

### What's NOT Implemented Yet:
- ⚠️ **Range highlighting** (greyed-out text between start/end) - Deferred to v2.0.7
- ⚠️ **Inline export** (`//@paired-comment-range-start`) - v2.0.7
- ⚠️ **Inline import** (parse inline markers) - v2.0.8
- ⚠️ **Visibility toggle** (hide/show inline markers) - v2.0.9
- ⚠️ **Partial cut/paste handling** (split ranges) - Future

### Edge Cases to Note:
- If you cut only part of a range (e.g., lines 25-26 from a 24-27 range), the end line will adjust but the comment will stay intact
- Nested ranges are allowed and should work correctly
- Very large ranges (1000+ lines) are allowed but may impact performance

---

## Reporting Issues

When reporting bugs, please include:
1. **Steps to reproduce** (exact steps)
2. **Expected behavior** (what should happen)
3. **Actual behavior** (what actually happened)
4. **Screenshot** (if visual issue)
5. **Contents of `.comments` file** (if data issue)
6. **Console output** (open Developer Tools → Console)

---

## Success Criteria

**This feature is ready to ship when:**
- [ ] All test cases pass
- [ ] No visual glitches in gutter icons
- [ ] Range tracking works reliably
- [ ] Hover messages show correct information
- [ ] File format is valid JSON
- [ ] Performance is acceptable (no lag)
- [ ] No console errors

---

**Ready to test!** Start with the Quick Start section, then proceed to detailed scenarios as needed.
