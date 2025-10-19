# Paired Comments MCP Server

**Version:** 0.1.0 (Planning)
**Status:** 📋 Planning Phase
**Target Release:** January 2026

Model Context Protocol (MCP) server for Paired Comments - enabling AI assistants to read, write, and manage code comments with full context awareness.

---

## 🎯 Vision

Transform Paired Comments from a human-centric VS Code extension into an **AI-accessible knowledge layer** that LLMs can use to understand and annotate codebases.

### Strategic Goals

1. **AI Training Pipeline** - Export annotated code for training datasets
2. **LLM Integration** - Claude/GPT can read and write comments during coding sessions
3. **Context Awareness** - AI gets full codebase context through comments
4. **Bi-directional Sync** - Extension ↔ MCP Server real-time updates

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   VS Code Extension                      │
│  (Client - Existing Paired Comments v2.1.6)             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ CommentMgr   │  │ GhostMarker  │  │ AST Anchor   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                           │                              │
│                    ┌──────▼──────┐                      │
│                    │ MCP Client  │ (New)                │
│                    │ Adapter     │                       │
│                    └──────┬──────┘                      │
└───────────────────────────┼──────────────────────────────┘
                            │
                     JSON-RPC over stdio
                            │
┌───────────────────────────▼──────────────────────────────┐
│                    MCP Server                             │
│              (Node.js/TypeScript)                         │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Core Services                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ Comment  │  │ Search   │  │ Export   │     │    │
│  │  │ Service  │  │ Service  │  │ Service  │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │          MCP Protocol Handlers                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ Tools    │  │ Resources│  │ Prompts  │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │           File System Access                     │    │
│  │  - Read/Write .comments files                    │    │
│  │  - Parse source code (AST)                       │    │
│  │  - Watch for changes                             │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
                            │
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐        ┌──────▼──────┐
         │   Claude    │        │     GPT     │
         │   Desktop   │        │  (via API)  │
         └─────────────┘        └─────────────┘
```

---

## 📦 Project Structure

```
mcp-server/
├── docs/                          # MCP-specific documentation
│   ├── ARCHITECTURE.md           # System design and patterns
│   ├── PROTOCOL_SPEC.md          # MCP protocol implementation
│   ├── API_REFERENCE.md          # Tools/Resources/Prompts API
│   ├── INTEGRATION_GUIDE.md      # VS Code extension integration
│   └── DEPLOYMENT.md             # Docker, npm, installation
├── src/
│   ├── server.ts                 # MCP server entry point
│   ├── protocol/                 # MCP protocol handlers
│   │   ├── tools.ts              # Tool implementations
│   │   ├── resources.ts          # Resource providers
│   │   └── prompts.ts            # Prompt templates
│   ├── services/                 # Business logic
│   │   ├── CommentService.ts     # CRUD operations
│   │   ├── SearchService.ts      # Comment search/filter
│   │   ├── ExportService.ts      # Export to various formats
│   │   └── SyncService.ts        # Real-time sync with extension
│   ├── core/                     # Core utilities
│   │   ├── FileSystemManager.ts  # .comments file I/O
│   │   ├── ASTParser.ts          # Source code parsing
│   │   └── EventBus.ts           # Event system
│   └── types/                    # TypeScript definitions
│       ├── mcp.ts                # MCP protocol types
│       └── comments.ts           # Comment schema (shared with extension)
├── test/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests with Claude
├── docker/
│   ├── Dockerfile                # Container for MCP server
│   └── docker-compose.yml        # Local development setup
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🔌 MCP Protocol Implementation

### Tools (Actions AI can perform)

```typescript
// Add a new comment to source file
add_comment(filePath, line, text, tag, author)

// Edit existing comment
edit_comment(filePath, commentId, text)

// Delete comment
delete_comment(filePath, commentId)

// Search comments across workspace
search_comments(query, filters)

// Get all comments for a file
get_file_comments(filePath)

// Move comment between files
move_comment(sourceFile, targetFile, commentId, targetLine)

// Export comments to format
export_comments(format, filePath?)
```

### Resources (Data AI can read)

```typescript
// Get comment file contents
comment://workspace/{filePath}.comments

// Get all comments in workspace
comment://workspace/all

// Get comments by tag
comment://workspace/tags/{tag}

// Get orphaned comments
comment://workspace/orphaned

// Get AI-enriched comments
comment://workspace/ai-enriched
```

### Prompts (Pre-built workflows)

```typescript
// Review code and suggest comments
review_code: "Review this code and suggest TODO/FIXME comments"

// Explain complex code
explain_complexity: "Add explanatory NOTE comments for complex functions"

// Generate training data
training_export: "Export comments as AI training dataset"

// Fix orphaned comments
fix_orphans: "Re-anchor orphaned comments to correct locations"
```

---

## 🚀 Quick Start (Future)

### Installation

```bash
# Install MCP server globally
npm install -g @paired-comments/mcp-server

# Or use with npx
npx @paired-comments/mcp-server
```

### Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "paired-comments": {
      "command": "npx",
      "args": ["-y", "@paired-comments/mcp-server"],
      "env": {
        "WORKSPACE_PATH": "/path/to/your/code"
      }
    }
  }
}
```

### Docker Deployment

```bash
cd mcp-server
docker-compose up -d
```

---

## 📋 Development Roadmap

### Phase 1: Core MCP Server (Weeks 1-2)
- [ ] Project setup (TypeScript, ESLint, tests)
- [ ] MCP protocol implementation (tools, resources, prompts)
- [ ] File system access (.comments file I/O)
- [ ] Basic CRUD operations (add, edit, delete comments)
- [ ] Integration tests with MCP Inspector

### Phase 2: Advanced Features (Weeks 3-4)
- [ ] Search service (multi-field, relevance scoring)
- [ ] Export service (JSON, Markdown, CSV, training data formats)
- [ ] AST parsing for symbol resolution
- [ ] Ghost marker tracking (sync with extension)
- [ ] Real-time sync via event bus

### Phase 3: VS Code Integration (Week 5)
- [ ] MCP client adapter in extension
- [ ] Bi-directional sync (extension ↔ server)
- [ ] Event hooks (comment changes, file changes)
- [ ] Settings synchronization
- [ ] User documentation

### Phase 4: Docker & Deployment (Week 6)
- [ ] Dockerfile with multi-stage build
- [ ] Docker Compose for local dev
- [ ] npm package publication
- [ ] CI/CD with GitHub Actions
- [ ] Integration with demo playground

---

## 🔗 Related Documentation

- [Main Project Docs](../docs/)
- [VS Code Extension README](../README.md)
- [Demo Playground](../demo-playground/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Anthropic MCP Documentation](https://docs.anthropic.com/mcp)

---

## 📝 Status

**Current:** Planning Phase
**Next Milestone:** Phase 1 - Core MCP Server
**Dependencies:** Demo Playground (v2.1.6) ✅ Complete

---

**Built with**: TypeScript, Node.js, MCP Protocol, Docker
**License:** MIT (TBD)
**Maintainer:** Paired Comments Team
