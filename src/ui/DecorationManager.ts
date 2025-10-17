/**
 * DecorationManager - Manages gutter icons and hover previews for commented lines
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { Comment, CommentTag, TAG_COLORS } from '../types';

export class DecorationManager {
  private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
  private commentManager: CommentManager | null = null;

  constructor(private context: vscode.ExtensionContext) {
    this.initializeDecorationTypes();
  }

  /**
   * Set the comment manager (called after initialization)
   */
  setCommentManager(manager: CommentManager): void {
    this.commentManager = manager;
  }

  /**
   * Initialize decoration types for each tag
   */
  private initializeDecorationTypes(): void {
    // Default decoration (no tag)
    this.decorationTypes.set('default', vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.context.asAbsolutePath('resources/comment-default.svg'),
      gutterIconSize: 'contain',
      overviewRulerColor: '#4A90E2',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    }));

    // Tag-specific decorations
    const tags: Array<NonNullable<CommentTag>> = ['TODO', 'FIXME', 'NOTE', 'QUESTION', 'HACK', 'WARNING'];
    for (const tag of tags) {
      const color = TAG_COLORS[tag];
      this.decorationTypes.set(tag, vscode.window.createTextEditorDecorationType({
        gutterIconPath: this.createGutterIcon(tag, color),
        gutterIconSize: 'contain',
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }));
    }
  }

  /**
   * Create a simple SVG gutter icon
   */
  private createGutterIcon(tag: string, color: string): vscode.Uri {
    // Create a simple colored circle with the first letter of the tag
    const letter = tag.charAt(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="${color}" opacity="0.8"/>
      <text x="8" y="11" text-anchor="middle" font-size="10" font-weight="bold" fill="white">${letter}</text>
    </svg>`;

    // Convert to data URI
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return vscode.Uri.parse(dataUri);
  }

  /**
   * Update decorations for an editor
   */
  async updateDecorations(editor: vscode.TextEditor): Promise<void> {
    if (!this.commentManager) {
      return;
    }

    try {
      // Load comments for this file
      const commentFile = await this.commentManager.loadComments(editor.document.uri);

      // Group comments by tag
      const commentsByTag = new Map<string, Comment[]>();

      for (const comment of commentFile.comments) {
        const tag = comment.tag || 'default';
        if (!commentsByTag.has(tag)) {
          commentsByTag.set(tag, []);
        }
        commentsByTag.get(tag)!.push(comment);
      }

      // Clear all existing decorations
      for (const decorationType of this.decorationTypes.values()) {
        editor.setDecorations(decorationType, []);
      }

      // Apply decorations for each tag group
      for (const [tag, comments] of commentsByTag.entries()) {
        const decorationType = this.decorationTypes.get(tag);
        if (!decorationType) continue;

        const decorations = comments.map(comment => this.createDecoration(comment, editor.document));
        editor.setDecorations(decorationType, decorations);
      }
    } catch (error) {
      console.error('Failed to update decorations:', error);
    }
  }

  /**
   * Create a decoration for a comment
   */
  private createDecoration(comment: Comment, document: vscode.TextDocument): vscode.DecorationOptions {
    const line = comment.line - 1; // Convert to 0-indexed

    // Validate line number
    if (line < 0 || line >= document.lineCount) {
      return {
        range: new vscode.Range(0, 0, 0, 0),
        hoverMessage: 'Invalid line number'
      };
    }

    const range = document.lineAt(line).range;

    // Create hover message
    const tagLabel = comment.tag ? `[${comment.tag}] ` : '';
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.appendMarkdown(`**${tagLabel}Comment by ${comment.author}**\n\n`);
    hoverMessage.appendMarkdown(comment.text);
    hoverMessage.appendMarkdown(`\n\n*Created: ${new Date(comment.created).toLocaleString()}*`);

    return {
      range,
      hoverMessage
    };
  }

  /**
   * Clear decorations for an editor
   */
  clearDecorations(editor: vscode.TextEditor): void {
    for (const decorationType of this.decorationTypes.values()) {
      editor.setDecorations(decorationType, []);
    }
  }

  /**
   * Refresh decorations for a specific source file
   */
  async refreshDecorations(sourceUri: vscode.Uri): Promise<void> {
    // Find the editor for this URI
    const editor = vscode.window.visibleTextEditors.find(
      e => e.document.uri.toString() === sourceUri.toString()
    );

    if (editor) {
      await this.updateDecorations(editor);
    }
  }

  /**
   * Dispose of decoration resources
   */
  dispose(): void {
    for (const decorationType of this.decorationTypes.values()) {
      decorationType.dispose();
    }
    this.decorationTypes.clear();
  }
}
