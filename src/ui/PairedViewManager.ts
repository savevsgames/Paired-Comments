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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    private commentManager: CommentManager,
    private scrollSyncManager: ScrollSyncManager,
    private decorationManager: DecorationManager
  ) {
    // These will be used when implementing methods
    void this.commentManager;
    void this.scrollSyncManager;
    void this.decorationManager;
  }

  /**
   * Open a paired view for a source file
   */
  async openPairedView(_sourceUri: vscode.Uri): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Close a paired view
   */
  closePairedView(_sourceUri: vscode.Uri): void {
    // TODO: Implement
    throw new Error('Not implemented');
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
