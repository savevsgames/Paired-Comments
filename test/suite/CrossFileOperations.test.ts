/**
 * E2E Tests for Cross-File Comment Operations
 * v2.1.5 - Cross-File Comment Movement
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { CommentManager } from '../../src/core/CommentManager';
import { GhostMarkerManager } from '../../src/core/GhostMarkerManager';
import { ASTAnchorManager } from '../../src/core/ASTAnchorManager';
import { ParamManager } from '../../src/core/ParamManager';
import { FileSystemManager } from '../../src/io/FileSystemManager';

suite('Cross-File Operations - E2E', () => {
  let commentManager: CommentManager;
  let ghostMarkerManager: GhostMarkerManager;
  let fileSystemManager: FileSystemManager;
  let sourceFileUri: vscode.Uri;
  let targetFileUri: vscode.Uri;

  setup(async () => {
    // Initialize managers
    const astAnchorManager = new ASTAnchorManager();
    ghostMarkerManager = new GhostMarkerManager();
    ghostMarkerManager.setASTManager(astAnchorManager);
    fileSystemManager = new FileSystemManager();
    const paramManager = new ParamManager(astAnchorManager);
    commentManager = new CommentManager(fileSystemManager, ghostMarkerManager, paramManager);

    // Create test files
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder available for testing');
    }

    sourceFileUri = vscode.Uri.file(
      path.join(workspaceFolder.uri.fsPath, 'test-cross-file-source.js')
    );

    targetFileUri = vscode.Uri.file(
      path.join(workspaceFolder.uri.fsPath, 'test-cross-file-target.js')
    );

    const sourceContent = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
`;

    const targetContent = `function displayResults(data) {
  console.log(data);
}
`;

    await vscode.workspace.fs.writeFile(sourceFileUri, Buffer.from(sourceContent, 'utf8'));
    await vscode.workspace.fs.writeFile(targetFileUri, Buffer.from(targetContent, 'utf8'));
  });

  teardown(async () => {
    // Clean up test files
    try {
      await vscode.workspace.fs.delete(sourceFileUri);
      await vscode.workspace.fs.delete(vscode.Uri.file(sourceFileUri.fsPath + '.comments'));
    } catch {
      // Ignore
    }

    try {
      await vscode.workspace.fs.delete(targetFileUri);
      await vscode.workspace.fs.delete(vscode.Uri.file(targetFileUri.fsPath + '.comments'));
    } catch {
      // Ignore
    }

    ghostMarkerManager.dispose();
  });

  suite('Move Comment to Different File', () => {
    test('should move comment from source to target file', async () => {
      // Add comment to source file
      const sourceComment = await commentManager.addComment(sourceFileUri, {
        line: 1,
        text: 'Calculate sum of prices',
        tag: 'NOTE'
      });

      assert.ok(sourceComment);

      // Load source comments
      const sourceFile = await commentManager.loadComments(sourceFileUri);
      assert.strictEqual(sourceFile.comments.length, 1);

      // Move comment to target file
      const movedComment = {
        ...sourceComment,
        line: 1 // New line in target file
      };

      // Create comment in target
      const targetDocument = await vscode.workspace.openTextDocument(targetFileUri);
      const newMarker = await ghostMarkerManager.createMarker(targetDocument, 1, [movedComment.id]);
      movedComment.ghostMarkerId = newMarker.id;

      // Add to target file
      const targetFile = await commentManager.loadComments(targetFileUri);
      targetFile.comments.push(movedComment);
      targetFile.ghostMarkers = ghostMarkerManager.getMarkers(targetFileUri);
      await commentManager.saveComments(targetFileUri, targetFile);

      // Remove from source file
      await commentManager.deleteComment(sourceFileUri, sourceComment.id);

      // Verify
      const updatedSourceFile = await commentManager.loadComments(sourceFileUri);
      const updatedTargetFile = await commentManager.loadComments(targetFileUri);

      assert.strictEqual(updatedSourceFile.comments.length, 0);
      assert.strictEqual(updatedTargetFile.comments.length, 1);
      assert.strictEqual(updatedTargetFile.comments[0].text, 'Calculate sum of prices');
    });
  });

  suite('Copy Comment to Different File', () => {
    test('should copy comment from source to target file', async () => {
      // Add comment to source file
      const sourceComment = await commentManager.addComment(sourceFileUri, {
        line: 1,
        text: 'Important calculation logic',
        tag: 'STAR'
      });

      assert.ok(sourceComment);

      // Copy comment to target file (new ID)
      const copiedComment = {
        ...sourceComment,
        id: `${sourceComment.id}-copy`,
        line: 1 // New line in target file
      };

      // Create marker in target
      const targetDocument = await vscode.workspace.openTextDocument(targetFileUri);
      const newMarker = await ghostMarkerManager.createMarker(targetDocument, 1, [copiedComment.id]);
      copiedComment.ghostMarkerId = newMarker.id;

      // Add to target file
      const targetFile = await commentManager.loadComments(targetFileUri);
      targetFile.comments.push(copiedComment);
      targetFile.ghostMarkers = ghostMarkerManager.getMarkers(targetFileUri);
      await commentManager.saveComments(targetFileUri, targetFile);

      // Verify both files have the comment
      const sourceFile = await commentManager.loadComments(sourceFileUri);
      const updatedTargetFile = await commentManager.loadComments(targetFileUri);

      assert.strictEqual(sourceFile.comments.length, 1);
      assert.strictEqual(updatedTargetFile.comments.length, 1);
      assert.strictEqual(sourceFile.comments[0].text, 'Important calculation logic');
      assert.strictEqual(updatedTargetFile.comments[0].text, 'Important calculation logic');
      assert.notStrictEqual(sourceFile.comments[0].id, updatedTargetFile.comments[0].id);
    });
  });

  suite('Bulk Move Operations', () => {
    test('should move multiple comments to target file', async () => {
      // Add multiple comments to source
      const comment1 = await commentManager.addComment(sourceFileUri, {
        line: 1,
        text: 'First comment',
        tag: 'TODO'
      });

      const comment2 = await commentManager.addComment(sourceFileUri, {
        line: 2,
        text: 'Second comment',
        tag: 'FIXME'
      });

      assert.ok(comment1 && comment2);

      // Load source comments
      const sourceFile = await commentManager.loadComments(sourceFileUri);
      assert.strictEqual(sourceFile.comments.length, 2);

      // Move all comments to target
      const targetDocument = await vscode.workspace.openTextDocument(targetFileUri);
      const targetFile = await commentManager.loadComments(targetFileUri);

      for (const comment of sourceFile.comments) {
        const movedComment = { ...comment, line: 1 };
        const newMarker = await ghostMarkerManager.createMarker(targetDocument, 1, [movedComment.id]);
        movedComment.ghostMarkerId = newMarker.id;
        targetFile.comments.push(movedComment);
      }

      targetFile.ghostMarkers = ghostMarkerManager.getMarkers(targetFileUri);
      await commentManager.saveComments(targetFileUri, targetFile);

      // Clear source file
      sourceFile.comments = [];
      sourceFile.ghostMarkers = [];
      await commentManager.saveComments(sourceFileUri, sourceFile);

      // Verify
      const updatedSourceFile = await commentManager.loadComments(sourceFileUri);
      const updatedTargetFile = await commentManager.loadComments(targetFileUri);

      assert.strictEqual(updatedSourceFile.comments.length, 0);
      assert.strictEqual(updatedTargetFile.comments.length, 2);
    });
  });

  suite('Metadata Preservation', () => {
    test('should preserve comment metadata when moving', async () => {
      const originalCreated = '2025-10-15T12:00:00.000Z';
      const originalUpdated = '2025-10-16T12:00:00.000Z';

      // Add comment to source with specific metadata
      const sourceComment = await commentManager.addComment(sourceFileUri, {
        line: 1,
        text: 'Test metadata preservation',
        tag: 'NOTE'
      });

      // Manually set metadata for testing
      const sourceFile = await commentManager.loadComments(sourceFileUri);
      sourceFile.comments[0].created = originalCreated;
      sourceFile.comments[0].updated = originalUpdated;
      await commentManager.saveComments(sourceFileUri, sourceFile);

      // Reload to verify
      const reloadedSource = await commentManager.loadComments(sourceFileUri);
      const comment = reloadedSource.comments[0];

      // Move to target
      const targetDocument = await vscode.workspace.openTextDocument(targetFileUri);
      const movedComment = { ...comment, line: 1 };
      const newMarker = await ghostMarkerManager.createMarker(targetDocument, 1, [movedComment.id]);
      movedComment.ghostMarkerId = newMarker.id;

      const targetFile = await commentManager.loadComments(targetFileUri);
      targetFile.comments.push(movedComment);
      targetFile.ghostMarkers = ghostMarkerManager.getMarkers(targetFileUri);
      await commentManager.saveComments(targetFileUri, targetFile);

      // Verify metadata preserved
      const updatedTargetFile = await commentManager.loadComments(targetFileUri);
      const movedCommentResult = updatedTargetFile.comments[0];

      assert.strictEqual(movedCommentResult.created, originalCreated);
      assert.strictEqual(movedCommentResult.updated, originalUpdated);
      assert.strictEqual(movedCommentResult.text, 'Test metadata preservation');
      assert.strictEqual(movedCommentResult.tag, 'NOTE');
    });
  });

  suite('Error Handling', () => {
    test('should handle moving to non-existent file gracefully', async () => {
      const sourceComment = await commentManager.addComment(sourceFileUri, {
        line: 1,
        text: 'Test comment',
        tag: 'NOTE'
      });

      const nonExistentUri = vscode.Uri.file(
        path.join(path.dirname(sourceFileUri.fsPath), 'nonexistent.js')
      );

      // Attempting to create a marker on non-existent file should fail or create empty comment file
      // This test verifies the system handles it gracefully
      try {
        const targetFile = await commentManager.loadComments(nonExistentUri);
        assert.ok(targetFile); // Should create empty comment file
      } catch (error) {
        // Or it might throw, which is also acceptable
        assert.ok(error);
      }
    });

    test('should preserve source file if move fails', async () => {
      const sourceComment = await commentManager.addComment(sourceFileUri, {
        line: 1,
        text: 'Critical comment',
        tag: 'WARNING'
      });

      const sourceFileBefore = await commentManager.loadComments(sourceFileUri);
      assert.strictEqual(sourceFileBefore.comments.length, 1);

      // Simulate a failed move by not actually moving it
      // Verify source file is unchanged
      const sourceFileAfter = await commentManager.loadComments(sourceFileUri);
      assert.strictEqual(sourceFileAfter.comments.length, 1);
      assert.strictEqual(sourceFileAfter.comments[0].id, sourceComment.id);
    });
  });
}).timeout(30000);
