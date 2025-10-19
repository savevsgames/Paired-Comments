# MVP Smoke Test Troubleshooting Log

**Last Updated:** October 19, 2025
**Status:** ✅ All critical bugs fixed. Legacy migration code removed (MVP uses v2.1.0 only)

> **Note (2025-10-19):** This document contains historical references to migration support.
> **Current MVP:** Uses v2.1.0 format exclusively - all migration code has been removed.

---

## 🔍 Quick Reference Checklist

### File Processing Filters (CRITICAL - Check These First!)

**Files that should be IGNORED by extension:**
- ✅ `.comments` files (ends with `.comments`)
- ✅ Backup files (contains `.backup-`)

**Where filters MUST be applied:**
1. ✅ `CommentFileDecorationProvider.provideFileDecoration()` - Lines 34-42
2. ✅ `CommentCodeLensProvider.provideCodeLenses()` - Lines 39-48
3. ✅ `DecorationManager.updateDecorations()` - Lines 168-176

**Filter Pattern:**
```typescript
// Don't process .comments files themselves
if (uri.fsPath.endsWith('.comments')) {
  return; // or return [] for arrays
}

// Don't process backup files
if (uri.fsPath.includes('.backup-')) {
  return; // or return [] for arrays
}
```

---

## 🐛 Bugs Fixed So Far

### Bug #1: Backup Files Processed as Source Files
- **Symptom:** Extension tried to load `.comments` for backup files
- **Caused:** Malformed `.backup-*.comments` files being created
- **Fix:** Added backup file filtering to `CommentFileDecorationProvider` and `CommentCodeLensProvider`
- **Files:**
  - `src/ui/CommentFileDecorationProvider.ts` (lines 39-43)
  - `src/ui/CommentCodeLensProvider.ts` (lines 44-48)

### Bug #2: Schema Validation Rejecting Old Format
- **Symptom:** `ValidationError: Comment file failed schema validation`
- **Root Cause:** Validator only accepted `created`/`updated` fields, rejected old `timestamp` field
- **Impact:** All v1.x-v2.0.5 files couldn't be loaded (migration runs AFTER validation)
- **Fix (Historical):** Initially accepted EITHER format, but this was later removed
- **Current (2025-10-19):** ✅ **REMOVED** - MVP uses v2.1.0 only, no backward compatibility
- **File:** `src/io/FileSystemManager.ts` (lines 315-317)
- **Code:**
```typescript
// Require created and updated fields (v2.1.0 format - no legacy support)
if (typeof c['created'] !== 'string') return false;
if (typeof c['updated'] !== 'string') return false;
```

### Bug #3: Extension Processing Its Own `.comments` Files
- **Symptom:** Double extensions like `ast-test.js.comments.comments`, `C:\undefined.comments`
- **Root Cause:** `DecorationManager` didn't filter `.comments` files, treated them as source files
- **Impact:** Infinite retry loops, high CPU usage ("burning"), failed writes
- **Fix:** Added `.comments` and backup file filtering to `DecorationManager.updateDecorations()`
- **File:** `src/ui/DecorationManager.ts` (lines 168-176)

---

## 📝 Schema Compatibility Notes

### Comment Field Naming (Historical - For Reference Only)
- **v1.x - v2.0.5 (Historical):** Used `timestamp` field
- **v2.0.6 (Historical):** Used `created` and `updated` fields
- **v2.1.0 (CURRENT MVP):** Uses `created` and `updated` fields - **NO LEGACY SUPPORT**
- **Migration:** ✅ **REMOVED** (2025-10-19) - No backward compatibility in MVP
- **Validation:** Only accepts v2.1.0 format (rejects `timestamp` field)

### Comment Interface (Current - v2.1.x)
```typescript
interface Comment {
  id: string;
  line: number;
  text: string;
  author: string;
  created: string;      // ISO 8601 - NEW format
  updated: string;      // ISO 8601 - NEW format
  // OLD format: timestamp: string
  tag?: CommentTag;
  status?: CommentStatus;
  ghostMarkerId?: string;
  // ... other fields
}
```

---

## 🔧 Common Error Patterns

### Double Extension Errors
**Pattern:** `Error: ENOENT: no such file or directory, open 'path/to/file.comments.comments'`
- **Cause:** Extension processing a `.comments` file as source file
- **Fix:** Add filter check BEFORE calling `loadComments()` or `updateDecorations()`

### Undefined Path Errors
**Pattern:** `Error: ENOENT: no such file or directory, open 'C:\undefined.comments'`
- **Cause:** URI parameter is undefined when passed to command
- **Fix:** Add null checks OR prevent command from being called on `.comments` files

### Schema Validation Errors
**Pattern:** `ValidationError: Comment file failed schema validation`
- **Cause:** Required field missing or wrong type
- **Fix:** Check `FileSystemManager.validateCommentFile()` for field requirements

### Infinite Retry Loops ("Burning")
**Pattern:** Repeated errors every 2 seconds, high CPU
- **Cause:** CommentFileCache auto-save trying to write invalid files
- **Fix:** Prevent invalid files from entering cache, filter at source

---

## 🗂️ File Processing Flow

### Normal Comment Load Flow
1. User opens `source.js`
2. `DecorationManager.updateDecorations()` called
3. Filters check: NOT `.comments`, NOT `.backup-`
4. `CommentManager.loadComments(source.js)` → loads `source.js.comments`
5. Apply decorations to `source.js`

### What Happens When User Opens `.comments` File (SHOULD NOT PROCESS)
1. User opens `source.js.comments`
2. `DecorationManager.updateDecorations()` called
3. **Filter MUST catch:** File ends with `.comments` → RETURN EARLY
4. No further processing

### What Was Happening Before Fix (BUG)
1. User opens `source.js.comments`
2. `DecorationManager.updateDecorations()` called
3. No filter → continues
4. `CommentManager.loadComments(source.js.comments)` → tries to load `source.js.comments.comments`
5. File not found → create empty → validation error → retry loop → BURN 🔥

---

## 🧪 Test Environment Files

### Valid Test Files
- `test-samples/ast-test.js` + `ast-test.js.comments` ✅
- `test-samples/ghost-markers-demo.js` + `ghost-markers-demo.js.comments` ✅
- `test-samples/ghost-markers-demo-fresh.js` + `ghost-markers-demo-fresh.js.comments` ✅

### Invalid Files (Should Be Ignored)
- `*.backup-*.comments` (backup files - NOT source files)
- `*.comments` files themselves (metadata, not source code)

### Cleanup Command
```bash
cd test-samples
rm -f *.backup-*.comments  # Remove corrupt double-extension backups
```

---

## 🚦 Smoke Test Checklist

### Expected Behavior
- [ ] Extension activates without errors
- [ ] CodeLens shows on lines 13, 18, 30 in ast-test.js
- [ ] Clicking CodeLens opens paired view
- [ ] Can view comment details
- [ ] NO CodeLens on `.comments` files
- [ ] NO double-extension errors
- [ ] NO undefined path errors
- [ ] NO schema validation errors
- [ ] CPU usage normal (not "burning")

### Debug Console - Good Signs
- `[INFO] Extension activated!`
- `[CodeLens] Using X LIVE ghost markers` OR `Using X comments from file (legacy mode)`
- No repeated errors every 2 seconds

### Debug Console - Bad Signs
- `Error: ENOENT: no such file or directory, open '*.comments.comments'`
- `Error: ENOENT: no such file or directory, open 'C:\undefined.comments'`
- `ValidationError: Comment file failed schema validation`
- `Operation failed after 3 attempts`
- Repeated errors (suggests retry loop)

---

## 📋 Quick Troubleshooting Steps

1. **Check for double extension errors**
   - Search logs for `.comments.comments`
   - If found: Missing filter in one of the 3 locations above

2. **Check for undefined path errors**
   - Search logs for `undefined.comments`
   - If found: URI being passed is undefined, trace back to command caller

3. **Check for schema validation errors**
   - Read the .comments file to see what's wrong
   - Check if old `timestamp` format vs new `created/updated`
   - Verify validator accepts both formats

4. **Check for retry loops**
   - Look for repeated identical errors
   - Check timestamps - if every ~2 seconds, likely CommentFileCache auto-save
   - Find what's triggering the initial error

5. **Force clean reload**
   - Close Extension Development Host
   - Run `npm run compile`
   - Delete `out/` directory if needed
   - Press F5 again

---

## 📌 Next Steps If Still Failing

1. Read latest console logs
2. Identify error pattern (use patterns above)
3. Locate source of error (which filter is missing or failing)
4. Add filter/fix
5. Compile
6. Test
7. Update this document with new findings

---

## 🔬 Latest Test Results (Test #4)

### ✅ Fixed Issues
1. No more double `.comments.comments` errors
2. No more `undefined.comments` errors
3. No more schema validation errors
4. Extension activates cleanly
5. CodeLens showing correctly on lines 13, 18

### ⚠️ Remaining Issues

#### Issue #4: CodeLens Shows Comments But Can't Access Them
**Symptom:** CodeLens displays "1 comment - Click for actions" but clicking shows "No comments on line X"

**Analysis:**
- CodeLens finds comments (legacy mode using file)
- `showCommentActionsMenu()` calls `getCommentsForLine()` but finds nothing
- Likely cause: Migration happening but in-memory comment data not updated

**Potential Causes:**
1. Comments migrated from `timestamp` → `created`/`updated` but `getCommentsForLine()` using old data
2. CommentManager cache not invalidated after migration
3. Ghost markers not created during migration

#### Issue #5: CommentFileCache Auto-Save Failures
**Symptom:** `Error writing .comments file FileIOError: Operation failed with unknown error`

**Pattern:** Happens every 2 seconds from `CommentFileCache.flushFile()`

**Non-Critical:** Doesn't block functionality, but indicates cache is marking files dirty unnecessarily

**Potential Causes:**
1. Migration modifying data and marking as dirty
2. File write permissions issue
3. File locked by VS Code

### Next Debugging Steps
1. Add logging to `getCommentsForLine()` to see what it's finding
2. Check if migration is creating ghost markers
3. Verify CommentManager cache invalidation after migration
4. Check if auto-save is needed or can be disabled during smoke test

---

## 🎉 Final Test Results (Test #5)

### ✅ ALL CRITICAL BUGS FIXED!

1. ✅ Backup files processed as source files → Fixed with filtering
2. ✅ Schema validation rejecting old format → Fixed with backward compatibility
3. ✅ Extension processing `.comments` files → Fixed with filtering
4. ✅ Cache marking all files dirty → Fixed with `markDirty` parameter
5. ✅ CodeLens click not finding comments → Fixed cache lookup to use CommentFileCache

### 🔧 Additional Improvements

**Keybindings Added:**
- `Ctrl+Alt+P Ctrl+Alt+F` - Advanced Search (already existed)
- `Ctrl+Alt+P Ctrl+Alt+O` - Detect Orphans
- `Ctrl+Alt+P Ctrl+Alt+R` - Show Orphan Report
- `Ctrl+Alt+P Ctrl+Alt+M` - Move Comment to Another File
- `Ctrl+Alt+P Ctrl+Alt+C` - Copy Comment to Another File

**Files Modified (Final Session):**
1. `src/io/CommentFileCache.ts` - Added `markDirty` parameter
2. `src/core/CommentManager.ts` - Fixed cache lookup in `getCommentsForLine()` and `getCommentById()`
3. `package.json` - Added 5 new keybindings

---

**Status:** ✅ ALL BUGS FIXED - Ready for clean smoke test!
