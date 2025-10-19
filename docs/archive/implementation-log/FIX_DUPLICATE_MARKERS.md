> **Historical Document:** This contains references to v1.0, v2.0.x formats.
> **Current MVP (2025-10-19):** Uses v2.1.0 format only - no migration support.

# Critical Bug Fix: Duplicate Ghost Markers

## Issue Discovered

**Problem**: Gutter icon disappears when editing the file (e.g., pressing Enter to add blank line)

**Root Cause**: Ghost markers were being loaded from `.comments` file multiple times, creating duplicate marker IDs in the GhostMarkerManager. When decorations were applied, the duplicates caused conflicts and the decoration would disappear.

## Evidence from Console Logs

```
Markers BEFORE update:
  - Marker gm-ast-001: line 118, text: "function calculateTotal(items) {"
  - Marker gm-ast-002: line 28, text: "addItem(item) {"
  - Marker gm-ast-003: line 51, text: "function applyDiscount(price) {"
  - Marker gm-ast-004: line 59, text: "const validateEmail = (email) => {"
  - Marker gm-ast-005: line 98, text: "addUser(user) {"
  - Marker gm-ast-001: line 118, text: "function calculateTotal(items) {"   <-- DUPLICATE!
  - Marker gm-ast-002: line 28, text: "addItem(item) {"                     <-- DUPLICATE!
  - Marker gm-ast-003: line 51, text: "function applyDiscount(price) {"   <-- DUPLICATE!
  - Marker gm-ast-004: line 59, text: "const validateEmail = (email) => {" <-- DUPLICATE!
  - Marker gm-ast-005: line 98, text: "addUser(user) {"                     <-- DUPLICATE!
```

Notice that each marker appears TWICE with the same ID!

## Why This Happened

The `GhostMarkerManager.addMarker()` method was missing duplicate detection:

```typescript
// OLD CODE (BROKEN):
addMarker(document, marker, editor) {
  // ... create decoration ...
  this.markers.get(key)!.push(markerState);  // No duplicate check!
}
```

When `CommentManager.loadComments()` was called:
1. It loaded ghost markers from `.comments` file
2. Called `ghostMarkerManager.addMarker()` for each marker
3. If called multiple times (e.g., file reload, editor refocus), markers were added again
4. Result: Multiple decorations at the same line, causing conflicts

## The Fix

Added duplicate detection in `GhostMarkerManager.addMarker()`:

```typescript
// NEW CODE (FIXED):
addMarker(document, marker, editor) {
  const key = document.uri.toString();

  // Check for duplicate marker ID (prevent double-loading from file)
  if (!this.markers.has(key)) {
    this.markers.set(key, []);
  }

  const existingMarkers = this.markers.get(key)!;
  const isDuplicate = existingMarkers.some(m => m.id === marker.id);
  if (isDuplicate) {
    console.log(`[GhostMarkerManager] ⚠️ Skipping duplicate marker: ${marker.id} at line ${marker.line}`);
    return;  // Skip adding duplicate
  }

  // ... rest of the code ...
}
```

## Files Modified

- `src/core/GhostMarkerManager.ts` - Added duplicate detection in `addMarker()`
- `test-samples/ast-test.js` - Reset to clean state
- `test-samples/ast-test.js.comments` - Deleted to start fresh

## Testing Steps

1. **Clean Start**: Deleted old `.comments` file to ensure no duplicates from previous sessions
2. **Reset Test File**: `calculateTotal` function now at line 13 (original position)
3. **Test Procedure**:
   - Press F5 to launch Extension Development Host
   - Open `test-samples/ast-test.js`
   - Add comment to line 13 (calculateTotal function)
   - Press Enter at line 11 to shift function down
   - **Expected**: Gutter icon should remain visible and shift to line 14
   - **Previous Behavior**: Icon would disappear
   - **New Behavior**: Icon stays visible with duplicate check preventing conflicts

## Console Output Expected

When loading the file, you should now see:
```
[GhostMarkerManager] Adding marker gm-xxx at line 13
```

If you try to reload and markers are already loaded:
```
[GhostMarkerManager] ⚠️ Skipping duplicate marker: gm-xxx at line 13
```

NO duplicate entries in the marker list!

## Why This is Critical

This bug was **blocking all testing** of AST-based ghost markers because:
- Decorations would disappear on any edit
- Impossible to test cut/paste tracking when decorations don't persist
- User couldn't see if AST resolution was working because markers vanished

With this fix, decorations should now:
✅ Stay visible during edits
✅ Shift up/down when lines are added/removed
✅ Allow proper testing of AST-based tracking

## Next Steps

1. Test basic marker persistence (press Enter, add lines, etc.)
2. Once markers stay visible, test cut/paste tracking
3. Verify AST resolution moves markers to new locations
4. Test all scenarios in the test file
