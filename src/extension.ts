/**
 * Main extension entry point for Paired Comments
 */

import * as vscode from 'vscode';
import { CommentManager } from './core/CommentManager';
import { PairedViewManager } from './ui/PairedViewManager';
import { ScrollSyncManager } from './ui/ScrollSyncManager';
import { DecorationManager } from './ui/DecorationManager';
import { CommentCodeLensProvider } from './ui/CommentCodeLensProvider';
import { CommentFileDecorationProvider } from './ui/CommentFileDecorationProvider';
import { FileSystemManager } from './io/FileSystemManager';
import { registerCommands } from './commands';

/**
 * Extension activation function
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Paired Comments extension is now active');

  // Apply initial file exclusion settings
  applyFileExclusionSettings();

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

  // Wire up decoration manager with comment manager
  decorationManager.setCommentManager(commentManager);

  // Register CodeLens provider for clickable comment indicators
  const codeLensProvider = new CommentCodeLensProvider(commentManager);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file' },
      codeLensProvider
    )
  );

  // Register File Decoration provider for comment count badges
  const fileDecorationProvider = new CommentFileDecorationProvider(commentManager);
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(fileDecorationProvider)
  );

  // Register all commands
  registerCommands(context, {
    commentManager,
    pairedViewManager,
    scrollSyncManager,
    decorationManager,
  });

  // Set up event listeners
  setupEventListeners(context, commentManager, decorationManager, codeLensProvider, fileDecorationProvider);

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
  decorationManager: DecorationManager,
  codeLensProvider: CommentCodeLensProvider,
  fileDecorationProvider: CommentFileDecorationProvider
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

        // Refresh CodeLens and file decorations
        codeLensProvider.refresh();
        fileDecorationProvider.refresh(sourceUri);
      }
    })
  );
}

/**
 * Apply file exclusion settings based on user configuration
 */
function applyFileExclusionSettings(): void {
  const config = vscode.workspace.getConfiguration('pairedComments');
  const hideCommentFiles = config.get<boolean>('hideCommentFiles', true);

  if (hideCommentFiles) {
    const filesConfig = vscode.workspace.getConfiguration('files');
    const exclude = filesConfig.get<Record<string, boolean>>('exclude') || {};
    exclude['**/*.comments'] = true;
    void filesConfig.update('exclude', exclude, vscode.ConfigurationTarget.Global);
  }
}
