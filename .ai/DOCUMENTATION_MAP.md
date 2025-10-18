# Remember: Documentation Structure

## 📂 Documentation Organization (as of October 18, 2025)

The `/docs` folder contains all project documentation in a **clean, consolidated structure**.

### Top-Level Files (Start Here!)

1. **README.md** - Documentation index and navigation hub
2. **ROADMAP.md** - Current milestone (v2.0.5 AST) + future plans (milestone-based, NOT phase-based)
3. **FEATURES.md** - Complete feature guide with examples
4. **ARCHITECTURE.md** - Technical architecture (AST-based tracking, hybrid system)
5. **SHORTCUTS.md** - Keyboard shortcut reference
6. **CONTRIBUTING.md** - Contribution guidelines for external developers

### Subdirectories

#### `guides/` - User-facing guides
- `getting-started.md` - First-time user guide

#### `testing/` - Testing documentation
- `QUICKSTART.md` - How to run and write tests (quick reference)
- `TESTING_STRATEGY.md` - Comprehensive testing strategy (Microsoft-grade)

#### `milestones/` - Development milestones
- `CURRENT.md` - What we're working on RIGHT NOW (phase-2.0.5-ast-checkpoint)

#### `archive/` - Historical documents
- `original-mvp.md` - Original MVP specification
- `implementation-log/` - Completed work logs:
  - `AST_REFACTOR_PLAN.md` - AST implementation plan
  - `FIX_DUPLICATE_MARKERS.md` - Bug fix log
  - `COMPLETE_ANALYSIS_PRE_HYBRID.md` - Pre-AST analysis

---

## 🎯 What NOT to Look For (Removed/Consolidated)

These files were **removed** or **consolidated** on October 18, 2025:

### Removed Redundancies
- ❌ `ROADMAP.md` (old v1 phase-based) → Replaced by `ROADMAP.md` (v2 milestone-based)
- ❌ `ROADMAP_V2.md` → Renamed to `ROADMAP.md`
- ❌ `testing/TESTING_GUIDE.md` → Redundant with TESTING_STRATEGY.md
- ❌ `testing/TESTING_QUICKSTART.md` → Duplicate of QUICKSTART.md
- ❌ `development/PROJECT_STATUS.md` → Outdated (Oct 16), superseded by ROADMAP.md
- ❌ `development/IMPLEMENTATION_PLAN.md` → Outdated MVP plan, superseded by AST refactor
- ❌ `development/AST_TEST_PLAN.md` → Moved to testing/ folder
- ❌ `development/GHOST_MARKERS_TEST_PLAN.md` → Moved to testing/ folder
- ❌ `features/ghost-markers.md` → Consolidated into FEATURES.md
- ❌ `features/params-and-hash-tree.md` → Consolidated into FEATURES.md + ROADMAP.md
- ❌ `features/security-foundation.md` → Consolidated into FEATURES.md
- ❌ `architecture/TECHNICAL_ARCHITECTURE.md` → Consolidated into ARCHITECTURE.md

### Archived (Not Removed)
- ✅ `archive/original-mvp.md` - Historical reference
- ✅ `archive/implementation-log/` - Completed work snapshots

---

## 📋 Quick Reference Cheat Sheet

**User wants to:**
- Get started → `guides/getting-started.md`
- See all features → `FEATURES.md`
- Find keyboard shortcuts → `SHORTCUTS.md`
- Understand architecture → `ARCHITECTURE.md`
- Know what's next → `ROADMAP.md`
- Contribute → `CONTRIBUTING.md`

**Developer wants to:**
- Run tests → `testing/QUICKSTART.md`
- Understand testing strategy → `testing/TESTING_STRATEGY.md`
- See current work → `milestones/CURRENT.md`
- See roadmap → `ROADMAP.md`

**You (AI assistant) need to:**
- Check documentation → Start with `docs/README.md`
- Find current milestone → `milestones/CURRENT.md`
- Understand roadmap → `ROADMAP.md` (milestone-based, NOT old phase-based)
- See testing info → `testing/TESTING_STRATEGY.md`

---

## 🚫 What We Cleaned Up

**Before (October 17):**
- 22 markdown files scattered across 8 folders
- 3 redundant testing guides
- 2 roadmap versions
- 7 outdated development logs
- Unclear what was current vs. historical

**After (October 18):**
- 14 markdown files in clean structure
- 1 testing quickstart + 1 comprehensive strategy
- 1 current roadmap (v2 milestone-based)
- 3 archived historical docs
- Clear separation of current vs. archive

**Space Saved:** ~8 duplicate/outdated files removed

---

## 💡 Guiding Principles

1. **Single Source of Truth** - One file per topic, no duplicates
2. **Current vs. Archive** - Clear separation
3. **User-Centric Navigation** - README.md as hub
4. **No Over-Documentation** - Concise, actionable docs only
5. **Living Documents** - Update as features change, archive when superseded

---

## 🔄 When to Update

### Update `ROADMAP.md` when:
- Completing a milestone
- Starting a new milestone
- Changing priorities
- Making strategic decisions

### Update `FEATURES.md` when:
- Adding a new feature
- Changing existing feature behavior
- Deprecating a feature

### Update `ARCHITECTURE.md` when:
- Adding new components (managers, providers, etc.)
- Changing core architecture (e.g., AST tracking)
- Performance optimizations

### Update `milestones/CURRENT.md` when:
- Starting work on a new milestone
- Previous milestone is complete

### Archive to `archive/implementation-log/` when:
- Completing a major refactor
- Finishing a bug fix investigation
- Documenting a significant technical decision

---

## ✅ Final Checklist (Completed)

- [x] Removed redundant testing guides
- [x] Consolidated roadmaps (v1 → v2)
- [x] Merged feature docs into FEATURES.md
- [x] Merged architecture docs into ARCHITECTURE.md
- [x] Created SHORTCUTS.md
- [x] Created CONTRIBUTING.md
- [x] Archived historical docs
- [x] Cleaned up development/ folder
- [x] Created this documentation map

---

**Status:** ✅ Documentation cleanup COMPLETE
**Date:** October 18, 2025
**Backup:** Old docs saved in `docs_old_backup/` (can delete after review)
