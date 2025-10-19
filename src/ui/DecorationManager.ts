/**
 * DecorationManager - Manages gutter icons and hover previews for commented lines
 * Now with ghost marker support for automatic line tracking! 👻
 */

import * as vscode from 'vscode';
import { CommentManager } from '../core/CommentManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';
import { OrphanDetector } from '../core/OrphanDetector';
import { OrphanStatusBar } from './OrphanStatusBar';
import { Comment, CommentTag, TAG_COLORS, GhostMarker, isRangeMarker, getRangeGutterCode, getSingleGutterCode } from '../types';

export class DecorationManager {
  private decorationTypes: Map<string, vscode.TextEditorDecorationType> = new Map();
  private commentManager: CommentManager | null = null;
  private ghostMarkerManager: GhostMarkerManager | null = null;
  private orphanDetector: OrphanDetector | null = null;
  private orphanStatusBar: OrphanStatusBar | null = null;

  constructor() {
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
   * Set the orphan detector (called after initialization) (v2.1.3)
   */
  setOrphanDetector(detector: OrphanDetector): void {
    this.orphanDetector = detector;
  }

  /**
   * Set the orphan status bar (called after initialization) (v2.1.3)
   */
  setOrphanStatusBar(statusBar: OrphanStatusBar): void {
    this.orphanStatusBar = statusBar;
  }

  /**
   * Initialize decoration types for each tag
   */
  private initializeDecorationTypes(): void {
    // Default decoration (no tag) - single line
    this.decorationTypes.set('default', vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.createGutterIcon('C', '#4A90E2', false),
      gutterIconSize: 'contain',
      overviewRulerColor: '#4A90E2',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    }));

    // Default range decorations (start/end)
    this.decorationTypes.set('default-start', vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.createGutterIcon('CS', '#4A90E2', true),
      gutterIconSize: 'contain',
      overviewRulerColor: '#4A90E2',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    }));
    this.decorationTypes.set('default-end', vscode.window.createTextEditorDecorationType({
      gutterIconPath: this.createGutterIcon('CE', '#4A90E2', false),
      gutterIconSize: 'contain',
      overviewRulerColor: '#4A90E2',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    }));

    // Tag-specific decorations (single line + range start/end)
    const tags: Array<NonNullable<CommentTag>> = ['TODO', 'FIXME', 'NOTE', 'QUESTION', 'HACK', 'WARNING', 'STAR'];
    for (const tag of tags) {
      const color = TAG_COLORS[tag];
      const singleCode = getSingleGutterCode(tag);
      const startCode = getRangeGutterCode(tag, true);
      const endCode = getRangeGutterCode(tag, false);

      // Single-line decoration
      this.decorationTypes.set(tag, vscode.window.createTextEditorDecorationType({
        gutterIconPath: this.createGutterIcon(singleCode, color, false),
        gutterIconSize: 'contain',
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }));

      // Range start decoration (larger)
      this.decorationTypes.set(`${tag}-start`, vscode.window.createTextEditorDecorationType({
        gutterIconPath: this.createGutterIcon(startCode, color, true),
        gutterIconSize: 'contain',
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }));

      // Range end decoration (smaller)
      this.decorationTypes.set(`${tag}-end`, vscode.window.createTextEditorDecorationType({
        gutterIconPath: this.createGutterIcon(endCode, color, false),
        gutterIconSize: 'contain',
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }));
    }

    // Orphaned comment decoration (v2.1.3)
    // Orange warning triangle icon with exclamation mark
    this.decorationTypes.set('orphaned', vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(__dirname + '/../../resources/orphan-warning.svg'),
      gutterIconSize: 'contain',
      overviewRulerColor: '#E57C2A',
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      border: '1px dashed #E57C2A',
      borderRadius: '3px',
      backgroundColor: 'rgba(229, 124, 42, 0.1)', // Light orange background
    }));
  }

  /**
   * Create a simple SVG gutter icon
   * @param code - Single letter (e.g., 'T') or two-letter code (e.g., 'TS', 'TE')
   * @param color - Hex color for the icon
   * @param isLarger - True for range start (larger icon), false for single-line or range end
   */
  private createGutterIcon(code: string, color: string, isLarger: boolean): vscode.Uri {
    const isTwoLetter = code.length === 2;

    // Size adjustments
    const radius = isLarger ? 8 : 7; // Larger radius for range start
    const strokeWidth = isLarger ? 2 : 0; // Thicker border for range start
    const fontSize = isTwoLetter ? 7 : 10; // Smaller font for two letters
    const yOffset = isTwoLetter ? 10.5 : 11; // Adjust vertical centering

    let svg: string;

    if (isTwoLetter) {
      // Two-letter code (e.g., TS, TE)
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="${radius}" fill="${color}" opacity="0.8" stroke="${isLarger ? color : 'none'}" stroke-width="${strokeWidth}"/>
        <text x="8" y="${yOffset}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="white">${code}</text>
      </svg>`;
    } else {
      // Single letter (e.g., T, N, F)
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="${radius}" fill="${color}" opacity="0.8"/>
        <text x="8" y="${yOffset}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="white">${code}</text>
      </svg>`;
    }

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

    // Don't decorate .comments files themselves (PRODUCTION BUG FIX)
    if (editor.document.uri.fsPath.endsWith('.comments')) {
      return;
    }

    // Don't decorate backup files (PRODUCTION BUG FIX)
    if (editor.document.uri.fsPath.includes('.backup-')) {
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

        // Apply orphan detection overlay (v2.1.3)
        if (this.orphanDetector) {
          await this.applyOrphanDecorations(editor, liveGhostMarkers, commentFile.comments);
        }
      } else if (commentFile.ghostMarkers && commentFile.ghostMarkers.length > 0) {
        // Fallback to file-based markers if live markers not available
        console.log(`[DecorationManager] Using ${commentFile.ghostMarkers.length} ghost markers from file`);
        this.applyGhostMarkerDecorations(editor, commentFile.ghostMarkers, commentFile.comments);

        // Apply orphan detection overlay (v2.1.3)
        if (this.orphanDetector) {
          await this.applyOrphanDecorations(editor, commentFile.ghostMarkers, commentFile.comments);
        }
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
   * Now supports range markers with start/end decorations (v2.0.6+)
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

    // Separate single-line markers and range markers
    const singleLineMarkers: GhostMarker[] = [];
    const rangeMarkers: GhostMarker[] = [];

    for (const marker of ghostMarkers) {
      if (isRangeMarker(marker)) {
        rangeMarkers.push(marker);
      } else {
        singleLineMarkers.push(marker);
      }
    }

    console.log(`[DecorationManager] ${singleLineMarkers.length} single-line markers, ${rangeMarkers.length} range markers`);

    // Group single-line markers by tag
    const singleLineByTag = new Map<string, GhostMarker[]>();
    for (const marker of singleLineMarkers) {
      const tag = this.getMarkerTag(marker, commentMap);
      if (!singleLineByTag.has(tag)) {
        singleLineByTag.set(tag, []);
      }
      singleLineByTag.get(tag)!.push(marker);
    }

    // Apply single-line decorations
    for (const [tag, markers] of singleLineByTag.entries()) {
      const decorationType = this.decorationTypes.get(tag);
      if (!decorationType) {
        console.log(`[DecorationManager] ❌ No decoration type found for tag: ${tag}`);
        continue;
      }

      const decorations = markers.map(marker =>
        this.createMarkerDecoration(marker, commentMap, editor.document)
      );
      console.log(`[DecorationManager] Applying ${decorations.length} single-line decorations with tag '${tag}' at lines: ${markers.map(m => m.line).join(', ')}`);
      editor.setDecorations(decorationType, decorations);
    }

    // Group range markers by tag for start/end decorations
    const rangeStartByTag = new Map<string, GhostMarker[]>();
    const rangeEndByTag = new Map<string, GhostMarker[]>();

    for (const marker of rangeMarkers) {
      const tag = this.getMarkerTag(marker, commentMap);

      // Group for start decorations
      const startKey = `${tag}-start`;
      if (!rangeStartByTag.has(startKey)) {
        rangeStartByTag.set(startKey, []);
      }
      rangeStartByTag.get(startKey)!.push(marker);

      // Group for end decorations
      const endKey = `${tag}-end`;
      if (!rangeEndByTag.has(endKey)) {
        rangeEndByTag.set(endKey, []);
      }
      rangeEndByTag.get(endKey)!.push(marker);
    }

    // Apply range START decorations
    for (const [decorationKey, markers] of rangeStartByTag.entries()) {
      const decorationType = this.decorationTypes.get(decorationKey);
      if (!decorationType) {
        console.log(`[DecorationManager] ❌ No decoration type found for: ${decorationKey}`);
        continue;
      }

      const decorations = markers.map(marker =>
        this.createMarkerDecoration(marker, commentMap, editor.document, 'start')
      );
      console.log(`[DecorationManager] Applying ${decorations.length} range START decorations (${decorationKey}) at lines: ${markers.map(m => m.line).join(', ')}`);
      editor.setDecorations(decorationType, decorations);
    }

    // Apply range END decorations
    for (const [decorationKey, markers] of rangeEndByTag.entries()) {
      const decorationType = this.decorationTypes.get(decorationKey);
      if (!decorationType) {
        console.log(`[DecorationManager] ❌ No decoration type found for: ${decorationKey}`);
        continue;
      }

      const decorations = markers.map(marker =>
        this.createMarkerDecoration(marker, commentMap, editor.document, 'end')
      );
      console.log(`[DecorationManager] Applying ${decorations.length} range END decorations (${decorationKey}) at lines: ${markers.map(m => m.endLine).join(', ')}`);
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
   * @param position - 'start' for range start line, 'end' for range end line, undefined for single-line
   */
  private createMarkerDecoration(
    marker: GhostMarker,
    commentMap: Map<string, Comment>,
    document: vscode.TextDocument,
    position?: 'start' | 'end'
  ): vscode.DecorationOptions {
    // Determine which line to decorate
    let lineNumber: number;
    if (position === 'end' && marker.endLine) {
      lineNumber = marker.endLine - 1; // Range end line (0-indexed)
    } else {
      lineNumber = marker.line - 1; // Range start or single-line (0-indexed)
    }

    // Validate line number
    if (lineNumber < 0 || lineNumber >= document.lineCount) {
      return {
        range: new vscode.Range(0, 0, 0, 0),
        hoverMessage: 'Invalid line number'
      };
    }

    const range = document.lineAt(lineNumber).range;

    // Create hover message showing all comments on this marker
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.isTrusted = true; // Enable command URIs

    // Header with count and range info
    const commentCount = marker.commentIds.length;
    const isRange = isRangeMarker(marker);

    if (isRange && marker.endLine) {
      if (position === 'end') {
        // End marker hover - just show range info
        hoverMessage.appendMarkdown(`**Range Comment (end)**\n\n`);
        hoverMessage.appendMarkdown(`Lines ${marker.line}-${marker.endLine}\n\n`);
        hoverMessage.appendMarkdown(`[Jump to start](#)`);
      } else {
        // Start marker hover - show full comment info
        hoverMessage.appendMarkdown(`**Range Comment (lines ${marker.line}-${marker.endLine})**\n\n`);
        if (commentCount > 1) {
          hoverMessage.appendMarkdown(`*${commentCount} comments*\n\n`);
        }
      }
    } else {
      // Single-line marker
      if (commentCount === 1) {
        hoverMessage.appendMarkdown(`**Comment**\n\n`);
      } else {
        hoverMessage.appendMarkdown(`**${commentCount} Comments**\n\n`);
      }
    }

    // Add comment details (skip for end marker)
    if (position !== 'end') {
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

        // Interpolate dynamic parameters if present
        let displayText = comment.text;
        if (comment.params && Object.keys(comment.params).length > 0) {
          // Use ParamManager to interpolate if available
          // For now, simple replacement (TODO: inject ParamManager)
          for (const [key, param] of Object.entries(comment.params)) {
            displayText = displayText.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(param.value));
          }
        }

        hoverMessage.appendMarkdown(displayText);
        hoverMessage.appendMarkdown(`\n\n*${new Date(comment.created).toLocaleString()}*`);

        // Show AI metadata if available
        if (comment.aiMetadata) {
          hoverMessage.appendMarkdown(`\n\n---\n\n**AI Metadata:**\n\n`);

          if (comment.aiMetadata.complexity) {
            const c = comment.aiMetadata.complexity;
            hoverMessage.appendMarkdown(`**Complexity:** Cyclomatic ${c.cyclomatic}, Cognitive ${c.cognitive} (Maintainability: ${c.maintainability}%)\n\n`);
          }

          if (comment.aiMetadata.tokens) {
            const t = comment.aiMetadata.tokens;
            hoverMessage.appendMarkdown(`**Tokens:** ~${t.validated || t.heuristic}\n\n`);
          }

          if (comment.aiMetadata.parameters) {
            const p = comment.aiMetadata.parameters;
            hoverMessage.appendMarkdown(`**Function:** ${p.name} (${p.parameters.length} param${p.parameters.length === 1 ? '' : 's'}, ${p.lineCount} lines)\n\n`);
          }
        }
      }

      // Add clickable action link at the bottom
      const commandUri = vscode.Uri.parse(
        `command:pairedComments.openAndNavigate?${encodeURIComponent(JSON.stringify([document.uri.toString(), marker.line]))}`
      );
      hoverMessage.appendMarkdown(`\n\n---\n\n[$(open-preview) Open Comments File](${commandUri})`);
    }

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

    // Interpolate dynamic parameters if present
    let displayText = comment.text;
    if (comment.params && Object.keys(comment.params).length > 0) {
      for (const [key, param] of Object.entries(comment.params)) {
        displayText = displayText.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(param.value));
      }
    }

    hoverMessage.appendMarkdown(displayText);
    hoverMessage.appendMarkdown(`\n\n*Created: ${new Date(comment.created).toLocaleString()}*`);

    // Show AI metadata if available
    if (comment.aiMetadata) {
      hoverMessage.appendMarkdown(`\n\n---\n\n**AI Metadata:**\n\n`);

      if (comment.aiMetadata.complexity) {
        const c = comment.aiMetadata.complexity;
        hoverMessage.appendMarkdown(`**Complexity:** Cyclomatic ${c.cyclomatic}, Cognitive ${c.cognitive} (Maintainability: ${c.maintainability}%)\n\n`);
      }

      if (comment.aiMetadata.tokens) {
        const t = comment.aiMetadata.tokens;
        hoverMessage.appendMarkdown(`**Tokens:** ~${t.validated || t.heuristic}\n\n`);
      }

      if (comment.aiMetadata.parameters) {
        const p = comment.aiMetadata.parameters;
        hoverMessage.appendMarkdown(`**Function:** ${p.name} (${p.parameters.length} param${p.parameters.length === 1 ? '' : 's'}, ${p.lineCount} lines)\n\n`);
      }
    }

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
   * Apply orphan detection decorations (v2.1.3)
   * Overlays orphan warnings on top of existing comment decorations
   */
  private async applyOrphanDecorations(
    editor: vscode.TextEditor,
    ghostMarkers: GhostMarker[],
    comments: Comment[]
  ): Promise<void> {
    if (!this.orphanDetector) {
      return;
    }

    const orphanDecorationType = this.decorationTypes.get('orphaned');
    if (!orphanDecorationType) {
      return;
    }

    // Create a map of comment ID -> comment for fast lookup
    const commentMap = new Map<string, Comment>();
    for (const comment of comments) {
      commentMap.set(comment.id, comment);
    }

    const orphanDecorations: vscode.DecorationOptions[] = [];

    // Check each ghost marker for orphaned comments
    for (const marker of ghostMarkers) {
      // Get the first comment on this marker to check orphan status
      const firstCommentId = marker.commentIds[0];
      if (!firstCommentId) {
        continue;
      }

      const comment = commentMap.get(firstCommentId);
      if (!comment) {
        continue;
      }

      // Detect if this comment is orphaned
      const orphanStatus = await this.orphanDetector.detectOrphan(
        comment,
        marker,
        editor.document
      );

      if (orphanStatus.isOrphaned && orphanStatus.confidence >= 70) {
        // Apply orphan decoration to this line
        const lineNumber = marker.line - 1; // Convert to 0-indexed

        if (lineNumber >= 0 && lineNumber < editor.document.lineCount) {
          const range = editor.document.lineAt(lineNumber).range;

          // Create hover message with orphan info
          const hoverMessage = new vscode.MarkdownString();
          hoverMessage.isTrusted = true;
          hoverMessage.supportHtml = true;
          hoverMessage.appendMarkdown(`**⚠️ Orphaned Comment** (${orphanStatus.confidence}% confidence)\n\n`);
          hoverMessage.appendMarkdown(`**Reason:** ${this.orphanDetector.getOrphanDescription(orphanStatus)}\n\n`);

          if (orphanStatus.suggestedLocation) {
            hoverMessage.appendMarkdown(`**Suggested location:**\n`);
            hoverMessage.appendMarkdown(`- File: ${orphanStatus.suggestedLocation.file}\n`);
            hoverMessage.appendMarkdown(`- Line: ${orphanStatus.suggestedLocation.line}\n`);
            hoverMessage.appendMarkdown(`- Symbol: ${orphanStatus.suggestedLocation.symbol}\n\n`);
          }

          // Add recovery suggestions
          const suggestions = this.orphanDetector.getRecoverySuggestions(orphanStatus);
          if (suggestions.length > 0) {
            hoverMessage.appendMarkdown(`**Recovery Options:**\n`);
            for (const suggestion of suggestions) {
              hoverMessage.appendMarkdown(`- ${suggestion}\n`);
            }
            hoverMessage.appendMarkdown(`\n`);
          }

          // Add action links
          hoverMessage.appendMarkdown(`**Actions:** `);
          hoverMessage.appendMarkdown(`[Re-anchor](command:pairedComments.reanchorComment?${encodeURIComponent(JSON.stringify({uri: editor.document.uri.toString(), line: marker.line}))}) | `);
          hoverMessage.appendMarkdown(`[View Report](command:pairedComments.showOrphanReport) | `);
          hoverMessage.appendMarkdown(`[Dismiss](command:pairedComments.dismissOrphanWarning)`);

          orphanDecorations.push({
            range,
            hoverMessage
          });

          console.log(`[DecorationManager] Orphaned comment detected at line ${marker.line}: ${orphanStatus.reason}`);
        }
      }
    }

    if (orphanDecorations.length > 0) {
      console.log(`[DecorationManager] Applying ${orphanDecorations.length} orphan decorations`);
      editor.setDecorations(orphanDecorationType, orphanDecorations);
    }

    // Update status bar with orphan count
    if (this.orphanStatusBar) {
      this.orphanStatusBar.updateCount(orphanDecorations.length);
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
