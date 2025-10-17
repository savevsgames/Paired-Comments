/**
 * FileSystemManager - Handles file I/O for .comments files
 * Supports both v1.0 (basic comments) and v2.0 (with ghost markers)
 */

import * as vscode from 'vscode';
import { CommentFile, COMMENT_FILE_EXTENSION, COMMENT_FILE_VERSION } from '../types';

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

    // DEBUG: Log the paths we're using
    console.log('[FileSystemManager] Reading .comments file:');
    console.log('  Source URI:', sourceUri.fsPath);
    console.log('  Comment URI:', commentUri.fsPath);

    try {
      const fileData = await vscode.workspace.fs.readFile(commentUri);
      const text = Buffer.from(fileData).toString('utf8');
      const data = JSON.parse(text) as unknown;

      if (!this.validateCommentFile(data)) {
        console.error('[FileSystemManager] Validation failed for:', commentUri.fsPath);
        throw new Error('Invalid comment file schema');
      }

      console.log('[FileSystemManager] Successfully loaded .comments file');
      console.log('  Version:', (data as CommentFile).version);
      console.log('  Comments:', (data as CommentFile).comments.length);
      console.log('  Ghost Markers:', (data as CommentFile).ghostMarkers?.length || 0);

      return data;
    } catch (error) {
      if ((error as { code?: string }).code === 'FileNotFound') {
        console.log('[FileSystemManager] .comments file not found, will create empty');
        return null;
      }
      console.error('[FileSystemManager] Error reading .comments file:', error);
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
      version: COMMENT_FILE_VERSION, // Use current version (now 2.0 with ghost markers)
      ghostMarkers: [], // Initialize empty ghost markers array
      comments: []
    };

    await this.writeCommentFile(sourceUri, commentFile);
    return commentFile;
  }

  /**
   * Validate comment file schema
   * Supports both v1.0 (basic) and v2.0 (with ghost markers)
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

    // Validate ghost markers (optional, only in v2.0+)
    if (obj['ghostMarkers'] !== undefined) {
      if (!Array.isArray(obj['ghostMarkers'])) return false;

      for (const marker of obj['ghostMarkers']) {
        if (!marker || typeof marker !== 'object') return false;
        const m = marker as Record<string, unknown>;

        if (typeof m['id'] !== 'string') return false;
        if (typeof m['line'] !== 'number') return false;
        if (!Array.isArray(m['commentIds'])) return false;
        if (typeof m['lineHash'] !== 'string') return false;
        if (typeof m['lineText'] !== 'string') return false;
        if (typeof m['prevLineText'] !== 'string') return false;
        if (typeof m['nextLineText'] !== 'string') return false;
        if (typeof m['lastVerified'] !== 'string') return false;
      }
    }

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
      // ghostMarkerId is optional (only in v2.0+)
    }

    return true;
  }
}
