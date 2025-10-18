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

  // Convert inline comment to paired comment (v2.0.8)
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.convertInlineToPaired', async () => {
      await convertInlineToPaired(deps);
    })
  );

  // Convert paired comment to inline comment (v2.0.8)
  context.subscriptions.push(
    vscode.commands.registerCommand('pairedComments.convertPairedToInline', async () => {
      await convertPairedToInline(deps);
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
 * Edit an existing comment - Opens paired view with cursor at end of comment text
 * v2.0.8 Critical UX Improvement
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

  if (!commentToEdit) {
    return;
  }

  try {
    // Open the paired view
    await deps.pairedViewManager.openPairedView(editor.document.uri);

    // Get session for sync control
    const session = deps.pairedViewManager.getSession(editor.document.uri);
    if (!session) {
      void vscode.window.showErrorMessage('Failed to get paired view session');
      return;
    }

    // Get the comments editor
    const commentsEditor = deps.pairedViewManager.getCommentsEditor(editor.document.uri);
    if (!commentsEditor) {
      void vscode.window.showErrorMessage('Failed to get comments editor');
      return;
    }

    // Search for the comment's text field in the JSON
    const commentText = await vscode.workspace.fs.readFile(commentsEditor.document.uri);
    const commentJsonText = Buffer.from(commentText).toString('utf8');
    const lines = commentJsonText.split('\n');

    // Find the line with this comment's "text" field
    let targetLine = 0;
    let targetColumn = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Look for "text": "..." pattern after finding the comment ID
      if (line.includes(`"id": "${commentToEdit.id}"`)) {
        // Found the comment, now find the text field (should be a few lines down)
        for (let j = i; j < Math.min(i + 20, lines.length); j++) {
          const textLine = lines[j];
          if (!textLine) continue;

          const textMatch = textLine.match(/"text":\s*"(.*)"/);
          if (textMatch) {
            targetLine = j;
            // Position cursor at the end of the text value, before the closing quote
            const textEnd = textLine.lastIndexOf('"');
            targetColumn = textEnd; // End of text, before closing quote
            break;
          }
        }
        break;
      }
    }

    // DISABLE AUTO-SCROLL while user is editing
    session.syncEnabled = false;

    // Navigate to the text field and place cursor at the end
    const position = new vscode.Position(targetLine, targetColumn);
    commentsEditor.selection = new vscode.Selection(position, position);
    commentsEditor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    // Focus the comments editor for editing
    await vscode.window.showTextDocument(commentsEditor.document, {
      viewColumn: commentsEditor.viewColumn,
      preserveFocus: false
    });

    // Set up listener to RE-ENABLE auto-scroll when user returns to source file
    const disposable = vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.uri.toString() === editor.document.uri.toString()) {
        session.syncEnabled = true;
        disposable.dispose();
      }
    });

    // Safety timeout
    setTimeout(() => {
      if (!session.syncEnabled) {
        session.syncEnabled = true;
      }
      disposable.dispose();
    }, 30000);

  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to edit comment: ${String(error)}`);
  }
}

/**
 * Delete a comment - Opens paired view to show comment before deletion
 * v2.0.8 Critical UX Improvement
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

  if (!commentToDelete) {
    return;
  }

  try {
    // Open the paired view to show the comment
    await deps.pairedViewManager.openPairedView(editor.document.uri);

    // Get the comments editor
    const commentsEditor = deps.pairedViewManager.getCommentsEditor(editor.document.uri);
    if (!commentsEditor) {
      void vscode.window.showErrorMessage('Failed to get comments editor');
      return;
    }

    // Get session for sync control
    const session = deps.pairedViewManager.getSession(editor.document.uri);
    if (session) {
      session.syncEnabled = false; // Disable auto-scroll during deletion
    }

    // Search for the comment in the JSON
    const commentText = await vscode.workspace.fs.readFile(commentsEditor.document.uri);
    const commentJsonText = Buffer.from(commentText).toString('utf8');
    const lines = commentJsonText.split('\n');

    // Find the line with this comment's ID
    let targetLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.includes(`"id": "${commentToDelete.id}"`)) {
        targetLine = i;
        break;
      }
    }

    // Navigate to the comment in the JSON
    const position = new vscode.Position(targetLine, 0);
    commentsEditor.selection = new vscode.Selection(position, position);
    commentsEditor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    // Focus the comments editor to show the comment
    await vscode.window.showTextDocument(commentsEditor.document, {
      viewColumn: commentsEditor.viewColumn,
      preserveFocus: false
    });

    // Confirm deletion with the comment visible
    const confirm = await vscode.window.showWarningMessage(
      `Delete comment "${commentToDelete.text.substring(0, 50)}..."?`,
      { modal: true },
      'Delete'
    );

    if (confirm !== 'Delete') {
      // Re-enable sync if user cancels
      if (session) {
        session.syncEnabled = true;
      }
      return;
    }

    // Perform the deletion
    await deps.commentManager.deleteComment(editor.document.uri, commentToDelete.id);
    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Comment deleted successfully');

    // Re-enable sync after deletion
    if (session) {
      session.syncEnabled = true;
    }

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

/**
 * Convert inline comment to paired comment
 * v2.0.8 Critical UX Feature - Manual Conversion
 */
async function convertInlineToPaired(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Prevent converting .comments files
  if (editor.document.uri.fsPath.endsWith('.comments')) {
    void vscode.window.showWarningMessage('Cannot convert comments in a .comments file');
    return;
  }

  const line = editor.selection.active.line; // 0-indexed
  const lineText = editor.document.lineAt(line).text;

  // Get language-specific comment syntax
  const languageId = editor.document.languageId;
  const { COMMENT_SYNTAX_MAP } = await import('../types.js');
  const syntax = COMMENT_SYNTAX_MAP[languageId];

  if (!syntax || !syntax.singleLine) {
    void vscode.window.showErrorMessage(`Unsupported language: ${languageId}`);
    return;
  }

  // Find inline comment on this line
  let commentStart = -1;
  let commentPrefix = '';
  for (const prefix of syntax.singleLine) {
    const index = lineText.indexOf(prefix);
    if (index !== -1 && (commentStart === -1 || index < commentStart)) {
      commentStart = index;
      commentPrefix = prefix;
    }
  }

  if (commentStart === -1) {
    void vscode.window.showInformationMessage(`No inline comment found on line ${line + 1}`);
    return;
  }

  // Extract the comment text (remove comment prefix and trim)
  const commentText = lineText.substring(commentStart + commentPrefix.length).trim();

  if (!commentText) {
    void vscode.window.showInformationMessage(`Empty comment on line ${line + 1}`);
    return;
  }

  // Check if there's already a paired comment on this line
  const existingComments = deps.commentManager.getCommentsForLine(editor.document.uri, line + 1);
  if (existingComments.length > 0) {
    const confirm = await vscode.window.showWarningMessage(
      `Line ${line + 1} already has ${existingComments.length} paired comment(s). Add another?`,
      'Add Anyway',
      'Cancel'
    );
    if (confirm !== 'Add Anyway') {
      return;
    }
  }

  try {
    // Add as paired comment
    await deps.commentManager.addComment(editor.document.uri, {
      line: line + 1, // Convert to 1-indexed
      text: commentText
    });

    // Ask if user wants to remove the inline comment
    const removeInline = await vscode.window.showInformationMessage(
      'Paired comment created! Remove the inline comment?',
      'Yes, Remove',
      'No, Keep Both'
    );

    if (removeInline === 'Yes, Remove') {
      // Remove the inline comment from the source file
      const edit = new vscode.WorkspaceEdit();
      const codeText = lineText.substring(0, commentStart).trimEnd();
      const range = new vscode.Range(
        new vscode.Position(line, 0),
        new vscode.Position(line, lineText.length)
      );
      edit.replace(editor.document.uri, range, codeText);
      await vscode.workspace.applyEdit(edit);
    }

    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Comment converted to paired format');

  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to convert comment: ${String(error)}`);
  }
}

/**
 * Convert paired comment to inline comment
 * v2.0.8 Critical UX Feature - Manual Conversion
 */
async function convertPairedToInline(deps: CommandDependencies): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showErrorMessage('No active editor');
    return;
  }

  // Prevent converting .comments files
  if (editor.document.uri.fsPath.endsWith('.comments')) {
    void vscode.window.showWarningMessage('Cannot convert comments in a .comments file');
    return;
  }

  const line = editor.selection.active.line + 1; // Convert to 1-indexed
  const comments = deps.commentManager.getCommentsForLine(editor.document.uri, line);

  if (comments.length === 0) {
    void vscode.window.showInformationMessage(`No paired comments on line ${line}`);
    return;
  }

  // If multiple comments, let user pick
  let commentToConvert = comments[0];
  if (comments.length > 1) {
    const items = comments.map(c => ({
      label: c.text.substring(0, 50) + (c.text.length > 50 ? '...' : ''),
      description: `by ${c.author}`,
      comment: c
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select comment to convert to inline'
    });

    if (!selected) {
      return;
    }

    commentToConvert = selected.comment;
  }

  if (!commentToConvert) {
    return;
  }

  // Get language-specific comment syntax
  const languageId = editor.document.languageId;
  const { COMMENT_SYNTAX_MAP } = await import('../types.js');
  const syntax = COMMENT_SYNTAX_MAP[languageId];

  if (!syntax || !syntax.singleLine || syntax.singleLine.length === 0) {
    void vscode.window.showErrorMessage(`Unsupported language: ${languageId}`);
    return;
  }

  const commentPrefix = syntax.singleLine[0]; // Use first available syntax
  const lineIndex = line - 1; // Convert back to 0-indexed
  const lineText = editor.document.lineAt(lineIndex).text;

  // Check if line already has an inline comment
  const hasInlineComment = syntax.singleLine.some((prefix: string) => lineText.includes(prefix));
  if (hasInlineComment) {
    const confirm = await vscode.window.showWarningMessage(
      `Line ${line} already has an inline comment. Add paired comment as inline anyway?`,
      'Yes, Add',
      'Cancel'
    );
    if (confirm !== 'Yes, Add') {
      return;
    }
  }

  try {
    // Add inline comment to source file
    const edit = new vscode.WorkspaceEdit();
    const inlineComment = `${commentPrefix} ${commentToConvert.text}`;
    const newLineText = lineText.trimEnd() + '  ' + inlineComment;
    const range = new vscode.Range(
      new vscode.Position(lineIndex, 0),
      new vscode.Position(lineIndex, lineText.length)
    );
    edit.replace(editor.document.uri, range, newLineText);
    await vscode.workspace.applyEdit(edit);

    // Ask if user wants to remove the paired comment
    const removePaired = await vscode.window.showInformationMessage(
      'Inline comment created! Remove the paired comment?',
      'Yes, Remove',
      'No, Keep Both'
    );

    if (removePaired === 'Yes, Remove') {
      await deps.commentManager.deleteComment(editor.document.uri, commentToConvert.id);
    }

    await deps.decorationManager.refreshDecorations(editor.document.uri);
    void vscode.window.showInformationMessage('Comment converted to inline format');

  } catch (error) {
    void vscode.window.showErrorMessage(`Failed to convert comment: ${String(error)}`);
  }
}
