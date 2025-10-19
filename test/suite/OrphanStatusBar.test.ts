/**
 * Unit tests for OrphanStatusBar (v2.1.3+)
 *
 * Tests orphan count display and global vs local messaging
 */

import * as assert from 'assert';
import { OrphanStatusBar } from '../../src/ui/OrphanStatusBar';

suite('OrphanStatusBar Tests', () => {
  let statusBar: OrphanStatusBar;

  setup(() => {
    statusBar = new OrphanStatusBar();
  });

  teardown(() => {
    statusBar.dispose();
  });

  test('should initialize with zero counts', () => {
    assert.strictEqual(statusBar.getLocalCount(), 0, 'Local count should be 0');
    assert.strictEqual(statusBar.getGlobalCount(), 0, 'Global count should be 0');
    assert.strictEqual(statusBar.getCount(), 0, 'Legacy count should be 0');
  });

  test('updateCount() with only local count should update both counts', () => {
    statusBar.updateCount(3);

    assert.strictEqual(statusBar.getLocalCount(), 3, 'Local count should be 3');
    assert.strictEqual(statusBar.getGlobalCount(), 3, 'Global count should default to local count');
    assert.strictEqual(statusBar.getCount(), 3, 'Legacy count should return global count');
  });

  test('updateCount() with both counts should update separately', () => {
    statusBar.updateCount(1, 5); // 1 local, 5 global

    assert.strictEqual(statusBar.getLocalCount(), 1, 'Local count should be 1');
    assert.strictEqual(statusBar.getGlobalCount(), 5, 'Global count should be 5');
    assert.strictEqual(statusBar.getCount(), 5, 'Legacy count should return global count');
  });

  test('updateCount() with zero should clear counts', () => {
    statusBar.updateCount(5);
    assert.strictEqual(statusBar.getGlobalCount(), 5, 'Should have count');

    statusBar.updateCount(0);
    assert.strictEqual(statusBar.getLocalCount(), 0, 'Local count should be cleared');
    assert.strictEqual(statusBar.getGlobalCount(), 0, 'Global count should be cleared');
  });

  test('updateCount() should handle same local and global counts', () => {
    statusBar.updateCount(3, 3); // Same count

    assert.strictEqual(statusBar.getLocalCount(), 3, 'Local count should be 3');
    assert.strictEqual(statusBar.getGlobalCount(), 3, 'Global count should be 3');
  });

  test('updateCount() should handle zero local with non-zero global', () => {
    statusBar.updateCount(0, 5); // No orphans in current file, but 5 in workspace

    assert.strictEqual(statusBar.getLocalCount(), 0, 'Local count should be 0');
    assert.strictEqual(statusBar.getGlobalCount(), 5, 'Global count should be 5');
  });

  test('updateCount() should handle non-zero local with zero global', () => {
    // This shouldn't happen in practice, but test edge case
    statusBar.updateCount(3, 0);

    assert.strictEqual(statusBar.getLocalCount(), 3, 'Local count should be 3');
    assert.strictEqual(statusBar.getGlobalCount(), 0, 'Global count should be 0');
  });

  test('multiple updateCount() calls should replace previous counts', () => {
    statusBar.updateCount(2, 5);
    assert.strictEqual(statusBar.getLocalCount(), 2);
    assert.strictEqual(statusBar.getGlobalCount(), 5);

    statusBar.updateCount(1, 3);
    assert.strictEqual(statusBar.getLocalCount(), 1, 'Should update to new local count');
    assert.strictEqual(statusBar.getGlobalCount(), 3, 'Should update to new global count');
  });

  test('updateCount() should handle large numbers', () => {
    statusBar.updateCount(999, 9999);

    assert.strictEqual(statusBar.getLocalCount(), 999);
    assert.strictEqual(statusBar.getGlobalCount(), 9999);
  });

  test('legacy getCount() method should return global count for backward compatibility', () => {
    statusBar.updateCount(1, 5);

    // Legacy code expects getCount() to return total count
    assert.strictEqual(statusBar.getCount(), 5, 'Legacy method should return global count');
  });
});
