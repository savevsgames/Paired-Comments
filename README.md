# Paired Comments - VS Code Extension

**Status:** In Development (v0.1.0 MVP)

## Overview

Paired Comments is a VS Code extension that separates code commentary from source files using synchronized sidecar `.comments` files. Keep your code clean while maintaining rich annotations.

### Key Features (MVP)

- **Dual-Pane View**: View source code and comments side-by-side
- **Synchronized Scrolling**: Comments scroll perfectly in sync with your code
- **Gutter Icons**: Visual indicators show which lines have comments
- **Easy CRUD**: Add, edit, and delete comments with simple commands
- **Git-Friendly**: `.comments` files are JSON-based and merge-friendly

## Installation

**Development Mode:**

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in VS Code Extension Host
# Press F5 in VS Code
```

## Usage

### Opening Paired Comments

1. Open any source file
2. Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
3. Or run command: "Paired Comments: Open"

### Adding a Comment

1. Place cursor on the line you want to comment
2. Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
3. Enter your comment text
4. Or run command: "Paired Comments: Add Comment"

### Editing a Comment

1. Right-click on a line with a comment
2. Select "Paired Comments: Edit Comment"

### Deleting a Comment

1. Right-click on a line with a comment
2. Select "Paired Comments: Delete Comment"

### Toggle Scroll Sync

- Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
- Or run command: "Paired Comments: Toggle Scroll Sync"

## File Format

Comments are stored in `.comments` files alongside your source code:

```
src/
├── main.ts
├── main.ts.comments  ← Sidecar file
```

**Example `.comments` file:**

```json
{
  "file": "src/main.ts",
  "version": "1.0",
  "comments": [
    {
      "id": "c1",
      "line": 42,
      "text": "This function should return a Promise",
      "author": "Greg",
      "created": "2025-10-16T20:00:00Z",
      "updated": "2025-10-16T20:00:00Z"
    }
  ]
}
```

## Development

### Project Structure

```
paired-comments/
├── src/
│   ├── extension.ts           # Main entry point
│   ├── types.ts               # Type definitions
│   ├── core/
│   │   └── CommentManager.ts  # CRUD operations
│   ├── io/
│   │   └── FileSystemManager.ts
│   ├── ui/
│   │   ├── PairedViewManager.ts
│   │   ├── ScrollSyncManager.ts
│   │   └── DecorationManager.ts
│   └── commands/
│       └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
└── docs/
    ├── architecture/
    └── development/
```

### Available Scripts

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-compile on change)
npm run watch

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Package extension
npm run package
```

### Testing

```bash
# Unit tests (Vitest)
npm test

# Integration tests (VS Code Test Runner)
npm run test:integration

# Watch mode
npm run test:watch
```

## Architecture

See [TECHNICAL_ARCHITECTURE.md](./docs/architecture/TECHNICAL_ARCHITECTURE.md) for detailed architecture documentation.

## Roadmap

### v0.1 (Current - MVP)
- [x] Project scaffolding
- [ ] Core CRUD operations
- [ ] Dual-pane view
- [ ] Scroll synchronization
- [ ] Gutter decorations
- [ ] Basic commands

### v0.2
- Tags and categories (TODO, NOTE, WARNING)
- Multi-line comments
- Comment threading

### v0.3
- Git integration
- Export to Markdown
- Search comments

### v1.0
- Polish and public release
- Comprehensive documentation
- Submit to VS Code Marketplace

## Contributing

**Development Status:** This project is in early development. Contributions welcome!

See [IMPLEMENTATION_PLAN.md](./docs/development/IMPLEMENTATION_PLAN.md) for the development roadmap.

## License

MIT

## Author

Greg Barker

---

**Built with best practices:**
- TypeScript strict mode
- Comprehensive testing
- Full documentation
- Error handling
