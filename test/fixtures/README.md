# Test Fixtures

> **MVP Note (2025-10-19):** Legacy migration removed. MVP uses v2.1.0 format only.
> Legacy fixture files kept for historical reference but are no longer used in tests.

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
- Demonstrates v2.1.0 schema with `endLine` fields

**Use for:**
- Manual testing of range comments
- Testing AST tracking
- Testing all gutter icon types
- Demonstrating the extension to users

---

### **legacy-v1.0.comments** ⚠️ DEPRECATED
Legacy file format from v1.0 (no ghost markers):
- Simple comment structure
- No AST tracking
- No range support

**Status:** DEPRECATED - Migration removed in MVP
**Kept for:** Historical reference only

---

### **legacy-v2.0.comments** ⚠️ DEPRECATED
Legacy file format from v2.0 (ghost markers, no AST):
- Has ghost markers
- No AST anchors (added in v2.0.5)
- No range support (added in v2.0.6)

**Status:** DEPRECATED - Migration removed in MVP
**Kept for:** Historical reference only

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
assert.equal(commentFile.version, '2.1.0');
assert.equal(commentFile.ghostMarkers.length, 9);
assert.equal(commentFile.comments.length, 9);
```

### Migration Testing ⚠️ REMOVED
```typescript
// MIGRATION REMOVED IN MVP - Legacy code deleted
// MVP only supports v2.1.0 format
// Migration support can be added post-MVP if needed
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
- Keep legacy files for historical reference only
- Update this README with changes
- **Note:** No migration logic in MVP - all files must be v2.1.0 format

---

Last Updated: October 19, 2025 (v2.1.0 MVP - De-migration complete)
