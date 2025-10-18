/**
 * Command registration and handlers
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { PairedViewManager } from '../ui/PairedViewManager';
import { ScrollSyncManager } from '../ui/ScrollSyncManager';
import { DecorationManager } from '../ui/DecorationManager';
import { FileSystemManager } from '../io/FileSystemManager';

export interface CommandDependencies {
  commentManager: CommentManager;
  pairedViewManager: PairedViewManager;
  scrollSyncManager: ScrollSyncManager;
  decorationManager: DecorationManager;
  fileSystemManager: FileSystemManager;
}

/**
 * Register all extension commands
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  deps: CommandDependencies
): void {
  // Show command menu (Ctrl+Alt+P)
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.showMenu', async () => {
      await showCommandMenu(deps);
    })
  );

  // Open paired comments view
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.open', async () => {
      await openPairedComments(deps);
    })
  );

  // Open paired comments view and navigate to specific line
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.openAndNavigate', async (uri: vscode.Uri, line: number) => {
      await openAndNavigateToComment(deps, uri, line);
    })
  );

  // Add a new comment (RESERVED for future auto-detect/smart add - v2.0.7+)
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.addComment', async () => {
      await addComment(deps);
    })
  );

  // Add a single-line comment (Ctrl+Alt+P S)
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.addSingleComment', async () => {
      await addSingleComment(deps);
    })
  );

  // Add a range comment (Ctrl+Alt+P R)
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.addRangeComment', async () => {
      await addRangeComment(deps);
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

  // Future features - Copy all comments
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.copyAllComments', async () => {
      await copyAllComments(deps);
    })
  );

  // Future features - Export comments
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.exportComments', async () => {
      await exportComments(deps);
    })
  );

  // Future features - Import comments
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.importComments', async () => {
      await importComments(deps);
    })
  );

  // Future features - Find in comments
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.findInComments', async () => {
      await findInComments(deps);
    })
  );

  // Future features - Next comment
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.nextComment', async () => {
      await nextComment(deps);
    })
  );

  // Future features - Previous comment
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.previousComment', async () => {
      await previousComment(deps);
    })
  );

  // Toggle .comments files visibility
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.toggleCommentFilesVisibility', async () => {
      await toggleCommentFilesVisibility();
    })
  );

  // Restore from backup
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.restoreFromBackup', async () => {
      await restoreFromBackup(deps);
    })
  );
}

/**
 * Show command menu with all available commands
 */
async function showCommandMenu(_deps: CommandDependencies): Promise<void> {
  interface CommandMenuItem {
    label: string;
    description: string;
    detail: string;
    key: string;
    command: string;
  }

  const menuItems: CommandMenuItem[] = [
    {
      label: '$(comment-discussion) O - Open Paired Comments',
      description: 'Open side-by-side view',
      detail: 'Open the .comments file next to your source file',
      key: 'O',
      command: 'pairedComments.open'
    },
    {
      label: '$(note) S - Add Single-Line Comment',
      description: 'Add comment to current line',
      detail: 'Create a single-line comment at cursor position',
      key: 'S',
      command: 'pairedComments.addSingleComment'
    },
    {
      label: '$(symbol-array) R - Add Range Comment',
      description: 'Add comment for line range',
      detail: 'Create a comment spanning multiple lines',
      key: 'R',
      command: 'pairedComments.addRangeComment'
    },
    {
      label: '$(edit) E - Edit Comment',
      description: 'Edit comment on current line',
      detail: 'Modify an existing comment on the current line',
      key: 'E',
      command: 'pairedComments.editComment'
    },
    {
      label: '$(trash) D - Delete Comment',
      description: 'Delete comment on current line',
      detail: 'Remove a comment from the current line',
      key: 'D',
      command: 'pairedComments.deleteComment'
    },
    {
      label: '$(list-unordered) L - List All Comments',
      description: 'View all comments in file',
      detail: 'Quick pick list of all comments with jump-to functionality',
      key: 'L',
      command: 'pairedComments.showAllComments'
    },
    {
      label: '$(sync) T - Toggle Scroll Sync',
      description: 'Enable/disable synchronized scrolling',
      detail: 'Keep source and comments files in sync while scrolling',
      key: 'T',
      command: 'pairedComments.toggleSync'
    },
    {
      label: '$(copy) C - Copy All Comments',
      description: 'Copy to clipboard',
      detail: 'Copy all comments in the current file to clipboard',
      key: 'C',
      command: 'pairedComments.copyAllComments'
    },
    {
      label: '$(export) X - Export Comments',
      description: 'Export to external file',
      detail: 'Export comments to markdown, JSON, or other formats',
      key: 'X',
      command: 'pairedComments.exportComments'
    },
    {
      label: '$(import) I - Import Comments',
      description: 'Import from external file',
      detail: 'Import comments from another file or project',
      key: 'I',
      command: 'pairedComments.importComments'
    },
    {
      label: '$(search) F - Find in Comments',
      description: 'Search through comments',
      detail: 'Search for text across all comments in the file',
      key: 'F',
      command: 'pairedComments.findInComments'
    },
    {
      label: '$(arrow-down) N - Next Comment',
      description: 'Jump to next comment',
      detail: 'Navigate to the next comment in the file',
      key: 'N',
      command: 'pairedComments.nextComment'
    },
    {
      label: '$(arrow-up) B - Previous Comment',
      description: 'Jump to previous comment',
      detail: 'Navigate to the previous comment in the file (B for Back)',
      key: 'B',
      command: 'pairedComments.previousComment'
    },
    {
      label: '$(eye) Toggle .comments Visibility',
      description: 'Show/hide .comments files',
      detail: 'Toggle visibility of .comments files in file explorer',
      key: '',
      command: 'pairedComments.toggleCommentFilesVisibility'
    }
  ];

  const selected = await vscode.window.showQuickPick(menuItems, {
    placeHolder: 'Paired Comments - Select a command (or press the letter key)',
    matchOnDescription: true,
    matchOnDetail: true,
    title: '💬 Paired Comments Menu'
  });

  if (selected) {
    await vscode.commands.executeCommand(selected.command);
  }
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

  // Prevent opening paired view for .comments files
  if (editor.document.uri.fsPath.endsWith('.comments')) {
    void vscode.window.showWarningMessage('Cannot create comments for a .comments file');
    return;
  }

  try {
    await deps.pairedViewManager.openPairedView(editor.document.uri);
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to open paired comments: ${String(error)}`);
  }
}

/**
 * Open paired comments view and navigate to specific line
 */
async function openAndNavigateToComment(
  deps: CommandDependencies,
  sourceUri: vscode.Uri,
  sourceLine: number
): Promise<void> {
  try {
    // Open the paired view
    await deps.pairedViewManager.openPairedView(sourceUri);

    // Get session for sync control
    const session = deps.pairedViewManager.getSession(sourceUri);
    if (!session) {
      void vscode.window.showErrorMessage('Failed to get paired view session');
      return;
    }

    // Get the comments editor
    const commentsEditor = deps.pairedViewManager.getCommentsEditor(sourceUri);
    if (!commentsEditor) {
      void vscode.window.showErrorMessage('Failed to get comments editor');
      return;
    }

    // Load comments to find the position in the .comments file
    const commentFile = await deps.commentManager.loadComments(sourceUri);

    // Find comments on this line
    const commentsOnLine = commentFile.comments.filter(c => c.line === sourceLine);
    if (commentsOnLine.length === 0) {
      return;
    }

    // Find the first comment's position in the comments array
    const firstComment = commentsOnLine[0];
    if (!firstComment) {
      return;
    }

    // Search for the comment ID in the JSON file
    const commentText = await vscode.workspace.fs.readFile(commentsEditor.document.uri);
    const commentJsonText = Buffer.from(commentText).toString('utf8');
    const lines = commentJsonText.split('\n');

    // Find the line with this comment's ID
    let targetLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.includes(`"id": "${firstComment.id}"`)) {
        targetLine = i;
        break;
      }
    }

    // DISABLE AUTO-SCROLL while user is viewing the comment JSON
    session.syncEnabled = false;
    console.log('[OpenAndNavigate] Disabled auto-scroll for comment navigation');

    // Navigate to that line in the comments editor
    const position = new vscode.Position(targetLine, 0);
    commentsEditor.selection = new vscode.Selection(position, position);
    commentsEditor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    // Focus the comments editor (user is now viewing JSON)
    await vscode.window.showTextDocument(commentsEditor.document, {
      viewColumn: commentsEditor.viewColumn,
      preserveFocus: false
    });

    // Set up listener to RE-ENABLE auto-scroll when user returns to source file
    const disposable = vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.uri.toString() === sourceUri.toString()) {
        // User switched back to source file - re-enable auto-scroll
        session.syncEnabled = true;
        console.log('[OpenAndNavigate] Re-enabled auto-scroll (user returned to source)');
        disposable.dispose(); // Clean up this listener
      }
    });

    // Also clean up after 30 seconds (safety timeout)
    setTimeout(() => {
      if (!session.syncEnabled) {
        session.syncEnabled = true;
        console.log('[OpenAndNavigate] Re-enabled auto-scroll (timeout)');
      }
      disposable.dispose();
    }, 30000);

  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to open and navigate: ${String(error)}`);
  }
}

/**
 * Add a new comment (AUTO-DETECT - RESERVED for v2.0.7+)
 *
 * TODO v2.0.7: Implement smart auto-detect:
 * - Detect multi-line selection → create range comment
 * - Single line or no selection → create single-line comment
 * - Or: Implement "double-tap A" to convert single → range
 */
async function addComment(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage(
    'Smart Add (Ctrl+Alt+P A) is reserved for v2.0.7+. Use:\n' +
    '• Ctrl+Alt+P S for Single-line comments\n' +
    '• Ctrl+Alt+P R for Range comments'
  );
}

/**
 * Add a single-line comment (Ctrl+Alt+P S)
 */
async function addSingleComment(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Prevent adding comments to .comments files
  if (editor.document.uri.fsPath.endsWith('.comments')) {
    void vscode.window.showWarningMessage('Cannot add comments to a .comments file');
    return;
  }

  // Use cursor line (ignore any selection)
  const line = editor.selection.active.line + 1; // Convert to 1-indexed

  const text = await vscode.window.showInputBox({
    prompt: `Add single-line comment for line ${line}`,
    placeHolder: 'Enter your comment...',
  });

  if (!text) {
    return; // User cancelled
  }

  try {
    await deps.commentManager.addComment(editor.document.uri, { line, text });
    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Single-line comment added successfully');
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to add comment: ${String(error)}`);
  }
}

/**
 * Add a range comment (Ctrl+Alt+P R)
 */
async function addRangeComment(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Prevent adding comments to .comments files
  if (editor.document.uri.fsPath.endsWith('.comments')) {
    void vscode.window.showWarningMessage('Cannot add comments to a .comments file');
    return;
  }

  // Get start line from cursor
  const startLine = editor.selection.active.line + 1; // Convert to 1-indexed

  // Ask for end line
  const endLineStr = await vscode.window.showInputBox({
    prompt: `Range comment starting at line ${startLine}. Enter end line number:`,
    placeHolder: `e.g., ${startLine + 5}`,
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num)) {
        return 'Please enter a valid line number';
      }
      if (num <= startLine) {
        return `End line must be greater than ${startLine}`;
      }
      if (num > editor.document.lineCount) {
        return `File only has ${editor.document.lineCount} lines`;
      }
      return null;
    }
  });

  if (!endLineStr) {
    return; // User cancelled
  }

  const endLine = parseInt(endLineStr);

  // Ask for comment text
  const text = await vscode.window.showInputBox({
    prompt: `Add range comment for lines ${startLine}-${endLine}`,
    placeHolder: 'Enter your comment...',
  });

  if (!text) {
    return; // User cancelled
  }

  try {
    await deps.commentManager.addComment(editor.document.uri, { line: startLine, endLine, text });
    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage(`Range comment added for lines ${startLine}-${endLine}`);
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to add range comment: ${String(error)}`);
  }
}

/**
 * Edit an existing comment
 */
async function editComment(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const line = editor.selection.active.line + 1; // Convert to 1-indexed
  const comments = deps.commentManager.getCommentsForLine(editor.document.uri, line);

  if (comments.length === 0) {
    void vscode.window.showInformationMessage(`No comments on line ${line}`);
    return;
  }

  // If multiple comments, let user pick
  let commentToEdit = comments[0];
  if (comments.length > 1) {
    const items = comments.map(c => ({
      label: c.text.substring(0, 50) + (c.text.length > 50 ? '...' : ''),
      description: `by ${c.author}`,
      comment: c
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select comment to edit'
    });

    if (!selected) {
      return;
    }

    commentToEdit = selected.comment;
  }

  // Get new text
  const newText = await vscode.window.showInputBox({
    prompt: `Edit comment for line ${line}`,
    value: commentToEdit?.text || '',
    placeHolder: 'Enter your comment...'
  });

  if (!newText || !commentToEdit) {
    return; // User cancelled
  }

  try {
    await deps.commentManager.updateComment(editor.document.uri, {
      id: commentToEdit.id,
      text: newText
    });
    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Comment updated successfully');
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to update comment: ${String(error)}`);
  }
}

/**
 * Delete a comment
 */
async function deleteComment(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  const line = editor.selection.active.line + 1; // Convert to 1-indexed
  const comments = deps.commentManager.getCommentsForLine(editor.document.uri, line);

  if (comments.length === 0) {
    void vscode.window.showInformationMessage(`No comments on line ${line}`);
    return;
  }

  // If multiple comments, let user pick
  let commentToDelete = comments[0];
  if (comments.length > 1) {
    const items = comments.map(c => ({
      label: c.text.substring(0, 50) + (c.text.length > 50 ? '...' : ''),
      description: `by ${c.author}`,
      comment: c
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select comment to delete'
    });

    if (!selected) {
      return;
    }

    commentToDelete = selected.comment;
  }

  // Confirm deletion
  if (!commentToDelete) {
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Delete comment "${commentToDelete.text.substring(0, 50)}..."?`,
    { modal: true },
    'Delete'
  );

  if (confirm !== 'Delete') {
    return;
  }

  try {
    await deps.commentManager.deleteComment(editor.document.uri, commentToDelete.id);
    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Comment deleted successfully');
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to delete comment: ${String(error)}`);
  }
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
async function showAllComments(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  try {
    const commentFile = await deps.commentManager.loadComments(editor.document.uri);

    if (commentFile.comments.length === 0) {
      void vscode.window.showInformationMessage('No comments in this file');
      return;
    }

    // Create quick pick items with tag indicators
    const items = commentFile.comments.map(c => {
      const tagEmoji = c.tag ? getTagEmoji(c.tag) : '💬';
      const tagLabel = c.tag ? `[${c.tag}] ` : '';

      return {
        label: `${tagEmoji} Line ${c.line}: ${tagLabel}${c.text.substring(0, 50)}${c.text.length > 50 ? '...' : ''}`,
        description: `by ${c.author}`,
        detail: c.text,
        line: c.line,
        tag: c.tag
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a comment to jump to',
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (!selected) {
      return;
    }

    // Jump to the line
    const line = selected.line - 1; // Convert to 0-indexed
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to load comments: ${String(error)}`);
  }
}

/**
 * Get emoji for comment tag
 */
function getTagEmoji(tag: string): string {
  const emojiMap: Record<string, string> = {
    'TODO': '📝',
    'FIXME': '🔥',
    'NOTE': '📌',
    'QUESTION': '❓',
    'HACK': '⚠️',
    'WARNING': '⚡',
    'STAR': '⭐'
  };
  return emojiMap[tag] || '💬';
}

/**
 * Copy all comments to clipboard
 * Future feature - Not yet implemented
 */
async function copyAllComments(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage('Copy all comments - Feature not yet implemented');
}

/**
 * Export comments to file
 * Future feature - Not yet implemented
 */
async function exportComments(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage('Export comments - Feature not yet implemented');
}

/**
 * Import comments from file
 * Future feature - Not yet implemented
 */
async function importComments(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage('Import comments - Feature not yet implemented');
}

/**
 * Find/search in comments
 * Future feature - Not yet implemented
 */
async function findInComments(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage('Find in comments - Feature not yet implemented');
}

/**
 * Navigate to next comment
 * Future feature - Not yet implemented
 */
async function nextComment(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage('Next comment - Feature not yet implemented');
}

/**
 * Navigate to previous comment
 * Future feature - Not yet implemented
 */
async function previousComment(_deps: CommandDependencies): Promise<void> {
  void vscode.window.showInformationMessage('Previous comment - Feature not yet implemented');
}

/**
 * Toggle visibility of .comments files in explorer
 */
async function toggleCommentFilesVisibility(): Promise<void> {
  const config = vscode.workspace.getConfiguration('pairedComments');
  const currentValue = config.get<boolean>('hideCommentFiles', true);

  await config.update('hideCommentFiles', !currentValue, vscode.ConfigurationTarget.Global);

  // Update files.exclude setting
  const filesConfig = vscode.workspace.getConfiguration('files');
  const exclude = filesConfig.get<Record<string, boolean>>('exclude') || {};

  if (!currentValue) {
    // Hide .comments files
    exclude['**/*.comments'] = true;
  } else {
    // Show .comments files
    delete exclude['**/*.comments'];
  }

  await filesConfig.update('exclude', exclude, vscode.ConfigurationTarget.Global);

  const status = !currentValue ? 'hidden' : 'visible';
  void vscode.window.showInformationMessage(`.comments files are now ${status}`);
}

/**
 * Restore .comments file from backup
 * v2.0.7 Error Handling feature
 */
async function restoreFromBackup(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Get source URI (strip .comments extension if present)
  const sourceUri = editor.document.uri.fsPath.endsWith('.comments')
    ? vscode.Uri.file(editor.document.uri.fsPath.replace(/\.comments$/, ''))
    : editor.document.uri;

  // Confirm restoration
  const confirm = await vscode.window.showWarningMessage(
    'Restore .comments file from the most recent backup? This will overwrite the current file.',
    { modal: true },
    'Restore',
    'Cancel'
  );

  if (confirm !== 'Restore') {
    return;
  }

  try {
    const success = await deps.fileSystemManager.restoreFromBackup(sourceUri);

    if (success) {
      // Reload comments after restore
      await deps.commentManager.reloadComments(sourceUri);
      await deps.decorationManager.refreshDecorations(sourceUri);
    } else {
      void vscode.window.showWarningMessage('No backup files found for this source file');
    }
  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to restore from backup: ${String(error)}`);
  }
}
