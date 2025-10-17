/**
 * Main extension entry point for Paired Comments
 */

import * as vscode from 'vscode';
import { CommentManager } from './core/CommentManager';
import { PairedViewManager } from './ui/PairedViewManager';
import { ScrollSyncManager } from './ui/ScrollSyncManager';
import { DecorationManager } from './ui/DecorationManager';
import { FileSystemManager } from './io/FileSystemManager';
import { registerCommands } from './commands';

/**
 * Extension activation function
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Paired Comments extension is now active');

  // Initialize core managers
  const fileSystemManager = new FileSystemManager();
  const commentManager = new CommentManager(fileSystemManager);
  const decorationManager = new DecorationManager(context);
  const scrollSyncManager = new ScrollSyncManager();
  const pairedViewManager = new PairedViewManager(
    commentManager,
    scrollSyncManager,
    decorationManager
  );

  // Register all commands
  registerCommands(context, {
    commentManager,
    pairedViewManager,
    scrollSyncManager,
    decorationManager,
  });

  // Set up event listeners
  setupEventListeners(context, commentManager, decorationManager);

  console.log('Paired Comments extension initialized successfully');
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  console.log('Paired Comments extension is now deactivated');
}

/**
 * Set up global event listeners
 */
function setupEventListeners(
  context: vscode.ExtensionContext,
  commentManager: CommentManager,
  decorationManager: DecorationManager
): void {
  // Update decorations when the active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        decorationManager.updateDecorations(editor).catch((error: Error) => {
          console.error('Failed to update decorations:', error);
        });
      }
    })
  );

  // Update decorations when a document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        decorationManager.updateDecorations(editor).catch((error: Error) => {
          console.error('Failed to update decorations:', error);
        });
      }
    })
  );

  // Refresh comments when a .comments file is saved
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.fileName.endsWith('.comments')) {
        const sourceUri = vscode.Uri.file(
          document.fileName.replace(/\.comments$/, '')
        );
        commentManager.reloadComments(sourceUri).catch((error: Error) => {
          console.error('Failed to reload comments:', error);
        });
      }
    })
  );
}
