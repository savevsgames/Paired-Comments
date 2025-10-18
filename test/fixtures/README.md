# Test Fixtures

This directory contains test files for manual and automated testing of the Paired Comments extension.

## Files

### **sample.js** + **sample.js.comments**
Comprehensive test file covering various JavaScript patterns:
- Top-level functions
- Arrow functions
- Classes with methods
- Nested functions with closures
- Async/await functions
- Generator functions
- Object literals with methods
- Complex nested structures

**Comments file includes:**
- Single-line comments (all tag types: TODO, NOTE, FIXME, STAR, QUESTION, HACK, WARNING)
- Range comments (lines 6-13, 23-64, 79-90, 127-180)
- Ghost markers with AST anchors
- Demonstrates v2.0.6 schema with `endLine` fields

**Use for:**
- Manual testing of range comments
- Testing AST tracking
- Testing all gutter icon types
- Demonstrating the extension to users

---

### **legacy-v1.0.comments**
Legacy file format from v1.0 (no ghost markers):
- Simple comment structure
- No AST tracking
- No range support

**Use for:**
- Testing migration from v1.0 → v2.0.6
- Verifying backwards compatibility
- Testing auto-upgrade functionality

---

### **legacy-v2.0.comments**
Legacy file format from v2.0 (ghost markers, no AST):
- Has ghost markers
- No AST anchors (added in v2.0.5)
- No range support (added in v2.0.6)

**Use for:**
- Testing migration from v2.0 → v2.0.6
- Testing AST anchor addition
- Testing range comment migration

---

### **corrupt.comments**
Intentionally malformed JSON file:
- Invalid JSON syntax (line breaks, missing quotes)
- Incomplete structure
- Missing required fields

**Use for:**
- Testing error handling for corrupt files
- Testing file validation
- Testing backup/restore functionality
- Verifying user-friendly error messages

---

### **large.comments**
Performance testing file with 10 comments (scalable pattern):
- Mix of single-line and range comments
- All tag types represented
- Demonstrates file format at moderate scale

**Use for:**
- Performance testing
- Testing with multiple decorations
- Testing UI responsiveness
- Can be duplicated/expanded for larger scale tests (100+ comments)

---

## Usage Examples

### Manual Testing
1. Open `sample.js` in VS Code
2. Activate the extension
3. Verify gutter icons appear at correct lines
4. Test `Ctrl+Alt+P S` for single-line comments
5. Test `Ctrl+Alt+P R` for range comments
6. Cut/paste functions and verify icons move

### Automated Testing
```typescript
// Load fixture
const fixturePath = path.join(__dirname, 'fixtures', 'sample.js.comments');
const commentFile = await fileSystemManager.readCommentFile(vscode.Uri.file(fixturePath));

// Verify structure
assert.equal(commentFile.version, '2.0.6');
assert.equal(commentFile.ghostMarkers.length, 9);
assert.equal(commentFile.comments.length, 9);
```

### Migration Testing
```typescript
// Test v1.0 → v2.0.6 migration
const legacyPath = path.join(__dirname, 'fixtures', 'legacy-v1.0.comments');
const migrated = await fileSystemManager.migrateToLatestVersion(legacyData, sourceUri);
assert.equal(migrated.version, '2.0.6');
assert.ok(migrated.ghostMarkers);
```

### Error Handling Testing
```typescript
// Test corrupt file handling
const corruptPath = path.join(__dirname, 'fixtures', 'corrupt.comments');
try {
  await fileSystemManager.readCommentFile(vscode.Uri.file(corruptPath));
  assert.fail('Should have thrown error');
} catch (error) {
  assert.ok(error instanceof FileIOError);
}
```

---

## Expanding Fixtures

To add more test scenarios:

1. **Add new pattern to sample.js** (e.g., TypeScript, complex generics)
2. **Create corresponding ghost marker** in sample.js.comments
3. **Test manually** to verify behavior
4. **Write automated test** using the new fixture

---

## Maintenance

When updating file format versions:
- Update `sample.js.comments` to latest version
- Keep legacy files unchanged (they test migration)
- Add new legacy file for previous version
- Update this README with changes

---

Last Updated: October 18, 2025 (v2.0.6)
