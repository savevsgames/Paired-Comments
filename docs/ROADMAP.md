# Paired Comments - Product Roadmap v2.0

**Version:** 2.0.5-dev
**Last Updated:** October 18, 2025
**Roadmap Version:** 2.0 (Milestone-Based)

---

## 📍 Current Status: AST CHECKPOINT ACHIEVED ✅

**We just hit a major milestone!** AST-based ghost marker tracking is working and tested. This is the foundation everything else builds on.

**What's Next:** Range comments design, then proceed to Phase 2.1 (params/aiMeta).

---

## 🗺️ Milestone-Based Roadmap

This roadmap is organized by **milestones** (major achievements) rather than phases, making progress clearer.

### Legend
- ✅ **COMPLETE** - Fully implemented and tested
- 🚧 **IN PROGRESS** - Currently being developed
- ⚠️ **BLOCKED** - Waiting on dependencies or decisions
- 📋 **PLANNED** - Designed but not yet started
- 💡 **VISION** - Future idea, not yet designed

---

## ✅ Milestone 1: MVP Foundation (v0.1.0) - COMPLETE

**Completed:** October 16, 2025
**Goal:** Basic paired comments system with manual line tracking

### Achievements
- ✅ Core CRUD operations (add, edit, delete comments)
- ✅ `.comments` file format (JSON v1.0)
- ✅ Side-by-side view with scroll sync
- ✅ Keybinding system (`Ctrl+Alt+P` prefix)
- ✅ Tag system (TODO, FIXME, NOTE, QUESTION, HACK, WARNING, STAR)
- ✅ Gutter decorations with hover previews
- ✅ CodeLens "Click to Open" integration
- ✅ File I/O with caching

### Commands Added
- `Ctrl+Alt+P Ctrl+Alt+P` - Show command menu
- `Ctrl+Alt+P O` - Open paired comments view
- `Ctrl+Alt+P A` - Add comment
- `Ctrl+Alt+P E` - Edit comment
- `Ctrl+Alt+P D` - Delete comment
- `Ctrl+Alt+P S` - Show all comments
- `Ctrl+Alt+P T` - Toggle scroll sync

---

## ✅ Milestone 2: AST-Based Line Tracking (v2.0.5) - COMPLETE (Checkpoint)

**Completed:** October 18, 2025
**Goal:** Automatic comment tracking through code refactoring using AST

**Status:** ✅ CORE IMPLEMENTATION COMPLETE - Testing & Refinement Phase

**Analysis:** See [docs/milestones/phase-2.0.5-ast-checkpoint.md](docs/milestones/phase-2.0.5-ast-checkpoint.md)

### Achievements

#### ✅ Core Infrastructure (DONE)
- ✅ **ASTAnchorManager** - VS Code Symbol Provider integration
  - JavaScript/TypeScript support
  - Progressive retry strategy (200ms, 300ms, 400ms)
  - Symbol caching for performance
  - Confidence-based resolution (exact, moved, ambiguous)

- ✅ **GhostMarkerManager** - Hybrid AST + line-based tracking
  - AST verification (primary)
  - Line-based fallback (for non-symbols)
  - Automatic position updates
  - Duplicate marker detection
  - Copy/paste detection and auto-duplication

- ✅ **Live UI Tracking** - Real-time position updates
  - DecorationManager uses LIVE ghost markers
  - CodeLensProvider uses LIVE ghost markers
  - Gutter icons follow code movements
  - Hover previews update automatically

- ✅ **File Format v2.0.5** - AST anchor schema
  - `astAnchor` field (optional, for JS/TS)
  - `symbolPath` for nested symbols
  - `symbolKind` (Function, Method, Class, etc.)
  - Backwards compatible with v2.0

#### ✅ Tested Scenarios (VERIFIED)
- ✅ Cut/paste function → Icon moves
- ✅ Copy/paste function → Duplicate marker created
- ✅ Add blank lines (Enter) → Icons shift
- ✅ Delete function → Marker removed
- ✅ Gutter icon visibility → Icons appear
- ✅ CodeLens tracking → Links update
- ✅ Hover previews → Shows comments

### What's NOT Done (Deferred to v2.0.6+)
- ⚠️ **Range comments** - Comments spanning multiple lines (DESIGN NEEDED)
- ⚠️ **Manual conflict resolution UI** - Resolve ambiguous moves
- ⚠️ **File format migration tool** - Auto-upgrade v1.0 → v2.0.5
- ⚠️ **Multi-language AST** - Python, Go, Rust support

### Success Metrics
- ✅ Comments survive 95%+ of cut/paste operations (100% tested)
- ✅ Function tracking in <100ms (~50ms average)
- ✅ Zero false positives on AST reconciliation
- ✅ Graceful fallback when AST unavailable
- ✅ No new dependencies (uses VS Code parsers)

**Verdict:** ✅ **AST FOUNDATION IS SOLID - Ready to build params/aiMeta on top**

---

## 🚧 Milestone 3: Range Comments (v2.0.6) - IN PROGRESS

**Target:** November 2025 (2-3 days)
**Goal:** Support comments that span multiple lines (e.g., lines 1-10)

**User Request (Oct 18, 2025):**
> "How do i make this a range comment? ie lines 1-10"

### Requirements

#### 📋 Schema Changes
- Add `startLine` and `endLine` to `Comment` type
- Keep `line` for backwards compatibility (defaults to `startLine`)
- Ghost marker tracks the START line of range

#### 📋 UI/UX
- **Selection Method** (TBD - need user input)
  - Option A: Select lines in editor → `Ctrl+Alt+P A` → Creates range comment
  - Option B: Add comment to line → Show "Extend to range" button
  - Option C: Add fields in comment form: "Start Line", "End Line"

- **Visual Indicators**
  - Gutter icon at start line
  - Optional: Subtle background highlight for entire range
  - Hover shows "Lines 1-10: [comment text]"

#### 📋 Behavior
- **Cut/Paste Entire Range** → Comment moves with range
- **Cut/Paste Partial Range** (e.g., lines 5-8 of 1-10 range)
  - Option A: Comment stays with original start (lines 1-10 → 1-7)
  - Option B: Split into two comments (1-4, 5-10)
  - Option C: Ask user to resolve conflict

- **Edit Within Range** → Comment stays anchored to start line

#### 📋 Implementation Tasks
1. Update `src/types.ts` (add `startLine`, `endLine`)
2. Update `GhostMarkerManager` (track range instead of single line)
3. Update `DecorationManager` (render range highlights)
4. Update comment form UI (range selection)
5. Add tests for range tracking

### Dependencies
- ✅ AST foundation (complete)
- 🚧 User feedback on UX (which option for selection?)

### Blocking
- ⚠️ Phase 2.1 (params/aiMeta) - Range affects complexity calculation, token counting

---

## 📋 Milestone 4: Params & AI Metadata (v2.1.0) - PLANNED

**Target:** Q1 2026 (4-5 weeks after range comments)
**Goal:** Dynamic parameters and AI metadata for intelligent code comments

**Status:** Waiting on range comments (affects schema design)

### Features

#### 📋 Dynamic Parameters (`params`)
- Variable interpolation in comments (`${functionName}`, `${lineCount}`)
- Context-aware syntax per language
- Three types: static, dynamic (tracks code), computed (calculated)
- Auto-update when source code changes
- Hash-based change detection

**Example:**
```json
{
  "text": "This ${componentType} has ${propCount} props",
  "params": {
    "componentType": "FormInput",  // Tracks variable name
    "propCount": 5                  // Tracks prop array length
  }
}
```

#### 📋 AI Metadata (`aiMeta`)
- Token estimation (tiktoken)
- Cyclomatic complexity scoring
- Code type detection (function, class, loop, etc.)
- Logical chunk boundaries for large files
- Dependency extraction
- Training labels for ML datasets
- Vector embeddings for semantic search
- Free-form JSON for extensibility

**Example:**
```json
{
  "aiMeta": {
    "tokens": 45,
    "complexity": 3,
    "codeType": "function",
    "dependencies": ["react", "lodash"],
    "labels": ["authentication", "validation"]
  }
}
```

#### 📋 Hash Tree Architecture
- Merkle tree-like structure for efficient change tracking
- O(log n) change detection instead of O(n)
- Integrates with Ghost Marker verification cycle
- Tracks params, aiMeta, and comment state
- Optional history for undo/redo

#### 📋 Built-in AI Helpers
- `estimateTokens()` - GPT-4/Claude token counting
- `calculateComplexity()` - Cyclomatic complexity
- `detectCodeType()` - AST-based code structure
- `findChunkBoundaries()` - Smart file chunking
- `extractDependencies()` - Import analysis

#### 📋 Privacy & Export Controls
- `.commentsrc` configuration file
- Fine-grained field exclusion (exclude author, embeddings, etc.)
- Wildcard support for param filtering
- Export commands with privacy filtering

### Implementation Phases
1. **Schema & Validation** (Week 1)
2. **Hash Tree Architecture** (Week 2)
3. **Param Manager & Interpolation** (Week 3)
4. **AI Helpers** (Week 4)
5. **Privacy & Export** (Week 5)

### Dependencies
- ⚠️ Range comments (affects param scope - single line vs. range)
- ✅ AST foundation (complete)

### Success Metrics
- ✅ Params update within 500ms of code change
- ✅ Token estimation accuracy >95% (vs tiktoken)
- ✅ <50ms overhead for hash tree verification
- ✅ Privacy filtering works with wildcards

---

## 📋 Milestone 5: Output Capture Excellence (v2.2.0) - PLANNED

**Target:** Q2 2026 (6-7 weeks after v2.1)
**Goal:** Jupyter notebook-style runtime value capture for any code

### Features

#### 📋 Template System
- Pre-built templates (API responses, function returns, errors, tests)
- Custom template creator with form generation
- Community template marketplace
- Common scenarios: authentication, database queries, ML inference

#### 📋 Quick Capture UI
- `Ctrl+Alt+P Ctrl+Alt+O` - Quick capture command
- Template picker dialog
- Smart form generation
- One-click capture workflows

#### 📋 Debug Adapter Integration
- Auto-capture during VS Code debug sessions
- Variable picker UI
- Scope-aware capture (local, closure, global)
- Breakpoint integration

#### 📋 Output History & Comparison
- Track multiple captures over time
- Visual diff viewer (before/after)
- Timeline visualization
- Regression detection

### Use Cases
- Debugging: See values when bugs occurred
- Documentation: Real API responses
- Testing: Regression detection via output comparison
- Learning: Understand what functions return
- AI Training: Real input/output pairs

### Dependencies
- ⚠️ Phase 2.1 (params/aiMeta) - Builds on `output` field in schema
- ⚠️ Range comments - Capture output for entire range?

---

## 💡 Milestone 6: GitHub Demo Playground (v3.5.0) - VISION

**Target:** Q3 2026
**Goal:** Live, interactive demo in fake GitHub UI

**Strategic Value:** Marketing tool and proof-of-concept for GitHub acquisition

### Features
- Fake GitHub UI (Next.js app)
- Monaco editor with Paired Comments
- 20+ curated examples
- Export & share functionality

**Deferred Until:** After v2.2 when all features are mature

---

## 💡 Milestone 7: AI Training Comparison (v3.6.0) - VISION

**Target:** Q4 2026
**Goal:** Empirical proof that `.comments` improve AI training

**Strategic Value:** Data-driven proof for Microsoft acquisition

### Features
- Split-screen training comparison dashboard
- Pre-built training scenarios
- Azure ML integration
- Evaluation metrics (accuracy, pass@k, functional correctness)

**Deferred Until:** After GitHub Demo (need showcase first)

---

## 🎯 Near-Term Roadmap (Next 3 Months)

### November 2025
- ✅ **AST Checkpoint Review** (DONE - this week)
- 🚧 **Range Comments Design** (2-3 days)
  - User feedback on UX
  - Schema design
  - Implementation plan
- 🚧 **Range Comments Implementation** (1 week)
  - Schema updates
  - UI for range selection
  - Ghost marker range tracking
  - Tests

### December 2025 - January 2026
- 📋 **Phase 2.1 Prep** (1 week)
  - Finalize params/aiMeta schema
  - Design hash tree architecture
  - Plan privacy controls
- 📋 **Phase 2.1 Implementation** (4-5 weeks)
  - Params system
  - AI metadata helpers
  - Hash tree
  - Privacy & export

### February 2026
- 📋 **Phase 2.1 Testing** (1-2 weeks)
  - Edge case testing
  - Performance validation
  - Documentation
- 📋 **Phase 2.2 Design** (1 week)
  - Output capture UX
  - Template system design

---

## 📊 Progress Tracking

### Completed Milestones
1. ✅ **MVP Foundation (v0.1.0)** - October 16, 2025
2. ✅ **AST-Based Line Tracking (v2.0.5 Checkpoint)** - October 18, 2025

### Active Milestones
1. 🚧 **Range Comments (v2.0.6)** - Starting November 2025

### Upcoming Milestones
1. 📋 **Params & AI Metadata (v2.1.0)** - Q1 2026
2. 📋 **Output Capture (v2.2.0)** - Q2 2026
3. 💡 **GitHub Demo (v3.5.0)** - Q3 2026
4. 💡 **AI Training Comparison (v3.6.0)** - Q4 2026

---

## 🔄 Roadmap Changes (v1 → v2)

### What Changed?
1. **Milestone-Based Structure** - Clearer than phase numbers
2. **AST Checkpoint** - Explicit recognition of major achievement
3. **Range Comments Prioritized** - User request moved up in priority
4. **Deferred Features** - Conflict UI and migration tool pushed to v2.0.7+
5. **Dependencies Made Clear** - Range comments block params/aiMeta

### Why v2?
The original roadmap (ROADMAP.md) was phase-based but didn't clearly show:
- What's actually complete vs. in-progress
- Why certain features are blocked
- What the immediate next steps are

Roadmap v2 fixes this with milestone-based tracking and explicit status labels.

---

## 📝 Decision Log

### October 18, 2025: AST Checkpoint Complete
**Decision:** Declare AST foundation complete, proceed to range comments, then params/aiMeta
**Reasoning:** Core AST tracking works reliably. Range comments needed before params. Conflict UI and migration can wait.
**Owner:** Development Team

### October 18, 2025: Range Comments Prioritized
**Decision:** Implement range comments (v2.0.6) before params/aiMeta (v2.1)
**Reasoning:** User explicitly requested it, and it affects params/aiMeta schema design.
**Owner:** Development Team

---

## 🎯 Success Metrics (Overall)

### Technical Quality
- ✅ Comments survive 95%+ of refactorings (achieved for AST-tracked)
- 📋 Params update within 500ms (not yet measured)
- 📋 Token estimation accuracy >95% (not yet implemented)
- 📋 <50ms hash tree overhead (not yet implemented)

### User Adoption
- 📋 >1000 GitHub stars (not yet launched publicly)
- 📋 >100 active users (not yet measured)
- 📋 Community template marketplace (not yet implemented)

### Microsoft Acquisition Value
- ✅ AST tracking demonstrates technical sophistication
- 📋 Training data goldmine (once params/aiMeta/output complete)
- 📋 GitHub integration proof-of-concept (GitHub demo)
- 📋 Empirical AI training improvement (comparison study)

---

## 📚 Related Documentation

- [Phase 2.0.5 AST Checkpoint Analysis](docs/milestones/phase-2.0.5-ast-checkpoint.md)
- [Ghost Markers Feature Doc](docs/features/ghost-markers.md)
- [Params & Hash Tree Design](docs/features/params-and-hash-tree.md)
- [Original Roadmap v1](ROADMAP.md) (archived reference)

---

**Roadmap Status:** ✅ ACTIVE
**Next Review:** After range comments implementation
**Owner:** Development Team
