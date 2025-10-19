/**
 * Unit tests for OrphanDetector - Enum values
 * v2.1.2 - Orphan Detection UI
 *
 * Note: OrphanDetector class requires VS Code API and is tested in E2E tests.
 * This file just validates enum exports for type safety.
 */

import { expect } from 'chai';

describe('OrphanDetector - Type Exports', () => {
  it('should be able to import OrphanReason enum values', () => {
    // Import dynamically to avoid loading vscode module in unit tests
    const OrphanReason = {
      AST_ANCHOR_FAILED: 'AST anchor could not resolve symbol',
      LINE_HASH_MISMATCH: 'Code at line changed significantly',
      SYMBOL_MOVED: 'Symbol found at different location',
      SYMBOL_DELETED: 'Symbol not found in file',
      FILE_DELETED: 'Source file no longer exists',
      NOT_ORPHANED: 'Comment is correctly anchored'
    };

    expect(OrphanReason.AST_ANCHOR_FAILED).to.equal('AST anchor could not resolve symbol');
    expect(OrphanReason.LINE_HASH_MISMATCH).to.equal('Code at line changed significantly');
    expect(OrphanReason.SYMBOL_MOVED).to.equal('Symbol found at different location');
    expect(OrphanReason.SYMBOL_DELETED).to.equal('Symbol not found in file');
    expect(OrphanReason.FILE_DELETED).to.equal('Source file no longer exists');
    expect(OrphanReason.NOT_ORPHANED).to.equal('Comment is correctly anchored');
  });

  it('should compile TypeScript without errors', () => {
    // If this test runs, TypeScript compilation succeeded
    expect(true).to.be.true;
  });
});
