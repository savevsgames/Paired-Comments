# Paired Comments - Documentation

**Version:** 2.0-dev
**Last Updated:** October 17, 2025

Welcome to the Paired Comments documentation! This extension provides a powerful system for adding persistent, trackable comments alongside your code.

---

## 📚 Table of Contents

### Getting Started
- [Getting Started Guide](guides/getting-started.md) - Introduction and basic usage

### Feature Documentation
- [Ghost Markers (v2.0)](features/ghost-markers.md) - Automatic line tracking system
- [Params & Hash Tree (v2.1)](features/params-and-hash-tree.md) - AI metadata and dynamic parameters

### Architecture
- [Technical Architecture](architecture/TECHNICAL_ARCHITECTURE.md) - System design and internals

### Development
- [Implementation Plan](development/IMPLEMENTATION_PLAN.md) - Development roadmap and milestones
- [Project Status](PROJECT_STATUS.md) - Current development status

### Historical Reference
- [Original Scope](original_scope/paired-comments-mvp.md) - Initial MVP requirements
- [Pre-Hybrid Analysis](COMPLETE_ANALYSIS_PRE_HYBRID.md) - Early architectural analysis

---

## 🚀 Quick Links

### For Users
- **New to Paired Comments?** → Start with [Getting Started Guide](guides/getting-started.md)
- **Want to understand Ghost Markers?** → Read [Ghost Markers Documentation](features/ghost-markers.md)
- **Interested in AI features?** → Check out [Params & Hash Tree](features/params-and-hash-tree.md)

### For Developers
- **Contributing?** → See [Implementation Plan](development/IMPLEMENTATION_PLAN.md)
- **Understanding the codebase?** → Read [Technical Architecture](architecture/TECHNICAL_ARCHITECTURE.md)
- **Current status?** → Check [Project Status](PROJECT_STATUS.md)

---

## 📖 Documentation Structure

```
docs/
├── README.md                          # This file - documentation index
├── PROJECT_STATUS.md                  # Current development status
│
├── guides/                            # User guides and tutorials
│   └── getting-started.md             # Introduction and basic usage
│
├── features/                          # Feature-specific documentation
│   ├── ghost-markers.md               # v2.0: Automatic line tracking
│   └── params-and-hash-tree.md        # v2.1: AI metadata and params
│
├── architecture/                      # Technical architecture docs
│   └── TECHNICAL_ARCHITECTURE.md      # System design and internals
│
├── development/                       # Development documentation
│   └── IMPLEMENTATION_PLAN.md         # Roadmap and milestones
│
├── original_scope/                    # Historical reference
│   └── paired-comments-mvp.md         # Initial MVP requirements
│
└── COMPLETE_ANALYSIS_PRE_HYBRID.md    # Early architectural analysis
```

---

## 🎯 Current Focus

### v2.0 - Ghost Markers (In Development)
**Status:** Implementation Complete, Testing Phase

Ghost Markers solve the fundamental problem of comment drift by automatically tracking code as it moves. See [Ghost Markers Documentation](features/ghost-markers.md) for details.

**Key Features:**
- Invisible decorations that move with code
- Hash-based drift detection
- 3-line fingerprint auto-reconciliation
- Manual conflict resolution UI

### v2.1 - AI Metadata & Params (Planned - Q1 2026)
**Status:** Design Phase

Extends Ghost Markers with dynamic parameters and AI metadata for advanced workflows. See [Params & Hash Tree Documentation](features/params-and-hash-tree.md) for details.

**Key Features:**
- Variable interpolation in comments
- AI metadata (tokens, complexity, embeddings)
- Hash tree architecture
- Built-in AI helpers
- Privacy controls

---

## 🔗 External Resources

- [GitHub Repository](https://github.com/yourusername/paired-comments)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yourusername.paired-comments)
- [Issue Tracker](https://github.com/yourusername/paired-comments/issues)
- [Roadmap](../ROADMAP.md)

---

## 📝 Contributing to Documentation

Documentation contributions are welcome! Please:

1. Follow the existing structure
2. Use clear, concise language
3. Include code examples where appropriate
4. Update this index when adding new docs
5. Keep feature docs in `/features/`
6. Keep guides in `/guides/`

---

## 📄 License

Documentation is licensed under [MIT License](../LICENSE).

---

**Questions?** Open an issue on GitHub or check the [Getting Started Guide](guides/getting-started.md).
