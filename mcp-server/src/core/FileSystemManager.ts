/**
 * File System Manager
 * Handles all file I/O operations for .comments files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CommentFile, Comment, GhostMarker } from '../types/comments.js';
import { ErrorCode } from '../types/mcp.js';

export class FileSystemManager {
  constructor(private workspaceRoot: string) {}

  /**
   * Validate file path is within workspace and not forbidden
   */
  private validatePath(filePath: string): void {
    const resolved = path.resolve(this.workspaceRoot, filePath);

    // Prevent directory traversal attacks
    if (!resolved.startsWith(this.workspaceRoot)) {
      throw this.createError(
        ErrorCode.FileAccessDenied,
        'Access denied: Path outside workspace',
        { filePath, workspaceRoot: this.workspaceRoot }
      );
    }

    // Prevent access to sensitive files/directories
    const forbidden = ['.env', '.git', 'node_modules', '.vscode'];
    const normalizedPath = resolved.replace(/\\/g, '/');

    if (forbidden.some(dir => normalizedPath.includes(`/${dir}/`) || normalizedPath.endsWith(`/${dir}`))) {
      throw this.createError(
        ErrorCode.FileAccessDenied,
        'Access denied: Forbidden path',
        { filePath, reason: 'Sensitive directory' }
      );
    }
  }

  /**
   * Get full path to comment file
   */
  private getCommentFilePath(filePath: string): string {
    this.validatePath(filePath);
    return path.join(this.workspaceRoot, `${filePath}.comments`);
  }

  /**
   * Check if comment file exists
   */
  async commentFileExists(filePath: string): Promise<boolean> {
    try {
      const commentPath = this.getCommentFilePath(filePath);
      await fs.access(commentPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read comment file
   */
  async readCommentFile(filePath: string): Promise<CommentFile> {
    const commentPath = this.getCommentFilePath(filePath);

    try {
      const content = await fs.readFile(commentPath, 'utf-8');
      const data = JSON.parse(content);

      // Validate basic structure
      if (!data.version || !data.comments || !data.ghostMarkers) {
        throw this.createError(
          ErrorCode.CommentFileCorrupted,
          'Invalid comment file format',
          { filePath, reason: 'Missing required fields' }
        );
      }

      return data as CommentFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw this.createError(
          ErrorCode.FileNotFound,
          'Comment file not found',
          { filePath: `${filePath}.comments` }
        );
      }
      if (error instanceof SyntaxError) {
        throw this.createError(
          ErrorCode.CommentFileCorrupted,
          'Failed to parse comment file JSON',
          { filePath, error: error.message }
        );
      }
      throw error;
    }
  }

  /**
   * Write comment file
   */
  async writeCommentFile(filePath: string, commentFile: CommentFile): Promise<void> {
    const commentPath = this.getCommentFilePath(filePath);

    try {
      // Ensure directory exists
      const dir = path.dirname(commentPath);
      await fs.mkdir(dir, { recursive: true });

      // Write with pretty formatting
      const content = JSON.stringify(commentFile, null, 2);
      await fs.writeFile(commentPath, content, 'utf-8');
    } catch (error) {
      throw this.createError(
        ErrorCode.InternalError,
        'Failed to write comment file',
        { filePath, error: (error as Error).message }
      );
    }
  }

  /**
   * Create new comment file if it doesn't exist
   */
  async createCommentFile(filePath: string): Promise<CommentFile> {
    const commentFile: CommentFile = {
      version: '2.1.0',
      filePath,
      comments: [],
      ghostMarkers: [],
      metadata: {
        lastSync: new Date().toISOString(),
        totalComments: 0
      }
    };

    await this.writeCommentFile(filePath, commentFile);
    return commentFile;
  }

  /**
   * Add comment to file
   */
  async addComment(
    filePath: string,
    comment: Comment,
    ghostMarker: GhostMarker
  ): Promise<void> {
    let commentFile: CommentFile;

    if (await this.commentFileExists(filePath)) {
      commentFile = await this.readCommentFile(filePath);
    } else {
      commentFile = await this.createCommentFile(filePath);
    }

    commentFile.comments.push(comment);
    commentFile.ghostMarkers.push(ghostMarker);
    commentFile.metadata = {
      ...commentFile.metadata,
      lastSync: new Date().toISOString(),
      totalComments: commentFile.comments.length
    };

    await this.writeCommentFile(filePath, commentFile);
  }

  /**
   * Update comment in file
   */
  async updateComment(
    filePath: string,
    commentId: string,
    text: string
  ): Promise<void> {
    const commentFile = await this.readCommentFile(filePath);
    const comment = commentFile.comments.find(c => c.id === commentId);

    if (!comment) {
      throw this.createError(
        ErrorCode.CommentNotFound,
        'Comment not found',
        { filePath, commentId }
      );
    }

    comment.text = text;
    comment.updated = new Date().toISOString();

    await this.writeCommentFile(filePath, commentFile);
  }

  /**
   * Delete comment from file
   */
  async deleteComment(filePath: string, commentId: string): Promise<void> {
    const commentFile = await this.readCommentFile(filePath);

    const commentIndex = commentFile.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      throw this.createError(
        ErrorCode.CommentNotFound,
        'Comment not found',
        { filePath, commentId }
      );
    }

    // Remove comment and associated ghost marker
    commentFile.comments.splice(commentIndex, 1);
    commentFile.ghostMarkers = commentFile.ghostMarkers.filter(
      gm => gm.commentId !== commentId
    );

    commentFile.metadata = {
      ...commentFile.metadata,
      lastSync: new Date().toISOString(),
      totalComments: commentFile.comments.length
    };

    await this.writeCommentFile(filePath, commentFile);
  }

  /**
   * Get all comment files in workspace
   */
  async getAllCommentFiles(): Promise<CommentFile[]> {
    const commentFiles: CommentFile[] = [];

    async function scanDirectory(dir: string, fsManager: FileSystemManager): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip forbidden directories
          if (entry.isDirectory()) {
            const forbidden = ['node_modules', '.git', '.vscode'];
            if (!forbidden.includes(entry.name)) {
              await scanDirectory(fullPath, fsManager);
            }
          } else if (entry.name.endsWith('.comments')) {
            const relativePath = path.relative(fsManager.workspaceRoot, fullPath);
            const sourceFilePath = relativePath.replace(/\.comments$/, '');
            try {
              const commentFile = await fsManager.readCommentFile(sourceFilePath);
              commentFiles.push(commentFile);
            } catch (error) {
              // Skip corrupted files
              console.error(`[FileSystem] Failed to read ${relativePath}:`, error);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't access
        console.error(`[FileSystem] Failed to scan ${dir}:`, error);
      }
    }

    await scanDirectory(this.workspaceRoot, this);
    return commentFiles;
  }

  /**
   * Check if source file exists
   */
  async sourceFileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.workspaceRoot, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read source file content
   */
  async readSourceFile(filePath: string): Promise<string> {
    this.validatePath(filePath);
    const fullPath = path.join(this.workspaceRoot, filePath);

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw this.createError(
          ErrorCode.FileNotFound,
          'Source file not found',
          { filePath }
        );
      }
      throw error;
    }
  }

  /**
   * Get line count of source file
   */
  async getSourceFileLineCount(filePath: string): Promise<number> {
    const content = await this.readSourceFile(filePath);
    return content.split('\n').length;
  }

  /**
   * Create error object
   */
  private createError(code: ErrorCode, message: string, data?: unknown): Error {
    const error = new Error(message) as Error & { code: ErrorCode; data?: unknown };
    error.code = code;
    error.data = data;
    return error;
  }
}
