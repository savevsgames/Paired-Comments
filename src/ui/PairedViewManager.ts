/**
 * PairedViewManager - Manages paired view sessions (source + comments side-by-side)
 */

import * as vscode from 'vscode';
import { PairedViewSession } from '../types';
import { CommentManager } from '../core/CommentManager';
import { ScrollSyncManager } from './ScrollSyncManager';
import { DecorationManager } from './DecorationManager';

export class PairedViewManager {
  private activeSessions: Map<string, PairedViewSession> = new Map();

  constructor(
    private commentManager: CommentManager,
    private scrollSyncManager: ScrollSyncManager,
    private decorationManager: DecorationManager
  ) {}

  /**
   * Open a paired view for a source file
   */
  async openPairedView(sourceUri: vscode.Uri): Promise<void> {
    // Check if already open
    if (this.isPairedViewOpen(sourceUri)) {
      const session = this.activeSessions.get(sourceUri.fsPath);
      if (session) {
        await vscode.window.showTextDocument(session.commentsEditor.document, {
          viewColumn: session.commentsEditor.viewColumn,
          preserveFocus: false
        });
      }
      return;
    }

    // Ensure comments file exists
    await this.commentManager.loadComments(sourceUri);

    // Get the source editor
    const sourceEditor = vscode.window.activeTextEditor;
    if (!sourceEditor || sourceEditor.document.uri.toString() !== sourceUri.toString()) {
      throw new Error('Source file is not the active editor');
    }

    // Get the comment file URI
    const commentsUri = vscode.Uri.file(sourceUri.fsPath + '.comments');

    // Open the comments file to the right
    const commentsDocument = await vscode.workspace.openTextDocument(commentsUri);
    const commentsEditor = await vscode.window.showTextDocument(commentsDocument, {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: false,
      preview: false
    });

    // Create session
    const session: PairedViewSession = {
      sourceUri,
      commentsUri,
      sourceEditor,
      commentsEditor,
      syncEnabled: true,
      disposables: []
    };

    // Set up event listeners for this session
    this.setupSessionListeners(session);

    // Store session
    this.activeSessions.set(sourceUri.fsPath, session);

    // Update context
    await vscode.commands.executeCommand('setContext', 'pairedComments.viewOpen', true);

    // Update decorations
    await this.decorationManager.updateDecorations(sourceEditor);
  }

  /**
   * Close a paired view
   */
  closePairedView(sourceUri: vscode.Uri): void {
    const session = this.activeSessions.get(sourceUri.fsPath);
    if (!session) {
      return;
    }

    // Dispose all listeners
    session.disposables.forEach(d => d.dispose());

    // Remove from active sessions
    this.activeSessions.delete(sourceUri.fsPath);

    // Update context if no more sessions
    if (this.activeSessions.size === 0) {
      void vscode.commands.executeCommand('setContext', 'pairedComments.viewOpen', false);
    }
  }

  /**
   * Set up event listeners for a paired view session
   */
  private setupSessionListeners(session: PairedViewSession): void {
    // Listen for document close events
    session.disposables.push(
      vscode.workspace.onDidCloseTextDocument(doc => {
        if (doc.uri.toString() === session.commentsUri.toString() ||
            doc.uri.toString() === session.sourceUri.toString()) {
          this.closePairedView(session.sourceUri);
        }
      })
    );

    // Listen for scroll events on source editor
    session.disposables.push(
      vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (session.syncEnabled && event.textEditor === session.sourceEditor) {
          this.scrollSyncManager.syncScroll(session.sourceEditor, session.commentsEditor);
        }
      })
    );

    // Listen for scroll events on comments editor
    session.disposables.push(
      vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (session.syncEnabled && event.textEditor === session.commentsEditor) {
          this.scrollSyncManager.syncScroll(session.commentsEditor, session.sourceEditor);
        }
      })
    );
  }

  /**
   * Check if a paired view is open for a source file
   */
  isPairedViewOpen(sourceUri: vscode.Uri): boolean {
    return this.activeSessions.has(sourceUri.fsPath);
  }

  /**
   * Get the comments editor for a source file
   */
  getCommentsEditor(sourceUri: vscode.Uri): vscode.TextEditor | undefined {
    const session = this.activeSessions.get(sourceUri.fsPath);
    return session?.commentsEditor;
  }

  /**
   * Get the active session for a source file
   */
  getSession(sourceUri: vscode.Uri): PairedViewSession | undefined {
    return this.activeSessions.get(sourceUri.fsPath);
  }

  /**
   * Clean up all sessions
   */
  dispose(): void {
    for (const session of this.activeSessions.values()) {
      session.disposables.forEach((d) => d.dispose());
    }
    this.activeSessions.clear();
  }
}
