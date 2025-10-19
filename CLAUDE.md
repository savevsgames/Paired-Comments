- #remember DecorationManager and CodeLens must use LIVE ghost markers from GhostMarkerManager.getMarkers(), NOT from commentFile.ghostMarkers (which is stale file data). This was the root cause of invisible/non-tracking gutter icons.
- #remember When debugging invisible gutter icons, check: 1) resources/comment-default.svg exists, 2) DecorationManager uses live markers, 3) Console shows "Applying N decorations" logs
- #remember Ghost marker tracking flow: GhostMarkerManager (live positions) → DecorationManager (gutter icons) + CodeLens (click links). Both UI components need
  ghostMarkerManager.setGhostMarkerManager() wired in extension.ts
- #remember Test file location: test-samples/ast-test.js with matching .comments file. Pre-existing comments at lines 13 (calculateTotal/NOTE), 18(formatCurrency/TODO), 30(addItem/STAR)
- #remember Copy/paste detection in GhostMarkerManager.detectAndHandleCopiedMarkers() - warns user that comments aren't duplicated on copy, only moved on cut/paste
- #remember Debug console: View → Debug Console (not terminal). Shows [GhostMarkerManager], [AST], [DecorationManager], [CodeLens] prefixed logs
- Remember: Test-Driven Feature Completion

  When completing any new feature or fixing a bug, follow this testing workflow:

  1. Write tests BEFORE marking feature complete - Every completed feature needs at least one test
  2. Follow the testing pyramid - Prefer fast unit tests (60%), then integration (30%), then E2E (10%)
  3. Test location guide:
    - Pure utility functions → test/unit/
    - Manager integrations → test/integration/
    - User workflows → test/suite/ (E2E)
  4. Run tests before committing - npm run test:unit should always pass
  5. Update coverage baseline - Run npm run test:coverage after adding tests
  6. Document new test patterns - If you create a new testing pattern, add example to QUICKSTART.md

  Test Naming Convention:
  - Test file: test/unit/featureName.test.ts
  - Describe block: describe('FeatureName', () => { ... })
  - Test cases: it('should [expected behavior]', () => { ... })

  Minimum Test Coverage Per Feature:
  - ✅ Happy path (feature works as intended)
  - ✅ Edge case (empty input, null values, boundaries)
  - ✅ Error handling (graceful failures)

  Example Workflow:
  1. Implement range comments feature
  2. Write test/unit/rangeComments.test.ts
  3. Add 3-5 tests covering happy path + edge cases
  4. Run npm run test:unit
  5. Fix any failures
  6. Mark feature as complete

  This ensures regression protection and Microsoft-grade quality standards from the start.
- Remember: AI Training is the Core Value Proposition

  Primary Mission: This extension exists to revolutionize AI model training through structured, traceable code annotations.

  Priority Hierarchy:
  1. AI Training Alignment - Azure/MS model training standards are non-negotiable
  2. Params & AI Metadata - The killer feature for widespread adoption
  3. User Experience - The vehicle for sharing, but not the destination

  Key Principles:

  AI Metadata (aiMeta) Must:
  - Align with Azure OpenAI training data formats
  - Support Microsoft's RLHF (Reinforcement Learning from Human Feedback) pipelines
  - Enable traceable provenance (who annotated, when, confidence level)
  - Export to standard ML formats (JSONL, Parquet, etc.)
  - Include version control integration for training dataset versioning

  Params Feature Must:
  - Document function/method signatures with AI-consumable metadata
  - Capture input/output examples for few-shot learning
  - Track edge cases and expected behaviors for unit test generation
  - Support type inference training data
  - Enable automatic documentation generation for LLM context windows

  Success Metrics:
  - ✅ Can a human annotator train a model 10x faster using this extension?
  - ✅ Does the exported data meet Azure ML Studio import requirements?
  - ✅ Can GitHub Copilot/Azure OpenAI use our annotations directly?
  - ✅ Would Microsoft's AI training teams adopt this for internal use?

  Design Decisions Filter:
  When choosing between features, ask:
  1. Does this help AI trainers work faster?
  2. Does this improve training data quality/accuracy?
  3. Does this align with Azure/MS standards?
  4. If NO to all three → deprioritize

  The Vision:
  Paired Comments should become the industry stan
- remember, when you reset the test files, also make sure there are no .comments files that should not be there, and ensure that the .comments files that may be present are reset to match the test files after establishing which test file(s) should be there.
- Current Project State

  Phase: Phase 1 (Integration) - Near Complete, Moving to Manual Testing
  Status: All 4 pre-built features integrated, bug fixes complete, clean test environment ready

  Recent Critical Decisions

  1. No Legacy Migration Code Needed

  - Decision: Don't maintain backward compatibility for old formats (v1.x, v2.0.x timestamp field)
  - Reason: No users yet = no legacy to support
  - Impact: Removed complex migration code we were writing, simplified approach
  - Files Affected: Reverted experimental changes to CommentManager.ts and FileSystemManager.ts
  - Current Format: v2.0.6 with created/updated fields, ghost markers required

  2. Clean Test Environment Over Complex Test Files

  - Decision: Create simple, clean test files in current format only
  - Reason: Old test files had mixed formats causing confusion during smoke tests
  - Result:
    - 2 test files: simple-test.js (3 functions, 3 comments) and ast-test.js (existing, cleaned)
    - Both files: v2.0.6 format, ghost markers with AST anchors, no legacy fields
    - Removed: All backup files, ghost-markers-demo files (redundant)

  Bug Fixes Completed (All Committed)

  1. ✅ Bug #1: Backup files processed as source files → Fixed with filtering in CommentFileDecorationProvider and CommentCodeLensProvider
  2. ✅ Bug #2: Schema validation rejecting old format → Fixed to accept EITHER format in FileSystemManager.validateCommentFile()
  3. ✅ Bug #3: Extension processing .comments files → Fixed with filtering in DecorationManager.updateDecorations()
  4. ✅ Bug #4: Cache marking all files dirty → Fixed with markDirty parameter in CommentFileCache.set()
  5. ✅ Bug #5: CodeLens click not finding comments → Fixed cache lookup in getCommentsForLine() and getCommentById()

  Phase 1 Features Integrated

  1. ✅ Advanced Search (v2.1.2) - Field:value syntax search
  2. ✅ Orphan Detection (v2.1.3) - Detect comments whose code was deleted
  3. ✅ Performance Caches (v2.1.4) - CommentFileCache with 10-50x speedup
  4. ✅ Cross-File Operations (v2.1.5) - Move/copy comments between files
  5. ✅ Keybindings added for all new features to Ctrl+Alt+P menu

  Testing Framework

  - Manual Testing: Template-based .test.md files in test/manual/ (following TEMPLATE.test.md)
  - Smoke Test Created: test/manual/core-features/01-smoke-test.test.md
  - Next Step: Run smoke test (Press F5 → Open test files → Verify CodeLens works → Check Debug Console for errors)
  - Strategy: Get a few manual tests passing BEFORE writing 250+ automated tests

  Key Files Status

  - ✅ test-samples/simple-test.js + .comments - Clean v2.0.6 format
  - ✅ test-samples/ast-test.js + .comments - Clean v2.0.6 format
  - ✅ test/manual/core-features/01-smoke-test.test.md - Ready to run
  - ✅ Compilation: Clean, no TypeScript errors
  - ✅ All bug fixes: Committed and int
- DO NOT Support Old Formats - MVP Rule

  If you encounter ANY errors related to old comment file formats or migrations:

  1. DO NOT add migration code - We have ZERO users, ZERO legacy to support
  2. DO NOT add backward compatibility - Delete old format handling instead
  3. DO NOT accept old timestamp field - Only created/updated (v2.1.0)
  4. DO NOT validate multiple versions - Only v2.1.0 is valid

  The Only Valid Format (v2.1.0)

  {
    "version": "2.1.0",
    "created": "ISO-8601-string",
    "updated": "ISO-8601-string",
    "ghostMarkerId": "required-not-null"
  }

  Old formats that should be REJECTED:
  - ❌ "timestamp" field (v1.x, v2.0.5)
  - ❌ "version": "2.0.6" or lower
  - ❌ ghostMarkerId: null (all comments need markers)

  What We Just Removed (Oct 19, 2025)

  - Deleted 211 lines of migration code from FileSystemManager.ts
  - Removed migrateToLatestVersion(), migrateV10ToV20(), migrateV20ToV205(), hashString()
  - Removed ASTAnchorManager dependency from FileSystemManager
  - Simplified validation to ONLY accept v2.1.0

  If Format Changes Before MVP Launch

  Example: We decide to change something in v2.1.0

  1. ✅ Update COMMENT_FILE_VERSION in types.ts
  2. ✅ Update ALL test .comments files to new format
  3. ✅ Delete old format handling code
  4. ✅ Update validation to new format only
  5. ❌ DO NOT keep old format support
  6. ❌ DO NOT add migration between v2.1.0 variants

  Post-MVP Strategy

  Only AFTER launch with real users:
  - THEN we can add