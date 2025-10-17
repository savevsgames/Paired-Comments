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
   * Check if a file is already a .comments file
   */
  isCommentFile(uri: vscode.Uri): boolean {
    return uri.fsPath.endsWith(COMMENT_FILE_EXTENSION);
  }

  /**
   * Check if a comment file exists
   */
  async commentFileExists(sourceUri: vscode.Uri): Promise<boolean> {
    const commentUri = this.getCommentFileUri(sourceUri);
    try {
      await vscode.workspace.fs.stat(commentUri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read a comment file from disk
   * Returns null if the file doesn't exist
   */
  async readCommentFile(sourceUri: vscode.Uri): Promise<CommentFile | null> {
    const commentUri = this.getCommentFileUri(sourceUri);

    try {
      const fileData = await vscode.workspace.fs.readFile(commentUri);
      const text = Buffer.from(fileData).toString('utf8');
      const data = JSON.parse(text) as unknown;

      if (!this.validateCommentFile(data)) {
        throw new Error('Invalid comment file schema');
      }

      return data;
    } catch (error) {
      if ((error as { code?: string }).code === 'FileNotFound') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write a comment file to disk
   * Creates parent directories if needed
   */
  async writeCommentFile(sourceUri: vscode.Uri, data: CommentFile): Promise<void> {
    const commentUri = this.getCommentFileUri(sourceUri);
    const text = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(text, 'utf8');

    await vscode.workspace.fs.writeFile(commentUri, buffer);
  }

  /**
   * Create an empty comment file
   */
  async createEmptyCommentFile(sourceUri: vscode.Uri): Promise<CommentFile> {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
    const relativePath = workspaceFolder
      ? vscode.workspace.asRelativePath(sourceUri, false)
      : sourceUri.fsPath;

    const commentFile: CommentFile = {
      file: relativePath,
      version: '1.0',
      comments: []
    };

    await this.writeCommentFile(sourceUri, commentFile);
    return commentFile;
  }

  /**
   * Validate comment file schema
   */
  validateCommentFile(data: unknown): data is CommentFile {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Check required fields
    if (typeof obj['file'] !== 'string') return false;
    if (typeof obj['version'] !== 'string') return false;
    if (!Array.isArray(obj['comments'])) return false;

    // Validate each comment
    for (const comment of obj['comments']) {
      if (!comment || typeof comment !== 'object') return false;
      const c = comment as Record<string, unknown>;

      if (typeof c['id'] !== 'string') return false;
      if (typeof c['line'] !== 'number') return false;
      if (typeof c['text'] !== 'string') return false;
      if (typeof c['author'] !== 'string') return false;
      if (typeof c['created'] !== 'string') return false;
      if (typeof c['updated'] !== 'string') return false;
    }

    return true;
  }
}
