/**
 * E2E Tests for CommentSearchEngine
 * v2.1.2 - Advanced Search & Filtering
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { CommentSearchEngine, QUICK_FILTERS } from '../../src/features/CommentSearchEngine';
import { FileSystemManager } from '../../src/io/FileSystemManager';
import { CommentManager } from '../../src/core/CommentManager';
import { GhostMarkerManager } from '../../src/core/GhostMarkerManager';
import { ASTAnchorManager } from '../../src/core/ASTAnchorManager';
import { ParamManager } from '../../src/core/ParamManager';

suite('CommentSearchEngine - E2E', () => {
  let searchEngine: CommentSearchEngine;
  let commentManager: CommentManager;
  let fileSystemManager: FileSystemManager;
  let ghostMarkerManager: GhostMarkerManager;
  let testFileUri: vscode.Uri;

  setup(async () => {
    // Initialize managers
    fileSystemManager = new FileSystemManager();
    const astAnchorManager = new ASTAnchorManager();
    ghostMarkerManager = new GhostMarkerManager();
    ghostMarkerManager.setASTManager(astAnchorManager);
    const paramManager = new ParamManager(astAnchorManager);
    commentManager = new CommentManager(fileSystemManager, ghostMarkerManager, paramManager);
    searchEngine = new CommentSearchEngine(fileSystemManager);

    // Create test file
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder available for testing');
    }

    testFileUri = vscode.Uri.file(
      path.join(workspaceFolder.uri.fsPath, 'test-search.js')
    );

    const testContent = `function example() {
  return 42;
}

function another() {
  return 'hello';
}
`;

    await vscode.workspace.fs.writeFile(testFileUri, Buffer.from(testContent, 'utf8'));

    // Add test comments
    await commentManager.addComment(testFileUri, {
      line: 1,
      text: 'TODO: Refactor this function',
      tag: 'TODO'
    });

    await commentManager.addComment(testFileUri, {
      line: 5,
      text: 'NOTE: This returns a greeting',
      tag: 'NOTE'
    });

    await commentManager.addComment(testFileUri, {
      line: 2,
      text: 'FIXME: Add error handling',
      tag: 'FIXME'
    });
  });

  teardown(async () => {
    // Clean up
    try {
      await vscode.workspace.fs.delete(testFileUri);
    } catch {
      // Ignore
    }

    try {
      const commentFileUri = vscode.Uri.file(testFileUri.fsPath + '.comments');
      await vscode.workspace.fs.delete(commentFileUri);
    } catch {
      // Ignore
    }

    ghostMarkerManager.dispose();
  });

  suite('parseSearchString()', () => {
    test('should parse simple text search', () => {
      const query = searchEngine.parseSearchString('refactoring');
      assert.strictEqual(query.text, 'refactoring');
    });

    test('should parse tag filter', () => {
      const query = searchEngine.parseSearchString('tag:TODO');
      assert.ok(query.tags);
      assert.strictEqual(query.tags.length, 1);
      assert.strictEqual(query.tags[0], 'TODO');
    });

    test('should parse author filter', () => {
      const query = searchEngine.parseSearchString('author:john');
      assert.strictEqual(query.author, 'john');
    });

    test('should parse symbol filter', () => {
      const query = searchEngine.parseSearchString('symbol:calculateTotal');
      assert.strictEqual(query.symbol, 'calculateTotal');
    });

    test('should parse multiple filters', () => {
      const query = searchEngine.parseSearchString('refactoring tag:TODO author:john');
      assert.strictEqual(query.text, 'refactoring');
      assert.ok(query.tags);
      assert.strictEqual(query.tags[0], 'TODO');
      assert.strictEqual(query.author, 'john');
    });

    test('should parse has:complexity filter', () => {
      const query = searchEngine.parseSearchString('has:complexity');
      assert.strictEqual(query.hasComplexity, true);
    });

    test('should parse has:tokens filter', () => {
      const query = searchEngine.parseSearchString('has:tokens');
      assert.strictEqual(query.hasTokens, true);
    });

    test('should parse has:params filter', () => {
      const query = searchEngine.parseSearchString('has:params');
      assert.strictEqual(query.hasParameters, true);
    });

    test('should parse has:ai filter', () => {
      const query = searchEngine.parseSearchString('has:ai');
      assert.strictEqual(query.hasAIMetadata, true);
    });

    test('should parse is:orphaned filter', () => {
      const query = searchEngine.parseSearchString('is:orphaned');
      assert.strictEqual(query.isOrphaned, true);
    });

    test('should parse is:range filter', () => {
      const query = searchEngine.parseSearchString('is:range');
      assert.strictEqual(query.isRange, true);
    });

    test('should handle quoted strings', () => {
      const query = searchEngine.parseSearchString('"needs attention" tag:TODO');
      assert.strictEqual(query.text, 'needs attention');
      assert.ok(query.tags);
      assert.strictEqual(query.tags[0], 'TODO');
    });

    test('should handle multiple tags', () => {
      const query = searchEngine.parseSearchString('tag:TODO tag:FIXME');
      assert.ok(query.tags);
      assert.strictEqual(query.tags.length, 2);
      assert.ok(query.tags.includes('TODO'));
      assert.ok(query.tags.includes('FIXME'));
    });
  });

  suite('search()', () => {
    test('should find comments by text', async () => {
      const results = await searchEngine.search({ text: 'Refactor' });

      assert.ok(results.length > 0);
      const found = results.find(r => r.comment.text.includes('Refactor'));
      assert.ok(found);
    });

    test('should find comments by tag', async () => {
      const results = await searchEngine.search({ tags: ['TODO'] });

      assert.ok(results.length > 0);
      const found = results.find(r => r.comment.tag === 'TODO');
      assert.ok(found);
    });

    test('should find comments by multiple tags', async () => {
      const results = await searchEngine.search({ tags: ['TODO', 'NOTE'] });

      assert.ok(results.length >= 2);
      const hasTodo = results.some(r => r.comment.tag === 'TODO');
      const hasNote = results.some(r => r.comment.tag === 'NOTE');
      assert.ok(hasTodo && hasNote);
    });

    test('should return empty array for non-matching search', async () => {
      const results = await searchEngine.search({ text: 'nonexistent' });

      assert.strictEqual(results.length, 0);
    });

    test('should search with combined filters', async () => {
      const results = await searchEngine.search({
        text: 'Refactor',
        tags: ['TODO']
      });

      assert.ok(results.length > 0);
      const found = results.find(r =>
        r.comment.text.includes('Refactor') && r.comment.tag === 'TODO'
      );
      assert.ok(found);
    });

    test('should return results with match score', async () => {
      const results = await searchEngine.search({ text: 'Refactor' });

      assert.ok(results.length > 0);
      for (const result of results) {
        assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
      }
    });

    test('should return results with matched fields', async () => {
      const results = await searchEngine.search({ tags: ['TODO'] });

      assert.ok(results.length > 0);
      for (const result of results) {
        assert.ok(Array.isArray(result.matchedFields));
        if (result.comment.tag === 'TODO') {
          assert.ok(result.matchedFields.includes('tag'));
        }
      }
    });
  });

  suite('QUICK_FILTERS', () => {
    test('should have todos filter', () => {
      assert.ok(QUICK_FILTERS.todos);
      assert.deepStrictEqual(QUICK_FILTERS.todos.tags, ['TODO']);
    });

    test('should have fixmes filter', () => {
      assert.ok(QUICK_FILTERS.fixmes);
      assert.deepStrictEqual(QUICK_FILTERS.fixmes.tags, ['FIXME']);
    });

    test('should have notes filter', () => {
      assert.ok(QUICK_FILTERS.notes);
      assert.deepStrictEqual(QUICK_FILTERS.notes.tags, ['NOTE']);
    });

    test('should have orphaned filter', () => {
      assert.ok(QUICK_FILTERS.orphaned);
      assert.strictEqual(QUICK_FILTERS.orphaned.isOrphaned, true);
    });

    test('should have aiEnriched filter', () => {
      assert.ok(QUICK_FILTERS.aiEnriched);
      assert.strictEqual(QUICK_FILTERS.aiEnriched.hasAIMetadata, true);
    });

    test('should have rangeComments filter', () => {
      assert.ok(QUICK_FILTERS.rangeComments);
      assert.strictEqual(QUICK_FILTERS.rangeComments.isRange, true);
    });
  });

  suite('getStats()', () => {
    test('should return search statistics', async () => {
      const results = await searchEngine.search({ tags: ['TODO'] });
      const stats = searchEngine.getStats();

      assert.ok(stats);
      assert.ok(typeof stats.totalComments === 'number');
      assert.ok(typeof stats.resultsCount === 'number');
      assert.ok(typeof stats.filesSearched === 'number');
      assert.ok(typeof stats.searchTimeMs === 'number');
      assert.strictEqual(stats.resultsCount, results.length);
    });
  });
}).timeout(30000);
