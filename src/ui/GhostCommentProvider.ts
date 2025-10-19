/**
 * Ghost Comment Provider - InlayHints for inline comment visualization
 *
 * Displays paired comments as virtual text in the editor without taking up
 * actual lines, similar to Jupyter notebook outputs.
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';
import { Comment } from '../types';

export class GhostCommentProvider implements vscode.InlayHintsProvider {
  private enabled: boolean = false;
  private enabledLines: Set<number> = new Set(); // Per-line toggle (1-indexed)

  constructor(
    private commentManager: CommentManager,
    private ghostMarkerManager: GhostMarkerManager
  ) {}

  /**
   * Provide inlay hints for comments in the visible range
   */
  async provideInlayHints(
    document: vscode.TextDocument,
    range: vscode.Range,
    _token: vscode.CancellationToken
  ): Promise<vscode.InlayHint[]> {
    // Early exit if ghost view is completely disabled
    if (!this.enabled && this.enabledLines.size === 0) {
      return [];
    }

    const hints: vscode.InlayHint[] = [];

    try {
      // Load comments for this file
      const commentFile = await this.commentManager.loadComments(document.uri);
      if (!commentFile || commentFile.comments.length === 0) {
        return [];
      }

      // Create hints for visible comments
      for (const comment of commentFile.comments) {
        const line = comment.line - 1; // Convert to 0-indexed

        // Check if within visible range
        if (line < range.start.line || line > range.end.line) {
          continue;
        }

        // Check if this line should show ghost view
        if (!this.enabled && !this.enabledLines.has(comment.line)) {
          continue;
        }

        const hint = this.createInlayHint(comment, document);
        if (hint) {
          hints.push(hint);
        }
      }
    } catch (error) {
      console.error('[GhostCommentProvider] Error providing inlay hints:', error);
    }

    return hints;
  }

  /**
   * Create an inlay hint for a single comment
   */
  private createInlayHint(
    comment: Comment,
    document: vscode.TextDocument
  ): vscode.InlayHint | null {
    const line = comment.line - 1; // Convert to 0-indexed

    // Ensure line is valid
    if (line < 0 || line >= document.lineCount) {
      return null;
    }

    const position = new vscode.Position(line, 0);

    // Check if comment has a valid marker (basic orphan detection)
    // Note: Full orphan detection (AST anchor validation, line hash checks) is
    // performed by OrphanDetector, but that's too expensive for InlayHints.
    // Here we just check if the marker exists - missing marker = orphaned
    const markers = this.ghostMarkerManager.getMarkers(document.uri);
    const marker = markers.find(m => m.commentIds.includes(comment.id));
    const isOrphaned = !marker;

    // Format comment text (pass orphan state for different styling)
    const text = this.formatGhostComment(comment, isOrphaned);

    const hint = new vscode.InlayHint(
      position,
      text,
      vscode.InlayHintKind.Type
    );

    // Add padding for better visual separation
    hint.paddingLeft = false;
    hint.paddingRight = true;

    return hint;
  }

  /**
   * Format a comment for inline display
   */
  private formatGhostComment(comment: Comment, isOrphaned: boolean): string {
    const config = vscode.workspace.getConfiguration('pairedComments.ghostView');
    const showAuthor = config.get<boolean>('showAuthor', true);
    const showTag = config.get<boolean>('showTag', true);
    const maxLines = config.get<number>('maxLines', 5);

    const parts: string[] = [];

    // Orphan warning (if applicable)
    if (isOrphaned) {
      parts.push('⚠️ ORPHANED');
    }

    // Author with icon
    if (showAuthor && comment.author) {
      parts.push(`👤 ${comment.author}`);
    }

    // Tag
    if (showTag && comment.tag) {
      parts.push(comment.tag);
    }

    // Range indicator
    if (comment.endLine && comment.endLine > comment.line) {
      parts.push(`(lines ${comment.line}-${comment.endLine})`);
    }

    // Comment text (truncated if needed)
    const textLines = comment.text.split('\n');
    let displayText = '';

    if (textLines.length <= maxLines) {
      // Show all lines, joined with space
      displayText = textLines.join(' ');
    } else {
      // Truncate and add indicator
      displayText = textLines.slice(0, maxLines).join(' ');
      displayText += '... [Click to view full comment]';
    }

    // Trim and limit total length
    displayText = displayText.trim();
    if (displayText.length > 200) {
      displayText = displayText.substring(0, 197) + '...';
    }

    parts.push(displayText);

    // Join with separator
    return parts.join(' | ');
  }

  /**
   * Enable ghost view for all comments in all files
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * Disable ghost view for all comments
   */
  public disable(): void {
    this.enabled = false;
    this.enabledLines.clear();
  }

  /**
   * Toggle ghost view for a specific line (1-indexed)
   */
  public toggleLine(line: number): void {
    if (this.enabledLines.has(line)) {
      this.enabledLines.delete(line);
    } else {
      this.enabledLines.add(line);
    }
  }

  /**
   * Check if ghost view is enabled (globally or for any lines)
   */
  public isEnabled(): boolean {
    return this.enabled || this.enabledLines.size > 0;
  }

  /**
   * Check if a specific line (1-indexed) has ghost view enabled
   */
  public isLineEnabled(line: number): boolean {
    return this.enabled || this.enabledLines.has(line);
  }

  /**
   * Get count of lines with ghost view enabled
   */
  public getEnabledLineCount(): number {
    return this.enabledLines.size;
  }
}
