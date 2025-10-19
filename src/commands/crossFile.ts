/**
 * Cross-File Commands - UI wrappers for cross-file comment operations
 * v2.1.5
 */

import * as vscode from 'vscode';
import { moveComment, copyComment, bulkMoveComments, MoveCommentOptions, CopyCommentOptions, BulkMoveOptions } from './crossFileOperations';
import { CommentManager } from '../core/CommentManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';
import { FileSystemManager } from '../io/FileSystemManager';
import { DecorationManager } from '../ui/DecorationManager';

export function registerCrossFileCommands(
  context: vscode.ExtensionContext,
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager,
  fileSystemManager: FileSystemManager,
  decorationManager: DecorationManager
): void {
  // Command: pairedComments.moveComment
  const moveCommentCommand = vscode.commands.registerCommand(
    'pairedComments.moveComment',
    async () => {
      await handleMoveComment(commentManager, ghostMarkerManager, fileSystemManager, decorationManager);
    }
  );

  // Command: pairedComments.copyComment
  const copyCommentCommand = vscode.commands.registerCommand(
    'pairedComments.copyComment',
    async () => {
      await handleCopyComment(commentManager, ghostMarkerManager, fileSystemManager, decorationManager);
    }
  );

  // Command: pairedComments.bulkMoveComments
  const bulkMoveCommand = vscode.commands.registerCommand(
    'pairedComments.bulkMoveComments',
    async () => {
      await handleBulkMoveComments(commentManager, ghostMarkerManager, fileSystemManager, decorationManager);
    }
  );

  context.subscriptions.push(
    moveCommentCommand,
    copyCommentCommand,
    bulkMoveCommand
  );
}

/**
 * Handle move comment command
 */
async function handleMoveComment(
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager,
  fileSystemManager: FileSystemManager,
  decorationManager: DecorationManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const sourceUri = editor.document.uri;
  const currentLine = editor.selection.active.line + 1; // 1-indexed

  // Get comments at current line
  const comments = commentManager.getCommentsForLine(sourceUri, currentLine);
  if (comments.length === 0) {
    void vscode.window.showInformationMessage('No comments on this line');
    return;
  }

  // If multiple comments, let user select which one
  let selectedComment = comments[0];
  if (comments.length > 1) {
    const items = comments.map(c => ({
      label: c.text.substring(0, 50) + (c.text.length > 50 ? '...' : ''),
      description: `by ${c.author}`,
      comment: c
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select comment to move'
    });

    if (!selected) {
      return;
    }

    selectedComment = selected.comment;
  }

  if (!selectedComment) {
    return;
  }

  // Ask for target file
  const targetUri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    defaultUri: vscode.Uri.file(sourceUri.fsPath.replace(/\.[^/.]+$/, '')), // Same directory
    title: 'Select target file'
  });

  if (!targetUri || targetUri.length === 0) {
    return;
  }

  const target = targetUri[0];
  if (!target) {
    return;
  }

  // Ask for target line
  const targetLineStr = await vscode.window.showInputBox({
    prompt: `Move comment "${selectedComment.text.substring(0, 30)}..." to which line in ${target.fsPath}?`,
    placeHolder: 'e.g., 42',
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'Please enter a valid line number (>= 1)';
      }
      return null;
    }
  });

  if (!targetLineStr) {
    return;
  }

  const targetLine = parseInt(targetLineStr);

  // Ask about preserving metadata
  const preserveMetadata = await vscode.window.showQuickPick([
    { label: 'Yes', value: true, description: 'Keep AI metadata and parameters' },
    { label: 'No', value: false, description: 'Remove AI metadata and parameters' }
  ], {
    placeHolder: 'Preserve AI metadata and parameters?'
  });

  if (!preserveMetadata) {
    return;
  }

  try {
    const options: MoveCommentOptions = {
      commentId: selectedComment.id,
      sourceUri,
      targetUri: target,
      targetLine,
      preserveMetadata: preserveMetadata.value
    };

    await moveComment(options, fileSystemManager, ghostMarkerManager);

    // Refresh decorations
    await decorationManager.refreshDecorations(sourceUri);
    await decorationManager.refreshDecorations(target);

    void vscode.window.showInformationMessage(`Comment moved to ${target.fsPath}:${targetLine}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to move comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle copy comment command
 */
async function handleCopyComment(
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager,
  fileSystemManager: FileSystemManager,
  decorationManager: DecorationManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const sourceUri = editor.document.uri;
  const currentLine = editor.selection.active.line + 1; // 1-indexed

  // Get comments at current line
  const comments = commentManager.getCommentsForLine(sourceUri, currentLine);
  if (comments.length === 0) {
    void vscode.window.showInformationMessage('No comments on this line');
    return;
  }

  // If multiple comments, let user select which one
  let selectedComment = comments[0];
  if (comments.length > 1) {
    const items = comments.map(c => ({
      label: c.text.substring(0, 50) + (c.text.length > 50 ? '...' : ''),
      description: `by ${c.author}`,
      comment: c
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select comment to copy'
    });

    if (!selected) {
      return;
    }

    selectedComment = selected.comment;
  }

  if (!selectedComment) {
    return;
  }

  // Ask for target file
  const targetUri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    defaultUri: vscode.Uri.file(sourceUri.fsPath.replace(/\.[^/.]+$/, '')),
    title: 'Select target file'
  });

  if (!targetUri || targetUri.length === 0) {
    return;
  }

  const target = targetUri[0];
  if (!target) {
    return;
  }

  // Ask for target line
  const targetLineStr = await vscode.window.showInputBox({
    prompt: `Copy comment "${selectedComment.text.substring(0, 30)}..." to which line in ${target.fsPath}?`,
    placeHolder: 'e.g., 42',
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'Please enter a valid line number (>= 1)';
      }
      return null;
    }
  });

  if (!targetLineStr) {
    return;
  }

  const targetLine = parseInt(targetLineStr);

  // Ask about preserving metadata
  const preserveMetadata = await vscode.window.showQuickPick([
    { label: 'Yes', value: true, description: 'Keep AI metadata and parameters' },
    { label: 'No', value: false, description: 'Remove AI metadata and parameters' }
  ], {
    placeHolder: 'Preserve AI metadata and parameters?'
  });

  if (!preserveMetadata) {
    return;
  }

  try {
    const options: CopyCommentOptions = {
      commentId: selectedComment.id,
      sourceUri,
      targetUri: target,
      targetLine,
      preserveMetadata: preserveMetadata.value
    };

    await copyComment(options, fileSystemManager, ghostMarkerManager);

    // Refresh decorations for target file
    await decorationManager.refreshDecorations(target);

    void vscode.window.showInformationMessage(`Comment copied to ${target.fsPath}:${targetLine}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to copy comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle bulk move comments command
 */
async function handleBulkMoveComments(
  commentManager: CommentManager,
  ghostMarkerManager: GhostMarkerManager,
  fileSystemManager: FileSystemManager,
  decorationManager: DecorationManager
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const sourceUri = editor.document.uri;

  // Load all comments for current file
  const commentFile = await commentManager.loadComments(sourceUri);
  if (commentFile.comments.length === 0) {
    void vscode.window.showInformationMessage('No comments in this file');
    return;
  }

  // Let user select multiple comments
  const items = commentFile.comments.map(c => ({
    label: `Line ${c.line}: ${c.text.substring(0, 50)}...`,
    description: `${c.tag || 'NOTE'} by ${c.author}`,
    picked: false,
    commentId: c.id
  }));

  const selected = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: 'Select comments to move (multiple selection)'
  });

  if (!selected || selected.length === 0) {
    return;
  }

  const commentIds = selected.map(s => s.commentId);

  // Ask for target file
  const targetUri = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    defaultUri: vscode.Uri.file(sourceUri.fsPath.replace(/\.[^/.]+$/, '')),
    title: 'Select target file'
  });

  if (!targetUri || targetUri.length === 0) {
    return;
  }

  const target = targetUri[0];
  if (!target) {
    return;
  }

  // Ask for starting line
  const startLineStr = await vscode.window.showInputBox({
    prompt: `Move ${commentIds.length} comments starting at which line in ${target.fsPath}?`,
    placeHolder: 'e.g., 10',
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'Please enter a valid line number (>= 1)';
      }
      return null;
    }
  });

  if (!startLineStr) {
    return;
  }

  const targetStartLine = parseInt(startLineStr);

  // Ask about relative spacing
  const preserveSpacing = await vscode.window.showQuickPick([
    { label: 'Yes', value: true, description: 'Maintain relative line positions' },
    { label: 'No', value: false, description: 'Place consecutively' }
  ], {
    placeHolder: 'Preserve relative line spacing?'
  });

  if (!preserveSpacing) {
    return;
  }

  try {
    const options: BulkMoveOptions = {
      commentIds,
      sourceUri,
      targetUri: target,
      targetStartLine,
      preserveRelativeSpacing: preserveSpacing.value
    };

    await bulkMoveComments(options, fileSystemManager, ghostMarkerManager);

    // Refresh decorations
    await decorationManager.refreshDecorations(sourceUri);
    await decorationManager.refreshDecorations(target);

    void vscode.window.showInformationMessage(`${commentIds.length} comments moved to ${target.fsPath}`);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Failed to move comments: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
