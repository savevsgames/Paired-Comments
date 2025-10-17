# Paired Comments - VS Code Extension

**Version:** 2.0-dev (Ghost Markers)
**Status:** In Development
**Last Updated:** October 17, 2025

---

## 🎯 Overview

**Paired Comments** is a revolutionary VS Code extension that separates code commentary from source files using intelligent sidecar `.comments` files. Unlike traditional inline comments, Paired Comments offers:

- 🎨 **Clean Code** - Keep your source files pristine and focused
- 👻 **Ghost Markers** - Comments automatically track code as it moves (v2.0)
- 🤖 **AI-Ready** - Dynamic params and metadata for AI workflows (v2.1)
- 🔄 **Git-Friendly** - JSON format that merges cleanly
- 📝 **Rich Features** - Tags, threads, status tracking, and more

---

## ✨ Key Features

### 🚀 v2.0 - Ghost Markers (Current Development)

**Automatic Line Tracking** - The killer feature that makes Paired Comments reliable:

- **Invisible Decorations**: Ghost markers track your code as it moves
- **Hash-Based Verification**: SHA-256 hashing detects when code changes
- **3-Line Fingerprinting**: Auto-reconciliation finds drifted comments
- **Zero Maintenance**: Comments stay synchronized through refactoring

**No more broken line numbers!** Ghost Markers solve the fundamental problem of comment drift.

→ [Read the Ghost Markers Documentation](docs/features/ghost-markers.md)

### 🤖 v2.1 - AI Metadata & Params (Coming Q1 2026)

**Dynamic Parameters** - Comments that auto-update:
**Security Foundation** - Enterprise-ready architecture:
```json
{
  "text": "The ${functionName} takes ${paramCount} parameters",
  "params": {
    "functionName": { "value": "processUserData", "type": "dynamic" },
    "paramCount": { "value": 3, "type": "computed" }
  }
}
```

**AI Metadata** - Rich context for AI workflows:
- Token estimation (for GPT-4, Claude, etc.)
- Complexity scoring
- Chunk boundaries for large files
- Training labels for ML datasets
- Vector embeddings for semantic search

→ [Read the Params & Hash Tree Documentation](docs/features/params-and-hash-tree.md)

### 📦 Core Features (v0.1 - Stable)

- ✅ **Dual-Pane View** - Side-by-side source and comments
- ✅ **Scroll Sync** - Perfect synchronization
- ✅ **Gutter Icons** - Visual comment indicators with color coding
- ✅ **Tag System** - TODO, FIXME, NOTE, QUESTION, HACK, WARNING, STAR
- ✅ **Multi-Language** - 30+ programming languages supported
- ✅ **Command Menu** - `Ctrl+Alt+P Ctrl+Alt+P` for all commands

---

## 🚀 Quick Start

### Installation (Development Mode)

```bash
# Clone the repository
git clone https://github.com/yourusername/paired-comments.git
cd paired-comments

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in VS Code Extension Host
# Press F5 in VS Code
```

### Basic Usage

#### 1. Show Command Menu
**Keybinding:** `Ctrl+Alt+P Ctrl+Alt+P` (press Ctrl+Alt+P twice)

Displays all available commands in a quick pick menu.

#### 2. Open Paired Comments View
**Keybinding:** `Ctrl+Alt+P O`

Opens the side-by-side view with your source file and comments.

#### 3. Add a Comment
**Keybinding:** `Ctrl+Alt+P A`

1. Place cursor on the line you want to comment
2. Press the keybinding
3. Enter your comment text
4. Ghost marker automatically created!

#### 4. Edit/Delete Comments
**Keybinding:** `Ctrl+Alt+P E` (edit) / `Ctrl+Alt+P D` (delete)

#### 5. Show All Comments
**Keybinding:** `Ctrl+Alt+P S`

Quick pick list of all comments in the current file.

---

## 📋 File Format

Comments are stored in `.comments` sidecar files:

```
src/
├── main.ts
└── main.ts.comments  ← Sidecar file with v2.0 schema
```

### v2.0 Format (Ghost Markers)

```json
{
  "file": "src/main.ts",
  "version": "2.0",
  "ghostMarkers": [
    {
      "id": "gm-abc123",
      "line": 42,
      "commentIds": ["c1", "c2"],
      "lineHash": "a3f9c2b1...",
      "lineText": "function processUserData(user: User) {",
      "prevLineText": "",
      "nextLineText": "  const validator = new UserValidator();",
      "lastVerified": "2025-10-17T03:00:00Z"
    }
  ],
  "comments": [
    {
      "id": "c1",
      "line": 42,
      "ghostMarkerId": "gm-abc123",
      "text": "TODO: Add input validation",
      "author": "Greg",
      "tag": "TODO",
      "created": "2025-10-16T20:00:00Z",
      "updated": "2025-10-16T20:00:00Z"
    }
  ]
}
```

### v2.1 Format (AI Metadata & Params) - Coming Soon

```json
{
  "id": "c1",
  "line": 42,
  "ghostMarkerId": "gm-abc123",
  "text": "The ${functionName} handles ${operationType} (~${tokens} tokens)",
  "params": {
    "functionName": {
      "value": "processUserData",
      "type": "dynamic",
      "source": "function.name"
    },
    "operationType": {
      "value": "user authentication",
      "type": "static"
    },
    "tokens": {
      "value": 450,
      "type": "computed",
      "source": "aiMeta.tokenEstimate"
    }
  },
  "aiMeta": {
    "tokenEstimate": 450,
    "complexity": 8,
    "codeType": "async-function",
    "lineRange": { "start": 42, "end": 148 },
    "chunkBoundary": true,
    "dependencies": ["UserValidator", "database"],
    "trainingLabel": "authentication"
  }
}
```

---

## 🎮 Keybindings

### Current Commands (v0.1+)

| Command | Keybinding | Description |
|---------|-----------|-------------|
| **Show Command Menu** | `Ctrl+Alt+P Ctrl+Alt+P` | Show all commands |
| Open Paired View | `Ctrl+Alt+P O` | Open side-by-side view |
| Add Comment | `Ctrl+Alt+P A` | Add comment to current line |
| Edit Comment | `Ctrl+Alt+P E` | Edit existing comment |
| Delete Comment | `Ctrl+Alt+P D` | Delete comment |
| Show All Comments | `Ctrl+Alt+P S` | List all comments |
| Toggle Scroll Sync | `Ctrl+Alt+P T` | Enable/disable scroll sync |

### Future Commands (Planned)

| Command | Keybinding | Version |
|---------|-----------|---------|
| Next Comment | `Ctrl+Alt+P N` | v0.3.0 |
| Previous Comment | `Ctrl+Alt+P B` | v0.3.0 |
| Export Comments | `Ctrl+Alt+P X` | v0.4.0 |
| Find in Comments | `Ctrl+Alt+P F` | v0.5.0 |

---

## 🏗️ Architecture

### Project Structure

```
paired-comments/
├── src/
│   ├── extension.ts                  # Main entry point
│   ├── types.ts                      # Type definitions
│   │
│   ├── core/                         # Core logic
│   │   ├── CommentManager.ts         # CRUD operations
│   │   ├── GhostMarkerManager.ts     # v2.0: Line tracking
│   │   └── (v2.1 planned)
│   │       ├── HashTreeManager.ts    # Change detection
│   │       ├── ParamManager.ts       # Dynamic params
│   │       └── AIHelpers.ts          # Token estimation, etc.
│   │
│   ├── io/                           # File I/O
│   │   ├── FileSystemManager.ts      # Read/write .comments
│   │   └── (v2.1 planned)
│   │       └── PrivacyManager.ts     # Export filtering
│   │
│   ├── ui/                           # User interface
│   │   ├── PairedViewManager.ts      # Dual-pane view
│   │   ├── ScrollSyncManager.ts      # Scroll synchronization
│   │   ├── DecorationManager.ts      # Gutter icons (ghost markers)
│   │   ├── CommentCodeLensProvider.ts
│   │   └── CommentFileDecorationProvider.ts
│   │
│   ├── commands/                     # Command implementations
│   │   └── index.ts
│   │
│   └── utils/                        # Utilities
│       ├── contentAnchor.ts          # Hash utilities
│       └── (v2.1 planned)
│           └── interpolation.ts      # Variable interpolation
│
├── docs/                             # Documentation
│   ├── README.md                     # Documentation index
│   ├── features/                     # Feature docs
│   │   ├── ghost-markers.md          # v2.0 documentation
│   │   └── params-and-hash-tree.md   # v2.1 documentation
│   ├── guides/                       # User guides
│   └── architecture/                 # Technical docs
│
└── ROADMAP.md                        # Product roadmap
```

### Key Components

#### Ghost Markers (v2.0)
- **GhostMarkerManager** - Tracks code movement with invisible decorations
- **DecorationManager** - Shows gutter icons at ghost marker positions
- **CommentManager** - Links comments to ghost markers

#### Hash Tree (v2.1 - Planned)
- **HashTreeManager** - Merkle tree for efficient change detection
- **ParamManager** - Evaluates and updates dynamic parameters
- **AIHelpers** - Token estimation, complexity, chunking

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

### For Users
- 📖 [Getting Started Guide](docs/guides/getting-started.md)
- 👻 [Ghost Markers Documentation](docs/features/ghost-markers.md)
- 🤖 [AI Metadata & Params Documentation](docs/features/params-and-hash-tree.md)

### For Developers
- 🏗️ [Technical Architecture](docs/architecture/TECHNICAL_ARCHITECTURE.md)
- 📋 [Implementation Plan](docs/development/IMPLEMENTATION_PLAN.md)
- 📊 [Project Status](docs/PROJECT_STATUS.md)

### Quick Links
- 🗺️ [Roadmap](ROADMAP.md) - Product roadmap and version history
- 📑 [Documentation Index](docs/README.md) - Complete documentation structure

---

## 🗺️ Roadmap

### ✅ v0.1.0 (October 2025) - MVP
- Core CRUD operations
- Side-by-side view
- Scroll synchronization
- Gutter decorations
- Tag system (TODO, FIXME, NOTE, etc.)
- Multi-language support (30+ languages)

### 🚧 v2.0 (Current - Q4 2025) - Ghost Markers
**Status:** Implementation Complete, Testing Phase

- Automatic line tracking with ghost markers
- Hash-based drift detection
- 3-line fingerprint auto-reconciliation
- Manual conflict resolution UI
- File format v2.0 with backwards compatibility

### 🔮 v2.1 (Planned - Q1 2026) - AI Metadata & Params
- Dynamic parameters with variable interpolation
- AI metadata (tokens, complexity, embeddings)
- Hash tree architecture for change detection
- Built-in AI helpers (token estimation, chunking)
- Output capture foundation (Jupyter-style runtime values)
- Privacy controls and export filtering
- Security foundation (encryption, sensitive data detection)
- `.commentsrc` configuration support

### 📅 Future Versions
- **v0.3.0** - Enhanced navigation (next/previous comment)
- **v0.4.0** - Import/export (Markdown, CSV, JSON)
- **v0.5.0** - Search & filter
- **v0.6.0** - Collaboration (threads, mentions)
- **v0.7.0** - Integrations (Git, GitHub, Jira)

→ [View Full Roadmap](ROADMAP.md)

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run compile          # Compile TypeScript
npm run watch           # Watch mode (auto-compile)

# Testing
npm test                # Run unit tests
npm run test:watch      # Watch mode for tests
npm run test:coverage   # Test coverage report

# Quality
npm run lint            # Lint code
npm run format          # Format with Prettier

# Packaging
npm run package         # Create .vsix package
```

### Running the Extension

1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test commands in the new VS Code window

### Testing Ghost Markers

1. Create a test file with comments
2. Add comments using `Ctrl+Alt+P A`
3. Edit code above comments (insert/delete lines)
4. Watch ghost markers auto-adjust comment positions!

---

## 🤝 Contributing

We welcome contributions! This project is in active development.

### How to Contribute

1. **Check the Roadmap** - See what's planned in [ROADMAP.md](ROADMAP.md)
2. **Open an Issue** - Discuss features or bugs
3. **Submit PRs** - Follow existing code style
4. **Write Tests** - Ensure quality
5. **Update Docs** - Keep documentation current

### Development Guidelines

- TypeScript strict mode
- Comprehensive testing (Vitest + VS Code Test Runner)
- Full JSDoc comments
- Error handling with custom error types
- Follow existing architecture patterns

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 👤 Author

**Greg Barker**

---

## 🌟 Why Paired Comments?

### The Problem
Traditional inline comments:
- ❌ Clutter your code
- ❌ Break when code moves
- ❌ Limited metadata
- ❌ Hard to search/analyze
- ❌ Not AI-friendly

### The Solution
Paired Comments:
- ✅ Clean source files
- ✅ Auto-tracking with Ghost Markers
- ✅ Rich metadata for AI workflows
- ✅ Powerful search and filtering
- ✅ Platform for AI-assisted development

---

## 🚀 Vision

**Paired Comments aims to be the definitive platform for code annotation in the age of AI-assisted development.**

By separating comments from code and adding intelligent tracking + AI metadata, we enable:

- 🎯 **Dynamic Documentation** - Comments that never go stale
- 🤖 **AI Workflows** - Structured metadata for ML/analysis
- 📊 **Code Intelligence** - Token estimation, complexity tracking
- 🏢 **Enterprise Features** - Compliance, audit trails, privacy
- 🌍 **Community Standards** - Industry-specific metadata schemas

---

**Join us in revolutionizing code comments!** 🎉

→ [Read the Documentation](docs/README.md)
→ [View the Roadmap](ROADMAP.md)
→ [Explore Ghost Markers](docs/features/ghost-markers.md)
→ [Learn About AI Features](docs/features/params-and-hash-tree.md)
