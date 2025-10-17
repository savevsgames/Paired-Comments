/**
 * CommentCodeLensProvider - Provides clickable CodeLens for commented lines
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';

export class CommentCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(private commentManager: CommentManager) {}

  /**
   * Refresh CodeLens
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Provide CodeLens for commented lines
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
      const commentFile = await this.commentManager.loadComments(document.uri);
      const codeLenses: vscode.CodeLens[] = [];

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
