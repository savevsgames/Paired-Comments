# Integration Roadmap - v2.1.x Features

**Status:** In Progress
**Target Completion:** 1-2 weeks
**Last Updated:** October 18, 2025

---

## 🎯 Objective

Wire up 4 pre-built features (Search, Orphan Detection, Performance Cache, Cross-File Ops) and write comprehensive tests before manual testing.

**Why This Order?**
1. Complete architecture first (avoid testing moving targets)
2. Automated tests catch bugs early
3. Manual testing validates UX with clean, tested code

---

## 📦 Pre-Built Features Ready for Integration

All core logic implemented (~1,640 lines), just needs UI wiring:

1. **CommentSearchEngine** (v2.1.2) - 376 lines ✅
2. **OrphanDetector** (v2.1.3) - 400+ lines ✅
3. **ASTCacheManager + CommentFileCache** (v2.1.4) - 500 lines ✅
4. **Cross-File Operations** (v2.1.5) - 365 lines ✅

---

## 🔧 Phase 1: Integration Tasks (Week 1)

### Task 1: Advanced Search UI (v2.1.2)
**Files to Create:**
- `src/ui/SearchPanel.ts` - Webview or TreeView for search results
- `src/commands/search.ts` - Search commands

**Integration Steps:**
1. Create SearchPanel webview
2. Add search input box
3. Add quick filter buttons (TODO, FIXME, My Comments, etc.)
4. Display results with grouping/sorting
5. Click to navigate to comment
6. Export to Markdown button

**Commands to Register:**
```json
{
  "command": "pairedComments.search",
  "title": "Paired Comments: Search",
  "key": "ctrl+alt+p f"
}
```

**Estimated Time:** 2-3 days

---

### Task 2: Orphan Detection UI (v2.1.3)
**Files to Modify:**
- `src/ui/DecorationManager.ts` - Add orphan decorations
- `src/ui/CommentCodeLensProvider.ts` - Add re-anchor actions
- `src/extension.ts` - Wire up OrphanDetector

**Integration Steps:**
1. Add orphan decoration type (orange gutter icon, dashed border)
2. Run orphan detection on file open/save
3. Add status bar item showing orphan count
4. Add CodeLens actions: [Re-anchor] [Find Symbol] [Delete]
5. Create re-anchor command
6. Add orphan report view (TreeDataProvider)

**Commands to Register:**
```json
{
  "command": "pairedComments.detectOrphans",
  "title": "Paired Comments: Detect Orphaned Comments"
},
{
  "command": "pairedComments.reanchorComment",
  "title": "Paired Comments: Re-anchor Comment"
},
{
  "command": "pairedComments.showOrphanReport",
  "title": "Paired Comments: Show Orphan Report"
}
```

**Estimated Time:** 2-3 days

---

### Task 3: Performance Caches (v2.1.4)
**Files to Modify:**
- `src/core/ASTAnchorManager.ts` - Use ASTCacheManager
- `src/core/CommentManager.ts` - Use CommentFileCache
- `src/extension.ts` - Initialize caches

**Integration Steps:**
1. Create singleton ASTCacheManager in extension.ts
2. Pass to ASTAnchorManager constructor
3. Update ASTAnchorManager.getSymbols() to use cache
4. Create singleton CommentFileCache in extension.ts
5. Pass to CommentManager constructor
6. Update CommentManager load/save to use cache
7. Invalidate caches on document changes

**Configuration:**
```json
{
  "pairedComments.performance.astCacheSize": 50,
  "pairedComments.performance.commentCacheSize": 100,
  "pairedComments.performance.autoSaveDelay": 2000
}
```

**Estimated Time:** 1-2 days

---

### Task 4: Cross-File Operations (v2.1.5)
**Files to Create:**
- `src/commands/crossFile.ts` - Wrapper commands

**Integration Steps:**
1. Create command wrappers for moveComment/copyComment
2. Add file picker UI
3. Add line number input
4. Register commands in package.json
5. Add context menu items (right-click on comment)

**Commands to Register:**
```json
{
  "command": "pairedComments.moveComment",
  "title": "Paired Comments: Move Comment to Another File"
},
{
  "command": "pairedComments.copyComment",
  "title": "Paired Comments: Copy Comment to Another File"
},
{
  "command": "pairedComments.bulkMoveComments",
  "title": "Paired Comments: Move Multiple Comments"
}
```

**Estimated Time:** 1-2 days

---

### Task 5: Smoke Test
**Actions:**
1. Press F5 to launch Extension Development Host
2. Verify extension activates without errors
3. Test one feature from each category
4. Check Debug Console for errors

**Success Criteria:**
- ✅ Extension activates
- ✅ No compilation errors
- ✅ No runtime errors in console
- ✅ At least one feature from each category works

**Estimated Time:** 1 hour

---

## 🧪 Phase 2: Automated Testing (Week 2)

### Unit Tests (~150 tests)
**Files to Create:**
```
test/unit/
├── features/
│   ├── CommentSearchEngine.test.ts (30 tests)
│   ├── OrphanDetector.test.ts (25 tests)
│   └── RangeComments.test.ts (20 tests)
├── core/
│   ├── ASTCacheManager.test.ts (15 tests)
│   ├── CommentFileCache.test.ts (15 tests)
│   └── ParamManager.test.ts (30 tests)
└── commands/
    └── crossFileOperations.test.ts (15 tests)
```

**Estimated Time:** 3-4 days

---

### Integration Tests (~75 tests)
**Files to Create:**
```
test/integration/
├── SearchWorkflow.test.ts (15 tests)
├── OrphanDetectionWorkflow.test.ts (15 tests)
├── PerformanceCache.test.ts (15 tests)
├── CrossFileWorkflow.test.ts (15 tests)
└── AIMetadataWorkflow.test.ts (15 tests)
```

**Estimated Time:** 2-3 days

---

### E2E Tests (~25 tests)
**Files to Create:**
```
test/suite/
├── SearchAndFilter.test.ts (10 tests)
└── OrphanDetection.test.ts (15 tests)
```

**Estimated Time:** 1-2 days

---

**Phase 2 Success Criteria:**
- ✅ 250+ total tests
- ✅ 70%+ overall coverage
- ✅ All tests passing
- ✅ CI/CD green

---

## 🎮 Phase 3: Manual Testing (Week 3)

### Manual Test Cases to Create (~40 tests)
```
test/manual/
├── core-features/ (10 tests)
│   ├── 01-add-comment.test.md
│   ├── 02-edit-comment.test.md
│   ├── 03-delete-comment.test.md
│   ├── 04-ghost-marker-tracking.test.md ✅ (example)
│   ├── 05-range-comments.test.md
│   └── ...
├── ai-features/ (8 tests)
│   ├── 10-dynamic-parameters.test.md
│   ├── 11-ai-enrichment.test.md
│   └── ...
├── search-features/ (8 tests)
│   ├── 20-basic-search.test.md
│   ├── 21-advanced-filters.test.md
│   └── ...
├── orphan-detection/ (6 tests)
│   ├── 30-detect-orphans.test.md
│   └── ...
├── cross-file/ (5 tests)
│   ├── 40-move-comment.test.md
│   └── ...
└── performance/ (3 tests)
    ├── 50-large-file-performance.test.md
    └── ...
```

**Workflow:**
1. Create test cases from template
2. Copy to `.originals/`
3. Run tests, record results
4. Share 3-5 completed tests with Claude
5. Analyze failures, fix bugs
6. Reset and continue

**Estimated Time:** 3-4 days

---

## 📅 Timeline Summary

| Week | Phase | Tasks | Outcome |
|------|-------|-------|---------|
| **Week 1** | Integration | Wire up 4 features + smoke test | All features compiled and working |
| **Week 2** | Automated Tests | 250+ tests, 70%+ coverage | Bugs caught early |
| **Week 3** | Manual Tests | 40 manual test cases | UX validated, edge cases found |
| **Week 4** | Polish | Fix bugs, update docs | Ready for v1.0 beta |

---

## ✅ Integration Checklist

### Week 1: Integration
- [x] CommentSearchEngine → Search panel UI (✅ COMPLETED)
  - Created SearchPanel.ts webview (469 lines)
  - Created search.ts command handlers
  - Registered commands and keybindings
  - Wired into extension.ts
  - Zero compilation errors
- [ ] OrphanDetector → Visual indicators (2-3 days) ⬅️ **NEXT**
- [ ] Performance Caches → Wire into managers (1-2 days)
- [ ] Cross-File Ops → Register commands (1-2 days)
- [ ] Smoke test (1 hour)
- [x] Zero compilation errors ✅
- [ ] Extension activates without errors

### Week 2: Automated Testing
- [ ] 150 unit tests written
- [ ] 75 integration tests written
- [ ] 25 E2E tests written
- [ ] 70%+ coverage achieved
- [ ] All tests passing
- [ ] CI/CD green

### Week 3: Manual Testing
- [ ] 40 manual test cases created
- [ ] Critical path tests completed
- [ ] All P0/P1 bugs fixed
- [ ] Performance validated
- [ ] UX smooth and intuitive

### Week 4: Release Prep
- [ ] All bugs fixed
- [ ] Documentation updated
- [ ] CHANGELOG.md complete
- [ ] Screenshots/GIFs created
- [ ] Ready for v1.0 beta release

---

## 🎯 Success Metrics

**Technical:**
- ✅ Zero compilation errors
- ✅ Zero runtime errors in common workflows
- ✅ 70%+ test coverage
- ✅ All automated tests passing

**Functional:**
- ✅ All planned features working
- ✅ Search returns results in <1 second
- ✅ Orphan detection >90% accuracy
- ✅ Cache provides 60-90x speedup
- ✅ Cross-file operations preserve metadata

**User Experience:**
- ✅ Extension activates quickly (<2 seconds)
- ✅ No UI lag during typing
- ✅ Clear error messages
- ✅ Intuitive workflows

---

**Status:** Phase 1 (Integration) - In Progress (1 of 4 features complete)
**Next Step:** Integrate Orphan Detection UI (v2.1.3)

---

## 🎉 Recent Progress (Oct 18, 2025)

### ✅ Completed:
1. **Advanced Search UI (v2.1.2)** - Fully integrated and compiling
   - Search panel webview with field:value syntax
   - Quick filters (TODO, FIXME, NOTE, REVIEW, STAR, Orphaned, AI-Enriched)
   - Click-to-navigate results
   - Export to Markdown
   - Command: `Ctrl+Alt+P Ctrl+Alt+F`

2. **Backup File Bug Fix** - Resolved double `.comments` extension issue
   - Fixed `FileSystemManager.restoreFromBackup()`
   - Created cleanup scripts
   - Clean test environment ready

### 📋 Next Up:
**Task 2: Orphan Detection UI (v2.1.3)** - Wire up visual indicators for orphaned comments
