# Testing Strategy

**Version:** 2.1.0
**Last Updated:** October 18, 2025

---

## 🎯 Overall Testing Philosophy

**Goal:** Achieve 70%+ test coverage with a comprehensive testing pyramid before v1.0 release.

**Strategy:** 3-Phase Approach
1. **Phase 1: Integration** - Wire up all features, ensure compilation
2. **Phase 2: Automated Testing** - Write comprehensive unit/integration tests
3. **Phase 3: Manual Testing** - Structured, repeatable manual test cases

**Why This Order?**
- Complete architecture first (avoid testing moving targets)
- Automated tests catch bugs early (before wasting manual testing time)
- Manual tests verify UX and edge cases automated tests can't cover

---

## 📊 Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Full user workflows
     /      \    - Extension activation
    /        \   - Multi-file scenarios
   /__________\
  /            \  Integration Tests (30%)
 /              \ - Manager interactions
/________________\- Command workflows
|                | Unit Tests (60%)
|   Unit Tests   | - Pure functions
|________________| - Business logic
                   - Individual managers
```

### Target Coverage (v1.0)
- **Overall:** 70%+ coverage
- **Core Logic:** 85%+ (managers, core/)
- **UI Layer:** 50%+ (commands, decorations)
- **Total Tests:** 250+ tests

---

## 🔧 Phase 1: Integration (Current)

**Objective:** Wire up all core features for MVP

### Features to Integrate
1. ✅ AI Metadata & Params (v2.1.0) - Mostly done
2. ⏳ Advanced Search (v2.1.2) - Core ready, needs UI
3. ⏳ Orphan Detection (v2.1.3) - Core ready, needs UI
4. ⏳ Performance Cache (v2.1.4) - Core ready, needs integration
5. ⏳ Cross-File Operations (v2.1.5) - Core ready, needs commands

### Integration Checklist
- [ ] CommentSearchEngine → Search panel UI
- [ ] OrphanDetector → Visual indicators (gutter, status bar, CodeLens)
- [ ] ASTCacheManager → Wire into ASTAnchorManager
- [ ] CommentFileCache → Wire into CommentManager
- [ ] Cross-File Ops → Register commands in package.json + extension.ts
- [ ] All features compile with zero errors
- [ ] Basic smoke test (extension activates)

**Success Criteria:** Extension compiles and activates without errors.

---

## 🧪 Phase 2: Automated Testing

**Objective:** Comprehensive test coverage to catch bugs before manual testing

### 2.1 Unit Tests (60% of total tests)

**Target:** ~150 unit tests

**Test Organization:**
```
test/unit/
├── managers/
│   ├── CommentManager.test.ts
│   ├── GhostMarkerManager.test.ts
│   ├── ASTAnchorManager.test.ts
│   ├── ParamManager.test.ts
│   └── DecorationManager.test.ts
├── features/
│   ├── CommentSearchEngine.test.ts
│   ├── OrphanDetector.test.ts
│   └── RangeComments.test.ts
├── core/
│   ├── ASTCacheManager.test.ts
│   └── CommentFileCache.test.ts
└── utils/
    ├── RetryLogic.test.ts
    └── Logger.test.ts
```

**What to Test:**
- ✅ Pure functions (100% coverage goal)
- ✅ Business logic (parameter extraction, search queries, orphan detection)
- ✅ Edge cases (null, undefined, empty arrays)
- ✅ Error handling (retry logic, validation)

### 2.2 Integration Tests (30% of total tests)

**Target:** ~75 integration tests

**Test Organization:**
```
test/integration/
├── CommentWorkflow.test.ts          # Add → Edit → Delete
├── GhostMarkerTracking.test.ts      # Cut/paste, code movement
├── SearchWorkflow.test.ts           # Search → Filter → Export
├── OrphanDetectionWorkflow.test.ts  # Detect → Re-anchor → Fix
├── CrossFileWorkflow.test.ts        # Move → Copy → Import/Export
├── AIMetadataWorkflow.test.ts       # Enrich → Display → Update
└── PerformanceCache.test.ts         # Cache hits, invalidation
```

### 2.3 Test Running

**Commands:**
```bash
npm run test:unit           # Run unit tests only (~2 seconds)
npm run test:integration    # Run integration tests (~10 seconds)
npm run test:all            # Run all automated tests (~15 seconds)
npm run test:coverage       # Generate coverage report
npm run test:watch          # Watch mode for TDD
```

**Success Criteria:**
- All automated tests pass
- 70%+ overall coverage
- Zero compilation errors

---

## 🎮 Phase 3: Manual Testing

**Objective:** Structured, repeatable manual test cases to verify UX and edge cases

### 3.1 Manual Testing Framework

**Philosophy:**
- **One feature, one test file** - Focused, isolated testing
- **Step-by-step instructions** - No ambiguity about what to test
- **Record results inline** - Test file becomes the test report
- **Resettable** - Script resets all test files to pristine state

**File Structure:**
```
test/manual/
├── core-features/
│   ├── 01-add-comment.test.md
│   ├── 02-edit-comment.test.md
│   ├── 03-delete-comment.test.md
│   ├── 04-ghost-marker-tracking.test.md
│   └── 05-range-comments.test.md
├── ai-features/
│   ├── 10-dynamic-parameters.test.md
│   ├── 11-ai-enrichment.test.md
│   └── 12-complexity-scoring.test.md
├── search-features/
│   ├── 20-basic-search.test.md
│   ├── 21-advanced-filters.test.md
│   └── 22-search-export.test.md
├── orphan-detection/
│   ├── 30-detect-orphans.test.md
│   ├── 31-re-anchor.test.md
│   └── 32-batch-operations.test.md
├── cross-file/
│   ├── 40-move-comment.test.md
│   ├── 41-copy-comment.test.md
│   └── 42-bulk-move.test.md
├── performance/
│   ├── 50-large-file-performance.test.md
│   └── 51-many-comments-performance.test.md
├── .originals/              # Pristine copies for reset script
│   └── [same structure]
└── reset-tests.js           # Script to reset all tests
```

### 3.2 Manual Testing Workflow

**Step-by-Step Process:**

1. **Pick a test category** (e.g., `core-features/`)
2. **Reset tests** (`npm run test:reset-manual`)
3. **Run tests sequentially** (01 → 02 → 03 → ...)
4. **Record results inline** (check PASS/FAIL, add notes)
5. **After 3-5 tests, review with Claude**
   - Share completed test files
   - Claude analyzes failures
   - Fix bugs together
6. **Reset and continue** (repeat steps 2-5)

**Benefits:**
- ✅ Systematic coverage (don't miss features)
- ✅ Reproducible (reset script ensures clean state)
- ✅ Documented (test files become QA reports)
- ✅ Efficient (Claude analyzes multiple tests at once)

### 3.3 Manual Test Prioritization

**Critical Path (Test First):**
1. Extension activation
2. Add/edit/delete comments
3. Ghost marker tracking (cut/paste)
4. Range comments (TS/TE icons)
5. Search basic functionality

**High Priority:**
6. Dynamic parameters
7. AI enrichment
8. Orphan detection
9. Cross-file operations

**Medium Priority:**
10. Performance (large files)
11. Advanced search filters
12. Batch operations

---

## 📅 Testing Timeline

### Week 1: Integration
- [ ] Wire up all 4 pre-built features
- [ ] Ensure compilation (zero errors)
- [ ] Smoke test (extension activates)

### Week 2: Automated Testing
- [ ] Write 150 unit tests
- [ ] Write 75 integration tests
- [ ] Write 25 E2E tests
- [ ] Achieve 70%+ coverage

### Week 3: Manual Testing
- [ ] Create 30-40 manual test cases
- [ ] Run critical path tests
- [ ] Fix bugs found
- [ ] Re-test failures

### Week 4: Polish & Release Prep
- [ ] All tests passing
- [ ] Performance validated
- [ ] Documentation complete
- [ ] Ready for v1.0 beta

---

## 🎯 Success Metrics

### Automated Testing
- [ ] 70%+ overall coverage
- [ ] 85%+ coverage on core/ and managers/
- [ ] 250+ total tests passing
- [ ] CI/CD green on all commits

### Manual Testing
- [ ] All critical path tests passing
- [ ] No P0/P1 bugs remaining
- [ ] Performance acceptable (large files, many comments)
- [ ] UX smooth and intuitive

### Release Readiness
- [ ] Zero compilation errors
- [ ] Zero runtime errors in common workflows
- [ ] All planned features working
- [ ] Documentation complete

---

## 📚 References

- **[Test Suite Status](test-suite-status.md)** - Current test count and coverage
- **[Testing Quickstart](QUICKSTART.md)** - How to run tests
- **[Manual Test Template](../manual/TEMPLATE.test.md)** - Template for new manual tests

---

**Last Updated:** October 18, 2025
**Next Review:** After automated tests complete
