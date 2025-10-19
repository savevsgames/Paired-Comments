# Scripts

Utility scripts for development and testing.

## Available Scripts

### `cleanup-old-backups.js`

Removes backup files created with the old buggy naming pattern.

**What it does:**
- Deletes files matching: `filename.js.comments.backup-timestamp.comments` (old buggy pattern)
- Keeps files matching: `filename.js.backup-timestamp.comments` (new correct pattern)

**Usage:**
```bash
npm run cleanup:old-backups
```

**When to use:**
- After upgrading from v2.1.0 to v2.1.1+ (backup naming bug was fixed)
- When you see double `.comments` extensions in backup files

---

### `reset-test-samples.js`

Resets the `test-samples/` directory to a clean state with fresh test data.

**What it does:**
- Deletes ALL `.comments` files in `test-samples/`
- Deletes ALL backup files
- Creates fresh `.comments` files with predefined test comments

**Usage:**
```bash
npm run test:reset-samples
```

**When to use:**
- Before starting a new manual testing session (F5)
- When test data becomes corrupted or messy
- When you want a clean slate for testing

**Test data created:**
- `ast-test.js.comments` - 3 comments (NOTE, TODO, STAR)
  - Line 13: calculateTotal function
  - Line 18: formatCurrency function
  - Line 30: addItem method
- `ghost-markers-demo.js.comments` - 1 comment (NOTE)
  - Line 5: Demo comment

---

## Development Workflow

**Before manual testing:**
```bash
npm run test:reset-samples  # Clean test environment
npm run compile             # Compile TypeScript
# Press F5 to launch Extension Development Host
```

**After upgrading to v2.1.1+:**
```bash
npm run cleanup:old-backups  # Remove old malformed backups
```

---

## Related Scripts

See `package.json` for all available npm scripts:
- `test:reset-manual` - Reset manual test files (in `test/manual/`)
- `test:reset-samples` - Reset test samples (in `test-samples/`)
- `cleanup:old-backups` - Clean up old backup files
