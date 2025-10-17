/**
 * CommentManager - Handles CRUD operations for comments
 */

import * as vscode from 'vscode';
import { Comment, CommentFile, AddCommentOptions, UpdateCommentOptions, detectTag } from '../types';
import { FileSystemManager } from '../io/FileSystemManager';

export class CommentManager {
  private cache: Map<string, CommentFile> = new Map();

  constructor(private fileSystemManager: FileSystemManager) {}

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

    // Cache and return
    this.cache.set(key, commentFile);
    return commentFile;
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

    const newComment: Comment = {
      id,
      line: options.line,
      text: options.text,
      author,
      created: now,
      updated: now,
      tag: tag
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
