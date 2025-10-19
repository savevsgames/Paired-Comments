# Changelog

All notable changes to the Paired Comments extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.6 - Demo Playground] - 2025-10-19

### Added - Demo Playground (Phases 5-7)
- **🎨 Phase 5: Extension Integration** - Full Monaco Editor integration with Paired Comments
  - Browser-compatible extension at `demo-playground/src/lib/extension/browser-extension.ts`
  - Gutter icons with color-coded comment tags (TODO, NOTE, FIXME, STAR, QUESTION)
  - CodeLens links showing comment metadata above commented lines
  - Hover tooltips with full comment text and author info
  - CSS styling with inline SVG icons (no external dependencies)
  - Fixed Docker deployment - Added src/ folder to container
  - Organized .comments files in correct subdirectories by language

- **📚 Phase 6: Example Files** - 10 curated code examples with paired comments
  - **JavaScript (4)**: react-component, async-patterns, event-emitter, closure-module
  - **TypeScript (2)**: generic-repository, dependency-injection
  - **Python (2)**: data-pipeline, async-crawler
  - **Go (1)**: goroutines
  - **SQL (1)**: complex-queries
  - All examples include 4 comments with diverse tags (NOTE, FIXME, STAR, QUESTION)
  - AI metadata: complexity ratings, token estimates, parameter documentation
  - Production-quality code patterns for AI training datasets

- **⚡ Phase 7: Export/Share/Reset** - Full-featured action buttons
  - **Export Modal** with 3 formats: ZIP Archive, JSON File, Markdown Documentation
  - **Share Button** - Copy demo URL to clipboard
  - **Reset Button** - Restore examples with confirmation
  - Export utilities using jszip library
  - GitHub-themed UI components

### Changed - Demo Playground
- Updated Dockerfile to copy src/ folder (fixes Monaco extension loading)
- Enhanced page.tsx with export/share/reset handlers
- Added confirmation dialogs for destructive actions
- Better error handling with user-friendly messages

### Testing - Demo Playground
- Test suite at `demo-playground/src/lib/__tests__/export.test.ts`
- Validates all example files have correct comment structure
- Tests for ZIP/JSON/Markdown export functionality

### Technical
- Added jszip dependency
- Docker multi-stage build includes source files
- 10 example files + 10 .comments files in public/examples/
- 1389+ additions across 16 files
- Commits: 3e7bfa8 (Phase 5), e0d25d0 (Phases 6 & 7)

---

# Changelog

All notable changes to the Paired Comments extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2025-10-19

### Removed
- **🧹 Legacy Migration Code** - Removed all backward compatibility support (MVP cleanup)
  - Removed 211 lines of migration code from FileSystemManager
  - Removed `migrateToLatestVersion()`, `migrateV10ToV20()`, `migrateV20ToV205()`, `hashString()` methods
  - Removed ASTAnchorManager dependency from FileSystemManager
  - Removed MigrationError handling for old formats
  - **Rationale**: No users yet = no legacy to support. MVP uses v2.1.0 format exclusively.
  - **Impact**: Extension only accepts v2.1.0 format files (created/updated fields, ghostMarkers required)

### Changed
- **File Format Validation** - Now strictly validates v2.1.0 format only
  - Requires `created` and `updated` fields (rejects old `timestamp` field)
  - Requires valid ghostMarkers (no null values)
  - Rejects files with version < 2.1.0
- **Test Files** - Updated all test samples to v2.1.0 format
  - Updated ast-test.js header (v2.0.5 → v2.1.0)
  - Updated simple-test.js to reflect empty state

## [2.1.1] - 2025-10-18

### Added
- **💬 Comment Actions Menu** - Interactive gutter icon actions for quick comment management
  - **Quick Pick Menu** - Click gutter icons to show action menu with 6 options:
    - 👁️ View Comment - Open paired view (read-only)
    - ✏️ Edit Comment - Open paired view with cursor positioned
    - 🗑️ Delete Comment - Remove comment with confirmation
    - 📋 Copy Comment Text - Copy to clipboard
    - 🏷️ Change Tag - Switch between TODO, FIXME, NOTE, QUESTION, HACK, WARNING, STAR, or None
    - ✅ Mark as Resolved / Reopen - Toggle comment resolution status
  - **Multi-Comment Handling** - If multiple comments on same line, choose which one first
  - **Context-Aware Actions** - Shows "Reopen" for resolved comments, "Mark as Resolved" for active ones
  - **Tag Picker** - Visual tag selection with emoji indicators and descriptions
  - **User-Friendly Messages** - Clear success/error feedback for all actions
- **Updated Gutter Icon Behavior** - Changed from direct view opening to actions menu
  - Previous: Click gutter icon → Opens paired view
  - New: Click gutter icon → Shows action menu → Select action

### Changed
- **CodeLens Command** - Gutter icons now trigger `pairedComments.commentActions` instead of `pairedComments.openAndNavigate`
- **Gutter Icon Title** - Updated to "Click for actions" (was "Click to open")
- **Command Registration** - Added new `commentActions` command to extension activation

### Fixed
- **Infinite Recursion Bug** - Disabled `validatePersistence()` call in `writeCommentFile()` (temporary fix)
  - Root cause: validatePersistence → readCommentFile → migrateToLatestVersion → writeCommentFile → LOOP
  - Status: Validation temporarily disabled to prevent crashes
  - TODO: Re-enable with proper skip flag once migration is fixed
- **Error Handling** - Added try-catch blocks to all action handlers
  - Better error messages with file context
  - Logger integration for debugging
  - User-friendly error dialogs

### Known Issues (Being Fixed)
- **🐛 Backup File Path Bug** - Double `.comments` extension in backup files
  - Error: `ENOENT: no such file or directory, open 'ast-test.js.comments.backup-2025-10-18T20-06-45-832Z.comments'`
  - Should be: `ast-test.js.comments.backup-2025-10-18T20-06-45-832Z`
  - Impact: Tag changes and deletions fail with FileIOError
  - Status: Root cause identified, fix in progress
- **🐛 Gutter Icons Not Refreshing** - After successful operations, gutter icons don't update
  - Attempted fix: Added `refreshDecorations()` calls after tag/delete operations
  - Status: Still investigating, likely blocked by backup file bug

### Technical Details
- **Files Modified**:
  - `src/commands/index.ts` - Added 6 new functions (300+ lines):
    - `showCommentActionsMenu()` - Main menu handler
    - `executeEditAction()` - Edit comment in paired view
    - `executeDeleteAction()` - Delete with confirmation
    - `executeCopyAction()` - Copy to clipboard
    - `executeChangeTagAction()` - Tag picker and update (with error handling)
    - `executeResolveAction()` - Toggle resolved status (with error handling)
  - `src/ui/CommentCodeLensProvider.ts` - Updated command and title
  - `src/io/FileSystemManager.ts` - Commented out validatePersistence (line 217)
- **User Experience**:
  - Single click on gutter icon → Quick access to all comment actions
  - No need to remember keyboard shortcuts for basic operations
  - Visual tag selection with emoji indicators
  - Immediate feedback for all actions
- **Error Logging**: All actions log errors to Output panel for debugging

### Next Steps (v2.1.2)
- Fix backup file path bug in `createBackup()` method
- Fix restore/cleanup methods that reference backup files
- Re-enable `validatePersistence()` with proper migration skip flag
- Verify gutter icon refresh works after successful operations
- Comprehensive testing of tag changes and deletions

---

## [2.1.0] - 2025-10-18

### Added
- **🤖 AI Metadata System (Phase 1: Provider Infrastructure)** - Foundation for AI-powered comment metadata
  - **Multi-Provider Architecture** - Extensible system supporting multiple AI providers
    - Abstract `AIMetadataProvider` base class for provider implementations
    - ProviderRegistry for centralized provider management
    - Currently supports: OpenAI (GPT-4), with Anthropic (Claude) and local models planned
  - **Three AI Operations**
    - `analyze_complexity` - Cyclomatic and cognitive complexity analysis
    - `estimate_tokens` - Token count estimation for LLM context management
    - `extract_parameters` - Function/class parameter extraction and metadata
  - **OpenAI Provider (GPT-4)** - First AI provider implementation
    - Full implementation of all three operations
    - Cost tracking ($0.045/1K tokens average)
    - Token usage monitoring
    - Timeout management (30s default)
    - Retry logic (3 attempts)
    - Response format validation (JSON mode)
  - **Graceful Degradation** - Extension works without AI configured
    - Fallback heuristics for complexity (control flow keyword counting)
    - Fallback token estimation (chars / 4)
    - Fallback parameter extraction (simple regex)
    - Never breaks if API key missing or AI disabled
  - **Configuration System**
    - Custom .env file parser (no external dependencies)
    - Dual configuration: .env file OR VS Code settings
    - Settings: `pairedComments.ai.*` namespace
    - Enable/disable AI features globally
    - Provider selection (openai, anthropic, local)
    - Cache control (enabled, TTL)
    - Provider-specific settings (model, timeout, API keys)
  - **Response Caching** - Cost optimization
    - In-memory cache with configurable TTL (default 1 hour)
    - Cache key generation based on operation + code
    - Cache hit/miss tracking
    - Manual cache clearing
  - **Service Layer** - High-level facade API
    - `AIMetadataService` singleton
    - Simple methods: `analyzeComplexity()`, `estimateTokens()`, `extractParameters()`
    - Automatic provider selection
    - Error handling with fallbacks
    - Service statistics (initialized, enabled, provider count, cache size)
  - **Test Command** - Development verification tool
    - New command: `pairedComments.testAIMetadata`
    - Tests all three AI operations on selected code
    - Displays results in user-friendly dialog
    - Detailed logging to Output panel
    - Detects fallback mode and shows configuration help
    - Shows service statistics
  - **Native Dependencies** - Zero external AI/HTTP libraries
    - Uses Node 18+ built-in `fetch` API
    - Custom .env parser (no dotenv package)
    - VS Code's configuration system
    - Minimal footprint

### Changed
- **Extension Activation** - Now initializes AI metadata service
  - Non-blocking async initialization
  - Logs AI provider status (enabled, provider count)
  - Shows warnings if no API key configured
  - Extension works normally if AI initialization fails
- **Version Number** - Updated to 2.1.0
  - Extension banner: "v2.1.0 AI METADATA"
  - Package.json version: 2.1.0
  - File format version remains 2.0.7 (no breaking changes)

### Technical Details
- **New Files Created**:
  - `src/ai/AIMetadataProvider.ts` (200+ lines) - Core abstraction layer
  - `src/ai/providers/OpenAIProvider.ts` (430+ lines) - GPT-4 implementation
  - `src/ai/ProviderRegistry.ts` (200+ lines) - Provider management
  - `src/ai/AIMetadataService.ts` (370+ lines) - High-level facade API
  - `src/config/AIConfig.ts` (220+ lines) - Configuration management
- **Files Modified**:
  - `src/extension.ts` - Added AI service initialization
  - `src/commands/index.ts` - Added test command (120 lines)
  - `package.json` - Added AI configuration schema (70+ lines)
- **AI Provider Architecture**:
  - Request/Response types with full TypeScript support
  - Error types (MISSING_API_KEY, NO_PROVIDER, etc.)
  - Metadata tracking (provider, model, latency, tokens, cost)
  - Confidence scoring (0-1) for all responses
- **Data Structures**:
  - `ComplexityAnalysis`: cyclomatic, cognitive, maintainability, explanation, confidence
  - `TokenEstimation`: heuristic, validated, breakdown (code/comments/whitespace), confidence
  - `ExtractedParameters`: name, kind, parameters[], returnType, lineCount, confidence
- **Configuration Schema** (package.json):
  - `pairedComments.ai.enabled` (boolean, default: true)
  - `pairedComments.ai.defaultProvider` (enum: openai|anthropic|local)
  - `pairedComments.ai.cacheEnabled` (boolean, default: true)
  - `pairedComments.ai.cacheTTL` (number, default: 3600000ms = 1 hour)
  - `pairedComments.ai.openai.apiKey` (string, optional)
  - `pairedComments.ai.openai.model` (enum: gpt-4|gpt-4-turbo|gpt-3.5-turbo)
  - `pairedComments.ai.openai.baseUrl` (string, for Azure/proxies)
  - `pairedComments.ai.openai.timeout` (number, default: 30000ms)
  - `pairedComments.ai.openai.maxRetries` (number, default: 3)
  - Similar settings for Anthropic (reserved for future)

### User Impact
- **AI is Optional** - Extension works perfectly without AI
- **Easy Configuration** - Drop OPENAI_API_KEY in .env file or VS Code settings
- **Cost Transparency** - Logs token usage and estimated costs
- **Foundation for Future Features** - Infrastructure ready for:
  - Phase 2: Dynamic Parameters (AI-suggested parameter names)
  - Phase 3: Ghost Comment Summaries (AI-generated explanations)
  - Phase 4: Bulk Metadata Generation (AI-powered analysis)
  - Future: MCP Server extraction for broader ecosystem
- **NASA Approach** - Manual workflows first, AI automation later

### Breaking Changes
- None - Fully backwards compatible with v2.0.8
- AI features are opt-in (disabled if no API key)
- No changes to file format or existing functionality

### Known Limitations (Phase 1)
- AI metadata not yet integrated into comment creation (Phase 2+)
- No bulk analysis commands yet (Phase 4)
- OpenAI only (Anthropic and local models coming)
- Test command not in UI menu (developer tool for now)

### Next Steps (v2.1.1+)
- Phase 2: Dynamic Parameters - AI suggests parameter names when creating comments
- Phase 3: Ghost Comment Summaries - AI generates explanations for complex code
- Phase 4: Bulk Metadata Generation - AI analyzes entire files/projects
- Anthropic (Claude) provider implementation
- Local model support (Ollama, LM Studio)
- MCP server extraction for ecosystem integration

---

## [2.0.8] - 2025-10-18

### Added
- **Critical UX Improvement: Edit Comment in Paired View** - Opens paired view with cursor at end of comment text
  - Ctrl+Alt+P E now opens the .comments file and positions cursor at the last character of the comment text
  - Disables auto-scroll during editing for better UX
  - Re-enables auto-scroll when user returns to source file
  - Same intuitive UX as clicking gutter icon to view comment
- **Critical UX Improvement: Delete Comment in Paired View** - Opens paired view to show comment before deletion
  - Ctrl+Alt+P D now opens the .comments file to show the comment
  - User sees the full comment context before confirming deletion
  - Auto-scroll disabled during deletion dialog
  - Consistent UX with edit and view commands
- **Comment Conversion: Inline ↔ Paired** - Manually convert between inline and paired comments
  - **Inline → Paired**: `Ctrl+Alt+P Ctrl+Alt+I` - Extract inline comment to paired format
    - Detects language-specific comment syntax (//,  #, --, etc.)
    - Preserves comment text
    - Optionally removes inline comment after conversion
    - Warns if paired comment already exists on line
  - **Paired → Inline**: `Ctrl+Alt+P Ctrl+Alt+U` - Convert paired comment to inline format
    - Adds comment to source file using language-specific syntax
    - Optionally removes paired comment after conversion
    - Warns if inline comment already exists on line
  - Foundation for future AI-powered bulk conversion tools
  - User validation required before AI automation (NASA approach)

### Changed
- **Edit Command Behavior** - No longer uses input box, opens paired view instead
  - Previous: Input box with current comment text
  - New: Paired view with cursor at end of comment text
  - Better for multi-line comments and context awareness
- **Delete Command Behavior** - Shows comment in paired view before deletion
  - Previous: Dialog with truncated comment text
  - New: Full paired view with complete comment JSON visible
  - User can review metadata (author, timestamps, tags) before deleting

### Technical Details
- Updated `src/commands/index.ts`:
  - Enhanced `editComment()` - Opens paired view, positions cursor at end of text field
  - Enhanced `deleteComment()` - Opens paired view, shows comment before confirmation
  - Added `convertInlineToPaired()` - 95 lines, language-aware extraction
  - Added `convertPairedToInline()` - 105 lines, language-aware insertion
- Updated `package.json`:
  - Added `pairedComments.convertInlineToPaired` command
  - Added `pairedComments.convertPairedToInline` command
  - Added keybindings: Ctrl+Alt+P Ctrl+Alt+I and Ctrl+Alt+P Ctrl+Alt+U
- Language support: 30+ languages via `COMMENT_SYNTAX_MAP` (JavaScript, TypeScript, Python, Java, C#, Go, Rust, PHP, Ruby, etc.)

### User Impact
- **Editing is now visual** - See full comment context while editing
- **Deletion is now safer** - Review comment metadata before removing
- **Conversion is now manual** - Users can test conversion logic before AI automation
- **Consistent UX** - Edit, delete, view all use same paired view pattern
- **Foundation for v2.1.0 AI features** - Manual conversion validates AI workflow

### Breaking Changes
- None - Fully backwards compatible with v2.0.7

---

## [2.0.7] - 2025-10-18

### Added
- **Comprehensive Error Handling Infrastructure** - Robust error management system
  - Custom error class hierarchy (PairedCommentsError, FileIOError, ValidationError, MigrationError, GhostMarkerError, ASTError, DecorationError)
  - User-friendly error messages with actionable recovery steps
  - Structured logging with VS Code output channel
  - Error context and debugging information
- **Retry Logic with Exponential Backoff** - Automatic recovery from transient failures
  - 3 retry attempts with 100ms, 200ms, 400ms delays
  - Smart retry policy (doesn't retry validation errors)
  - Detailed retry logging
- **Ghost Marker Persistence Validation** - Prevents data loss bugs
  - Validates ghost markers are saved correctly after write
  - Auto-repair mechanism for persistence failures
  - Detects and fixes missing ghost markers
  - User notification for persistence issues
- **Automatic Backup System** - Protection against data loss
  - Automatic backup before each write operation
  - Timestamp-based backup files (.comments.backup-YYYY-MM-DDTHH-MM-SS)
  - Automatic cleanup (keeps 5 most recent backups)
  - Backup creation logging
- **Restore from Backup Command** - Easy recovery from errors
  - New command: `Paired Comments: Restore from Backup`
  - Accessible via command palette
  - Restores most recent backup with confirmation
  - Automatic comment reload after restore
- **Logger Infrastructure** - Structured logging throughout extension
  - VS Code output channel integration
  - Log levels: DEBUG, INFO, WARN, ERROR
  - Context-rich logging with JSON formatting
  - "View Output" button in error dialogs
  - Circular reference handling for complex objects

### Changed
- **Enhanced FileSystemManager** - Improved reliability
  - All file operations now use retry logic
  - Pre-write validation prevents invalid data from being saved
  - Post-write validation ensures data integrity
  - Better error messages with recovery steps
- **Migration System** - Better error handling
  - Migration errors wrapped with user-friendly messages
  - Detailed migration logging (v1.0 → v2.0 → v2.0.5 → v2.0.6 → v2.0.7)
  - Recovery steps for failed migrations
- **Extension Event Listeners** - User-friendly error dialogs
  - Decoration update errors show recovery steps
  - Comment reload errors show detailed context
  - All errors link to output channel
- **Version Number** - Updated to 2.0.7
  - File format version updated to 2.0.7
  - Extension activation banner updated
  - Package.json version updated

### Fixed
- **Ghost Marker Persistence Bug** - The original reported issue
  - Added validation to detect when ghost markers aren't saved
  - Auto-repair mechanism re-writes file if markers are missing
  - User notification if persistence issue detected
  - Prevents comment/marker desynchronization
- **File I/O Transient Failures** - Improved reliability
  - Retry logic handles temporary file locks
  - Retry logic handles network file system delays
  - Better handling of concurrent write operations
- **Error Reporting** - More informative error messages
  - Users now see recovery steps instead of technical errors
  - Errors include file paths and context
  - Link to output channel for debugging

### Technical Details
- Created `src/errors/PairedCommentsError.ts` - 6 custom error types
- Created `src/utils/RetryLogic.ts` - Exponential backoff implementation
- Enhanced `src/io/FileSystemManager.ts` - 250+ lines of error handling
- Enhanced `src/extension.ts` - Error dialog handler with recovery steps
- Enhanced `src/commands/index.ts` - Restore from backup command
- Added `Logger.show()` method to open output channel
- Added 5 backup files per source file (auto-cleanup)

### Breaking Changes
- None - Fully backwards compatible with v2.0.6

---

## [2.0.6] - 2025-10-18

### Added
- **Range Comments** - Comment multiple lines at once
  - Start line and end line support
  - Two-letter gutter icons (TS/TE, NS/NE, etc.)
  - Hover messages show range ("Lines 10-20")
  - New command: `Ctrl+Alt+P R` for range comments
- **Improved Command Structure**
  - `Ctrl+Alt+P S` - Single-line comment
  - `Ctrl+Alt+P R` - Range comment
  - `Ctrl+Alt+P A` - Reserved for smart add (v2.0.7+)
- **Visual Enhancements**
  - Larger, bold gutter icons for range start markers
  - Distinct styling for range end markers
  - Position-aware hover messages (start/end/within range)

### Changed
- Updated ghost marker schema to include `endLine` field
- Updated comment schema to include `startLine` and `endLine` fields
- Improved decoration manager to handle range decorations
- Enhanced migration system (v2.0.5 → v2.0.6)

### Technical Details
- Updated `src/types.ts` - Range comment type guards
- Enhanced `src/ui/DecorationManager.ts` - Two-letter icon support
- Updated `src/core/GhostMarkerManager.ts` - Range tracking
- Created comprehensive test fixtures in `test/fixtures/`

---

## [2.0.5] - 2025-10-17

### Added
- **AST-Based Ghost Markers** - Semantic code tracking
  - Tracks comments by symbol path, not just line numbers
  - Automatically follows functions/classes when moved
  - Fallback to line-based tracking for non-symbolic lines
  - Language support: JavaScript, TypeScript, Python, Java, C#, Go, Rust, PHP
- **Ghost Marker Reconciliation** - Smart comment tracking
  - AST-based reconciliation for supported languages
  - 3-line fingerprinting fallback for unsupported languages
  - Automatic line number updates when code moves
- **ASTAnchorManager** - Symbol resolution system
  - Uses VS Code's DocumentSymbolProvider
  - Creates semantic anchors (symbol path + offset)
  - Symbol kind tracking (Function, Class, Method, etc.)

### Changed
- Ghost markers now include `astAnchor` field (optional)
- Migration system updated (v2.0 → v2.0.5)
- Reconciliation algorithm prioritizes AST over line hash

### Technical Details
- Created `src/core/ASTAnchorManager.ts` - 300+ lines
- Created `src/types/ast.ts` - AST type definitions
- Enhanced `src/core/GhostMarkerManager.ts` - AST integration

---

## [2.0.0] - 2025-10-16

### Added
- **Ghost Markers** - Invisible decorations track comment positions
  - 3-line fingerprinting (prev/current/next)
  - SHA-256 line hashing for drift detection
  - Automatic reconciliation when code changes
- **Two-Way Linking** - Comments reference markers, markers reference comments
  - Ghost markers track comment IDs
  - Comments include `ghostMarkerId` field
- **Gutter Icons** - Visual indicators in editor
  - Single-letter icons (T, F, N, Q, H, W, S, C)
  - Color-coded by tag type
  - Clickable to open comment JSON

### Changed
- File format version updated to 2.0
- Migration system for v1.0 → v2.0 upgrade
- Comments now include ghost marker references

### Technical Details
- Created `src/core/GhostMarkerManager.ts`
- Enhanced `src/ui/DecorationManager.ts` for gutter icons
- Added automatic migration on file load

---

## [1.0.0] - 2025-10-15

### Added
- **Initial Release** - Basic paired comments functionality
  - Sidecar `.comments` JSON files
  - Side-by-side synchronized viewing
  - CRUD operations (Create, Read, Update, Delete)
  - Tag-based categorization (TODO, FIXME, NOTE, etc.)
  - Comment badges on files (shows comment count)
  - Scroll sync between source and comments
- **Commands**
  - `Ctrl+Alt+P O` - Open paired comments
  - `Ctrl+Alt+P S` - Add single-line comment
  - `Ctrl+Alt+P E` - Edit comment
  - `Ctrl+Alt+P D` - Delete comment
  - `Ctrl+Alt+P L` - List all comments
  - `Ctrl+Alt+P T` - Toggle scroll sync

### Technical Details
- File format version 1.0
- Basic line-number tracking (no ghost markers)
- JSON schema validation
