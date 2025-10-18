/**
 * Integration tests for FileSystemManager
 * These tests run in a real VS Code instance with actual file system
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileSystemManager } from '../../src/io/FileSystemManager';
import { ASTAnchorManager } from '../../src/core/ASTAnchorManager';
import { CommentFile, COMMENT_FILE_EXTENSION } from '../../src/types';

suite('FileSystemManager Integration Tests', () => {
  let tempDir: string;
  let fileSystemManager: FileSystemManager;
  let testFileUri: vscode.Uri;

  suiteSetup(() => {
    // Create temp directory for test files
    tempDir = path.join(__dirname, '../../../test-output');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  setup(() => {
    // Create a test file
    const testFileName = `test-${Date.now()}.ts`;
    const testFilePath = path.join(tempDir, testFileName);
    testFileUri = vscode.Uri.file(testFilePath);

    // Write test content
    fs.writeFileSync(testFilePath, 'console.log("test");', 'utf8');

    // Initialize manager
    const astManager = new ASTAnchorManager();
    fileSystemManager = new FileSystemManager(astManager);
  });

  teardown(() => {
    // Clean up test files
    try {
      if (fs.existsSync(testFileUri.fsPath)) {
        fs.unlinkSync(testFileUri.fsPath);
      }
      const commentsFile = testFileUri.fsPath + COMMENT_FILE_EXTENSION;
      if (fs.existsSync(commentsFile)) {
        fs.unlinkSync(commentsFile);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  });

  suiteTeardown(() => {
    // Clean up temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error('Suite cleanup error:', err);
    }
  });

  test('should generate correct comment file URI', () => {
    const commentUri = fileSystemManager.getCommentFileUri(testFileUri);
    
    assert.strictEqual(
      commentUri.fsPath,
      testFileUri.fsPath + COMMENT_FILE_EXTENSION,
      'Comment file should have .comments extension'
    );
  });

  test('should detect comment files', () => {
    const sourceUri = vscode.Uri.file('/test/file.ts');
    const commentUri = vscode.Uri.file('/test/file.ts.comments');
    
    assert.strictEqual(fileSystemManager.isCommentFile(sourceUri), false);
    assert.strictEqual(fileSystemManager.isCommentFile(commentUri), true);
  });

  test('should check if comment file exists', async () => {
    // Initially should not exist
    const existsBefore = await fileSystemManager.commentFileExists(testFileUri);
    assert.strictEqual(existsBefore, false, 'Comment file should not exist initially');

    // Create the file
    const emptyFile = await fileSystemManager.createEmptyCommentFile(testFileUri);
    await fileSystemManager.writeCommentFile(testFileUri, emptyFile);

    // Now should exist
    const existsAfter = await fileSystemManager.commentFileExists(testFileUri);
    assert.strictEqual(existsAfter, true, 'Comment file should exist after creation');
  });

  test('should create empty comment file', async () => {
    const emptyFile = await fileSystemManager.createEmptyCommentFile(testFileUri);

    assert.ok(emptyFile.version.match(/^2\.\d+\.\d+$/), 'Should have v2.x version');
    assert.strictEqual(emptyFile.comments.length, 0, 'Should have no comments');
    assert.ok(Array.isArray(emptyFile.ghostMarkers), 'Should have ghostMarkers array');
    assert.strictEqual(emptyFile.ghostMarkers?.length, 0, 'Should have no ghost markers');
  });

  test('should write comment file to disk', async () => {
    const commentFile: CommentFile = {
      file: path.basename(testFileUri.fsPath),
      version: '2.0.6',
      comments: [
        {
          id: 'test-id',
          line: 1,
          startLine: 1,
          text: 'Test comment',
          author: 'Test',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tag: null
        }
      ],
      ghostMarkers: []
    };

    await fileSystemManager.writeCommentFile(testFileUri, commentFile);

    // Verify file was written
    const commentPath = testFileUri.fsPath + COMMENT_FILE_EXTENSION;
    assert.ok(fs.existsSync(commentPath), 'Comment file should be written to disk');

    // Verify content
    const content = fs.readFileSync(commentPath, 'utf8');
    const parsed = JSON.parse(content);
    assert.ok(parsed.version.match(/^2\.\d+\.\d+$/), 'Should have v2.x version');
    assert.strictEqual(parsed.comments.length, 1);
    assert.strictEqual(parsed.comments[0].id, 'test-id');
  });

  test('should read comment file from disk', async () => {
    // Create and write a comment file
    const commentFile: CommentFile = {
      file: path.basename(testFileUri.fsPath),
      version: '2.0.6',
      comments: [
        {
          id: 'read-test',
          line: 5,
          startLine: 5,
          text: 'Test reading',
          author: 'Reader',
          created: '2025-01-01T00:00:00.000Z',
          updated: '2025-01-01T00:00:00.000Z',
          tag: 'NOTE'
        }
      ],
      ghostMarkers: []
    };

    await fileSystemManager.writeCommentFile(testFileUri, commentFile);

    // Read it back
    const readFile = await fileSystemManager.readCommentFile(testFileUri);

    assert.ok(readFile, 'Should read file successfully');
    assert.ok(readFile?.version.match(/^2\.\d+\.\d+$/), 'Should have v2.x version');
    assert.strictEqual(readFile?.comments.length, 1);
    assert.strictEqual(readFile?.comments[0]?.id, 'read-test');
    assert.strictEqual(readFile?.comments[0]?.tag, 'NOTE');
  });

  test('should return null when reading nonexistent file', async () => {
    const nonexistentUri = vscode.Uri.file(path.join(tempDir, 'nonexistent.ts'));
    const result = await fileSystemManager.readCommentFile(nonexistentUri);

    assert.strictEqual(result, null, 'Should return null for nonexistent file');
  });

  test('should handle JSON with proper formatting', async () => {
    const commentFile: CommentFile = {
      file: path.basename(testFileUri.fsPath),
      version: '2.0.6',
      comments: [],
      ghostMarkers: []
    };

    await fileSystemManager.writeCommentFile(testFileUri, commentFile);

    // Read raw file content
    const commentPath = testFileUri.fsPath + COMMENT_FILE_EXTENSION;
    const content = fs.readFileSync(commentPath, 'utf8');

    // Should be pretty-printed (has newlines and indentation)
    assert.ok(content.includes('\n'), 'JSON should be formatted with newlines');
    assert.ok(content.includes('  '), 'JSON should be indented');
  });

  test('should handle file paths with special characters', async () => {
    const specialNameUri = vscode.Uri.file(
      path.join(tempDir, 'test file with spaces.ts')
    );
    
    fs.writeFileSync(specialNameUri.fsPath, 'test', 'utf8');

    const commentUri = fileSystemManager.getCommentFileUri(specialNameUri);
    assert.ok(commentUri.fsPath.includes(' '), 'Should handle spaces in filename');

    const emptyFile = await fileSystemManager.createEmptyCommentFile(specialNameUri);
    await fileSystemManager.writeCommentFile(specialNameUri, emptyFile);

    const exists = await fileSystemManager.commentFileExists(specialNameUri);
    assert.strictEqual(exists, true, 'Should handle special characters');

    // Cleanup
    fs.unlinkSync(specialNameUri.fsPath);
    fs.unlinkSync(commentUri.fsPath);
  });

  test('should preserve comment metadata on round-trip', async () => {
    const originalComment: CommentFile = {
      file: path.basename(testFileUri.fsPath),
      version: '2.0.6',
      comments: [
        {
          id: 'preserve-test',
          line: 10,
          startLine: 10,
          endLine: 15,
          text: 'Range comment with metadata',
          author: 'Tester',
          created: '2025-01-01T10:00:00.000Z',
          updated: '2025-01-02T15:30:00.000Z',
          tag: 'TODO',
          status: 'open',
          lineHash: 'abc123',
          lineText: 'function test() {',
          replies: [
            {
              id: 'reply-1',
              text: 'Good point',
              author: 'Reviewer',
              created: '2025-01-03T09:00:00.000Z'
            }
          ]
        }
      ],
      ghostMarkers: []
    };

    // Write and read back
    await fileSystemManager.writeCommentFile(testFileUri, originalComment);
    const readBack = await fileSystemManager.readCommentFile(testFileUri);

    // Verify all metadata preserved
    const comment = readBack?.comments[0];
    assert.strictEqual(comment?.id, 'preserve-test');
    assert.strictEqual(comment?.startLine, 10);
    assert.strictEqual(comment?.endLine, 15);
    assert.strictEqual(comment?.author, 'Tester');
    assert.strictEqual(comment?.tag, 'TODO');
    assert.strictEqual(comment?.status, 'open');
    assert.strictEqual(comment?.lineHash, 'abc123');
    assert.strictEqual(comment?.replies?.length, 1);
    assert.strictEqual(comment?.replies?.[0]?.text, 'Good point');
  });

  test('should handle empty comments array', async () => {
    const emptyFile: CommentFile = {
      file: path.basename(testFileUri.fsPath),
      version: '2.0.6',
      comments: [],
      ghostMarkers: []
    };

    await fileSystemManager.writeCommentFile(testFileUri, emptyFile);
    const readBack = await fileSystemManager.readCommentFile(testFileUri);

    assert.strictEqual(readBack?.comments.length, 0);
    assert.ok(Array.isArray(readBack?.comments), 'Comments should be array');
  });

  test('should handle files without extensions', async () => {
    const noExtUri = vscode.Uri.file(path.join(tempDir, 'README'));
    fs.writeFileSync(noExtUri.fsPath, '# README', 'utf8');

    const commentUri = fileSystemManager.getCommentFileUri(noExtUri);
    assert.strictEqual(commentUri.fsPath, noExtUri.fsPath + COMMENT_FILE_EXTENSION);

    const emptyFile = await fileSystemManager.createEmptyCommentFile(noExtUri);
    await fileSystemManager.writeCommentFile(noExtUri, emptyFile);

    const exists = await fileSystemManager.commentFileExists(noExtUri);
    assert.strictEqual(exists, true);

    // Cleanup
    fs.unlinkSync(noExtUri.fsPath);
    fs.unlinkSync(commentUri.fsPath);
  });
});
