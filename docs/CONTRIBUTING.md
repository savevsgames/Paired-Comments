# Contributing to Paired Comments

Thank you for your interest in contributing! This guide will help you get started.

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- VS Code installed
- Git installed
- Basic TypeScript knowledge

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/paired-comments.git
cd paired-comments

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm run test:unit
```

### Launch Extension Development Host
1. Open project in VS Code
2. Press `F5` (or Run > Start Debugging)
3. New VS Code window opens with extension loaded
4. Test your changes!

---

## Development Workflow

### 1. Pick a Task
- Check [GitHub Issues](https://github.com/yourusername/paired-comments/issues)
- Look for `good-first-issue` label
- Or propose a new feature (open an issue first!)

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Changes
- Write code
- Follow TypeScript strict mode (no `any` types!)
- Add tests (see [Testing Guide](testing/QUICKSTART.md))
- Update documentation if needed

### 4. Test Your Changes
```bash
# Run unit tests
npm run test:unit

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format
```

### 5. Commit
```bash
git add .
git commit -m "feat: add range comment support"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `test:` Adding tests
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Performance improvement
- `chore:` Maintenance tasks

### 6. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

---

## Code Style

### TypeScript
- **Strict mode:** All strict checks enabled
- **No `any`:** Use explicit types
- **Explicit return types:** Required for functions
- **Naming conventions:**
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: prefix with `_` (e.g., `_cache`)

### Example
```typescript
// ✅ Good
export class GhostMarkerManager {
  private _markers: Map<string, GhostMarker[]> = new Map();

  public async loadMarkers(uri: vscode.Uri): Promise<void> {
    const data = await this._loadFromFile(uri);
    this._markers.set(uri.toString(), data);
  }

  private async _loadFromFile(uri: vscode.Uri): Promise<GhostMarker[]> {
    // Implementation
    return [];
  }
}

// ❌ Bad
class ghostMarkerManager {  // Wrong casing
  markers: any;  // No 'any' types

  loadMarkers(uri) {  // Missing types
    // Missing return type
  }
}
```

---

## Testing

### Unit Tests
Every new feature needs unit tests.

**Location:** `test/unit/`

**Framework:** Mocha + Chai

**Example:**
```typescript
import { expect } from 'chai';
import { hashLine } from '../../src/utils/contentAnchor';

describe('MyFeature', () => {
  it('should do something', () => {
    const result = hashLine('test');
    expect(result).to.be.a('string');
    expect(result.length).to.be.greaterThan(0);
  });

  it('should handle edge cases', () => {
    const result = hashLine('');
    expect(result).to.be.a('string');
  });
});
```

**Run tests:**
```bash
npm run test:unit
npm run test:watch  # Watch mode
npm run test:coverage  # With coverage
```

---

## Documentation

### When to Update Docs
- Adding a new feature → Update [FEATURES.md](FEATURES.md)
- Changing architecture → Update [ARCHITECTURE.md](ARCHITECTURE.md)
- Adding a command → Update [SHORTCUTS.md](SHORTCUTS.md)
- Completing a milestone → Update [ROADMAP.md](ROADMAP.md)

### Documentation Style
- **Be concise:** Users want quick answers
- **Use examples:** Show, don't just tell
- **Use diagrams:** ASCII art is fine!
- **Link related docs:** Help users find more info

---

## Pull Request Guidelines

### Before Submitting
- [ ] Tests pass (`npm run test:unit`)
- [ ] Linter passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] TypeScript compiles with zero errors (`npm run compile`)
- [ ] You tested manually in Extension Development Host
- [ ] Documentation is updated

### PR Description Template
```markdown
## What does this PR do?
[Brief description]

## Why is this needed?
[Explain the problem this solves]

## How was this tested?
- [ ] Unit tests added
- [ ] Manually tested in Extension Development Host
- [ ] Tested on [Windows/Mac/Linux]

## Screenshots (if applicable)
[Add screenshots or GIFs]

## Related Issues
Fixes #123
```

### Review Process
1. Maintainer reviews your PR
2. You address feedback
3. PR is approved and merged
4. Your contribution is in the next release! 🎉

---

## Project Structure

```
paired-comments/
├── src/                     # Source code
│   ├── extension.ts         # Extension entry point
│   ├── types.ts             # Type definitions
│   ├── core/                # Core managers
│   │   ├── ASTAnchorManager.ts
│   │   ├── GhostMarkerManager.ts
│   │   └── CommentManager.ts
│   ├── ui/                  # UI components
│   │   ├── DecorationManager.ts
│   │   └── CodeLensProvider.ts
│   ├── commands/            # Command handlers
│   └── utils/               # Utilities
│
├── test/                    # Tests
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── suite/               # E2E tests
│
├── documentation/           # Documentation (you are here!)
│   ├── README.md
│   ├── ROADMAP.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   └── testing/
│
└── package.json             # Extension manifest
```

---

## Common Tasks

### Add a New Command
1. Add command to `package.json` → `contributes.commands`
2. Add keybinding to `package.json` → `contributes.keybindings`
3. Implement command in `src/commands/`
4. Register command in `src/extension.ts`
5. Add to [SHORTCUTS.md](SHORTCUTS.md)

### Add a New Feature
1. Open an issue to discuss (get feedback early!)
2. Update [ROADMAP.md](ROADMAP.md) if it's a major feature
3. Implement feature (with tests!)
4. Update [FEATURES.md](FEATURES.md)
5. Create PR

### Fix a Bug
1. Create a failing test that reproduces the bug
2. Fix the bug
3. Verify test now passes
4. Create PR with `fix:` prefix

---

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/yourusername/paired-comments/discussions)
- **Bug report?** Open a [GitHub Issue](https://github.com/yourusername/paired-comments/issues)
- **Want to chat?** (Add Discord/Slack link if available)

---

## Code of Conduct

Be respectful and inclusive. This is a welcoming community!

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉
