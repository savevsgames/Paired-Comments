/**
 * E2E Activation Tests
 * These tests run in a real VS Code instance
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Tests', () => {
  test('Extension should be present', () => {
    const ext = vscode.extensions.getExtension('your-publisher.paired-comments');
    assert.ok(ext, 'Extension should be installed');
  });

  test('Extension should activate', async function() {
    this.timeout(5000);

    const ext = vscode.extensions.getExtension('your-publisher.paired-comments');
    assert.ok(ext, 'Extension must be present');

    await ext!.activate();
    assert.strictEqual(ext!.isActive, true, 'Extension should be active');
  });

  test('Core commands should be registered', async function() {
    this.timeout(5000);

    const commands = await vscode.commands.getCommands(true);

    // Check that our commands are registered
    const expectedCommands = [
      'pairedComments.addComment',
      'pairedComments.editComment',
      'pairedComments.deleteComment',
      'pairedComments.openPairedView',
      'pairedComments.showAllComments',
      'pairedComments.toggleScrollSync',
      'pairedComments.showCommands',
    ];

    for (const cmd of expectedCommands) {
      assert.ok(
        commands.includes(cmd),
        `Command ${cmd} should be registered`
      );
    }
  });

  test('Extension should not throw errors on activation', async function() {
    this.timeout(5000);

    let activationError: Error | undefined;

    try {
      const ext = vscode.extensions.getExtension('your-publisher.paired-comments');
      await ext?.activate();
    } catch (err) {
      activationError = err as Error;
    }

    assert.strictEqual(activationError, undefined, 'Extension should activate without errors');
  });
});
