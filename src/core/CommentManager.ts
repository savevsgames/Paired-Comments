/**
 * CommentManager - Handles CRUD operations for comments
 * Now with ghost marker support for automatic line tracking! 👻
 * v2.1.0: AI metadata enrichment
 */

import * as vscode from 'vscode';
import { Comment, CommentFile, AddCommentOptions, UpdateCommentOptions, detectTag } from '../types';
import { FileSystemManager } from '../io/FileSystemManager';
import { GhostMarkerManager } from './GhostMarkerManager';
import { aiMetadataService } from '../ai/AIMetadataService';
import { logger } from '../utils/Logger';

export class CommentManager {
  private cache: Map<string, CommentFile> = new Map();
  private ghostMarkerManager: GhostMarkerManager | null = null;

  constructor(
    private fileSystemManager: FileSystemManager,
    ghostMarkerManager?: GhostMarkerManager
  ) {
    // Ghost markers are optional for backwards compatibility
    this.ghostMarkerManager = ghostMarkerManager || null;
  }

  /**
   * Enable ghost markers (call this after construction if needed)
   */
  enableGhostMarkers(ghostMarkerManager: GhostMarkerManager): void {
    this.ghostMarkerManager = ghostMarkerManager;
  }

  /**
   * Load comments for a source file
   */
  async loadComments(sourceUri: vscode.Uri): Promise<CommentFile> {
    const key = sourceUri.fsPath;

    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Try to load from disk
    let commentFile = await this.fileSystemManager.readCommentFile(sourceUri);

    // If file doesn't exist, create an empty one
    if (!commentFile) {
      commentFile = await this.fileSystemManager.createEmptyCommentFile(sourceUri);
    }

    // Restore ghost markers if they exist
    if (this.ghostMarkerManager && commentFile.ghostMarkers) {
      await this.restoreGhostMarkers(sourceUri, commentFile);
    }

    // Cache and return
    this.cache.set(key, commentFile);
    return commentFile;
  }

  /**
   * Restore ghost markers from comment file
   */
  private async restoreGhostMarkers(sourceUri: vscode.Uri, commentFile: CommentFile): Promise<void> {
    if (!this.ghostMarkerManager || !commentFile.ghostMarkers) {
      return;
    }

    const document = await vscode.workspace.openTextDocument(sourceUri);
    const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === sourceUri.toString());

    for (const marker of commentFile.ghostMarkers) {
      // Re-add marker to tracking
      this.ghostMarkerManager.addMarker(document, marker, editor);
    }

    // Verify all markers (check for drift)
    const results = await this.ghostMarkerManager.verifyMarkers(document);

    // Log any drift detected (for now just console, later we'll show UI)
    for (const result of results) {
      if (result.status !== 'valid') {
        console.log(`[GhostMarker] Drift detected:`, result);
      }
    }
  }

  /**
   * Save comments for a source file
   */
  async saveComments(sourceUri: vscode.Uri, commentFile: CommentFile): Promise<void> {
    await this.fileSystemManager.writeCommentFile(sourceUri, commentFile);
    // Update cache
    this.cache.set(sourceUri.fsPath, commentFile);
  }

  /**
   * Add a new comment
   */
  async addComment(sourceUri: vscode.Uri, options: AddCommentOptions): Promise<Comment> {
    const commentFile = await this.loadComments(sourceUri);

    // Generate unique ID
    const id = this.generateId();
    const now = new Date().toISOString();
    const author = options.author || this.getDefaultAuthor();
    const tag = detectTag(options.text);

    // Create or find ghost marker for this line
    let ghostMarkerId: string | undefined;
    if (this.ghostMarkerManager) {
      const document = await vscode.workspace.openTextDocument(sourceUri);
      const editor = vscode.window.activeTextEditor;

      // Check if a ghost marker already exists at this line
      let existingMarker = this.ghostMarkerManager.getMarkerAtLine(sourceUri, options.line);

      if (existingMarker) {
        // Add comment to existing marker
        existingMarker.commentIds.push(id);
        ghostMarkerId = existingMarker.id;
      } else {
        // Create new ghost marker (now async with AST support + range support v2.0.6)
        const marker = await this.ghostMarkerManager.createMarker(
          document,
          options.line,
          [id],
          options.endLine // Pass endLine for range comments (v2.0.6)
        );
        this.ghostMarkerManager.addMarker(document, marker, editor);
        ghostMarkerId = marker.id;

        // Add marker to comment file
        if (!commentFile.ghostMarkers) {
          commentFile.ghostMarkers = [];
        }
        commentFile.ghostMarkers.push(marker);
      }
    }

    // AI metadata enrichment (v2.1.0) - Optional and non-blocking
    let aiMetadata: Comment['aiMetadata'];
    if (options.requestAIMetadata && options.codeSnippet && options.languageId) {
      try {
        logger.info(`Enriching comment with AI metadata (line ${options.line})`);

        // Run all three AI operations in parallel for efficiency
        const [complexity, tokens, parameters] = await Promise.all([
          aiMetadataService.analyzeComplexity(
            options.codeSnippet,
            options.languageId,
            { filePath: sourceUri.fsPath, lineNumber: options.line }
          ),
          aiMetadataService.estimateTokens(
            options.codeSnippet,
            options.languageId,
            { filePath: sourceUri.fsPath }
          ),
          aiMetadataService.extractParameters(
            options.codeSnippet,
            options.languageId,
            { filePath: sourceUri.fsPath, lineNumber: options.line }
          )
        ]);

        // Build AI metadata object (only include if available)
        if (complexity || tokens || parameters) {
          aiMetadata = {
            analyzedAt: now,
            provider: 'openai', // TODO: Get from service stats
            model: 'gpt-4', // TODO: Get from service stats
          };

          if (complexity) {
            aiMetadata.complexity = {
              cyclomatic: complexity.cyclomatic,
              cognitive: complexity.cognitive,
              maintainability: complexity.maintainability,
              confidence: complexity.confidence
            };
          }

          if (tokens) {
            aiMetadata.tokens = {
              heuristic: tokens.heuristic,
              validated: tokens.validated,
              confidence: tokens.confidence
            };
          }

          if (parameters) {
            aiMetadata.parameters = {
              name: parameters.name,
              kind: parameters.kind,
              parameters: parameters.parameters,
              returnType: parameters.returnType,
              lineCount: parameters.lineCount,
              confidence: parameters.confidence
            };
          }

          logger.info(`AI metadata enrichment successful (complexity: ${complexity?.cyclomatic}, tokens: ${tokens?.validated})`);
        }
      } catch (error) {
        // Non-blocking: Log error but continue with comment creation
        logger.warn('AI metadata enrichment failed (comment will be created without metadata)', error);
      }
    }

    const newComment: Comment = {
      id,
      line: options.line,
      startLine: options.line, // Always set startLine (v2.0.6)
      endLine: options.endLine, // Set endLine if provided (v2.0.6)
      text: options.text,
      author,
      created: now,
      updated: now,
      tag: tag,
      ghostMarkerId: ghostMarkerId,
      aiMetadata: aiMetadata // v2.1.0: Add AI metadata if available
    };

    // Add to comments array
    commentFile.comments.push(newComment);

    // Sort by line number
    commentFile.comments.sort((a, b) => a.line - b.line);

    // Save to disk
    await this.saveComments(sourceUri, commentFile);

    return newComment;
  }

  /**
   * Update an existing comment
   */
  async updateComment(sourceUri: vscode.Uri, options: UpdateCommentOptions): Promise<void> {
    const commentFile = await this.loadComments(sourceUri);

    const comment = commentFile.comments.find(c => c.id === options.id);
    if (!comment) {
      throw new Error(`Comment with ID ${options.id} not found`);
    }

    comment.text = options.text;
    comment.updated = new Date().toISOString();
    comment.tag = detectTag(options.text);

    await this.saveComments(sourceUri, commentFile);
  }

  /**
   * Delete a comment
   */
  async deleteComment(sourceUri: vscode.Uri, commentId: string): Promise<void> {
    const commentFile = await this.loadComments(sourceUri);

    const index = commentFile.comments.findIndex(c => c.id === commentId);
    if (index === -1) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }

    const comment = commentFile.comments[index];
    if (!comment) {
      throw new Error(`Comment at index ${index} not found`);
    }

    // Remove comment from ghost marker
    if (this.ghostMarkerManager && comment.ghostMarkerId) {
      const marker = this.ghostMarkerManager.getMarkerById(sourceUri, comment.ghostMarkerId);

      if (marker) {
        // Remove comment ID from marker
        marker.commentIds = marker.commentIds.filter(id => id !== commentId);

        // If marker has no more comments, remove it entirely
        if (marker.commentIds.length === 0) {
          this.ghostMarkerManager.removeMarker(sourceUri, marker.id);

          // Remove from comment file too
          if (commentFile.ghostMarkers) {
            commentFile.ghostMarkers = commentFile.ghostMarkers.filter(m => m.id !== marker.id);
          }
        }
      }
    }

    // Remove comment
    commentFile.comments.splice(index, 1);

    await this.saveComments(sourceUri, commentFile);
  }

  /**
   * Get all comments for a specific line
   */
  getCommentsForLine(sourceUri: vscode.Uri, line: number): Comment[] {
    const commentFile = this.cache.get(sourceUri.fsPath);
    if (!commentFile) {
      return [];
    }

    return commentFile.comments.filter(c => c.line === line);
  }

  /**
   * Get a comment by ID
   */
  getCommentById(sourceUri: vscode.Uri, commentId: string): Comment | undefined {
    const commentFile = this.cache.get(sourceUri.fsPath);
    if (!commentFile) {
      return undefined;
    }

    return commentFile.comments.find(c => c.id === commentId);
  }

  /**
   * Reload comments from disk (invalidate cache)
   */
  async reloadComments(sourceUri: vscode.Uri): Promise<void> {
    this.cache.delete(sourceUri.fsPath);
    await this.loadComments(sourceUri);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate a unique ID for a comment
   */
  private generateId(): string {
    // Simple UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get the default author name
   */
  private getDefaultAuthor(): string {
    const config = vscode.workspace.getConfiguration('pairedComments');
    return config.get<string>('defaultAuthor') || 'Unknown';
  }
}
