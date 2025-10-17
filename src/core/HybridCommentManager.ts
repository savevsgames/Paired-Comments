/**
 * HybridCommentManager - Manages comments from both .comments files and inline sources
 */

import * as vscode from 'vscode';
import { Comment } from '../types';
import { CommentManager } from './CommentManager';
import { InlineCommentParser, InlineComment } from './InlineCommentParser';
import { FileSystemManager } from '../io/FileSystemManager';

export interface HybridComment extends Comment {
  source: 'paired' | 'inline' | 'paired-marker';
  inlineText?: string;
  canMigrate?: boolean;
}

export type ViewMode = 'inline' | 'paired' | 'hybrid';

export class HybridCommentManager extends CommentManager {
  private inlineParser: InlineCommentParser;
  private viewMode: Map<string, ViewMode> = new Map();

  constructor(fileSystemManager: FileSystemManager) {
    super(fileSystemManager);
    this.inlineParser = new InlineCommentParser();
  }

  /**
   * Load all comments from both sources (hybrid mode)
   */
  async loadAllComments(sourceUri: vscode.Uri): Promise<HybridComment[]> {
    // Load from .comments file
    const pairedComments = await super.loadComments(sourceUri);

    // Load from inline comments
    const document = await vscode.workspace.openTextDocument(sourceUri);
    const inlineComments = this.inlineParser.parseDocument(document);

    // Merge both sources
    return this.mergeComments(pairedComments.comments, inlineComments);
  }

  /**
   * Merge comments from both sources, avoiding duplicates
   */
  private mergeComments(
    pairedComments: Comment[],
    inlineComments: InlineComment[]
  ): HybridComment[] {
    const result: HybridComment[] = [];
    const pairedLines = new Set(pairedComments.map(c => c.line));

    // Add paired comments first (highest priority)
    for (const comment of pairedComments) {
      result.push({
        ...comment,
        source: 'paired',
        canMigrate: false
      });
    }

    // Add inline comments that don't conflict with paired comments
    for (const inlineComment of inlineComments) {
      if (!pairedLines.has(inlineComment.line)) {
        result.push({
          ...inlineComment,
          source: inlineComment.source,
          inlineText: inlineComment.originalLine,
          canMigrate: true
        });
      }
    }

    // Sort by line number
    result.sort((a, b) => a.line - b.line);

    return result;
  }

  /**
   * Get view mode for a file
   */
  getViewMode(sourceUri: vscode.Uri): ViewMode {
    const key = sourceUri.fsPath;
    return this.viewMode.get(key) || 'hybrid'; // Default to hybrid
  }

  /**
   * Set view mode for a file
   */
  setViewMode(sourceUri: vscode.Uri, mode: ViewMode): void {
    const key = sourceUri.fsPath;
    this.viewMode.set(key, mode);
  }

  /**
   * Get migratable comments count
   */
  async getMigratableCount(sourceUri: vscode.Uri): Promise<number> {
    const allComments = await this.loadAllComments(sourceUri);
    return allComments.filter(c => c.canMigrate).length;
  }

  /**
   * Migrate inline comments to .comments file
   */
  async migrateInlineComments(
    sourceUri: vscode.Uri,
    options: {
      removeInline?: boolean;
      onlyMarked?: boolean; // Only migrate @paired-comment: markers
    } = {}
  ): Promise<{
    migrated: number;
    skipped: number;
  }> {
    const allComments = await this.loadAllComments(sourceUri);
    const toMigrate = allComments.filter(c => {
      if (!c.canMigrate) return false;
      if (options.onlyMarked && c.source !== 'paired-marker') return false;
      return true;
    });

    if (toMigrate.length === 0) {
      return { migrated: 0, skipped: 0 };
    }

    // Load existing paired comments
    const commentFile = await super.loadComments(sourceUri);

    // Add inline comments to paired comments
    for (const comment of toMigrate) {
      // Convert to regular Comment (remove hybrid-specific fields)
      const regularComment: Comment = {
        id: comment.id,
        line: comment.line,
        text: comment.text,
        author: comment.author,
        created: comment.created,
        updated: comment.updated,
        tag: comment.tag
      };

      commentFile.comments.push(regularComment);
    }

    // Sort by line number
    commentFile.comments.sort((a, b) => a.line - b.line);

    // Save to .comments file
    await super.saveComments(sourceUri, commentFile);

    // Optionally remove inline comments from source file
    if (options.removeInline) {
      await this.removeInlineComments(sourceUri, toMigrate);
    }

    return {
      migrated: toMigrate.length,
      skipped: allComments.length - toMigrate.length
    };
  }

  /**
   * Remove inline comments from source file
   */
  private async removeInlineComments(
    sourceUri: vscode.Uri,
    comments: HybridComment[]
  ): Promise<void> {
    const document = await vscode.workspace.openTextDocument(sourceUri);

    const edit = new vscode.WorkspaceEdit();

    // Remove comments in reverse order to maintain line numbers
    const sortedComments = [...comments].sort((a, b) => b.line - a.line);

    for (const comment of sortedComments) {
      if (comment.inlineText) {
        const line = document.lineAt(comment.line - 1); // Convert to 0-indexed

        // Check if line contains only the comment (whitespace + comment)
        const trimmed = line.text.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
          // Remove entire line
          const range = new vscode.Range(
            new vscode.Position(comment.line - 1, 0),
            new vscode.Position(comment.line, 0)
          );
          edit.delete(sourceUri, range);
        } else {
          // Comment is inline with code, just remove comment part
          // This is more complex, skip for now
          // TODO: Handle inline comments with code on same line
        }
      }
    }

    await vscode.workspace.applyEdit(edit);
    await document.save();
  }

  /**
   * Get statistics for a file
   */
  async getCommentStats(sourceUri: vscode.Uri): Promise<{
    total: number;
    paired: number;
    inline: number;
    migratable: number;
  }> {
    const allComments = await this.loadAllComments(sourceUri);

    return {
      total: allComments.length,
      paired: allComments.filter(c => c.source === 'paired').length,
      inline: allComments.filter(c => c.source === 'inline' || c.source === 'paired-marker').length,
      migratable: allComments.filter(c => c.canMigrate).length
    };
  }
}
