/**
 * DecorationManager - Manages gutter icons and hover previews for commented lines
 * Now with ghost marker support for automatic line tracking! 👻
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';
import { Comment, CommentTag, TAG_COLORS, GhostMarker } from '../types';

export class DecorationManager {
  private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
  private commentManager: CommentManager | null = null;
  private ghostMarkerManager: GhostMarkerManager | null = null;

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
   * Set the ghost marker manager (called after initialization)
   */
  setGhostMarkerManager(manager: GhostMarkerManager): void {
    this.ghostMarkerManager = manager;
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

    // Tag-specific decorations (now includes STAR)
    const tags: Array<NonNullable<CommentTag>> = ['TODO', 'FIXME', 'NOTE', 'QUESTION', 'HACK', 'WARNING', 'STAR'];
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
   * Now uses ghost markers for automatic line tracking
   */
  async updateDecorations(editor: vscode.TextEditor): Promise<void> {
    if (!this.commentManager) {
      return;
    }

    try {
      // Load comments for this file
      const commentFile = await this.commentManager.loadComments(editor.document.uri);

      // Clear all existing decorations
      for (const decorationType of this.decorationTypes.values()) {
        editor.setDecorations(decorationType, []);
      }

      // Get LIVE ghost markers from GhostMarkerManager (not from file!)
      const liveGhostMarkers = this.ghostMarkerManager
        ? this.ghostMarkerManager.getMarkers(editor.document.uri)
        : null;

      // If live ghost markers exist, use them (v2.0+)
      if (liveGhostMarkers && liveGhostMarkers.length > 0) {
        console.log(`[DecorationManager] Using ${liveGhostMarkers.length} LIVE ghost markers`);
        this.applyGhostMarkerDecorations(editor, liveGhostMarkers, commentFile.comments);
      } else if (commentFile.ghostMarkers && commentFile.ghostMarkers.length > 0) {
        // Fallback to file-based markers if live markers not available
        console.log(`[DecorationManager] Using ${commentFile.ghostMarkers.length} ghost markers from file`);
        this.applyGhostMarkerDecorations(editor, commentFile.ghostMarkers, commentFile.comments);
      } else {
        // Fallback to legacy decoration mode (v1.0)
        this.applyLegacyDecorations(editor, commentFile.comments);
      }
    } catch (error) {
      console.error('Failed to update decorations:', error);
    }
  }

  /**
   * Apply decorations using ghost markers (v2.0+)
   * One decoration per ghost marker, not per comment
   */
  private applyGhostMarkerDecorations(
    editor: vscode.TextEditor,
    ghostMarkers: GhostMarker[],
    comments: Comment[]
  ): void {
    console.log(`[DecorationManager] Applying decorations for ${ghostMarkers.length} ghost markers`);

    // Create a map of comment ID -> comment for fast lookup
    const commentMap = new Map<string, Comment>();
    for (const comment of comments) {
      commentMap.set(comment.id, comment);
    }

    // Group ghost markers by tag (use highest priority tag for multi-comment markers)
    const markersByTag = new Map<string, GhostMarker[]>();

    for (const marker of ghostMarkers) {
      // Determine the tag for this marker
      const tag = this.getMarkerTag(marker, commentMap);
      console.log(`[DecorationManager] Marker at line ${marker.line} has tag: ${tag}`);
      if (!markersByTag.has(tag)) {
        markersByTag.set(tag, []);
      }
      markersByTag.get(tag)!.push(marker);
    }

    // Apply decorations for each tag group
    for (const [tag, markers] of markersByTag.entries()) {
      const decorationType = this.decorationTypes.get(tag);
      if (!decorationType) {
        console.log(`[DecorationManager] ❌ No decoration type found for tag: ${tag}`);
        continue;
      }

      const decorations = markers.map(marker =>
        this.createMarkerDecoration(marker, commentMap, editor.document)
      );
      console.log(`[DecorationManager] Applying ${decorations.length} decorations with tag '${tag}' at lines: ${markers.map(m => m.line).join(', ')}`);
      editor.setDecorations(decorationType, decorations);
    }
  }

  /**
   * Apply decorations using legacy mode (v1.0 - no ghost markers)
   */
  private applyLegacyDecorations(editor: vscode.TextEditor, comments: Comment[]): void {
    // Group comments by tag
    const commentsByTag = new Map<string, Comment[]>();

    for (const comment of comments) {
      const tag = comment.tag || 'default';
      if (!commentsByTag.has(tag)) {
        commentsByTag.set(tag, []);
      }
      commentsByTag.get(tag)!.push(comment);
    }

    // Apply decorations for each tag group
    for (const [tag, comments] of commentsByTag.entries()) {
      const decorationType = this.decorationTypes.get(tag);
      if (!decorationType) continue;

      const decorations = comments.map(comment => this.createDecoration(comment, editor.document));
      editor.setDecorations(decorationType, decorations);
    }
  }

  /**
   * Get the display tag for a ghost marker
   * Uses highest priority tag if multiple comments
   */
  private getMarkerTag(marker: GhostMarker, commentMap: Map<string, Comment>): string {
    const tagPriority: Record<string, number> = {
      'FIXME': 1,
      'WARNING': 2,
      'TODO': 3,
      'STAR': 4,
      'QUESTION': 5,
      'HACK': 6,
      'NOTE': 7,
      'default': 8
    };

    let highestPriorityTag = 'default';
    let highestPriority = 999;

    for (const commentId of marker.commentIds) {
      const comment = commentMap.get(commentId);
      if (!comment) continue;

      const tag = comment.tag || 'default';
      const priority = tagPriority[tag] ?? 999;

      if (priority < highestPriority) {
        highestPriority = priority;
        highestPriorityTag = tag;
      }
    }

    return highestPriorityTag;
  }

  /**
   * Create a decoration for a ghost marker
   */
  private createMarkerDecoration(
    marker: GhostMarker,
    commentMap: Map<string, Comment>,
    document: vscode.TextDocument
  ): vscode.DecorationOptions {
    const line = marker.line - 1; // Convert to 0-indexed

    // Validate line number
    if (line < 0 || line >= document.lineCount) {
      return {
        range: new vscode.Range(0, 0, 0, 0),
        hoverMessage: 'Invalid line number'
      };
    }

    const range = document.lineAt(line).range;

    // Create hover message showing all comments on this marker
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.isTrusted = true; // Enable command URIs

    // Header with count
    const commentCount = marker.commentIds.length;
    if (commentCount === 1) {
      hoverMessage.appendMarkdown(`**Comment**\n\n`);
    } else {
      hoverMessage.appendMarkdown(`**${commentCount} Comments**\n\n`);
    }

    // Add each comment
    for (let i = 0; i < marker.commentIds.length; i++) {
      const commentId = marker.commentIds[i];
      if (!commentId) continue;

      const comment = commentMap.get(commentId);
      if (!comment) continue;

      if (i > 0) {
        hoverMessage.appendMarkdown(`\n\n---\n\n`);
      }

      const tagLabel = comment.tag ? `[${comment.tag}] ` : '';
      hoverMessage.appendMarkdown(`**${tagLabel}${comment.author}**\n\n`);
      hoverMessage.appendMarkdown(comment.text);
      hoverMessage.appendMarkdown(`\n\n*${new Date(comment.created).toLocaleString()}*`);
    }

    // Add clickable action link at the bottom
    const commandUri = vscode.Uri.parse(
      `command:pairedComments.openAndNavigate?${encodeURIComponent(JSON.stringify([document.uri.toString(), marker.line]))}`
    );
    hoverMessage.appendMarkdown(`\n\n---\n\n[$(open-preview) Open Comments File](${commandUri})`);

    return {
      range,
      hoverMessage
    };
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
    hoverMessage.isTrusted = true; // Enable command URIs
    hoverMessage.appendMarkdown(`**${tagLabel}Comment by ${comment.author}**\n\n`);
    hoverMessage.appendMarkdown(comment.text);
    hoverMessage.appendMarkdown(`\n\n*Created: ${new Date(comment.created).toLocaleString()}*`);

    // Add clickable action link at the bottom
    const commandUri = vscode.Uri.parse(
      `command:pairedComments.openAndNavigate?${encodeURIComponent(JSON.stringify([document.uri.toString(), comment.line]))}`
    );
    hoverMessage.appendMarkdown(`\n\n---\n\n[$(open-preview) Open Comments File](${commandUri})`);

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
