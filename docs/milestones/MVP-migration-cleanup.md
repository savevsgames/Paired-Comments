# MVP Migration Cleanup - Remove Legacy Support

**Created:** October 19, 2025
**Status:** In Progress
**Priority:** Critical - Blocking MVP launch

---

## Problem Statement

Throughout development, we've been building migration logic as if we had existing users with legacy `.comments` files. This has resulted in:

1. **Unnecessary complexity** - Migration code for v1.0, v2.0, v2.0.5, v2.0.6 formats
2. **Version confusion** - Multiple version numbers scattered across codebase
3. **Over-engineering** - Supporting formats that have zero users
4. **Test file issues** - Mixed format test files causing false positives
5. **Code bloat** - Hundreds of lines of dead migration code

**Reality Check:** We have **ZERO users**. We need **ZERO legacy support**.

---

## Decision

**For MVP Launch:**
- Support **ONLY v2.1.0** comment file format
- **NO backward compatibility** with any previous formats
- **NO migration logic** at all
- If format changes before launch, we **update everything** and **delete old code**
- After launch, we can add migrations for real users if needed

---

## Current Format (v2.1.0)

```json
{
  "file": "example.js",
  "version": "2.1.0",
  "ghostMarkers": [
    {
      "id": "gm-...",
      "line": 10,
      "commentIds": ["comment-id"],
      "astAnchor": { "symbolPath": ["functionName"], "symbolKind": "Function", ... },
      "lineHash": "a1b2c3d4",
      "lineText": "function example() {",
      "prevLineText": "// Comment above",
      "nextLineText": "  return true;",
      "lastVerified": "2025-10-19T00:00:00.000Z"
    }
  ],
  "comments": [
    {
      "id": "comment-id",
      "line": 10,
      "startLine": 10,
      "endLine": 15,          // Optional - for range comments
      "text": "Comment text",
      "author": "Username",
      "created": "2025-10-19T00:00:00.000Z",
      "updated": "2025-10-19T00:00:00.000Z",
      "tag": "NOTE",
      "ghostMarkerId": "gm-...",
      "aiMetadata": { ... },  // Optional - v2.1.0 feature
      "params": { ... }       // Optional - v2.1.0 feature
    }
  ]
}
```

**Key Fields (v2.1.0 ONLY):**
- `created` and `updated` (NOT `timestamp`)
- `ghostMarkerId` required (NOT null)
- `version: "2.1.0"`
- `aiMetadata` and `params` optional

---

## Cleanup Checklist

### 1. Source Code (`src/`)

#### FileSystemManager.ts
- [ ] Remove `migrateToLatestVersion()` method (lines ~260-327)
- [ ] Remove `migrateV10ToV20()` method (lines ~332-393)
- [ ] Remove `migrateV20ToV205()` method (lines ~398-448)
- [ ] Remove `hashString()` method (used only for migration)
- [ ] Remove call to `migrateToLatestVersion()` in `readCommentFile()`
- [ ] Update comments referencing migration logic
- [ ] Simplify `validateCommentFile()` to ONLY accept v2.1.0 format
  - Remove check for old `timestamp` field
  - Require `created` and `updated` fields
  - Require `ghostMarkerId` (not null)

#### CommentManager.ts
- [ ] Remove any migration-related code
- [ ] Ensure all created comments use v2.1.0 format
- [ ] Remove any `timestamp` field handling

#### types.ts
- [ ] Verify `COMMENT_FILE_VERSION = '2.1.0'`
- [ ] Remove old version constants if any exist
- [ ] Update Comment interface documentation

#### errors/PairedCommentsError.ts
- [ ] Review MigrationError class - keep or remove?
- [ ] Update error messages to not reference migrations

### 2. Test Files (`test/`)

#### Test Fixtures (`test/fixtures/`)
- [ ] Delete all old format test files
- [ ] Create ONLY v2.1.0 format fixtures
- [ ] Update README.md in fixtures folder

#### Unit Tests (`test/unit/`)
- [ ] Remove migration-related tests
- [ ] Update FileSystemManager tests to only test v2.1.0
- [ ] Remove validation tests for old formats

#### Integration Tests (`test/integration/`)
- [ ] Remove tests for old format compatibility
- [ ] Update to use v2.1.0 format only

#### Manual Tests (`test/manual/`)
- [ ] Update test files to reference v2.1.0 only
- [ ] Remove any migration test cases

### 3. Test Sample Files (`test-samples/`)

- [x] Delete all `.comments` files (let extension create fresh ones)
- [ ] Ensure `.js` files are clean
- [ ] Document that `.comments` files are generated, not pre-created

### 4. Documentation (`docs/`)

#### Architecture Docs
- [ ] `docs/ARCHITECTURE.md` - Remove migration flow diagrams
- [ ] Remove "backward compatibility" sections
- [ ] Update file format section to show v2.1.0 only

#### User Guide
- [ ] `docs/USER_GUIDE.md` - Remove migration references
- [ ] Update version history to note "MVP format: v2.1.0"

#### Roadmap
- [ ] `docs/ROADMAP.md` - Remove migration milestones
- [ ] Note that migrations will be added POST-MVP if needed

#### Milestone Docs
- [ ] `docs/milestones/CURRENT.md` - Update to reflect no migrations
- [ ] Review other milestone docs for migration references
- [ ] Update troubleshooting docs

#### Archive
- [ ] Move migration-related docs to `docs/archive/` if valuable
- [ ] Or delete entirely if not needed

### 5. Comments & Code Documentation

Search for these patterns and clean up:
- [ ] "v1.0", "v1.x" references
- [ ] "v2.0", "v2.0.0" references
- [ ] "v2.0.5" references
- [ ] "v2.0.6" references
- [ ] "migration", "migrate" (except in this doc and commit messages)
- [ ] "backward compatibility", "backwards compatible"
- [ ] "legacy", "old format"
- [ ] "timestamp" field (should only be in removal notes)

### 6. Configuration Files

- [ ] `package.json` - Verify version is 2.1.x
- [ ] Remove any migration-related scripts
- [ ] Update description if it mentions migrations

### 7. CHANGELOG.md

- [ ] Add entry: "Removed legacy migration code (no users = no legacy support)"
- [ ] Note: "MVP supports v2.1.0 format only"

---

## Implementation Strategy

### Phase 1: Analysis (This Document)
1. Create this milestone document
2. Search entire codebase for migration-related code
3. Catalog all files that need updates

### Phase 2: Code Cleanup
1. Remove migration methods from FileSystemManager
2. Simplify validation to v2.1.0 only
3. Update all test files to v2.1.0 format
4. Run compile and fix any TypeScript errors

### Phase 3: Documentation Cleanup
1. Update all docs to remove migration references
2. Update inline comments
3. Update error messages

### Phase 4: Testing
1. Delete all test `.comments` files
2. Run smoke test - add comments from scratch
3. Verify extension creates v2.1.0 files correctly
4. Confirm NO migration code runs

### Phase 5: Verification
1. Search codebase for patterns listed in checklist
2. Verify zero references to old versions
3. Git commit with message: "Remove legacy migration code for MVP"

---

## Search Commands

Use these to find remaining references:

```bash
# Find version references
grep -r "v1\.0\|v2\.0\.5\|v2\.0\.6" src/ docs/ test/ --exclude-dir=node_modules

# Find migration references
grep -r "migrat" src/ docs/ test/ --exclude-dir=node_modules

# Find timestamp field references (old format)
grep -r "timestamp.*field\|'timestamp'" src/ --exclude-dir=node_modules

# Find backward compatibility references
grep -r "backward.*compat\|legacy" src/ docs/ --exclude-dir=node_modules
```

---

## Files to Review (Preliminary List)

### High Priority - Contains Migration Code
- `src/io/FileSystemManager.ts` ⚠️ **CRITICAL**
- `src/core/CommentManager.ts`
- `src/types.ts`
- `src/errors/PairedCommentsError.ts`

### Medium Priority - References Old Versions
- `docs/ARCHITECTURE.md`
- `docs/USER_GUIDE.md`
- `docs/ROADMAP.md`
- `docs/milestones/CURRENT.md`
- `docs/milestones/MVP_troubleshooting.md`
- `test/fixtures/` (entire directory)

### Low Priority - May Have Scattered References
- All files in `docs/archive/`
- All test files
- CHANGELOG.md
- README.md

---

## Post-Cleanup Verification

After cleanup is complete, these should all be TRUE:

- [ ] `grep -r "migrateToLatestVersion" src/` returns 0 results
- [ ] `grep -r "timestamp.*field" src/` returns 0 results (except removal notes)
- [ ] `grep -r "v1\.0\|v2\.0\.5\|v2\.0\.6" src/` returns 0 results
- [ ] All test files use v2.1.0 format
- [ ] Extension compiles with no errors
- [ ] Smoke test passes (add comments from scratch)
- [ ] No migration code executes during normal operation

---

## Rationale

**Why now?**
- We're preparing for MVP manual testing
- Migration code is causing bugs (orphan false positives, version mismatches)
- Cleaner codebase = easier to test and debug
- Technical debt removal before launch

**Why remove instead of disable?**
- Dead code is confusing
- Easier to add migrations later (when we have real users) than maintain unused code now
- Clear separation: MVP = v2.1.0 only, post-MVP = add migrations if needed

**What if we change the format before MVP?**
- We update all test files to the new format
- We delete old format handling code
- We do NOT add migration logic
- Only ONE format supported at any time during MVP development

---

## Success Criteria

✅ Extension loads cleanly with v2.1.0 files
✅ No migration code executes
✅ All tests pass with v2.1.0 format only
✅ Documentation reflects single-format approach
✅ Codebase search shows zero old version references
✅ Smoke test passes - comments created from scratch work perfectly

---

## Timeline

- **Day 1 (Today):** Create this document, begin Phase 1 analysis
- **Day 2:** Complete code cleanup (Phase 2)
- **Day 3:** Documentation cleanup (Phase 3)
- **Day 4:** Testing and verification (Phases 4-5)

**Target Completion:** October 22, 2025

---

## Notes

- Keep this document updated as cleanup progresses
- Mark checklist items as completed
- Document any issues encountered
- This is a ONE-TIME cleanup for MVP
- Post-MVP, we can decide on migration strategy for real users
