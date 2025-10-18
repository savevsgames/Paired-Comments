/**
 * Main extension entry point for Paired Comments
 * Now with AST-based ghost markers! 👻
 */

import * as vscode from 'vscode';
import { CommentManager } from './core/CommentManager';
import { GhostMarkerManager } from './core/GhostMarkerManager';
import { ASTAnchorManager } from './core/ASTAnchorManager';
import { PairedViewManager } from './ui/PairedViewManager';
import { ScrollSyncManager } from './ui/ScrollSyncManager';
import { DecorationManager } from './ui/DecorationManager';
import { CommentCodeLensProvider } from './ui/CommentCodeLensProvider';
import { CommentFileDecorationProvider } from './ui/CommentFileDecorationProvider';
import { FileSystemManager } from './io/FileSystemManager';
import { registerCommands } from './commands';
import { logger } from './utils/Logger';
import {
  isPairedCommentsError,
  getUserMessage,
  getRecoverySteps
} from './errors/PairedCommentsError';

/**
 * Extension activation function
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize logger first
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('🚀 PAIRED COMMENTS EXTENSION ACTIVATED - v2.0.8 CRITICAL UX');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('Paired Comments extension is now active');

  // Register logger for disposal
  context.subscriptions.push({
    dispose: () => logger.dispose()
  });

  // Apply initial file exclusion settings
  applyFileExclusionSettings();

  // Initialize core managers (order matters: AST → FileSystem → Comment → Ghost)
  const astAnchorManager = new ASTAnchorManager();
  const fileSystemManager = new FileSystemManager(astAnchorManager);
  const ghostMarkerManager = new GhostMarkerManager();
  const commentManager = new CommentManager(fileSystemManager, ghostMarkerManager);
  const decorationManager = new DecorationManager();
  const scrollSyncManager = new ScrollSyncManager();
  const pairedViewManager = new PairedViewManager(
    commentManager,
    scrollSyncManager,
    decorationManager
  );

  // Wire up managers
  decorationManager.setCommentManager(commentManager);
  decorationManager.setGhostMarkerManager(ghostMarkerManager);
  ghostMarkerManager.setASTManager(astAnchorManager);

  // Register managers for disposal
  context.subscriptions.push({
    dispose: () => {
      ghostMarkerManager.dispose();
      astAnchorManager.dispose();
    }
  });

  // Register CodeLens provider for clickable comment indicators
  const codeLensProvider = new CommentCodeLensProvider(commentManager);
  codeLensProvider.setGhostMarkerManager(ghostMarkerManager);
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
    fileSystemManager,
  });

  // Set up event listeners
  setupEventListeners(context, commentManager, decorationManager, codeLensProvider, fileDecorationProvider);

  logger.info('Paired Comments extension initialized successfully');
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  logger.info('Paired Comments extension is now deactivated');
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
        decorationManager.updateDecorations(editor).catch((error: unknown) => {
          handleError(error, 'Failed to update comment decorations');
        });
      }
    })
  );

  // Update decorations when a document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        decorationManager.updateDecorations(editor).catch((error: unknown) => {
          handleError(error, 'Failed to update comment decorations');
        });
      }
    })
  );

  // Refresh comments when a .comments file is saved
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.fileName.endsWith('.comments')) {
        logger.debug(`Reloading comments from: ${document.fileName}`);

        const sourceUri = vscode.Uri.file(
          document.fileName.replace(/\.comments$/, '')
        );
        commentManager.reloadComments(sourceUri).catch((error: unknown) => {
          handleError(error, 'Failed to reload comments from file');
        });

        // Refresh CodeLens and file decorations
        codeLensProvider.refresh();
        fileDecorationProvider.refresh(sourceUri);

        logger.debug('Comments reloaded and UI refreshed');
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

/**
 * Handle errors with user-friendly messages
 * Shows actionable error dialogs for PairedCommentsError instances
 */
function handleError(error: unknown, context?: string): void {
  logger.error(context || 'An error occurred', error);

  if (isPairedCommentsError(error)) {
    // Show user-friendly error message with recovery steps
    const userMessage = getUserMessage(error);
    const recoverySteps = getRecoverySteps(error);

    const message = context
      ? `${context}: ${userMessage}`
      : userMessage;

    // Build recovery steps message
    const recoveryMessage = recoverySteps.length > 0
      ? `\n\nSuggested actions:\n${recoverySteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`
      : '';

    vscode.window.showErrorMessage(
      message + recoveryMessage,
      'View Output',
      'Dismiss'
    ).then(selection => {
      if (selection === 'View Output') {
        logger.show();
      }
    });
  } else {
    // Generic error
    const message = context
      ? `${context}: ${error instanceof Error ? error.message : String(error)}`
      : error instanceof Error ? error.message : String(error);

    vscode.window.showErrorMessage(
      message,
      'View Output',
      'Dismiss'
    ).then(selection => {
      if (selection === 'View Output') {
        logger.show();
      }
    });
  }
}
