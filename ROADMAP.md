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

5.5. **Security Foundation** (Week 5.5)
   - Extend `.commentsrc` with security section
   - Encryption provider interface (stub implementations)
   - Sensitive data pattern detection (passwords, API keys, etc.)
   - Export safety warnings
   - Architecture ready for Azure Key Vault, AWS KMS (future)

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

### 🎮 Phase 3.5: Interactive GitHub Demo & Playground

**Target:** Q3 2026 (After v2.2)
**Status:** Vision Phase

#### Why This Matters
Creates a **live, interactive demo** that showcases Paired Comments in action, exactly as it would appear in GitHub's UI. This is our **"wow factor" marketing tool** and proof-of-concept for GitHub acquisition. By building a fake GitHub interface with real Monaco editor integration, we demonstrate the production-ready nature of `.comments` files and their value for developers.

**Strategic Value**: "Don't build our stage before we know how the play will end" - this comes AFTER v2.2 when all major features are mature and impressive.

#### Features
- **Fake GitHub UI**
  - Next.js app that perfectly replicates GitHub's file viewer
  - Left sidebar: File tree navigation (fake but realistic)
  - Top tabs: Code, Issues, Pull Requests, etc.
  - Code tab contains Monaco editor with Paired Comments running
  - Fully responsive, pixel-perfect GitHub aesthetic

- **Monaco Integration**
  - Browser-compatible version of Paired Comments
  - Full feature parity with VS Code extension (v2.2)
  - Gutter icons, hover previews, ghost markers
  - Output capture visualization
  - Dynamic params rendering

- **Curated Examples (20+ Scenarios)**
  - Click file in sidebar → instant load with comments
  - Examples organized by category
  - Each example demonstrates specific features

- **Export & Share**
  - "Fork this example" button (downloads .comments file)
  - Share URL (deep links to specific examples)
  - "Open in VS Code" button (opens local workspace)
  - Embed code for documentation sites

#### Example Categories

**1. Real-World Applications**
- Express.js API with authentication flow
- React component library with component variants
- Python data processing pipeline
- ML model training script with hyperparameter tuning
- Database migration with rollback logic
- Payment processing integration (Stripe/PayPal)

**2. AI/ML Workflows**
- Fine-tuning dataset with input/output pairs
- Model evaluation with captured predictions
- API response caching for development
- Training data curation with labels
- Token estimation for cost tracking
- Chunk boundaries for large context

**3. Educational Examples**
- Algorithm implementations (sorting, searching)
- Design pattern demonstrations
- Code smells with refactoring suggestions
- Performance optimization case studies
- Security vulnerability examples with fixes
- Testing strategies (unit, integration, e2e)

**4. Enterprise Features**
- Compliance tracking (SOC2, GDPR)
- API cost estimation
- Team collaboration workflows
- Code review processes
- Audit trail examples
- Privacy controls demonstration

#### Technical Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Editor**: Monaco Editor with custom language support
- **Paired Comments**: Browser-compatible core (stripped of VS Code APIs)
- **Styling**: Tailwind CSS (GitHub-like theme)
- **Deployment**: Vercel (instant deployment, edge network)
- **Analytics**: Track which examples get most views

#### Implementation Phases

1. **Monaco Setup** (Week 1)
   - Browser-compatible Paired Comments core
   - Monaco editor integration
   - Basic .comments file rendering

2. **GitHub UI** (Week 2-3)
   - Next.js app with fake GitHub interface
   - File tree navigation
   - Tab system (Code, Issues, etc.)
   - Responsive layout

3. **Example Curation** (Week 4-5)
   - Create 20+ example files with comments
   - Organize by category
   - Write descriptions and README

4. **Features & Polish** (Week 6-7)
   - Deep linking to examples
   - Export/share functionality
   - "Open in VS Code" integration
   - Analytics setup

5. **Launch & Marketing** (Week 8)
   - Deploy to production
   - Create demo videos
   - Write blog posts
   - Reddit/HN launch

#### Success Metrics
- ✅ >1000 visitors in first week
- ✅ >50% click through multiple examples
- ✅ >10% download .comments files
- ✅ Featured on HN front page / r/programming
- ✅ GitHub stars increase by 500+
- ✅ Direct interest from Microsoft/GitHub

#### GitHub Acquisition Value 🎯
- **Live Proof**: Not vaporware - fully functional in browser
- **Zero Friction**: No installation required to try
- **Instant Understanding**: 30 seconds to see the value
- **Production Ready**: Demonstrates robustness and polish
- **Developer Love**: Comments on HN/Reddit validate demand
- **Training Data Showcase**: Real examples show AI training value

---

### 🤖 Phase 3.6: AI Training Comparison Playground

**Target:** Q4 2026 (After Phase 3.5 GitHub Demo)
**Status:** Vision Phase

#### Why This Matters
**Empirical proof that `.comments` files improve AI training.** We fine-tune two models side-by-side:
1. **Control**: Traditional code with inline comments
2. **Experiment**: Same code + `.comments` files with rich metadata (params, aiMeta, outputs)

Then we evaluate both models on the SAME task and show **quantifiable improvements** in accuracy, understanding, and code generation quality.

**Strategic Value**: This is the **data-driven proof** Microsoft needs to justify acquisition. "Our users' `.comments` files improved model accuracy by 15%."

#### Features

**1. Training Comparison Dashboard**
- Split-screen view showing two training runs simultaneously
- Left: Control (conventional code)
- Right: Experiment (code + .comments with params, aiMeta, outputs)
- Real-time metrics: loss, accuracy, perplexity
- Visual diff of generated outputs

**2. Pre-Built Training Scenarios**
Choose from curated fine-tuning datasets:
- **React Component Generator**: Generate form components with a11y
- **API Endpoint Creator**: Build REST endpoints from specs
- **Bug Fix Predictor**: Given buggy code, predict the fix
- **Documentation Writer**: Generate JSDoc from function signatures
- **Test Case Generator**: Create unit tests for functions

**3. Azure ML Integration**
- Uses Azure Machine Learning Studio
- Pre-configured fine-tuning pipelines
- GPT-4 fine-tuning API or open models (Llama, Mistral)
- Automatic experiment tracking
- Model comparison reports with statistical significance

**4. Evaluation Metrics**
- **Code Accuracy**: Exact match vs. expected output
- **Functional Correctness**: Does generated code run? Pass tests?
- **Semantic Similarity**: Embedding distance from target
- **Pass@k**: Standard AI code generation metric (% correct in top-k)
- **Human Eval**: Side-by-side comparison UI for subjective quality

**5. Interactive Results**
- "Try it yourself" - give both models the same prompt
- Compare generated code side-by-side
- Show which model understood context better
- Highlight where `.comments` metadata helped (annotations on diff)

#### Example: React Component Training

**Training Data (100 components):**
- Control: React component code with inline comments
- Experiment: Same code + `.comments` with metadata:
  ```json
  {
    "text": "This is a ${componentType} with ${propCount} props",
    "params": {
      "componentType": "FormInput",
      "propCount": 5
    },
    "aiMeta": {
      "complexity": 3,
      "componentCategory": "form-control",
      "a11y": true,
      "responsive": true,
      "dependencies": ["react", "styled-components"]
    },
    "output": {
      "value": { "rendered": true, "errors": [] },
      "type": "object"
    }
  }
  ```

**Evaluation Task:**
- Prompt: "Create a search bar component with autocomplete"

**Results Display:**
```
Metric                Control    Experiment    Improvement
─────────────────────────────────────────────────────────
Functional tests     78%        94%           +16%
Accessibility        45%        91%           +46%
Type safety          82%        97%           +15%
Best practices       68%        89%           +21%
Overall quality      73%        93%           +20%
```

#### Technical Stack
- **Training**: Azure ML Studio (or Hugging Face AutoTrain)
- **Models**: GPT-4 fine-tuning API, Claude fine-tuning, or Llama-3 70B
- **Frontend**: Next.js dashboard (extends Phase 3.5 GitHub demo)
- **Datasets**: Curated from popular repos (React, Express, Django, etc.)
- **Evaluation**: Custom harness + Azure ML evaluation tools
- **Storage**: Azure Blob Storage for datasets, models, results

#### Implementation Phases

1. **Dataset Preparation** (Week 1-2)
   - Select 5 target applications to reproduce
   - Create control datasets (conventional code)
   - Create experiment datasets (+ .comments with metadata)
   - Quality validation (manual review)

2. **Training Pipeline** (Week 3-4)
   - Azure ML pipeline setup
   - Fine-tuning scripts for both datasets
   - Experiment tracking (MLflow)
   - Checkpoint management

3. **Evaluation Harness** (Week 5-6)
   - Automated test generation for each scenario
   - Metric calculation (accuracy, pass@k, semantic similarity)
   - Human eval interface (A/B comparison)
   - Statistical significance testing
   - Results aggregation and visualization

4. **Interactive Dashboard** (Week 7-8)
   - Real-time training visualization
   - Model comparison UI with metrics
   - "Try it yourself" playground (prompt both models)
   - Export whitepaper-ready charts and tables

5. **Whitepaper & Launch** (Week 9-10)
   - Write methodology and results paper
   - Create demo videos showing improvement
   - Submit to arXiv (academic credibility)
   - LinkedIn/Twitter/HN launch
   - Reach out to Microsoft Research / OpenAI

#### Example Scenarios (5 Initial Fine-Tuning Tasks)

1. **React Component Library** (Frontend)
   - Task: Generate accessible, responsive components
   - Metadata: `a11y`, `responsive`, `componentType`, `propTypes`
   - Expected Improvement: +30% on accessibility checks

2. **Express.js API** (Backend)
   - Task: Build REST endpoints with auth/validation
   - Metadata: `authRequired`, `validationRules`, `outputSchema`
   - Expected Improvement: +20% on security best practices

3. **Python Data Pipeline** (Data Science)
   - Task: Create ETL scripts with error handling
   - Metadata: `dataSource`, `transformations`, `errorCases`
   - Expected Improvement: +25% on edge case handling

4. **Bug Fix Prediction** (Code Quality)
   - Task: Given buggy code, predict the fix
   - Metadata: `errorType`, `rootCause`, `testCase` (in output)
   - Expected Improvement: +15% on fix accuracy

5. **SQL Query Generator** (Database)
   - Task: Generate optimized queries from natural language
   - Metadata: `tableSchema`, `indexHints`, `expectedRows`
   - Expected Improvement: +20% on query optimization

#### Success Metrics
- ✅ Experiment model outperforms control by **>10%** on average accuracy
- ✅ Experiment model shows **>20%** improvement on complex/edge cases
- ✅ Whitepaper published on arXiv, cited by AI research community
- ✅ Featured in Azure ML case studies or Microsoft blog
- ✅ Microsoft Research / OpenAI reaches out to discuss integration
- ✅ "Paired Comments training" becomes an AI best practice

#### Microsoft Acquisition Value 🎯🎯🎯 (HIGHEST)
- **Empirical Proof**: Not speculation - REAL data showing 10-20% improvement
- **Azure Integration**: Already using Azure ML (natural acquisition fit)
- **Training Data Goldmine**: Thousands of developers creating labeled datasets daily
- **GitHub Copilot Enhancement**: ".comments improve Copilot accuracy by 15%" (marketing gold)
- **Academic Credibility**: Published methodology, reproducible results
- **Competitive Moat**: First mover in "metadata-enhanced training"
- **Revenue Impact**: Better models = happier Copilot customers = retention

This is the **killer proof point** that makes Microsoft say "we need to own this platform."

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
  - Security foundation (encryption interface, sensitive data detection)
  - `.commentsrc` configuration support (privacy + security)
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
