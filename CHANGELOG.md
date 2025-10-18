# Changelog

All notable changes to the Paired Comments extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
