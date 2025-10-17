/**
 * FileSystemManager - Handles file I/O for .comments files
 */

import * as vscode from 'vscode';
import { CommentFile, COMMENT_FILE_EXTENSION } from '../types';

export class FileSystemManager {
  /**
   * Get the URI for a comment file given a source file URI
   */
  getCommentFileUri(sourceUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.file(sourceUri.fsPath + COMMENT_FILE_EXTENSION);
  }

  /**
   * Check if a comment file exists
   */
  async commentFileExists(_sourceUri: vscode.Uri): Promise<boolean> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Read a comment file from disk
   * Returns null if the file doesn't exist
   */
  async readCommentFile(_sourceUri: vscode.Uri): Promise<CommentFile | null> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Write a comment file to disk
   * Creates parent directories if needed
   */
  async writeCommentFile(_sourceUri: vscode.Uri, _data: CommentFile): Promise<void> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Create an empty comment file
   */
  async createEmptyCommentFile(_sourceUri: vscode.Uri): Promise<CommentFile> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Validate comment file schema
   */
  validateCommentFile(_data: unknown): _data is CommentFile {
    // TODO: Implement proper validation
    return true;
  }
}
