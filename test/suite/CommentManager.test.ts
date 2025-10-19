/**
 * Integration tests for CommentManager
 * These tests run in a real VS Code instance with actual file system
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CommentManager } from '../../src/core/CommentManager';
import { FileSystemManager } from '../../src/io/FileSystemManager';
// import { ASTAnchorManager } from // Unused import '../../src/core/ASTAnchorManager';

suite('CommentManager Integration Tests', () => {
  let tempDir: string;
  let commentManager: CommentManager;
  let fileSystemManager: FileSystemManager;
  let testFileUri: vscode.Uri;

  suiteSetup(() => {
    // Create temp directory for test files
    tempDir = path.join(__dirname, '../../../test-output');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  setup(async () => {
    // Create a test file
    const testFileName = `test-${Date.now()}.ts`;
    const testFilePath = path.join(tempDir, testFileName);
    testFileUri = vscode.Uri.file(testFilePath);

    // Write test content
    const testContent = `function hello() {
  console.log('Hello World');
}

function goodbye() {
  console.log('Goodbye');
}`;

    fs.writeFileSync(testFilePath, testContent, 'utf8');

    // Initialize managers
    // const astManager = new ASTAnchorManager(); // Unused in current tests
    fileSystemManager = new FileSystemManager();
    commentManager = new CommentManager(fileSystemManager);
  });

  teardown(() => {
    // Clean up: delete test file and .comments file
    try {
      if (fs.existsSync(testFileUri.fsPath)) {
        fs.unlinkSync(testFileUri.fsPath);
      }
      const commentsFile = testFileUri.fsPath + '.comments';
      if (fs.existsSync(commentsFile)) {
        fs.unlinkSync(commentsFile);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }

    commentManager.clearCache();
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

  test('should create empty comment file on first load', async () => {
    const commentFile = await commentManager.loadComments(testFileUri);

    assert.ok(commentFile, 'Comment file should be created');
    assert.strictEqual(commentFile.comments.length, 0, 'Should start with no comments');
    assert.ok(commentFile.version.match(/^2\.\d+\.\d+$/), 'Should have v2.x version');
  });

  test('should add single-line comment', async () => {
    const newComment = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'Test comment on line 1',
      author: 'TestUser'
    });

    assert.ok(newComment.id, 'Comment should have ID');
    assert.strictEqual(newComment.line, 1, 'Comment should be on line 1');
    assert.strictEqual(newComment.text, 'Test comment on line 1');
    assert.strictEqual(newComment.author, 'TestUser');
  });

  test('should add multiple comments', async () => {
    await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'First comment',
      author: 'User1'
    });

    await commentManager.addComment(testFileUri, {
      line: 5,
      text: 'Second comment',
      author: 'User2'
    });

    const commentFile = await commentManager.loadComments(testFileUri);
    assert.strictEqual(commentFile.comments.length, 2, 'Should have 2 comments');
  });

  test('should sort comments by line number', async () => {
    // Add in reverse order
    await commentManager.addComment(testFileUri, {
      line: 5,
      text: 'Second',
      author: 'Test'
    });

    await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'First',
      author: 'Test'
    });

    await commentManager.addComment(testFileUri, {
      line: 3,
      text: 'Middle',
      author: 'Test'
    });

    const commentFile = await commentManager.loadComments(testFileUri);
    
    assert.strictEqual(commentFile.comments[0]?.line, 1);
    assert.strictEqual(commentFile.comments[1]?.line, 3);
    assert.strictEqual(commentFile.comments[2]?.line, 5);
  });

  test('should detect TODO tag', async () => {
    const comment = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'TODO: Fix this bug',
      author: 'Test'
    });

    assert.strictEqual(comment.tag, 'TODO');
  });

  test('should detect FIXME tag', async () => {
    const comment = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'FIXME: Broken logic',
      author: 'Test'
    });

    assert.strictEqual(comment.tag, 'FIXME');
  });

  test('should update comment text', async () => {
    const comment = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'Original text',
      author: 'Test'
    });

    await commentManager.updateComment(testFileUri, {
      id: comment.id,
      text: 'Updated text'
    });

    const updatedComment = commentManager.getCommentById(testFileUri, comment.id);
    assert.strictEqual(updatedComment?.text, 'Updated text');
  });

  test('should update tag when text changes', async () => {
    const comment = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'Normal comment',
      author: 'Test'
    });

    assert.strictEqual(comment.tag, null, 'Should start with no tag');

    await commentManager.updateComment(testFileUri, {
      id: comment.id,
      text: 'TODO: Now with tag'
    });

    const updatedComment = commentManager.getCommentById(testFileUri, comment.id);
    assert.strictEqual(updatedComment?.tag, 'TODO');
  });

  test('should delete comment', async () => {
    const comment = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'To be deleted',
      author: 'Test'
    });

    await commentManager.deleteComment(testFileUri, comment.id);

    const deletedComment = commentManager.getCommentById(testFileUri, comment.id);
    assert.strictEqual(deletedComment, undefined, 'Comment should be deleted');
  });

  test('should get comments for specific line', async () => {
    await commentManager.addComment(testFileUri, {
      line: 2,
      text: 'Comment 1',
      author: 'Test'
    });

    await commentManager.addComment(testFileUri, {
      line: 2,
      text: 'Comment 2',
      author: 'Test'
    });

    await commentManager.addComment(testFileUri, {
      line: 5,
      text: 'Different line',
      author: 'Test'
    });

    const line2Comments = commentManager.getCommentsForLine(testFileUri, 2);
    assert.strictEqual(line2Comments.length, 2, 'Should have 2 comments on line 2');

    const line5Comments = commentManager.getCommentsForLine(testFileUri, 5);
    assert.strictEqual(line5Comments.length, 1, 'Should have 1 comment on line 5');
  });

  test('should persist comments to disk', async () => {
    await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'Persistent comment',
      author: 'Test'
    });

    // Clear cache
    commentManager.clearCache();

    // Create new manager instance to force disk read
    const newCommentManager = new CommentManager(fileSystemManager);
    const commentFile = await newCommentManager.loadComments(testFileUri);

    assert.strictEqual(commentFile.comments.length, 1, 'Comment should persist');
    assert.strictEqual(commentFile.comments[0]?.text, 'Persistent comment');
  });

  test('should reload comments from disk', async () => {
    await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'Original',
      author: 'Test'
    });

    // Manually modify the file
    const commentFilePath = testFileUri.fsPath + '.comments';
    const fileContent = JSON.parse(fs.readFileSync(commentFilePath, 'utf8'));
    fileContent.comments[0].text = 'Modified externally';
    fs.writeFileSync(commentFilePath, JSON.stringify(fileContent, null, 2));

    // Reload
    await commentManager.reloadComments(testFileUri);

    const comment = commentManager.getCommentById(testFileUri, fileContent.comments[0].id);
    assert.strictEqual(comment?.text, 'Modified externally');
  });

  test('should handle multiple sequential operations', async () => {
    // Add multiple comments sequentially
    await commentManager.addComment(testFileUri, { line: 1, text: 'Comment 1', author: 'Test' });
    await commentManager.addComment(testFileUri, { line: 2, text: 'Comment 2', author: 'Test' });
    await commentManager.addComment(testFileUri, { line: 3, text: 'Comment 3', author: 'Test' });

    const commentFile = await commentManager.loadComments(testFileUri);
    assert.strictEqual(commentFile.comments.length, 3, 'All comments should be added');
  });

  test('should throw error when updating nonexistent comment', async () => {
    try {
      await commentManager.updateComment(testFileUri, {
        id: 'nonexistent-id',
        text: 'Updated'
      });
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.ok((err as Error).message.includes('not found'));
    }
  });

  test('should throw error when deleting nonexistent comment', async () => {
    try {
      await commentManager.deleteComment(testFileUri, 'nonexistent-id');
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.ok(err instanceof Error);
      assert.ok((err as Error).message.includes('not found'));
    }
  });

  test('should generate unique IDs', async () => {
    const comment1 = await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'Comment 1',
      author: 'Test'
    });

    const comment2 = await commentManager.addComment(testFileUri, {
      line: 2,
      text: 'Comment 2',
      author: 'Test'
    });

    assert.notStrictEqual(comment1.id, comment2.id, 'IDs should be unique');
    assert.match(comment1.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('should add range comment (v2.0.6)', async () => {
    const rangeComment = await commentManager.addComment(testFileUri, {
      line: 1,
      endLine: 3,
      text: 'Range comment spanning lines 1-3',
      author: 'Test'
    });

    assert.strictEqual(rangeComment.startLine, 1);
    assert.strictEqual(rangeComment.endLine, 3);
    assert.strictEqual(rangeComment.line, 1, 'Line should equal startLine');
  });
});
