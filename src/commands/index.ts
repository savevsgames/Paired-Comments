/**
 * Command registration and handlers
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { PairedViewManager } from '../ui/PairedViewManager';
import { ScrollSyncManager } from '../ui/ScrollSyncManager';
import { DecorationManager } from '../ui/DecorationManager';

export interface CommandDependencies {
  commentManager: CommentManager;
  pairedViewManager: PairedViewManager;
  scrollSyncManager: ScrollSyncManager;
  decorationManager: DecorationManager;
}

/**
 * Register all extension commands
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  deps: CommandDependencies
): void {
  // Open paired comments view
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.open', async () => {
      await openPairedComments(deps);
    })
  );

  // Add a new comment
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.addComment', async () => {
      await addComment(deps);
    })
  );

  // Edit an existing comment
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.editComment', async () => {
      await editComment(deps);
    })
  );

  // Delete a comment
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.deleteComment', async () => {
      await deleteComment(deps);
    })
  );

  // Toggle scroll sync
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.toggleSync', async () => {
      await toggleSync(deps);
    })
  );

  // Show all comments in quick pick
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.showAllComments', async () => {
      await showAllComments(deps);
    })
  );
}

/**
 * Open paired comments view
 */
async function openPairedComments(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  try {
    await deps.pairedViewManager.openPairedView(editor.document.uri);
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to open paired comments: ${String(error)}`);
  }
}

/**
 * Add a new comment
 */
async function addComment(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const line = editor.selection.active.line + 1; // Convert to 1-indexed
  const text = await vscode.window.showInputBox({
    prompt: `Add comment for line ${line}`,
    placeHolder: 'Enter your comment...',
  });

  if (!text) {
    return; // User cancelled
  }

  try {
    await deps.commentManager.addComment(editor.document.uri, { line, text });
    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Comment added successfully');
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to add comment: ${String(error)}`);
  }
}

/**
 * Edit an existing comment
 */
async function editComment(_deps: CommandDependencies): Promise<void> {
  // TODO: Implement
  void vscode.window.showInformationMessage('Edit comment - Not implemented yet');
}

/**
 * Delete a comment
 */
async function deleteComment(_deps: CommandDependencies): Promise<void> {
  // TODO: Implement
  void vscode.window.showInformationMessage('Delete comment - Not implemented yet');
}

/**
 * Toggle scroll sync
 */
async function toggleSync(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const enabled = deps.scrollSyncManager.toggleSync(editor.document.uri);
  void vscode.window.showInformationMessage(
    `Scroll sync ${enabled ? 'enabled' : 'disabled'}`
  );
}

/**
 * Show all comments in quick pick
 */
async function showAllComments(_deps: CommandDependencies): Promise<void> {
  // TODO: Implement
  void vscode.window.showInformationMessage('Show all comments - Not implemented yet');
}
