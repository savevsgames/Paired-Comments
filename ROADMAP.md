# Paired Comments - Product Roadmap

**Version:** 0.2.0-dev
**Last Updated:** October 17, 2025

---

## Current Status

### ✅ MVP Features (v0.1.0) - COMPLETED
Core functionality is now implemented and ready for testing:

- **Core Operations**
  - `Ctrl+Alt+P Ctrl+Alt+P` - Show command menu (NEW!)
  - `Ctrl+Alt+P O` - Open paired comments view
  - `Ctrl+Alt+P A` - Add comment to current line
  - `Ctrl+Alt+P E` - Edit existing comment
  - `Ctrl+Alt+P D` - Delete comment
  - `Ctrl+Alt+P S` - Show all comments (quick pick)
  - `Ctrl+Alt+P T` - Toggle scroll sync

- **Technical Foundation**
  - `.comments` file format (JSON v1.0)
  - File I/O with caching
  - Side-by-side view management
  - Bidirectional scroll synchronization
  - Comment decorations in gutter
  - Tag system (TODO, FIXME, NOTE, QUESTION, HACK, WARNING, STAR)
  - Multi-language comment detection (30+ languages)
  - Syntax highlighting for .comments files

### 🚧 v0.1.5 - Infrastructure Enhancements - IN PROGRESS

**Status:** Design & Implementation Phase

#### Completed Features
- ✅ **Command Menu** - `Ctrl+Alt+P Ctrl+Alt+P` shows all available commands
- ✅ **Multi-Language Support** - Detects comment syntax for 30+ programming languages
- ✅ **Content Anchoring** - Hash-based line tracking utilities
- ✅ **Extended Comment Schema** - Support for ranges, status, threaded replies
- ✅ **STAR Tag** - Gold-colored bookmark tag for significant comments

#### In Progress
- 🚧 **Ghost Markers** - Automatic line tracking system (CRITICAL MILESTONE)
  - See: [docs/features/ghost-markers.md](docs/features/ghost-markers.md)
  - Invisible decorations that auto-track line movements
  - Hash-based drift detection
  - 3-line fingerprinting for auto-reconciliation
  - Manual conflict resolution UI

---

## Planned Features

### 🎯 Phase 2: Ghost Markers & Line Tracking (v0.2.0) - CRITICAL

**Target:** Q4 2025 (PRIORITY)
**Documentation:** [docs/features/ghost-markers.md](docs/features/ghost-markers.md)

#### Why This Matters
Ghost Markers solve the **fundamental problem of comment drift** - when line numbers in .comments files become misaligned with actual code as files are edited. This is the core architectural foundation that makes Paired Comments reliable and production-ready.

#### Features
- **Automatic Line Tracking**
  - Invisible decorations that move with code edits
  - Comments automatically follow their code as it moves
  - No manual updates needed when inserting/deleting lines

- **Drift Detection**
  - SHA-256 hash verification of line content
  - 3-line fingerprinting for context matching
  - Immediate detection when code content changes

- **Auto-Reconciliation**
  - Search nearby lines (±10) for matching content
  - Whitespace-tolerant (formatting changes don't break)
  - Automatic repositioning when code moves

- **Manual Conflict Resolution**
  - UI for reviewing unresolved conflicts
  - Options: Auto-search, manual select, delete comment
  - Clear visual feedback of drift status

- **File Format v2.0**
  - New `ghostMarkers` array in .comments files
  - Backwards compatible with v1.0 files
  - Migration tool for existing comments

#### Technical Details
- VS Code decoration API for auto-tracking
- Content anchoring with hash verification
- 3-line fingerprint matching algorithm
- Document change event listeners
- Performance: O(1) verification, O(n) reconciliation
- Memory: ~300 bytes per ghost marker

#### Success Metrics
- ✅ Comments stay synchronized through refactoring
- ✅ <1% false positives on drift detection
- ✅ >95% auto-reconciliation success rate
- ✅ <50ms verification per document change
- ✅ Zero data loss during migration

#### Implementation Phases
1. **Core Infrastructure** (Week 1)
   - GhostMarker type definition
   - GhostMarkerManager class
   - VS Code decoration integration

2. **Verification System** (Week 2)
   - Document change listeners
   - Hash verification logic
   - 3-line fingerprint matching

3. **Reconciliation** (Week 3)
   - Auto-search algorithm
   - Conflict detection
   - Manual adjustment UI

4. **Integration** (Week 4)
   - Update CommentManager
   - Update DecorationManager
   - File format migration

---

### 🤖 Phase 2.1: AI Metadata & Params System (v2.1) - NEXT

**Target:** Q1 2026 (Post v2.0)
**Documentation:** [docs/features/params-and-hash-tree.md](docs/features/params-and-hash-tree.md)

#### Why This Matters
Extends Ghost Markers with **dynamic parameters** and **AI metadata**, transforming Paired Comments into a powerful platform for AI-assisted development, code analysis, and training data curation. This enables comments to auto-update with code changes and provides structured metadata for ML workflows.

#### Features
- **Dynamic Parameters (`params`)**
  - Variable interpolation in comments (e.g., `${functionName}`, `${lineCount}`)
  - Context-aware syntax per language (JS: `${}`, Python: `{}`, etc.)
  - Three types: static, dynamic (tracks code), computed (calculated)
  - Auto-update when source code changes
  - Hash-based change detection

- **AI Metadata (`aiMeta`)**
  - Token estimation (using tiktoken)
  - Cyclomatic complexity scoring
  - Code type detection (function, class, loop, etc.)
  - Logical chunk boundaries for large files
  - Dependency extraction
  - Training labels for ML datasets
  - Vector embeddings for semantic search
  - Free-form JSON for extensibility

- **Hash Tree Architecture**
  - Merkle tree-like structure for efficient change tracking
  - O(log n) change detection instead of O(n)
  - Integrates with Ghost Marker verification cycle
  - Tracks params, aiMeta, and comment state
  - Optional history for undo/redo

- **Built-in AI Helpers**
  - `estimateTokens()` - GPT-4/Claude token counting
  - `calculateComplexity()` - Cyclomatic complexity
  - `detectCodeType()` - AST-based code structure detection
  - `findChunkBoundaries()` - Smart file chunking for AI context
  - `extractDependencies()` - Import/module analysis
  - `semanticHash()` - Content-aware hashing

- **Privacy & Export Controls**
  - `.commentsrc` configuration file
  - Fine-grained field exclusion (exclude author, embeddings, etc.)
  - Wildcard support for param filtering
  - Export commands with privacy filtering

#### Use Cases
- **Dynamic Documentation**: Function names/params auto-update in comments
- **AI Code Review**: Estimate review time based on tokens/complexity
- **Training Data**: Label code examples for ML fine-tuning
- **Context Management**: Smart chunking saves AI tokens on large files
- **Enterprise Compliance**: Track who generated code, calculate API costs

#### Technical Details
- File format: v2.1 (backwards compatible with v2.0)
- Free-form JSON in `params` and `aiMeta` fields
- Hash tree integrates with ghost marker cycle (500ms debounce)
- Performance: <50ms for 1000-line files
- Memory: ~100 bytes per param, ~200 bytes per aiMeta

#### Implementation Phases
1. **Schema & Validation** (Week 1)
   - Add params/aiMeta to Comment interface
   - Update validation for free-form JSON
   - Preserve fields in all managers

2. **Hash Tree Architecture** (Week 2)
   - HashTreeManager class
   - Change detection algorithm
   - Integration with ghost markers

3. **Param Manager & Interpolation** (Week 3)
   - Variable interpolation engine
   - Context-aware syntax
   - Update rules (track function, count lines, etc.)

4. **AI Helpers** (Week 4)
   - Token estimation (tiktoken)
   - Complexity calculator
   - Code type detection
   - Chunking utilities

5. **Privacy & Export** (Week 5)
   - `.commentsrc` configuration
   - PrivacyManager class
   - Export with field exclusion

6. **Documentation & Polish** (Week 6)
   - Usage guides and examples
   - API documentation
   - Community templates

#### Success Metrics
- ✅ Params update within 500ms of code change
- ✅ Token estimation accuracy >95% (vs tiktoken)
- ✅ <50ms overhead for hash tree verification
- ✅ Privacy filtering works with wildcards and nested paths
- ✅ Community adopts for AI workflows

#### Community Standards
- **Phase 1**: Open experimentation (free-form JSON)
- **Phase 2**: Collect common patterns (3-6 months)
- **Phase 3**: Standardize popular schemas (1 year)
  - `ai-training-v1` - ML dataset curation
  - `code-review-v1` - Review workflows
  - `token-tracking-v1` - API cost estimation
- **Phase 4**: QOL improvements (schema marketplace, auto-populate)

---

### 📤 Phase 2.2: Output Capture Excellence (v2.2) - Jupyter for All Code

**Target:** Q2 2026 (Post v2.1)
**Documentation:** [docs/features/params-and-hash-tree.md](docs/features/params-and-hash-tree.md#6-runtime-output-capture--debugging-v21-foundation-v22-complete)

#### Why This Matters
Completes the output capture system started in v2.1, bringing **Jupyter notebook-style runtime value capture** to any codebase. Enables developers to see what their code actually did, capture real API responses, detect regressions, and create training datasets with real input/output pairs.

#### Features
- **Template System**
  - Pre-built templates for common scenarios (API responses, function returns, errors, tests)
  - Custom template creator with form generation
  - Community template marketplace
  - Templates for: API calls, authentication, database queries, ML inference, payments

- **Quick Capture UI**
  - `Ctrl+Alt+P Ctrl+Alt+O` - Quick capture command
  - Template picker dialog with search
  - Smart form generation from selected template
  - One-click capture workflows

- **Debug Adapter Integration**
  - Auto-capture during VS Code debug sessions
  - Variable picker UI (select what to capture)
  - Scope-aware capture (local, closure, global variables)
  - Breakpoint integration (capture on hit)

- **Output History & Comparison**
  - Track multiple captures over time
  - Visual diff viewer (before/after)
  - Timeline visualization of changes
  - Regression detection (alert when output changes unexpectedly)

- **Advanced Features**
  - Output assertions (check status === 200, data exists, etc.)
  - Smart truncation for large values (>1KB)
  - Custom serializers (Date, Error, Buffer, custom classes)
  - Export training datasets (code + output pairs)

#### Use Cases
- **Debugging**: See what values looked like when bugs occurred
- **Documentation**: Real API responses, not hypothetical examples
- **Testing**: Regression detection via output comparison
- **Learning**: Understand what functions actually return
- **AI Training**: Real input/output pairs for ML datasets
- **Security**: Detect data leaks (e.g., user data on failed auth)

#### Technical Details
- Builds on v2.1 foundation (`output` field already in schema)
- VS Code Debug Adapter Protocol integration
- Template engine with variable substitution
- Diff algorithm for output comparison
- Privacy filters apply to captured values

#### Implementation Phases
1. **Template System** (Week 1-2)
   - Template schema and engine
   - 5-10 built-in templates
   - Template UI picker

2. **Quick Capture UI** (Week 3)
   - Command and keybinding
   - Form generation from template
   - Clipboard and manual input

3. **Debug Integration** (Week 4-5)
   - Debug Adapter Protocol integration
   - Variable picker UI
   - Breakpoint capture

4. **History & Comparison** (Week 6)
   - Output history tracking
   - Diff viewer
   - Regression alerts

#### Success Metrics
- ✅ Templates reduce capture time by 80%
- ✅ Debug integration works in 90%+ scenarios
- ✅ Diff viewer highlights changes clearly
- ✅ Users create training datasets from captured outputs
- ✅ Community shares custom templates

#### Microsoft Acquisition Value 😎
- **Training Data Gold Mine**: Real code → output pairs from thousands of developers
- **Bug Pattern Library**: Before/after fixes with actual values
- **API Response Catalog**: Real responses from hundreds of APIs
- **Security Insights**: Detected data leak patterns
- **GitHub Copilot Enhancement**: Better suggestions from real runtime examples

---

### 🧭 Phase 3: Enhanced Navigation (v0.3.0)

**Target:** Q2 2026

#### Features
- **Next/Previous Comment Navigation**
  - `Ctrl+Alt+P N` - Jump to next comment
  - `Ctrl+Alt+P B` - Jump to previous (back) comment
  - Circular navigation (wrap around at file boundaries)
  - Visual indicator of current position

#### Technical Details
- Implement comment position index using ghost markers
- Handle edge cases (first/last comment)
- Smooth scroll animation to target line

#### Success Metrics
- Navigation feels instant (<50ms)
- Clear visual feedback when at boundaries

---

### 📦 Phase 4: Import/Export (v0.4.0)

**Target:** Q1 2026

#### Features
- **Copy All Comments**
  - `Ctrl+Alt+P C` - Copy all comments to clipboard
  - Format options: Plain text, Markdown, JSON
  - Include line numbers and author info

- **Export Comments**
  - `Ctrl+Alt+P X` - Export comments to file
  - Supported formats:
    - Markdown (`.md`) - Human-readable format
    - JSON (`.json`) - Machine-readable format
    - CSV (`.csv`) - Spreadsheet-compatible
  - Export options dialog
  - Include metadata (file path, export date, etc.)

- **Import Comments**
  - `Ctrl+Alt+P I` - Import comments from file
  - Support formats: JSON, CSV
  - Merge strategies:
    - Replace all (clear existing)
    - Merge (keep existing, add new)
    - Skip conflicts (keep existing on duplicate lines)
  - Validation and error handling

#### Use Cases
- Share comments with team members
- Migrate comments between projects
- Backup comments before refactoring
- Generate documentation from comments

#### Technical Details
- Format converters (JSON ↔ Markdown ↔ CSV)
- Schema validation on import
- Conflict resolution UI
- Progress indicators for large files

---

### 🔍 Phase 5: Search & Filter (v0.5.0)

**Target:** Q2 2026

#### Features
- **Find in Comments**
  - `Ctrl+Alt+P F` - Search across all comments
  - Full-text search with regex support
  - Filter by:
    - Author
    - Date range
    - Line number range
  - Search results in quick pick
  - Jump to comment from results

- **Advanced Filtering**
  - Filter by keyword
  - Filter by multiple authors
  - Filter by date (today, this week, this month)
  - Show only unresolved comments
  - Persistent filter state

#### Technical Details
- Fast in-memory search index
- Incremental search (results as you type)
- Search performance: <100ms for 1000 comments
- Highlight matches in preview

---

### 👥 Phase 6: Collaboration Features (v0.6.0)

**Target:** Q2 2026

#### Features
- **Comment Threads**
  - Reply to comments
  - Nested conversation view
  - Thread collapse/expand
  - Thread resolution status

- **Comment Status**
  - `Ctrl+Alt+P M` - Mark comment as resolved/unresolved
  - Status indicators (open, resolved, wontfix)
  - Filter by status
  - Statistics (X open, Y resolved)

- **Mentions & Notifications**
  - @mention users in comments
  - Notification when mentioned
  - Assign comments to team members

#### Technical Details
- Extended comment schema (threads, status, mentions)
- Migration path from v0.1 format
- Backward compatibility

---

### 🔗 Phase 7: Integration Features (v0.7.0)

**Target:** Q3 2026

#### Features
- **Deep Linking**
  - `Ctrl+Alt+P L` - Generate shareable link to comment
  - Open comment from link (custom URI scheme)
  - Integration with issue trackers (GitHub, Jira)
  - Share comment in chat tools (Slack, Teams)

- **Git Integration**
  - Comments follow code during refactoring
  - Preserve comments across branches
  - Merge conflict resolution for comments
  - Comment history (blame view)

- **Workspace Features**
  - Search comments across entire workspace
  - Comment dashboard (all comments in project)
  - Statistics and analytics
  - Export workspace comments

---

### 🎨 Phase 8: Customization (v0.8.0)

**Target:** Q3 2026

#### Features
- **Themes & Appearance**
  - Custom comment colors
  - Gutter icon customization
  - Font size/family for comments
  - Preview layout options (side-by-side, split)

- **Configuration**
  - Default author name
  - Auto-save settings
  - Keybinding customization
  - Comment templates

- **Language Support**
  - Syntax highlighting in comments
  - Code snippets in comments
  - Markdown rendering
  - Image embedding

---

### 🚀 Phase 9: Performance & Scale (v0.9.0)

**Target:** Q4 2026

#### Features
- **Performance Optimizations**
  - Virtual scrolling for large files
  - Lazy loading of comments
  - Background indexing
  - Memory optimization

- **Large-Scale Support**
  - Handle files with 10,000+ lines
  - Handle 1,000+ comments per file
  - Workspace with 1,000+ files
  - Fast workspace-wide search

---

## Future Considerations

### 🧪 Experimental Ideas
These features are under consideration but not yet scheduled:

- **AI Integration**
  - AI-generated comment suggestions
  - Auto-summarize complex code blocks
  - Natural language code explanation

- **Cloud Sync**
  - Sync comments across devices
  - Team shared comment repository
  - Web interface for comments

- **Code Review Mode**
  - Structured code review workflow
  - Review checklist templates
  - Approval/rejection workflow

- **Analytics**
  - Comment coverage metrics
  - Complexity vs. documentation ratio
  - Team activity dashboard

---

## Keybinding Reference

### Current Keybindings (v0.1.5)
| Command | Keybinding | Status |
|---------|-----------|--------|
| Show command menu | `Ctrl+Alt+P Ctrl+Alt+P` | ✅ Implemented |
| Open paired comments | `Ctrl+Alt+P O` | ✅ Implemented |
| Add comment | `Ctrl+Alt+P A` | ✅ Implemented |
| Edit comment | `Ctrl+Alt+P E` | ✅ Implemented |
| Delete comment | `Ctrl+Alt+P D` | ✅ Implemented |
| Show all comments | `Ctrl+Alt+P S` | ✅ Implemented |
| Toggle scroll sync | `Ctrl+Alt+P T` | ✅ Implemented |

### Future Keybindings
| Command | Keybinding | Planned Version |
|---------|-----------|-----------------|
| Capture output | `Ctrl+Alt+P Ctrl+Alt+O` | v2.2 |
| Next comment | `Ctrl+Alt+P N` | v0.3.0 |
| Previous comment | `Ctrl+Alt+P B` | v0.3.0 |
| Copy all comments | `Ctrl+Alt+P C` | v0.4.0 |
| Export comments | `Ctrl+Alt+P X` | v0.4.0 |
| Import comments | `Ctrl+Alt+P I` | v0.4.0 |
| Find in comments | `Ctrl+Alt+P F` | v0.5.0 |
| Mark resolved | `Ctrl+Alt+P M` | v0.6.0 |
| Generate link | `Ctrl+Alt+P L` | v0.7.0 |

---

## Version History

- **v2.2** (Planned - Q2 2026) - Output Capture Excellence
  - Template system for common capture scenarios
  - Quick capture UI with form generation
  - Debug adapter integration (auto-capture)
  - Output history and comparison (diff viewer)
  - Regression detection
  - Training dataset export (code + output pairs)

- **v2.1** (Planned - Q1 2026) - AI Metadata & Params System
  - Dynamic parameters with variable interpolation
  - AI metadata (tokens, complexity, embeddings)
  - Output capture foundation (manual clipboard capture)
  - Hash tree architecture for efficient change detection
  - Built-in AI helpers (token estimation, complexity, chunking)
  - Privacy controls and export filtering
  - `.commentsrc` configuration support
  - Community-driven metadata standards

- **v2.0** (Current - In Development) - Ghost Markers & Line Tracking
  - Automatic line tracking with ghost markers
  - Hash-based drift detection
  - 3-line fingerprint auto-reconciliation
  - Manual conflict resolution UI
  - File format v2.0 with backwards compatibility

- **v0.1.5** (October 2025) - Infrastructure Enhancements
  - Command menu (`Ctrl+Alt+P Ctrl+Alt+P`)
  - Multi-language comment detection (30+ languages)
  - Content anchoring utilities
  - Extended comment schema (ranges, status, threads)
  - STAR tag for bookmarked comments

- **v0.1.0** (October 16, 2025) - MVP with core functionality
  - Basic CRUD operations
  - Side-by-side view
  - Scroll synchronization
  - Keybinding system established
  - Tag system (TODO, FIXME, NOTE, etc.)
  - Gutter decorations
  - CodeLens integration

---

## Contributing

Have ideas for new features? Please:
1. Check if the feature is already on the roadmap
2. Open an issue with the "feature request" label
3. Describe the use case and expected behavior
4. We'll discuss and potentially add it to the roadmap

---

## Release Philosophy

We follow semantic versioning (SEMVER):
- **Major (1.0, 2.0)** - Breaking changes to file format or API
- **Minor (0.1, 0.2)** - New features, backward compatible
- **Patch (0.1.1, 0.1.2)** - Bug fixes only

Each minor version will be fully tested and documented before release.
