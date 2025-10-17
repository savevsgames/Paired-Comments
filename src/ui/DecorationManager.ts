/**
 * DecorationManager - Manages gutter icons and hover previews for commented lines
 */

import * as vscode from 'vscode';

export class DecorationManager {
  private commentDecorationType: vscode.TextEditorDecorationType;

  // @ts-expect-error - will be used when implementing icon paths
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private context: vscode.ExtensionContext) {
    this.commentDecorationType = this.createDecorationType();
  }

  /**
   * Create the decoration type for comment indicators
   */
  private createDecorationType(): vscode.TextEditorDecorationType {
    // TODO: Implement with proper icon path
    return vscode.window.createTextEditorDecorationType({
      gutterIconSize: '16px',
      overviewRulerColor: 'rgba(100, 150, 255, 0.5)',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });
  }

  /**
   * Update decorations for an editor
   */
  async updateDecorations(_editor: vscode.TextEditor): Promise<void> {
    // TODO: Implement
    // Will use this.createDecorationOptions() when implementing
    throw new Error('Not implemented');
  }

  /**
   * Clear decorations for an editor
   */
  clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.commentDecorationType, []);
  }

  /**
   * Refresh decorations for a specific source file
   */
  async refreshDecorations(_sourceUri: vscode.Uri): Promise<void> {
    // TODO: Implement
    // Will need to create helper methods for decorations and hover messages
    throw new Error('Not implemented');
  }

  /**
   * Dispose of decoration resources
   */
  dispose(): void {
    this.commentDecorationType.dispose();
  }
}
