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