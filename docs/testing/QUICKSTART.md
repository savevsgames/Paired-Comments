# Testing Quickstart Guide

**Get up and running with tests in 5 minutes!**

---

## 🚀 Installation

```bash
# Install all testing dependencies
npm install

# Verify installation
npm run test:unit -- --version  # Should show Mocha version
```

---

## 📝 Running Tests

### Unit Tests (Fast - Recommended During Development)
```bash
# Run all unit tests
npm run test:unit

# Watch mode (re-runs on file save)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests (Slow - Requires VS Code)
```bash
npm run test:e2e
```

### All Tests
```bash
npm test  # Runs unit + E2E
npm run test:all  # Runs unit + integration + E2E
```

---

## ✍️ Writing Your First Test

### Unit Test Example

Create `test/unit/myFeature.test.ts`:

```typescript
import { expect } from 'chai';
import { hashLine } from '../../src/utils/contentAnchor';

describe('My Feature', () => {
  it('should do something', () => {
    const result = hashLine('test');
    expect(result).to.be.a('string');
  });
});
```

Run it:
```bash
npm run test:unit
```

### E2E Test Example

Create `test/suite/myFeature.test.ts`:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Feature E2E', () => {
  test('Extension activates', async () => {
    const ext = vscode.extensions.getExtension('paired-comments.paired-comments');
    await ext!.activate();
    assert.ok(ext!.isActive);
  });
});
```

Run it:
```bash
npm run test:e2e
```

---

## 🐛 Debugging Tests

### VS Code Debugger

1. Set a breakpoint in your test file
2. Press `F5` (or Run > Start Debugging)
3. Select **"Extension Tests"** or **"Unit Tests"** from dropdown
4. Test will pause at breakpoint

### Launch Configurations

Already configured in `.vscode/launch.json`:
- **Extension Tests** - Debug E2E tests
- **Unit Tests** - Debug unit tests with Mocha

---

## 📊 Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html  # macOS
start coverage/index.html  # Windows
xdg-open coverage/index.html  # Linux
```

Coverage shows:
- **Lines** - Which lines were executed
- **Functions** - Which functions were called
- **Branches** - Which if/else paths were taken
- **Statements** - Which statements ran

---

##  CI/CD (GitHub Actions)

Tests run automatically on:
- ✅ Every push to `main` or `dev`
- ✅ Every pull request

View results: **Actions** tab on GitHub

---

## 📋 Quick Reference

| Command | What It Does | Speed |
|---------|-------------|-------|
| `npm run test:unit` | Run unit tests | ⚡ Fast (milliseconds) |
| `npm run test:integration` | Run integration tests | 🐢 Medium (seconds) |
| `npm run test:e2e` | Run E2E tests | 🐌 Slow (10-30 seconds) |
| `npm run test:watch` | Auto-run on save | ⚡ Fast |
| `npm run test:coverage` | Coverage report | ⚡ Fast |
| `npm test` | Unit + E2E | 🐢 Medium |

---

## 🎯 Best Practices

1. **Write unit tests first** - They're fastest
2. **Use watch mode during development** - Instant feedback
3. **Add E2E tests for critical flows** - Ghost marker tracking, etc.
4. **Check coverage before committing** - Aim for >60%
5. **Run full suite before pushing** - `npm test`

---

## 🆘 Troubleshooting

### "Cannot find module 'chai'"
```bash
npm install  # Make sure all deps are installed
```

### "Extension test failed to run"
```bash
npm run compile  # Compile TypeScript first
```

### Tests timeout
```typescript
// Increase timeout in test file
it('slow test', async function() {
  this.timeout(10000); // 10 seconds
  // ...
});
```

### VS Code not launching for E2E tests
- Make sure VS Code is closed
- Try: `npm run clean && npm run compile && npm run test:e2e`

---

## 📚 Next Steps

- Read [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Full strategy
- See example tests in `test/unit/contentAnchor.test.ts`
- See E2E test in `test/suite/activation.test.ts`

---

**Happy Testing! 🎉**
