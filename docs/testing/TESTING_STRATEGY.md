# Testing Strategy - Microsoft/GitHub Ready

**Version:** 1.0
**Last Updated:** October 18, 2025
**Status:** Foundation Phase

---

## 🎯 Strategic Goals

### Why This Matters
If Microsoft/GitHub acquires Paired Comments, they will **demand**:
1. ✅ **Automated test suite** - Can't manually test every PR
2. ✅ **CI/CD integration** - Tests run on every commit
3. ✅ **Regression prevention** - Catch bugs before they ship
4. ✅ **Documentation via tests** - Tests show how features work
5. ✅ **Confidence in refactoring** - Safe to improve code

### Our Approach
- ✅ **Professional foundation NOW** - Infrastructure that MS expects
- ✅ **Minimum viable coverage** - Critical paths tested, not 100%
- ✅ **Easy to expand** - Add tests as we build features
- ✅ **CI/CD ready** - GitHub Actions integration from day 1

**Philosophy:** "Test the foundation, expand as we grow."

---

## 📊 Testing Pyramid (Microsoft Standard)

```
        /\
       /E2E\         ← 10-15% (Critical user flows)
      /------\
     / Integ \       ← 25-30% (Module interactions)
    /----------\
   /    Unit    \    ← 55-65% (Pure logic, fast)
  /--------------\
```

### Why This Ratio?
- **Unit tests** are fast (milliseconds) - run on every save
- **Integration tests** catch module issues - run on every commit
- **E2E tests** are slow (seconds) - run before release

Microsoft follows this pyramid for VS Code, TypeScript, GitHub, etc.

---

## 🏗️ Test Infrastructure

### Technology Stack (Microsoft-Approved)

| Layer | Framework | Why |
|-------|-----------|-----|
| **Unit Tests** | Mocha + Chai | VS Code's official choice |
| **Integration Tests** | Mocha + Sinon (mocks) | Standard for Node.js |
| **E2E Tests** | @vscode/test-electron | Official VS Code testing |
| **Coverage** | nyc (Istanbul) | Industry standard |
| **CI/CD** | GitHub Actions | Free, MS-owned |
| **Assertions** | Chai (expect/assert) | Readable, popular |

**Note:** We're using the EXACT same stack as VS Code itself. Microsoft can't complain.

### File Structure

```
paired-comments/
├── test/
│   ├── suite/                    # E2E tests (VS Code runner)
│   │   ├── index.ts              # Test suite loader
│   │   ├── activation.test.ts    # Extension activation
│   │   ├── ghostMarker.test.ts   # Ghost marker E2E
│   │   └── commands.test.ts      # Command execution
│   │
│   ├── integration/              # Integration tests
│   │   ├── commentManager.test.ts
│   │   └── ghostMarkerManager.test.ts
│   │
│   ├── unit/                     # Unit tests
│   │   ├── contentAnchor.test.ts
│   │   └── astAnchor.test.ts
│   │
│   ├── fixtures/                 # Test data
│   │   ├── sample.js
│   │   └── sample.js.comments
│   │
│   └── runTest.ts                # E2E test runner
│
├── .github/
│   └── workflows/
│       └── test.yml              # CI/CD pipeline
│
├── .nycrc.json                   # Coverage config
└── package.json                  # Test scripts
```

---

## 🚀 Phase 1: Foundation (THIS WEEK)

**Goal:** Set up infrastructure + 3-5 smoke tests to prove it works

### Tasks

#### 1. Install Dependencies
```bash
npm install --save-dev @vscode/test-electron mocha @types/mocha chai @types/chai sinon @types/sinon nyc
```

#### 2. Create Test Scripts (`package.json`)
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "mocha --require ts-node/register 'test/unit/**/*.test.ts'",
    "test:integration": "mocha --require ts-node/register 'test/integration/**/*.test.ts'",
    "test:e2e": "node ./out/test/runTest.js",
    "test:watch": "mocha --require ts-node/register --watch 'test/unit/**/*.test.ts'",
    "test:coverage": "nyc npm run test:unit",
    "pretest": "npm run compile"
  }
}
```

#### 3. Write 5 Foundation Tests

**Unit Test Example** (test/unit/contentAnchor.test.ts):
```typescript
import { expect } from 'chai';
import { hashLine, getLineText } from '../../src/utils/contentAnchor';

describe('contentAnchor utilities', () => {
  describe('hashLine', () => {
    it('produces consistent hashes for same input', () => {
      const line = 'function calculateTotal(items) {';
      expect(hashLine(line)).to.equal(hashLine(line));
    });

    it('produces different hashes for different input', () => {
      const line1 = 'function foo() {';
      const line2 = 'function bar() {';
      expect(hashLine(line1)).to.not.equal(hashLine(line2));
    });

    it('handles empty strings', () => {
      expect(hashLine('')).to.be.a('string');
    });
  });
});
```

**E2E Test Example** (test/suite/activation.test.ts):
```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation', () => {
  test('Extension activates successfully', async () => {
    const ext = vscode.extensions.getExtension('your-publisher.paired-comments');
    assert.ok(ext, 'Extension should be installed');

    await ext!.activate();
    assert.ok(ext!.isActive, 'Extension should be active');
  });

  test('Commands are registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('pairedComments.addComment'));
    assert.ok(commands.includes('pairedComments.openPairedView'));
  });
});
```

#### 4. Set Up GitHub Actions (`.github/workflows/test.yml`)
```yaml
name: Tests

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests (Ubuntu only)
      if: runner.os == 'Linux'
      run: xvfb-run -a npm run test:e2e

    - name: Upload coverage
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '20.x'
      uses: codecov/codecov-action@v3
```

#### 5. Coverage Config (`.nycrc.json`)
```json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "include": ["src/**/*.ts"],
  "exclude": ["src/test/**", "**/*.d.ts"],
  "reporter": ["html", "lcov", "text"],
  "check-coverage": false,
  "report-dir": "coverage"
}
```

---

## 📋 Minimum Viable Test Coverage

### Phase 1: Foundation (5-10 tests) - THIS WEEK

**Unit Tests (3-5 tests):**
- ✅ `hashLine()` - consistent hashing
- ✅ `getLineText()` - handles edge cases (blank lines, out of bounds)
- ✅ Ghost marker duplicate detection logic

**Integration Tests (1-2 tests):**
- ✅ CommentManager.addComment() creates ghost marker
- ✅ FileSystemManager saves/loads `.comments` file

**E2E Tests (1-2 tests):**
- ✅ Extension activates without errors
- ✅ Commands are registered
- ✅ Adding a comment shows gutter icon (smoke test)

**Time Investment:** 4-6 hours total

---

## 📈 Expansion Plan (As We Build Features)

### Phase 2: Core Features (v2.0.6 - Range Comments)

**When adding range comments, also add:**
- Unit: Range validation logic
- Integration: Range ghost marker creation
- E2E: Selecting lines 1-10 → add comment → verify range highlighted

**Test Growth:** +5-8 tests

### Phase 3: Params & AI Metadata (v2.1)

**When adding params/aiMeta, also add:**
- Unit: Param interpolation (`${functionName}`)
- Unit: Token estimation accuracy
- Integration: Hash tree change detection
- E2E: Param auto-updates when code changes

**Test Growth:** +10-15 tests

### Phase 4: Output Capture (v2.2)

**When adding output capture, also add:**
- Unit: Template engine
- Integration: Debug adapter integration
- E2E: Capture output during debug session

**Test Growth:** +8-12 tests

---

## 🎯 Critical User Flows (E2E Priority List)

These are the tests Microsoft will care most about:

### Must Have (v2.0.6)
1. ✅ **Extension activates** - No startup crashes
2. ✅ **Add comment** - User can create comment
3. ✅ **Gutter icon appears** - Visual feedback works
4. ✅ **Cut/paste tracking** - Ghost marker moves with code
5. ✅ **Copy/paste duplication** - Creates new marker

### Should Have (v2.1)
6. ✅ **Param interpolation** - `${var}` updates when code changes
7. ✅ **Tag system** - TODO shows orange, FIXME shows red
8. ✅ **CodeLens navigation** - "Click to Open" works

### Nice to Have (v2.2+)
9. ✅ **Output capture** - Can capture debug values
10. ✅ **Range comments** - Multi-line comments work
11. ✅ **Search** - Find comments across workspace

---

## 🏆 Success Metrics

### Microsoft Acquisition Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Automated test suite** | ✅ Setup | Mocha + VS Code runner |
| **CI/CD integration** | ✅ Setup | GitHub Actions |
| **Multi-platform tests** | ✅ Setup | Ubuntu, Windows, macOS |
| **Test coverage reporting** | ✅ Setup | nyc + Codecov |
| **Regression prevention** | 🚧 Growing | Add tests per feature |
| **Performance benchmarks** | 📋 Planned | v2.1+ |
| **Security tests** | 📋 Planned | v2.1+ (privacy checks) |

### Coverage Goals

| Phase | Unit | Integration | E2E | Total Tests |
|-------|------|-------------|-----|-------------|
| **v2.0.6** (Now) | 60% | 40% | 5 | ~15 tests |
| **v2.1** (Params) | 70% | 50% | 10 | ~40 tests |
| **v2.2** (Output) | 75% | 60% | 15 | ~65 tests |
| **v3.0** (Stable) | 80% | 70% | 25 | ~100 tests |

**Industry Standard:** 70-80% coverage for production code (Microsoft's bar)

---

## 🛠️ Developer Workflow

### Writing Tests (TDD Optional)

**1. Add Feature**
```bash
# Write feature code
vim src/core/RangeCommentManager.ts

# Write tests (can be before or after implementation)
vim test/unit/rangeCommentManager.test.ts
```

**2. Run Tests Locally**
```bash
# Fast feedback (unit tests only)
npm run test:unit

# Full suite (before committing)
npm test

# Watch mode (during development)
npm run test:watch
```

**3. Check Coverage**
```bash
npm run test:coverage
# Opens HTML report at coverage/index.html
```

**4. Commit**
```bash
git add .
git commit -m "feat: add range comments support"
git push
# GitHub Actions runs tests automatically
```

### Debugging Tests

**VS Code Launch Config** (.vscode/launch.json):
```json
{
  "configurations": [
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
      ],
      "outFiles": ["${workspaceFolder}/out/test/**/*.js"]
    },
    {
      "name": "Unit Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
      "args": [
        "--require", "ts-node/register",
        "--timeout", "999999",
        "--colors",
        "${workspaceFolder}/test/unit/**/*.test.ts"
      ],
      "internalConsoleOptions": "openOnSessionStart"
    }
  ]
}
```

---

## 📚 Test Documentation Standards

### Test Naming Convention

```typescript
// ✅ GOOD - Describes behavior, not implementation
describe('Ghost Marker Manager', () => {
  it('moves marker when function is cut and pasted', () => {});
  it('creates duplicate marker when function is copied', () => {});
  it('falls back to line-based tracking when AST unavailable', () => {});
});

// ❌ BAD - Too implementation-focused
describe('GhostMarkerManager', () => {
  it('calls verifyMarker method', () => {});
  it('sets line property to 119', () => {});
});
```

### Test Structure (AAA Pattern)

```typescript
it('creates duplicate marker when function is copied', async () => {
  // ARRANGE - Set up test conditions
  const doc = await openTestFile('ast-test.js');
  await addCommentAtLine(13);

  // ACT - Perform the action
  await copyLines(13, 15);
  await pasteAtLine(119);

  // ASSERT - Verify expected outcome
  const markers = getGhostMarkers(doc.uri);
  expect(markers).to.have.lengthOf(2);
  expect(markers[0].line).to.equal(13);
  expect(markers[1].line).to.equal(119);
});
```

---

## 🔒 Quality Gates

### PR Merge Requirements

Before merging any PR:
- ✅ All tests pass (unit + integration + E2E)
- ✅ No decrease in test coverage (enforced by CI)
- ✅ New features include tests
- ✅ Bug fixes include regression tests

### Release Requirements

Before releasing any version:
- ✅ Full test suite passes on all platforms (Ubuntu, Windows, macOS)
- ✅ Manual smoke testing complete
- ✅ Performance benchmarks meet targets
- ✅ No known critical bugs

---

## 🎬 Getting Started (Next Steps)

### Immediate (This Week)
1. **Install dependencies** (5 min)
   ```bash
   npm install --save-dev @vscode/test-electron mocha @types/mocha chai @types/chai nyc
   ```

2. **Create test structure** (15 min)
   ```bash
   mkdir -p test/{suite,integration,unit,fixtures}
   ```

3. **Write 3 unit tests** (1 hour)
   - hashLine consistency
   - getLineText edge cases
   - Duplicate detection

4. **Write 1 E2E test** (1 hour)
   - Extension activation smoke test

5. **Set up GitHub Actions** (30 min)
   - Create `.github/workflows/test.yml`

6. **Verify CI works** (15 min)
   - Commit and push
   - Watch GitHub Actions run

**Total Time:** ~3-4 hours

### Next Week (As You Build Features)
- Add integration test for CommentManager
- Add E2E test for ghost marker tracking
- Expand coverage to 60%+

---

## 📊 Example: What Microsoft Looks For

When Microsoft reviews code, they check:

### ✅ Green Flags (What We're Building)
- Automated test suite with CI/CD
- Multi-platform testing (Linux, Windows, macOS)
- Test coverage reporting (Codecov badges)
- Clear test structure (unit/integration/e2e)
- Tests run fast (<2 min for full suite)
- Regression tests for every bug fix
- Documentation via tests (tests show how to use APIs)

### ❌ Red Flags (What We're Avoiding)
- No tests at all
- Manual testing only
- Tests that don't run in CI
- Flaky tests (pass sometimes, fail others)
- Tests take >10 minutes
- No coverage reporting
- Tests tightly coupled to implementation (brittle)

---

## 🎯 Summary

**What We're Building:**
- ✅ Professional test infrastructure (Mocha, nyc, GitHub Actions)
- ✅ Minimum viable coverage (5-10 tests to start)
- ✅ Easy expansion (add tests as features grow)
- ✅ Microsoft-ready quality gates

**What We're NOT Doing (Yet):**
- ❌ 100% test coverage (overkill for now)
- ❌ Performance benchmarks (v2.1+)
- ❌ Security penetration tests (v2.1+)
- ❌ Load testing (not needed for single-user extension)

**Philosophy:**
> "Build the foundation Microsoft expects, expand as we grow features, ship with confidence."

---

**Document Status:** ✅ COMPLETE
**Next Review:** After Phase 1 tests are written
**Owner:** Development Team
