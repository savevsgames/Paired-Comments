# Paired Comments Demo Playground

**Version:** 2.1.6  
**Status:** ✅ **Ready for Testing**

Interactive demo environment showcasing the Paired Comments VS Code extension in a containerized, GitHub-like UI with Monaco Editor integration.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- 4GB RAM minimum
- Port 3000 available

### Start the Demo

```bash
cd demo-playground
docker-compose up
```

Access the demo at **http://localhost:3000**

### Development Mode (with hot-reload)

```bash
npm install
npm run dev
```

### Stop the Demo

```bash
docker-compose down
```

## ✨ Features

### Completed (Phases 1-7)
- ✅ **Phase 1-4**: Container Setup + GitHub UI + Monaco Editor + VS Code Shim
- ✅ **Phase 5**: Extension Integration
  - Gutter icons with color-coded comment tags
  - CodeLens links showing comment metadata
  - Hover tooltips with full comment details
  - Browser-compatible Paired Comments extension
- ✅ **Phase 6**: Example Files
  - 10 curated code examples across 5 languages
  - 40+ paired comments demonstrating real-world usage
  - AI metadata (complexity, tokens, params)
- ✅ **Phase 7**: Export & Share
  - Export as ZIP, JSON, or Markdown
  - Share demo URL to clipboard
  - Reset to original examples

### In Progress
- 🚧 **Phase 8**: Polish & Testing
  - Error handling improvements
  - Loading states
  - Comprehensive test coverage

## 📚 Example Files (10 total)

| Language | Files | Comments |
|----------|-------|----------|
| JavaScript | 4 | react-component, async-patterns, event-emitter, closure-module |
| TypeScript | 2 | generic-repository, dependency-injection |
| Python | 2 | data-pipeline, async-crawler |
| Go | 1 | goroutines |
| SQL | 1 | complex-queries |

All examples include:
- 4 paired comments per file
- Diverse tags (NOTE, FIXME, STAR, QUESTION)
- AI training metadata
- Production-quality code patterns

## 🎨 UI Features

- **GitHub-themed** dark mode interface
- **File tree** with folder navigation
- **Monaco Editor** with syntax highlighting
- **Comments pane** showing all comments for current file
- **Action buttons**: Export, Share, Reset, Toggle Comments
- **Gutter icons**: Click to see comment details
- **CodeLens**: Inline comment indicators

## 📁 Project Structure

```
demo-playground/
├── public/examples/        # 10 source files + 10 .comments files
│   ├── javascript/
│   ├── typescript/
│   ├── python/
│   ├── go/
│   └── sql/
├── src/
│   ├── app/               # Next.js 14 app directory
│   ├── components/        # React components
│   │   ├── GitHubUI/     # File tree, editor, comments pane
│   │   ├── Monaco/       # Monaco editor wrapper
│   │   └── ExportModal.tsx
│   ├── lib/
│   │   ├── extension/    # Browser Paired Comments extension
│   │   ├── export.ts     # ZIP/JSON/Markdown export
│   │   └── vscode-shim.ts
│   └── styles/
│       └── extension.css # Gutter icon styles
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Container config
└── package.json
```

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
docker-compose down
# Or change port in docker-compose.yml
```

### Container won't start
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Extension not loading
Check Docker logs:
```bash
docker logs paired-comments-demo
```

Ensure src/ folder is in container:
```bash
docker exec paired-comments-demo ls -la /app/src/lib/extension/
```

### Gutter icons not showing
1. Open browser console (F12)
2. Look for `[PairedComments]` logs
3. Check if .comments files are loading (Network tab)
4. Verify extension CSS is loaded

## 🔗 Links

- [Paired Comments Extension](../)
- [Design Document](../docs/milestones/v2.1.3-github-demo-playground.md)
- [Changelog](../CHANGELOG.md)

## 📝 Development Notes

### Testing
```bash
npm test                # Run Jest tests
npm run build          # Production build check
```

### Docker Commands
```bash
docker-compose up --build -d    # Rebuild and start detached
docker-compose logs -f          # Follow logs
docker exec -it paired-comments-demo sh  # Access container shell
```

### Adding New Examples
1. Create source file in `public/examples/<language>/`
2. Create matching `.comments` file with v2.1.0 schema
3. Rebuild container: `docker-compose up --build`

---

**Built with**: Next.js 14, Monaco Editor, Docker, TypeScript, Tailwind CSS
