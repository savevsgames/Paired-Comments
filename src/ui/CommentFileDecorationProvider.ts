/**
 * CommentFileDecorationProvider - Decorates files with comment count badges
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';

export class CommentFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations: vscode.EventEmitter<vscode.Uri | vscode.Uri[]> =
    new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
  public readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[]> =
    this._onDidChangeFileDecorations.event;

  constructor(private commentManager: CommentManager) {}

  /**
   * Refresh file decorations
   */
  refresh(uri?: vscode.Uri): void {
    if (uri) {
      this._onDidChangeFileDecorations.fire(uri);
    } else {
      this._onDidChangeFileDecorations.fire(undefined as unknown as vscode.Uri);
    }
  }

  /**
   * Provide file decoration for a file
   */
  async provideFileDecoration(
    uri: vscode.Uri,
    _token: vscode.CancellationToken
  ): Promise<vscode.FileDecoration | undefined> {
    // Don't decorate .comments files themselves
    if (uri.fsPath.endsWith('.comments')) {
      return undefined;
    }

    // Don't decorate backup files (PRODUCTION BUG FIX)
    // Backup files match pattern: *.backup-YYYY-MM-DDTHH-MM-SS-sssZ
    if (uri.fsPath.includes('.backup-')) {
      return undefined;
    }

    try {
      // Check if this file has comments
      const commentFile = await this.commentManager.loadComments(uri);

      if (!commentFile || commentFile.comments.length === 0) {
        return undefined;
      }

      const count = commentFile.comments.length;

      // Count comments by tag type
      let todoCount = 0;
      let fixmeCount = 0;

      for (const comment of commentFile.comments) {
        if (comment.tag === 'TODO') todoCount++;
        if (comment.tag === 'FIXME') fixmeCount++;
      }

      // Choose badge color based on comment types
      let color: vscode.ThemeColor | undefined;

      if (fixmeCount > 0) {
        // Red for FIXME
        color = new vscode.ThemeColor('list.errorForeground');
      } else if (todoCount > 0) {
        // Orange for TODO
        color = new vscode.ThemeColor('list.warningForeground');
      } else {
        // Blue for regular comments
        color = new vscode.ThemeColor('charts.blue');
      }

      return {
        badge: `${count}`,
        tooltip: this.getTooltip(commentFile.comments.length, todoCount, fixmeCount),
        color,
        propagate: false
      };
    } catch (error) {
      // File doesn't have comments or error loading
      return undefined;
    }
  }

  /**
   * Generate tooltip text
   */
  private getTooltip(total: number, todoCount: number, fixmeCount: number): string {
    const parts: string[] = [];

    parts.push(`${total} comment${total === 1 ? '' : 's'}`);

    if (todoCount > 0) {
      parts.push(`${todoCount} TODO${todoCount === 1 ? '' : 's'}`);
    }

    if (fixmeCount > 0) {
      parts.push(`${fixmeCount} FIXME${fixmeCount === 1 ? '' : 's'}`);
    }

    return parts.join(', ');
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this._onDidChangeFileDecorations.dispose();
  }
}
