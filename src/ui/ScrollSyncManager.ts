/**
 * ScrollSyncManager - Handles bidirectional scroll synchronization
 */

import * as vscode from 'vscode';

export class ScrollSyncManager {
  private syncEnabled: Map<string, boolean> = new Map();
  private scrollListeners: Map<string, vscode.Disposable[]> = new Map();

  /**
   * Enable scroll sync between source and comments editors
   */
  enableSync(
    _sourceEditor: vscode.TextEditor,
    _commentsEditor: vscode.TextEditor,
    _sourceUri: vscode.Uri
  ): void {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Disable scroll sync for a source file
   */
  disableSync(_sourceUri: vscode.Uri): void {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Toggle scroll sync on/off
   */
  toggleSync(sourceUri: vscode.Uri): boolean {
    const key = sourceUri.fsPath;
    const currentState = this.syncEnabled.get(key) ?? false;
    this.syncEnabled.set(key, !currentState);
    return !currentState;
  }

  /**
   * Check if sync is enabled for a source file
   */
  isSyncEnabled(sourceUri: vscode.Uri): boolean {
    return this.syncEnabled.get(sourceUri.fsPath) ?? false;
  }

  /**
   * Clean up scroll listeners for a source file
   */
  cleanup(sourceUri: vscode.Uri): void {
    const key = sourceUri.fsPath;
    const listeners = this.scrollListeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => listener.dispose());
      this.scrollListeners.delete(key);
    }
    this.syncEnabled.delete(key);
  }

  /**
   * Clean up all scroll listeners
   */
  dispose(): void {
    for (const listeners of this.scrollListeners.values()) {
      listeners.forEach((listener) => listener.dispose());
    }
    this.scrollListeners.clear();
    this.syncEnabled.clear();
  }
}
