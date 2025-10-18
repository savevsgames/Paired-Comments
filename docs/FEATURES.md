# Paired Comments - Feature Guide

**Version:** 2.0.5-dev
**Last Updated:** October 18, 2025

---

## Core Features

### 1. Paired Comments System
Store rich comments in separate `.comments` files alongside your code, keeping source files clean while maintaining detailed annotations.

**Commands:**
- `Ctrl+Alt+P O` - Open paired comments view
- `Ctrl+Alt+P A` - Add comment to current line
- `Ctrl+Alt+P E` - Edit existing comment
- `Ctrl+Alt+P D` - Delete comment

**File Format:**
```json
{
  "version": "2.0.5",
  "ghostMarkers": [ ... ],
  "comments": [ ... ]
}
```

---

### 2. AST-Based Line Tracking (v2.0.5) ✨ NEW
Comments automatically follow your code as it moves! Cut/paste a function, and its comment travels with it.

**How it Works:**
- Uses VS Code's Symbol Provider API (JavaScript/TypeScript)
- Tracks functions, methods, classes, and other AST symbols
- Falls back to line-based tracking for non-symbols
- No configuration needed - works automatically

**Supported Scenarios:**
- ✅ Cut/paste entire function → Comment follows
- ✅ Copy/paste function → Creates duplicate comment
- ✅ Add/delete lines → Comments shift automatically
- ✅ Rename function → Comment stays attached
- ✅ Move function 100+ lines → Still tracks it

**Technical Details:**
- Progressive retry strategy (waits for Symbol Provider)
- Confidence-based resolution (exact/moved/ambiguous)
- Real-time gutter icon updates
- CodeLens "Click to Open" follows code

---

### 3. Tag System
Organize comments by type with visual indicators:

- 🔵 **NOTE** - General information
- 🟠 **TODO** - Tasks to complete
- 🔴 **FIXME** - Bugs to fix
- 🟡 **QUESTION** - Questions to answer
- 🟣 **HACK** - Temporary workarounds
- ⚠️ **WARNING** - Important warnings
- ⭐ **STAR** - Bookmarks (gold)

**Usage:**
```
Type "TODO: Fix validation logic" in comment text
```

---

### 4. Side-by-Side View
View code and comments side-by-side with synchronized scrolling.

**Features:**
- Auto-opens `.comments` file beside source
- Bidirectional scroll sync
- Toggle sync on/off (`Ctrl+Alt+P T`)
- Percentage-based scroll algorithm

---

### 5. Visual Indicators

#### Gutter Icons
See comment locations at a glance - colored icons in the line number area.

#### Hover Previews
Hover over gutter icon to see comment preview without opening file.

#### CodeLens Integration
"Click to Open" links for quick navigation.

---

## Upcoming Features

### Range Comments (v2.0.6) - Coming November 2025
Comment entire code blocks (e.g., lines 1-10) instead of single lines.

**Example Use Case:**
```javascript
// Lines 1-25: Authentication middleware
// - Validates JWT tokens
// - Checks user permissions
// - Handles refresh tokens
```

---

### Dynamic Parameters (v2.1.0) - Coming Q1 2026
Comments that auto-update when code changes:

```json
{
  "text": "This ${componentType} has ${propCount} props",
  "params": {
    "componentType": "FormInput",
    "propCount": 5
  }
}
```

If you rename `FormInput` → `SearchBar`, comment updates automatically!

---

### AI Metadata (v2.1.0) - Coming Q1 2026
Rich metadata for AI training and code analysis:

```json
{
  "aiMeta": {
    "tokens": 45,
    "complexity": 3,
    "codeType": "function",
    "dependencies": ["react", "lodash"],
    "labels": ["authentication", "validation"]
  }
}
```

**Use Cases:**
- Train AI models on annotated code
- Track API costs (token estimation)
- Find complex code that needs review
- Generate training datasets

---

### Output Capture (v2.2.0) - Coming Q2 2026
Capture runtime values like a Jupyter notebook:

```json
{
  "output": {
    "value": {"status": 200, "data": {...}},
    "timestamp": "2026-02-15T10:30:00Z",
    "type": "object"
  }
}
```

**Use Cases:**
- Document real API responses
- Debugging (see values when bug occurred)
- Regression detection (compare outputs over time)
- Training data (real input/output pairs)

---

## Feature Comparison

| Feature | v0.1.0 (MVP) | v2.0.5 (AST) | v2.1.0 (Params) | v2.2.0 (Output) |
|---------|--------------|--------------|-----------------|-----------------|
| Basic comments | ✅ | ✅ | ✅ | ✅ |
| Tag system | ✅ | ✅ | ✅ | ✅ |
| Gutter icons | ✅ | ✅ | ✅ | ✅ |
| Scroll sync | ✅ | ✅ | ✅ | ✅ |
| AST tracking | ❌ | ✅ | ✅ | ✅ |
| Range comments | ❌ | ❌ | ✅ | ✅ |
| Dynamic params | ❌ | ❌ | ✅ | ✅ |
| AI metadata | ❌ | ❌ | ✅ | ✅ |
| Output capture | ❌ | ❌ | ❌ | ✅ |

---

## Configuration

### Settings
```json
{
  "pairedComments.defaultAuthor": "Your Name",
  "pairedComments.hideCommentFiles": true,
  "pairedComments.showFileBadges": true
}
```

### Keyboard Shortcuts
See [SHORTCUTS.md](SHORTCUTS.md) for complete reference.

---

## File Format Evolution

### v1.0 (MVP)
```json
{
  "version": "1.0",
  "comments": [
    {"id": "c1", "line": 10, "text": "...", "author": "..."}
  ]
}
```

### v2.0.5 (AST)
```json
{
  "version": "2.0.5",
  "ghostMarkers": [
    {
      "id": "gm-1",
      "line": 10,
      "lineHash": "...",
      "astAnchor": {
        "symbolPath": ["calculateTotal"],
        "symbolKind": "Function",
        "offset": 250
      }
    }
  ],
  "comments": [
    {"id": "c1", "ghostMarkerId": "gm-1", "text": "..."}
  ]
}
```

### v2.1.0 (Params + AI Metadata)
```json
{
  "version": "2.1.0",
  "ghostMarkers": [ ... ],
  "comments": [
    {
      "id": "c1",
      "ghostMarkerId": "gm-1",
      "text": "This ${funcName} has ${complexity} complexity",
      "params": {"funcName": "calculateTotal", "complexity": 3},
      "aiMeta": {"tokens": 45, "labels": ["math", "utility"]}
    }
  ]
}
```

---

## Frequently Asked Questions

### Do comments survive refactoring?
✅ Yes! AST-based tracking (v2.0.5+) survives cut/paste, rename, and code movement.

### What languages are supported?
- **AST tracking:** JavaScript, TypeScript (v2.0.5)
- **Line-based fallback:** All languages
- **Future:** Python, Go, Rust, Java, C++ (v2.0.7+)

### Can I use this with Git?
✅ Yes! `.comments` files are plain JSON, perfect for version control.

**Recommendation:** Commit `.comments` files alongside source code.

### What about merge conflicts?
`.comments` files can have merge conflicts just like source files. Resolve them the same way.

**Future:** Conflict resolution UI (v2.0.7+)

### Can I share comments with my team?
✅ Yes! `.comments` files work like any other file:
- Commit to Git
- Share via Slack/email
- Export to Markdown/JSON/CSV (v0.4.0+)

---

## Related Documentation

- [Getting Started Guide](guides/getting-started.md) - First-time user guide
- [Keyboard Shortcuts](SHORTCUTS.md) - Complete command reference
- [Architecture](ARCHITECTURE.md) - Technical details
- [Roadmap](ROADMAP.md) - Future features
