/**
 * ScrollSyncManager - Handles bidirectional scroll synchronization
 */

import * as vscode from 'vscode';

export class ScrollSyncManager {
  private syncEnabled: Map<string, boolean> = new Map();
  private scrollListeners: Map<string, vscode.Disposable[]> = new Map();

  // Prevent feedback loop: when we're programmatically scrolling, ignore scroll events
  private isScrolling: boolean = false;

  /**
   * Synchronize scroll position between two editors
   */
  syncScroll(sourceEditor: vscode.TextEditor, targetEditor: vscode.TextEditor): void {
    // Prevent feedback loop
    if (this.isScrolling) {
      return;
    }

    const sourceRange = sourceEditor.visibleRanges[0];
    if (!sourceRange) {
      return;
    }

    // Set flag to prevent recursive scrolling
    this.isScrolling = true;

    try {
      // Calculate the percentage of scroll in the source editor
      const sourceFirstLine = sourceRange.start.line;
      const targetPosition = new vscode.Position(sourceFirstLine, 0);
      const targetRange = new vscode.Range(targetPosition, targetPosition);

      // Scroll target editor to match
      targetEditor.revealRange(targetRange, vscode.TextEditorRevealType.AtTop);
    } finally {
      // Reset flag after a small delay to allow scroll event to complete
      setTimeout(() => {
        this.isScrolling = false;
      }, 50);
    }
  }

  /**
   * Enable scroll sync between source and comments editors
   */
  enableSync(
    _sourceEditor: vscode.TextEditor,
    _commentsEditor: vscode.TextEditor,
    _sourceUri: vscode.Uri
  ): void {
    // This is now handled by PairedViewManager
    // Keep method for backwards compatibility
  }

  /**
   * Disable scroll sync for a source file
   */
  disableSync(_sourceUri: vscode.Uri): void {
    // This is now handled by PairedViewManager
    // Keep method for backwards compatibility
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
