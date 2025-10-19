/**
 * Orphan Detection Commands
 * v2.1.3
 */

import * as vscode from 'vscode';
import { OrphanDetector, OrphanedComment } from '../core/OrphanDetector';
import { CommentManager } from '../core/CommentManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';
import { DecorationManager } from '../ui/DecorationManager';

export function registerOrphanCommands(
  context: vscode.ExtensionContext,
  orphanDetector: OrphanDetector,
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager,
  decorationManager: DecorationManager
): void {
  // Command: pairedComments.detectOrphans
  const detectOrphansCommand = vscode.commands.registerCommand(
    'pairedComments.detectOrphans',
    async () => {
      await detectOrphans(orphanDetector, commentManager, ghostMarkerManager);
    }
  );

  // Command: pairedComments.reanchorComment
  const reanchorCommentCommand = vscode.commands.registerCommand(
    'pairedComments.reanchorComment',
    async (args?: { uri: string; line: number }) => {
      await reanchorComment(args, commentManager, ghostMarkerManager, decorationManager);
    }
  );

  // Command: pairedComments.showOrphanReport
  const showOrphanReportCommand = vscode.commands.registerCommand(
    'pairedComments.showOrphanReport',
    async () => {
      await showOrphanReport(orphanDetector, commentManager, ghostMarkerManager);
    }
  );

  context.subscriptions.push(
    detectOrphansCommand,
    reanchorCommentCommand,
    showOrphanReportCommand
  );
}

/**
 * Detect orphaned comments in the current file
 */
async function detectOrphans(
  orphanDetector: OrphanDetector,
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  try {
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Detecting orphaned comments...',
      cancellable: false
    }, async (_progress) => {
      const orphans = await orphanDetector.detectOrphansInFile(
        editor.document.uri.fsPath,
        editor.document
      );

      if (orphans.length === 0) {
        void vscode.window.showInformationMessage('✅ No orphaned comments found');
      } else {
        const message = `⚠️ Found ${orphans.length} orphaned comment${orphans.length === 1 ? '' : 's'}`;
        const action = await vscode.window.showWarningMessage(
          message,
          'View Report',
          'Dismiss'
        );

        if (action === 'View Report') {
          await showOrphanReport(orphanDetector, commentManager, ghostMarkerManager);
        }
      }
    });
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to detect orphans: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Re-anchor an orphaned comment
 */
async function reanchorComment(
  args: { uri: string; line: number } | undefined,
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager,
  decorationManager: DecorationManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Get line from args or current cursor position
  const line = args ? args.line : editor.selection.active.line + 1;
  const uri = args ? vscode.Uri.parse(args.uri) : editor.document.uri;

  const comments = commentManager.getCommentsForLine(uri, line);
  if (comments.length === 0) {
    void vscode.window.showInformationMessage(`No comments on line ${line}`);
    return;
  }

  // Let user pick which comment to re-anchor if multiple
  let selectedComment = comments[0];
  if (comments.length > 1) {
    const items = comments.map(c => ({
      label: c.text.substring(0, 50) + (c.text.length > 50 ? '...' : ''),
      description: `by ${c.author}`,
      comment: c
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select comment to re-anchor'
    });

    if (!selected) {
      return;
    }

    selectedComment = selected.comment;
  }

  if (!selectedComment) {
    return;
  }

  // Ask for new line number
  const newLineStr = await vscode.window.showInputBox({
    prompt: `Re-anchor comment "${selectedComment.text.substring(0, 30)}..." to which line?`,
    placeHolder: 'e.g., 42',
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) {
        return 'Please enter a valid line number';
      }
      if (num < 1 || num > editor.document.lineCount) {
        return `Line must be between 1 and ${editor.document.lineCount}`;
      }
      return null;
    }
  });

  if (!newLineStr) {
    return;
  }

  const newLine = parseInt(newLineStr);

  try {
    // Update comment line
    const commentFile = await commentManager.loadComments(uri);
    const comment = commentFile.comments.find(c => c.id === selectedComment!.id);
    if (!comment) {
      void vscode.window.showErrorMessage('Comment not found');
      return;
    }

    comment.line = newLine;
    comment.updated = new Date().toISOString();

    // Create new ghost marker at new location
    const newMarker = await ghostMarkerManager.createMarker(
      editor.document,
      newLine,
      [comment.id]
    );

    comment.ghostMarkerId = newMarker.id;

    // Save changes
    await commentManager.saveComments(uri, commentFile);

    // Refresh decorations
    await decorationManager.refreshDecorations(uri);

    void vscode.window.showInformationMessage(`Comment re-anchored to line ${newLine}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to re-anchor comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Show orphan report in quick pick
 */
async function showOrphanReport(
  orphanDetector: OrphanDetector,
  commentManager: CommentManager,
  _ghostMarkerManager: GhostMarkerManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  try {
    const orphans = await orphanDetector.detectOrphansInFile(
      editor.document.uri.fsPath,
      editor.document
    );

    if (orphans.length === 0) {
      void vscode.window.showInformationMessage('✅ No orphaned comments found');
      return;
    }

    // Create quick pick items
    interface OrphanQuickPickItem extends vscode.QuickPickItem {
      orphan: OrphanedComment;
    }

    const items: OrphanQuickPickItem[] = orphans.map((orphan: OrphanedComment) => ({
      label: `$(warning) Line ${orphan.marker.line}: ${orphan.comment.text.substring(0, 50)}...`,
      description: `${orphan.status.confidence}% confidence`,
      detail: `Reason: ${orphan.status.reason}${orphan.status.suggestedLocation ? ` | Suggested: Line ${orphan.status.suggestedLocation.line}` : ''}`,
      orphan
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `${orphans.length} orphaned comment${orphans.length === 1 ? '' : 's'} - Select to navigate`,
      title: '⚠️ Orphaned Comments Report'
    });

    if (!selected) {
      return;
    }

    // Navigate to the orphaned comment
    const line = selected.orphan.marker.line - 1; // 0-indexed
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    // Ask what to do
    const action = await vscode.window.showQuickPick([
      { label: '$(link) Re-anchor Comment', action: 'reanchor' },
      { label: '$(search) Find Symbol', action: 'find' },
      { label: '$(trash) Delete Comment', action: 'delete' },
      { label: '$(close) Cancel', action: 'cancel' }
    ], {
      placeHolder: 'What would you like to do?'
    });

    if (!action || action.action === 'cancel') {
      return;
    }

    switch (action.action) {
      case 'reanchor':
        await vscode.commands.executeCommand('pairedComments.reanchorComment', {
          uri: editor.document.uri.toString(),
          line: selected.orphan.marker.line
        });
        break;
      case 'find':
        if (selected.orphan.status.suggestedLocation) {
          const suggestedLine = selected.orphan.status.suggestedLocation.line - 1;
          const suggestedPosition = new vscode.Position(suggestedLine, 0);
          editor.selection = new vscode.Selection(suggestedPosition, suggestedPosition);
          editor.revealRange(
            new vscode.Range(suggestedPosition, suggestedPosition),
            vscode.TextEditorRevealType.InCenter
          );
        } else {
          void vscode.window.showInformationMessage('No suggested location available');
        }
        break;
      case 'delete':
        await commentManager.deleteComment(editor.document.uri, selected.orphan.comment.id);
        void vscode.window.showInformationMessage('Orphaned comment deleted');
        break;
    }
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to show orphan report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
