# Paired Comments - Product Roadmap

**Version:** 0.1.0
**Last Updated:** October 16, 2025

---

## Current Status

### ✅ MVP Features (v0.1.0) - COMPLETED
Core functionality is now implemented and ready for testing:

- **Core Operations**
  - `Ctrl+Alt+P O` - Open paired comments view
  - `Ctrl+Alt+P A` - Add comment to current line
  - `Ctrl+Alt+P E` - Edit existing comment
  - `Ctrl+Alt+P D` - Delete comment
  - `Ctrl+Alt+P S` - Show all comments (quick pick)
  - `Ctrl+Alt+P T` - Toggle scroll sync

- **Technical Foundation**
  - `.comments` file format (JSON)
  - File I/O with caching
  - Side-by-side view management
  - Bidirectional scroll synchronization
  - Comment decorations in gutter

---

## Planned Features

### 🚧 Phase 2: Enhanced Navigation (v0.2.0)

**Target:** Q1 2026

#### Features
- **Next/Previous Comment Navigation**
  - `Ctrl+Alt+P N` - Jump to next comment
  - `Ctrl+Alt+P B` - Jump to previous (back) comment
  - Circular navigation (wrap around at file boundaries)
  - Visual indicator of current position

#### Technical Details
- Implement comment position index
- Handle edge cases (first/last comment)
- Smooth scroll animation to target line

#### Success Metrics
- Navigation feels instant (<50ms)
- Clear visual feedback when at boundaries

---

### 📦 Phase 3: Import/Export (v0.3.0)

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

### 🔍 Phase 4: Search & Filter (v0.4.0)

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

### 👥 Phase 5: Collaboration Features (v0.5.0)

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

### 🔗 Phase 6: Integration Features (v0.6.0)

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

### 🎨 Phase 7: Customization (v0.7.0)

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

### 🚀 Phase 8: Performance & Scale (v0.8.0)

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

### Current Keybindings (v0.1.0)
| Command | Keybinding | Status |
|---------|-----------|--------|
| Open paired comments | `Ctrl+Alt+P O` | ✅ Implemented |
| Add comment | `Ctrl+Alt+P A` | ✅ Implemented |
| Edit comment | `Ctrl+Alt+P E` | ✅ Implemented |
| Delete comment | `Ctrl+Alt+P D` | ✅ Implemented |
| Show all comments | `Ctrl+Alt+P S` | ✅ Implemented |
| Toggle scroll sync | `Ctrl+Alt+P T` | ✅ Implemented |

### Future Keybindings
| Command | Keybinding | Planned Version |
|---------|-----------|-----------------|
| Copy all comments | `Ctrl+Alt+P C` | v0.3.0 |
| Export comments | `Ctrl+Alt+P X` | v0.3.0 |
| Import comments | `Ctrl+Alt+P I` | v0.3.0 |
| Find in comments | `Ctrl+Alt+P F` | v0.4.0 |
| Next comment | `Ctrl+Alt+P N` | v0.2.0 |
| Previous comment | `Ctrl+Alt+P B` | v0.2.0 |
| Mark resolved | `Ctrl+Alt+P M` | v0.5.0 |
| Generate link | `Ctrl+Alt+P L` | v0.6.0 |

---

## Version History

- **v0.1.0** (Current) - MVP with core functionality
  - Basic CRUD operations
  - Side-by-side view
  - Scroll synchronization
  - Keybinding system established

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
