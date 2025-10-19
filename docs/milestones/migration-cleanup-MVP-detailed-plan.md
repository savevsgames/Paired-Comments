# MVP Migration Cleanup - Detailed File-by-File Plan

**Created:** October 19, 2025
**Parent Document:** [MVP-migration-cleanup.md](./MVP-migration-cleanup.md)
**Status:** Ready for execution

---

## Overview

This document provides a **detailed, file-by-file breakdown** of every change needed to remove all legacy migration code and standardize on v2.1.0 format only.

**Total Files to Modify:** 26
- Source Files: 8
- Documentation Files: 17
- Test Files: 3

---

## PHASE 1: Critical Source Code Files

### 1. `src/io/FileSystemManager.ts` ⚠️ **HIGHEST PRIORITY**

**Current Issues:**
- Contains 200+ lines of migration code
- References v1.0, v2.0, v2.0.5, v2.0.6
- Validates both old `timestamp` and new `created`/`updated` formats
- Has 3 migration methods that are never needed

**Changes Required:**

#### Line 3: Update file header comment
```typescript
// REMOVE:
* Supports v1.0 (basic), v2.0 (ghost markers), v2.0.5 (AST anchors), v2.0.6 (range comments)

// REPLACE WITH:
* Supports v2.1.0 format only (MVP - no legacy support)
```

#### Lines 122-123: Already fixed ✅
```typescript
// No migration support - MVP uses v2.1.0 only
return result;
```

#### Lines 259-327: DELETE entire `migrateToLatestVersion()` method
- Remove method completely (69 lines)
- This includes all version migration logic
- Remove related error handling

#### Lines 337-393: DELETE entire `migrateV10ToV20()` method
- Remove method completely (57 lines)
- Remove ghost marker creation logic for v1.0

#### Lines 405-448: DELETE entire `migrateV20ToV205()` method
- Remove method completely (44 lines)
- Remove AST anchor addition logic for v2.0

#### Lines 453-461: DELETE `hashString()` method
- Only used by migration code
- Remove completely (9 lines)

#### Lines 472-474: Update `validateCommentFile()` comment
```typescript
// REMOVE:
* Supports v1.0 (basic), v2.0 (ghost markers), and v2.0.5 (AST anchors)

// REPLACE WITH:
* Validates v2.1.0 format only - MVP standard
```

#### Lines 524-527: Simplify timestamp validation
```typescript
// REMOVE:
// Accept either old 'timestamp' field (v1.x-v2.0.5) OR new 'created'/'updated' (v2.0.6+)
// Migration will handle converting timestamp -> created/updated
const hasOldFormat = typeof c['timestamp'] === 'string';
const hasNewFormat = typeof c['created'] === 'string' && typeof c['updated'] === 'string';
if (!hasOldFormat && !hasNewFormat) return false;

// REPLACE WITH:
// Require created and updated fields (v2.1.0 format)
if (typeof c['created'] !== 'string') return false;
if (typeof c['updated'] !== 'string') return false;
```

**Total Lines to Remove:** ~200 lines
**Estimated Time:** 15 minutes

---

### 2. `src/types.ts`

**Current Issues:**
- Comments reference old versions
- May have old version constants

**Changes Required:**

#### Search for version references
```bash
grep -n "v1\.0\|v2\.0\.5\|v2\.0\.6" src/types.ts
```

**Expected Changes:**
- Line 193: Update comment about ghost markers
- Remove any old version references in comments
- Verify `COMMENT_FILE_VERSION = '2.1.0'` is correct

**Estimated Time:** 5 minutes

---

### 3. `src/core/CommentManager.ts`

**Current Issues:**
- May reference old format handling
- Comments might reference migrations

**Changes Required:**

#### Search for issues
```bash
grep -n "timestamp\|v2\.0\|migrat" src/core/CommentManager.ts
```

**Expected Findings:**
- Update any comments about version compatibility
- Ensure all created comments use v2.1.0 format
- No `timestamp` field handling

**Estimated Time:** 5 minutes

---

### 4. `src/core/GhostMarkerManager.ts`

**Current Issues:**
- Comments reference v2.0.5+ for AST anchors

**Changes Required:**

#### Lines to update
- Line 6: Comment says "v2.0.5+" - update to "v2.1.0"
- Line 51: Comment says "v2.0.5+" - update to "v2.1.0"
- Line 323: Comment says "v2.0.5+" - update to "v2.1.0"

```typescript
// FIND & REPLACE:
"v2.0.5+" → "v2.1.0"
```

**Estimated Time:** 2 minutes

---

### 5. `src/ui/DecorationManager.ts`

**Current Issues:**
- May have version-related comments

**Changes Required:**

```bash
grep -n "v2\.0" src/ui/DecorationManager.ts
```

**Expected:** Minimal changes, just comment updates

**Estimated Time:** 2 minutes

---

### 6. `src/io/FileSystemManager.d.ts` (Auto-generated)

**Changes Required:**
- Will be regenerated after TypeScript compilation
- No manual changes needed

**Estimated Time:** 0 minutes (automatic)

---

### 7. `src/types.d.ts` (Auto-generated)

**Changes Required:**
- Will be regenerated after TypeScript compilation
- No manual changes needed

**Estimated Time:** 0 minutes (automatic)

---

### 8. `src/core/GhostMarkerManager.d.ts` (Auto-generated)

**Changes Required:**
- Will be regenerated after TypeScript compilation
- No manual changes needed

**Estimated Time:** 0 minutes (automatic)

---

## PHASE 2: Documentation Files

### 9. `docs/ARCHITECTURE.md`

**Current Issues:**
- Contains migration flow diagrams
- References v2.0.5, v2.0.6 formats
- Has backward compatibility sections

**Changes Required:**

```bash
grep -n "v1\.0\|v2\.0\.5\|v2\.0.6\|migrat\|backward" docs/ARCHITECTURE.md | wc -l
```

**Actions:**
1. Remove "Migration Flow" section if it exists
2. Update "File Format" section to show v2.1.0 only
3. Remove any "Backward Compatibility" sections
4. Update version references from v2.0.6 to v2.1.0

**Estimated Time:** 10 minutes

---

### 10. `docs/USER_GUIDE.md`

**Current Issues:**
- Version history may reference old versions
- Migration instructions may exist

**Changes Required:**

**Search:**
```bash
grep -n "migrat\|v2\.0\.5\|v2\.0\.6" docs/USER_GUIDE.md
```

**Actions:**
1. Update version history table to show v2.1.0 as MVP
2. Remove migration-related FAQ items
3. Update feature tables to reference v2.1.0

**Estimated Time:** 8 minutes

---

### 11. `docs/ROADMAP.md`

**Current Issues:**
- References AST-Based Line Tracking (v2.0.5)
- May have migration milestones

**Changes Required:**

**Search:**
```bash
grep -n "v2\.0\.5\|migrat" docs/ROADMAP.md
```

**Actions:**
1. Update milestone references
2. Change "v2.0.5 checkpoint" to "v2.1.0 MVP"
3. Note that migrations will be added POST-MVP if needed

**Estimated Time:** 10 minutes

---

### 12. `docs/milestones/CURRENT.md`

**Current Issues:**
- References v2.0.5 development
- May have migration documentation

**Changes Required:**

**Actions:**
1. Update version references to v2.1.0
2. Remove migration-related content
3. Update file format examples

**Estimated Time:** 5 minutes

---

### 13. `docs/milestones/MVP_troubleshooting.md`

**Current Issues:**
- Bug #2 discusses old timestamp format
- References v1.x-v2.0.5 migration

**Changes Required:**

**Specific Lines:**
- Lines 49, 71: Update comments about timestamp format
- Update to note "MVP uses v2.1.0 only - no migration needed"

**Estimated Time:** 3 minutes

---

### 14. `docs/milestones/v2.0.6-range-comments-checkpoint.md`

**Current Issues:**
- Entire document is about v2.0.6
- May be historical reference

**Changes Required:**

**Decision:**
- Move to `docs/archive/milestones/` (historical reference)
- OR update to reflect v2.1.0 if still relevant
- Add note at top: "Historical - MVP uses v2.1.0"

**Estimated Time:** 2 minutes

---

### 15. `docs/milestones/range-comments-design.md`

**Current Issues:**
- References v2.0.5 AST foundation

**Changes Required:**

**Actions:**
1. Update version references
2. Note that range comments are part of v2.1.0

**Estimated Time:** 3 minutes

---

### 16. `docs/milestones/integration-roadmap.md`

**Current Issues:**
- May reference version milestones

**Changes Required:**

```bash
grep -n "v2\.0" docs/milestones/integration-roadmap.md
```

**Actions:**
- Update version references
- Ensure roadmap reflects v2.1.0 as current

**Estimated Time:** 3 minutes

---

### 17-24. Archive Documentation Files

**Files:**
- `docs/analysis/project-health-analysis.md`
- `docs/archive/implementation-log/AST_REFACTOR_PLAN.md`
- `docs/archive/implementation-log/COMPLETE_ANALYSIS_PRE_HYBRID.md`
- `docs/archive/original-mvp.md`
- `docs/archive/roadmap-additions-analysis.md`
- `docs/archive/session-summary-2025-10-18.md`
- `docs/guides/getting-started.md`
- `docs/testing/IMPLEMENTATION_STATUS.md`

**Changes Required:**

**Decision:** Add header note to each file:
```markdown
> **Note:** This document contains historical references to v1.0, v2.0.x formats.
> **Current MVP:** v2.1.0 format only - no migration support.
```

**Estimated Time:** 15 minutes total (all files)

---

### 25. `docs/testing/TESTING_STRATEGY.md`

**Changes Required:**
- Remove migration-related test strategies
- Update to reflect v2.1.0 only testing

**Estimated Time:** 5 minutes

---

## PHASE 3: Test Files

### 26. `test/fixtures/README.md`

**Current Issues:**
- Documents old format fixtures
- References v2.0 format

**Changes Required:**

**Actions:**
1. Update to document v2.1.0 format only
2. Note that all fixtures use current format
3. Remove references to legacy formats

**Estimated Time:** 5 minutes

---

### 27. `test/suite/CommentManager.test.ts`

**Current Issues:**
- May have migration-related tests

**Changes Required:**

```bash
grep -n "migrat\|v1\.0\|v2\.0" test/suite/CommentManager.test.ts
```

**Actions:**
- Remove migration test cases
- Update all test data to v2.1.0 format
- Ensure tests only validate v2.1.0 schema

**Estimated Time:** 10 minutes

---

### 28. `test/suite/RangeComments.test.ts`

**Current Issues:**
- May reference v2.0.6 as when range comments were added

**Changes Required:**

**Actions:**
- Update comments to note range comments are part of v2.1.0
- Ensure test data uses v2.1.0 format

**Estimated Time:** 3 minutes

---

## PHASE 4: Test Sample Files

### 29. `test-samples/` directory

**Current Status:**
- ✅ All `.comments` files deleted (already done)
- Clean `.js` files remain

**Changes Required:**
- None (already clean)
- Document that `.comments` files are generated by extension, not pre-created

**Estimated Time:** 0 minutes (already complete)

---

## PHASE 5: Configuration & Metadata

### 30. `CHANGELOG.md`

**Changes Required:**

**Add entry:**
```markdown
## [2.1.1] - 2025-10-19

### Removed
- All legacy migration code (v1.0, v2.0, v2.0.5, v2.0.6)
- Backward compatibility support for old .comments formats
- Reason: No users = no legacy to support. MVP uses v2.1.0 only.

### Changed
- Standardized on v2.1.0 comment file format exclusively
- Simplified file validation (removed old timestamp field support)
- Updated documentation to reflect single-format approach
```

**Estimated Time:** 3 minutes

---

### 31. `README.md`

**Changes Required:**

**Search:**
```bash
grep -n "migrat\|v2\.0" README.md
```

**Actions:**
- Update version references if any exist
- Ensure feature list reflects v2.1.0

**Estimated Time:** 2 minutes

---

## Execution Summary

### Total Time Estimate: **2 hours**

**Breakdown:**
- Phase 1 (Source Code): 45 minutes
- Phase 2 (Documentation): 60 minutes
- Phase 3 (Tests): 15 minutes
- Phase 4 (Samples): 0 minutes (done)
- Phase 5 (Config): 5 minutes
- Compilation & Testing: 15 minutes

### Priority Order

**Do First (Critical Path):**
1. ✅ `src/io/FileSystemManager.ts` - Remove migration code
2. `src/types.ts` - Update version constants
3. Compile TypeScript
4. Test extension loads

**Do Second (Testing):**
5. `test/suite/CommentManager.test.ts` - Update tests
6. `test/fixtures/README.md` - Update documentation
7. Run test suite

**Do Third (Documentation):**
8. All docs files (can be done in parallel)
9. CHANGELOG.md
10. README.md

---

## Verification Commands

Run these after cleanup:

```bash
# Should return 0 results
grep -r "migrateToLatestVersion" src/ --include="*.ts"

# Should return 0 results
grep -r "migrateV10\|migrateV20" src/ --include="*.ts"

# Should return 0 results (except in removal notes/comments)
grep -r "timestamp.*field" src/ --include="*.ts"

# Should return 0 results
grep -r "v1\.0\|v2\.0\.5" src/ --include="*.ts"

# Should return minimal results (only historical docs)
grep -r "v2\.0\.6" src/ docs/ test/ --include="*.ts" --include="*.md"

# Compile should succeed
npm run compile

# Extension should load with v2.1.0 files
# Open test-samples/simple-test.js and add a comment
# Check that .comments file has "version": "2.1.0"
```

---

## Completion Checklist

- [ ] All source code files updated
- [ ] All documentation files updated
- [ ] All test files updated
- [ ] TypeScript compiles with no errors
- [ ] All verification commands return expected results
- [ ] Smoke test passes (add comment to test file)
- [ ] Created `.comments` file shows v2.1.0
- [ ] No migration code executes during operation
- [ ] Git commit created: "Remove legacy migration code - MVP standardized on v2.1.0"

---

## Post-Cleanup Actions

1. Update parent document `MVP-migration-cleanup.md` with completion status
2. Close this milestone
3. Create new milestone: "MVP Manual Testing"
4. Proceed with smoke tests using clean v2.1.0 format

---

## Notes

- Keep a backup branch before starting cleanup
- Test after each phase to catch issues early
- Update this document if any unexpected issues arise
- Some auto-generated `.d.ts` and `.js` files will update after compilation
