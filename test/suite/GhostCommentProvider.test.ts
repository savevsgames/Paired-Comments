/**
 * Unit tests for GhostCommentProvider (v2.0.9 - Ghost Comment Visibility)
 *
 * Tests InlayHints-based inline comment visualization
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { GhostCommentProvider } from '../../src/ui/GhostCommentProvider';
import { CommentManager } from '../../src/core/CommentManager';
import { GhostMarkerManager } from '../../src/core/GhostMarkerManager';
import { FileSystemManager } from '../../src/io/FileSystemManager';
import { Comment, CommentFile, GhostMarker } from '../../src/types';

suite('GhostCommentProvider Tests', () => {
  let provider: GhostCommentProvider;
  let commentManager: CommentManager;
  let ghostMarkerManager: GhostMarkerManager;
  let fileSystemManager: FileSystemManager;

  setup(() => {
    fileSystemManager = new FileSystemManager();
    ghostMarkerManager = new GhostMarkerManager();
    commentManager = new CommentManager(fileSystemManager, ghostMarkerManager);
    provider = new GhostCommentProvider(commentManager, ghostMarkerManager);
  });

  test('should initialize with ghost view disabled', () => {
    assert.strictEqual(provider.isEnabled(), false, 'Ghost view should be disabled by default');
    assert.strictEqual(provider.getEnabledLineCount(), 0, 'No lines should have ghost view enabled');
  });

  test('enable() should enable ghost view globally', () => {
    provider.enable();
    assert.strictEqual(provider.isEnabled(), true, 'Ghost view should be enabled');
  });

  test('disable() should disable ghost view and clear per-line toggles', () => {
    provider.toggleLine(10);
    provider.toggleLine(20);
    provider.enable();

    assert.strictEqual(provider.isEnabled(), true, 'Ghost view should be enabled');
    assert.strictEqual(provider.getEnabledLineCount(), 2, 'Should have 2 lines enabled');

    provider.disable();

    assert.strictEqual(provider.isEnabled(), false, 'Ghost view should be disabled');
    assert.strictEqual(provider.getEnabledLineCount(), 0, 'All per-line toggles should be cleared');
  });

  test('toggleLine() should toggle ghost view for specific line', () => {
    const line = 15;

    // Initially not enabled
    assert.strictEqual(provider.isLineEnabled(line), false, 'Line should not be enabled');

    // Toggle on
    provider.toggleLine(line);
    assert.strictEqual(provider.isLineEnabled(line), true, 'Line should be enabled after first toggle');
    assert.strictEqual(provider.isEnabled(), true, 'Provider should report as enabled');
    assert.strictEqual(provider.getEnabledLineCount(), 1, 'Should have 1 line enabled');

    // Toggle off
    provider.toggleLine(line);
    assert.strictEqual(provider.isLineEnabled(line), false, 'Line should be disabled after second toggle');
    assert.strictEqual(provider.isEnabled(), false, 'Provider should report as disabled when no lines');
    assert.strictEqual(provider.getEnabledLineCount(), 0, 'Should have 0 lines enabled');
  });

  test('toggleLine() with multiple lines', () => {
    provider.toggleLine(10);
    provider.toggleLine(20);
    provider.toggleLine(30);

    assert.strictEqual(provider.getEnabledLineCount(), 3, 'Should have 3 lines enabled');
    assert.strictEqual(provider.isLineEnabled(10), true, 'Line 10 should be enabled');
    assert.strictEqual(provider.isLineEnabled(20), true, 'Line 20 should be enabled');
    assert.strictEqual(provider.isLineEnabled(30), true, 'Line 30 should be enabled');
    assert.strictEqual(provider.isLineEnabled(40), false, 'Line 40 should not be enabled');
  });

  test('isEnabled() should return true if global enable or any line enabled', () => {
    // No lines, not globally enabled
    assert.strictEqual(provider.isEnabled(), false, 'Should be disabled initially');

    // One line enabled (not global)
    provider.toggleLine(10);
    assert.strictEqual(provider.isEnabled(), true, 'Should be enabled with one line');

    // Clear line, enable globally
    provider.toggleLine(10);
    provider.enable();
    assert.strictEqual(provider.isEnabled(), true, 'Should be enabled globally');
  });

  test('provideInlayHints() should return empty array when disabled', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'function test() { return 42; }',
      language: 'javascript'
    });

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 0, 'Should return no hints when disabled');
  });

  test('provideInlayHints() should return hints when enabled globally', async () => {
    // Create a test document
    const document = await vscode.workspace.openTextDocument({
      content: 'function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}',
      language: 'javascript'
    });

    // Mock comment data
    const comment: Comment = {
      id: 'test-comment-1',
      line: 1, // 1-indexed
      text: 'Test comment for calculateTotal',
      author: 'Test User',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tag: 'TODO'
    };

    const ghostMarker: GhostMarker = {
      id: 'gm-test-1',
      line: 1,
      commentIds: ['test-comment-1'],
      lineHash: 'test-hash',
      lineText: 'function calculateTotal(items) {',
      prevLineText: '',
      nextLineText: '  return items.reduce((sum, item) => sum + item.price, 0);',
      lastVerified: new Date().toISOString()
    };

    const commentFile: CommentFile = {
      file: document.fileName,
      version: '2.1.0',
      ghostMarkers: [ghostMarker],
      comments: [comment]
    };

    // Mock the comment manager to return our test data
    (commentManager as any).loadComments = async () => commentFile;

    // Mock ghost marker manager
    ghostMarkerManager.getMarkers = () => [ghostMarker];

    // Enable ghost view
    provider.enable();

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 1, 'Should return 1 hint for the comment');
    assert.ok(hints[0], 'First hint should exist');
    assert.strictEqual(hints[0]!.kind, vscode.InlayHintKind.Type, 'Hint should be of type Type');

    const hintText = typeof hints[0]!.label === 'string'
      ? hints[0]!.label
      : hints[0]!.label.map(part => typeof part === 'string' ? part : part.value).join('');

    assert.ok(hintText.includes('Test User'), 'Hint should include author name');
    assert.ok(hintText.includes('TODO'), 'Hint should include tag');
    assert.ok(hintText.includes('Test comment'), 'Hint should include comment text');
  });

  test('provideInlayHints() should show orphaned warning for comments without markers', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'function test() { return 42; }',
      language: 'javascript'
    });

    const comment: Comment = {
      id: 'orphaned-comment',
      line: 1,
      text: 'Orphaned comment',
      author: 'Test User',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tag: 'NOTE'
    };

    const commentFile: CommentFile = {
      file: document.fileName,
      version: '2.1.0',
      ghostMarkers: [], // No markers!
      comments: [comment]
    };

    (commentManager as any).loadComments = async () => commentFile;
    ghostMarkerManager.getMarkers = () => []; // No markers

    provider.enable();

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 1, 'Should return hint for orphaned comment');
    assert.ok(hints[0], 'First hint should exist');

    const hintText = typeof hints[0]!.label === 'string'
      ? hints[0]!.label
      : hints[0]!.label.map(part => typeof part === 'string' ? part : part.value).join('');

    assert.ok(hintText.includes('⚠️ ORPHANED'), 'Hint should show orphaned warning');
  });

  test('provideInlayHints() should respect per-line toggles', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'line 1\nline 2\nline 3',
      language: 'javascript'
    });

    const comments: Comment[] = [
      {
        id: 'comment-1',
        line: 1,
        text: 'Comment on line 1',
        author: 'User',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      {
        id: 'comment-2',
        line: 2,
        text: 'Comment on line 2',
        author: 'User',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    ];

    const markers: GhostMarker[] = [
      {
        id: 'gm-1',
        line: 1,
        commentIds: ['comment-1'],
        lineHash: 'hash1',
        lineText: 'line 1',
        prevLineText: '',
        nextLineText: 'line 2',
        lastVerified: new Date().toISOString()
      },
      {
        id: 'gm-2',
        line: 2,
        commentIds: ['comment-2'],
        lineHash: 'hash2',
        lineText: 'line 2',
        prevLineText: 'line 1',
        nextLineText: 'line 3',
        lastVerified: new Date().toISOString()
      }
    ];

    const commentFile: CommentFile = {
      file: document.fileName,
      version: '2.1.0',
      ghostMarkers: markers,
      comments: comments
    };

    (commentManager as any).loadComments = async () => commentFile;
    ghostMarkerManager.getMarkers = () => markers;

    // Enable only line 1
    provider.toggleLine(1);

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 1, 'Should return hint only for line 1');
    assert.ok(hints[0], 'First hint should exist');
    assert.strictEqual(hints[0]!.position.line, 0, 'Hint should be on line 0 (0-indexed)');
  });

  test('provideInlayHints() should handle range comments', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'function test() {\n  line1\n  line2\n  line3\n}',
      language: 'javascript'
    });

    const comment: Comment = {
      id: 'range-comment',
      line: 2,
      startLine: 2,
      endLine: 4,
      text: 'Range comment spanning lines 2-4',
      author: 'User',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tag: 'NOTE'
    };

    const marker: GhostMarker = {
      id: 'gm-range',
      line: 2,
      endLine: 4,
      commentIds: ['range-comment'],
      lineHash: 'hash',
      lineText: '  line1',
      prevLineText: 'function test() {',
      nextLineText: '  line2',
      lastVerified: new Date().toISOString()
    };

    const commentFile: CommentFile = {
      file: document.fileName,
      version: '2.1.0',
      ghostMarkers: [marker],
      comments: [comment]
    };

    (commentManager as any).loadComments = async () => commentFile;
    ghostMarkerManager.getMarkers = () => [marker];

    provider.enable();

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 1, 'Should return 1 hint for range comment');
    assert.ok(hints[0], 'First hint should exist');

    const hintText = typeof hints[0]!.label === 'string'
      ? hints[0]!.label
      : hints[0]!.label.map(part => typeof part === 'string' ? part : part.value).join('');

    assert.ok(hintText.includes('lines 2-4'), 'Hint should indicate line range');
  });

  test('provideInlayHints() should handle errors gracefully', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'test content',
      language: 'javascript'
    });

    // Mock loadComments to throw error
    (commentManager as any).loadComments = async () => {
      throw new Error('Test error');
    };

    provider.enable();

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 0, 'Should return empty array on error');
  });

  test('provideInlayHints() should filter by visible range', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: 'line 1\nline 2\nline 3\nline 4\nline 5',
      language: 'javascript'
    });

    const comments: Comment[] = [
      { id: 'c1', line: 1, text: 'Comment 1', author: 'User', created: new Date().toISOString(), updated: new Date().toISOString() },
      { id: 'c3', line: 3, text: 'Comment 3', author: 'User', created: new Date().toISOString(), updated: new Date().toISOString() },
      { id: 'c5', line: 5, text: 'Comment 5', author: 'User', created: new Date().toISOString(), updated: new Date().toISOString() }
    ];

    const markers: GhostMarker[] = [
      { id: 'gm1', line: 1, commentIds: ['c1'], lineHash: 'h1', lineText: 'line 1', prevLineText: '', nextLineText: 'line 2', lastVerified: new Date().toISOString() },
      { id: 'gm3', line: 3, commentIds: ['c3'], lineHash: 'h3', lineText: 'line 3', prevLineText: 'line 2', nextLineText: 'line 4', lastVerified: new Date().toISOString() },
      { id: 'gm5', line: 5, commentIds: ['c5'], lineHash: 'h5', lineText: 'line 5', prevLineText: 'line 4', nextLineText: '', lastVerified: new Date().toISOString() }
    ];

    const commentFile: CommentFile = {
      file: document.fileName,
      version: '2.1.0',
      ghostMarkers: markers,
      comments: comments
    };

    (commentManager as any).loadComments = async () => commentFile;
    ghostMarkerManager.getMarkers = () => markers;

    provider.enable();

    // Only request hints for lines 2-4 (0-indexed: 1-3)
    const range = new vscode.Range(1, 0, 3, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    // Should only return hint for line 3 (0-indexed: line 2)
    assert.strictEqual(hints.length, 1, 'Should return only hints within visible range');
    assert.ok(hints[0], 'First hint should exist');
    assert.strictEqual(hints[0]!.position.line, 2, 'Hint should be for line 3 (0-indexed: 2)');
  });

  test('onDidChangeInlayHints event should fire when enable() is called', (done) => {
    let eventFired = false;

    // Subscribe to event
    const disposable = provider.onDidChangeInlayHints(() => {
      eventFired = true;
    });

    // Enable ghost view (should trigger event)
    provider.enable();

    // Give event time to fire
    setTimeout(() => {
      assert.strictEqual(eventFired, true, 'Event should have fired after enable()');
      disposable.dispose();
      done();
    }, 50);
  });

  test('onDidChangeInlayHints event should fire when disable() is called', (done) => {
    let eventFired = false;

    provider.enable(); // Enable first

    // Subscribe to event
    const disposable = provider.onDidChangeInlayHints(() => {
      eventFired = true;
    });

    // Disable ghost view (should trigger event)
    provider.disable();

    // Give event time to fire
    setTimeout(() => {
      assert.strictEqual(eventFired, true, 'Event should have fired after disable()');
      disposable.dispose();
      done();
    }, 50);
  });

  test('onDidChangeInlayHints event should fire when toggleLine() is called', (done) => {
    let eventFired = false;

    // Subscribe to event
    const disposable = provider.onDidChangeInlayHints(() => {
      eventFired = true;
    });

    // Toggle line (should trigger event)
    provider.toggleLine(10);

    // Give event time to fire
    setTimeout(() => {
      assert.strictEqual(eventFired, true, 'Event should have fired after toggleLine()');
      disposable.dispose();
      done();
    }, 50);
  });

  test('provideInlayHints() should skip .comments files', async () => {
    const document = await vscode.workspace.openTextDocument({
      content: '{"file": "test.js", "comments": []}',
      language: 'json'
    });

    // Override the document URI to simulate a .comments file
    Object.defineProperty(document, 'uri', {
      value: vscode.Uri.file('/test/path/test.js.comments'),
      writable: false
    });

    provider.enable();

    const range = new vscode.Range(0, 0, document.lineCount, 0);
    const token = new vscode.CancellationTokenSource().token;

    const hints = await provider.provideInlayHints(document, range, token);

    assert.strictEqual(hints.length, 0, 'Should return no hints for .comments files');
  });
});
