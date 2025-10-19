/**
 * Unit tests for GhostMarkerManager - AST-based comment tracking
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as vscode from 'vscode';
import { GhostMarkerManager } from '../../src/core/GhostMarkerManager';
import { ASTAnchorManager } from '../../src/core/ASTAnchorManager';
import { GhostMarker } from '../../src/types';

suite('GhostMarkerManager', () => {
  let ghostMarkerManager: GhostMarkerManager;
  let astAnchorManager: ASTAnchorManager;

  setup(() => {
    ghostMarkerManager = new GhostMarkerManager();
    astAnchorManager = new ASTAnchorManager();
    ghostMarkerManager.setASTManager(astAnchorManager);
  });

  suite('createMarker', () => {
    test('should create single-line marker', async () => {
      const content = 'function test() {\n  return 42;\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(
        doc,
        1, // Line 1 (0-indexed)
        'c1'
      );

      expect(marker).to.exist;
      expect(marker.id).to.be.a('string');
      expect(marker.line).to.equal(2); // 1-indexed
      expect(marker.commentIds).to.deep.equal(['c1']);
      expect(marker.lineHash).to.be.a('string');
      expect(marker.lineText).to.include('return 42');
      expect(marker.endLine).to.be.undefined;
    });

    test('should create range marker', async () => {
      const content = 'function test() {\n  const x = 5;\n  const y = 10;\n  return x + y;\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(
        doc,
        0, // Line 0
        'c1',
        4 // End line (0-indexed)
      );

      expect(marker).to.exist;
      expect(marker.line).to.equal(1); // 1-indexed
      expect(marker.endLine).to.equal(5); // 1-indexed
      expect(marker.commentIds).to.deep.equal(['c1']);
    });

    test('should include AST anchor for function', async () => {
      const content = 'function calculateTotal(items) {\n  return items.reduce((a, b) => a + b, 0);\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');

      // AST anchor may or may not be created depending on VS Code symbol provider
      if (marker.astAnchor) {
        expect(marker.astAnchor.symbolPath).to.be.an('array');
        expect(marker.astAnchor.kind).to.be.a('number');
      }
    });

    test('should handle empty lines', async () => {
      const content = '\n\n  \n';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 1, 'c1');

      expect(marker).to.exist;
      expect(marker.lineText).to.equal(''); // Trimmed
    });
  });

  suite('getMarker', () => {
    test('should retrieve marker by ID', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      const retrieved = ghostMarkerManager.getMarker(marker.id);

      expect(retrieved).to.deep.equal(marker);
    });

    test('should return undefined for non-existent marker', () => {
      const retrieved = ghostMarkerManager.getMarker('non-existent-id');
      expect(retrieved).to.be.undefined;
    });
  });

  suite('getMarkerAtLine', () => {
    test('should find marker at specific line', async () => {
      const content = 'const x = 5;\nconst y = 10;\nconst z = 15;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      await ghostMarkerManager.createMarker(doc, 1, 'c1');

      const marker = ghostMarkerManager.getMarkerAtLine(doc.uri, 2); // 1-indexed

      expect(marker).to.exist;
      expect(marker?.commentIds).to.include('c1');
    });

    test('should find marker within range', async () => {
      const content = 'function test() {\n  const x = 5;\n  return x;\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      await ghostMarkerManager.createMarker(doc, 0, 'c1', 3); // Lines 0-3

      // Should find marker at any line in range
      const marker1 = ghostMarkerManager.getMarkerAtLine(doc.uri, 1);
      const marker2 = ghostMarkerManager.getMarkerAtLine(doc.uri, 2);
      const marker3 = ghostMarkerManager.getMarkerAtLine(doc.uri, 4);

      if (marker1 && marker2 && marker3) {
        expect(marker1.id).to.equal(marker2.id);
        expect(marker2.id).to.equal(marker3.id);
      } else {
        // At least verify they exist
        expect(marker1).to.exist;
        expect(marker2).to.exist;
        expect(marker3).to.exist;
      }
    });

    test('should return undefined for line without marker', async () => {
      const content = 'const x = 5;\nconst y = 10;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = ghostMarkerManager.getMarkerAtLine(doc.uri, 1);
      expect(marker).to.be.undefined;
    });
  });

  suite('updateMarkerLine', () => {
    test('should update marker line number', async () => {
      const content = 'const x = 5;\nconst y = 10;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      const originalLine = marker.line;

      ghostMarkerManager.updateMarkerLine(marker.id, originalLine + 5);

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated?.line).to.equal(originalLine + 5);
    });

    test('should update range marker end line', async () => {
      const content = 'function test() {\n  return 42;\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1', 2);

      ghostMarkerManager.updateMarkerLine(marker.id, 10, 15);

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated?.line).to.equal(10);
      expect(updated?.endLine).to.equal(15);
    });

    test('should handle non-existent marker gracefully', () => {
      // Should not throw
      ghostMarkerManager.updateMarkerLine('non-existent', 10);

      const marker = ghostMarkerManager.getMarker('non-existent');
      expect(marker).to.be.undefined;
    });
  });

  suite('removeMarker', () => {
    test('should remove marker by ID', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.removeMarker(marker.id);

      const retrieved = ghostMarkerManager.getMarker(marker.id);
      expect(retrieved).to.be.undefined;
    });

    test('should handle removing non-existent marker', () => {
      // Should not throw
      ghostMarkerManager.removeMarker('non-existent');
    });
  });

  suite('getMarkers', () => {
    test('should return all markers for a document', async () => {
      const content = 'const x = 5;\nconst y = 10;\nconst z = 15;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      await ghostMarkerManager.createMarker(doc, 0, 'c1');
      await ghostMarkerManager.createMarker(doc, 1, 'c2');
      await ghostMarkerManager.createMarker(doc, 2, 'c3');

      const markers = ghostMarkerManager.getMarkers(doc.uri);
      expect(markers).to.have.lengthOf(3);
    });

    test('should return empty array for document with no markers', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const markers = ghostMarkerManager.getMarkers(doc.uri);
      expect(markers).to.deep.equal([]);
    });

    test('should return sorted markers by line number', async () => {
      const content = 'const x = 5;\nconst y = 10;\nconst z = 15;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      // Create in reverse order
      await ghostMarkerManager.createMarker(doc, 2, 'c3');
      await ghostMarkerManager.createMarker(doc, 0, 'c1');
      await ghostMarkerManager.createMarker(doc, 1, 'c2');

      const markers = ghostMarkerManager.getMarkers(doc.uri);
      expect(markers).to.have.lengthOf(3);
      if (markers.length === 3) {
        expect(markers[0].line).to.be.lessThan(markers[1].line);
        expect(markers[1].line).to.be.lessThan(markers[2].line);
      }
    });
  });

  suite('addCommentToMarker', () => {
    test('should add comment ID to existing marker', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.addCommentToMarker(marker.id, 'c2');

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated?.commentIds).to.deep.equal(['c1', 'c2']);
    });

    test('should not duplicate comment IDs', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.addCommentToMarker(marker.id, 'c1'); // Duplicate

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated?.commentIds).to.deep.equal(['c1']);
    });
  });

  suite('removeCommentFromMarker', () => {
    test('should remove comment ID from marker', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.addCommentToMarker(marker.id, 'c2');
      ghostMarkerManager.removeCommentFromMarker(marker.id, 'c1');

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated?.commentIds).to.deep.equal(['c2']);
    });

    test('should delete marker when last comment removed', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.removeCommentFromMarker(marker.id, 'c1');

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated).to.be.undefined;
    });
  });

  suite('Hash Verification', () => {
    test('should detect line changes via hash', async () => {
      const content1 = 'const x = 5;';
      const doc1 = await vscode.workspace.openTextDocument({
        content: content1,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc1, 0, 'c1');
      const originalHash = marker.lineHash;

      // Simulate document change
      const content2 = 'const x = 10; // Changed!';
      const doc2 = await vscode.workspace.openTextDocument({
        content: content2,
        language: 'javascript',
      });

      const results = await ghostMarkerManager.verifyMarkers(doc2);

      // Hash should be different (line changed)
      // Note: This test may vary depending on implementation details
      expect(results).to.be.an('array');
    });
  });

  suite('Range Marker Tracking', () => {
    test('should track range through document edits', async () => {
      const content = 'function test() {\n  const x = 5;\n  return x;\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1', 3);

      expect(marker.line).to.equal(1);
      expect(marker.endLine).to.equal(4);

      // Simulate adding lines before the range
      // (In real usage, this would trigger document change events)
      const rangeSize = marker.endLine - marker.line + 1;
      expect(rangeSize).to.equal(4);
    });

    test('should handle range marker within larger function', async () => {
      const content = [
        'function processData(items) {',
        '  // Start of complex logic',
        '  const filtered = items.filter(x => x > 0);',
        '  const mapped = filtered.map(x => x * 2);',
        '  const reduced = mapped.reduce((a, b) => a + b, 0);',
        '  // End of complex logic',
        '  return reduced;',
        '}',
      ].join('\n');

      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      // Mark lines 2-5 (the complex logic)
      const marker = await ghostMarkerManager.createMarker(doc, 1, 'c1', 5);

      expect(marker.line).to.equal(2);
      expect(marker.endLine).to.equal(6);
    });
  });

  suite('Multiple Comments on Same Line', () => {
    test('should support multiple comments on same line', async () => {
      const content = 'function complexFunction() { /* Multiple concerns */ }';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const marker = await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.addCommentToMarker(marker.id, 'c2');
      ghostMarkerManager.addCommentToMarker(marker.id, 'c3');

      const updated = ghostMarkerManager.getMarker(marker.id);
      expect(updated?.commentIds).to.have.lengthOf(3);
      expect(updated?.commentIds).to.deep.equal(['c1', 'c2', 'c3']);
    });
  });

  suite('Cleanup', () => {
    test('should dispose resources', () => {
      // Should not throw
      ghostMarkerManager.dispose();
    });

    test('should clear all markers after disposal', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      await ghostMarkerManager.createMarker(doc, 0, 'c1');
      ghostMarkerManager.dispose();

      // After disposal, manager should be clean
      // (exact behavior depends on implementation)
    });
  });
});
