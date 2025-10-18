/**
 * CommentCodeLensProvider - Provides clickable CodeLens for commented lines
 * Now with ghost marker support for automatic line tracking! 👻
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';

export class CommentCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
  private ghostMarkerManager: GhostMarkerManager | null = null;

  constructor(private commentManager: CommentManager) {}

  /**
   * Set the ghost marker manager (called after initialization)
   */
  setGhostMarkerManager(manager: GhostMarkerManager): void {
    this.ghostMarkerManager = manager;
  }

  /**
   * Refresh CodeLens
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Provide CodeLens for commented lines
   * Now uses LIVE ghost markers for automatic position tracking
   */
  async provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    // Don't provide CodeLens for .comments files
    if (document.uri.fsPath.endsWith('.comments')) {
      return [];
    }

    try {
      const codeLenses: vscode.CodeLens[] = [];

      // Get LIVE ghost markers from GhostMarkerManager (not from file!)
      const liveGhostMarkers = this.ghostMarkerManager
        ? this.ghostMarkerManager.getMarkers(document.uri)
        : null;

      if (liveGhostMarkers && liveGhostMarkers.length > 0) {
        // Use live ghost markers for accurate positions (v2.0+)
        console.log(`[CodeLens] Using ${liveGhostMarkers.length} LIVE ghost markers`);

        for (const marker of liveGhostMarkers) {
          const line = marker.line - 1; // Convert to 0-indexed

          // Validate line number
          if (line < 0 || line >= document.lineCount) {
            continue;
          }

          const range = new vscode.Range(line, 0, line, 0);
          const count = marker.commentIds.length;

          // Create CodeLens with clickable command that jumps to this specific line
          const commentText = count === 1 ? '1 comment' : `${count} comments`;
          const codeLens = new vscode.CodeLens(range, {
            title: `💬 ${commentText} - Click to open`,
            command: 'pairedComments.openAndNavigate',
            arguments: [document.uri, marker.line] // Use marker's LIVE line number
          });

          codeLenses.push(codeLens);
        }
      } else {
        // Fallback to file-based comments if live markers not available (legacy mode)
        const commentFile = await this.commentManager.loadComments(document.uri);
        console.log(`[CodeLens] Using ${commentFile.comments.length} comments from file (legacy mode)`);

        // Group comments by line
        const commentsByLine = new Map<number, number>();
        for (const comment of commentFile.comments) {
          const count = commentsByLine.get(comment.line) || 0;
          commentsByLine.set(comment.line, count + 1);
        }

        // Create CodeLens for each line with comments
        for (const [lineNumber, count] of commentsByLine.entries()) {
          const line = lineNumber - 1; // Convert to 0-indexed

          // Validate line number
          if (line < 0 || line >= document.lineCount) {
            continue;
          }

          const range = new vscode.Range(line, 0, line, 0);

          // Create CodeLens with clickable command that jumps to this specific line
          const commentText = count === 1 ? '1 comment' : `${count} comments`;
          const codeLens = new vscode.CodeLens(range, {
            title: `💬 ${commentText} - Click to open`,
            command: 'pairedComments.openAndNavigate',
            arguments: [document.uri, lineNumber] // Pass 1-indexed line number
          });

          codeLenses.push(codeLens);
        }
      }

      return codeLenses;
    } catch (error) {
      console.error('Failed to provide CodeLens:', error);
      return [];
    }
  }

  /**
   * Resolve CodeLens (optional)
   */
  resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this._onDidChangeCodeLenses.dispose();
  }
}
