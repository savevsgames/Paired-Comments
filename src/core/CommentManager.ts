/**
 * CommentManager - Handles CRUD operations for comments
 */

import * as vscode from 'vscode';
import { Comment, CommentFile, AddCommentOptions, UpdateCommentOptions } from '../types';
import { FileSystemManager } from '../io/FileSystemManager';

export class CommentManager {
  private cache: Map<string, CommentFile> = new Map();

  // @ts-expect-error - will be used when implementing methods
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private fileSystemManager: FileSystemManager) {}

  /**
   * Load comments for a source file
   */
  async loadComments(_sourceUri: vscode.Uri): Promise<CommentFile> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Save comments for a source file
   */
  async saveComments(_sourceUri: vscode.Uri, _commentFile: CommentFile): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Add a new comment
   */
  async addComment(_sourceUri: vscode.Uri, _options: AddCommentOptions): Promise<Comment> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Update an existing comment
   */
  async updateComment(_sourceUri: vscode.Uri, _options: UpdateCommentOptions): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Delete a comment
   */
  async deleteComment(_sourceUri: vscode.Uri, _commentId: string): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Get all comments for a specific line
   */
  getCommentsForLine(_sourceUri: vscode.Uri, _line: number): Comment[] {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Get a comment by ID
   */
  getCommentById(_sourceUri: vscode.Uri, _commentId: string): Comment | undefined {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Reload comments from disk (invalidate cache)
   */
  async reloadComments(_sourceUri: vscode.Uri): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
