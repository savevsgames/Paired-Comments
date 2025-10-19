/**
 * Comment Service
 * Handles CRUD operations for comments
 */

import { FileSystemManager } from '../core/FileSystemManager.js';
import { ASTParser } from '../core/ASTParser.js';
import { EventBus, CommentAddedEvent, CommentUpdatedEvent, CommentDeletedEvent, CommentMovedEvent } from '../core/EventBus.js';
import {
  Comment,
  GhostMarker,
  CommentFile,
  AddCommentParams,
  AddCommentResult,
  EditCommentParams,
  DeleteCommentParams,
  MoveCommentParams
} from '../types/comments.js';
import { ErrorCode } from '../types/mcp.js';

export class CommentService {
  constructor(
    private fileSystem: FileSystemManager,
    private astParser: ASTParser,
    private eventBus: EventBus
  ) {}

  /**
   * Add a new comment to a source file
   */
  async addComment(params: AddCommentParams): Promise<AddCommentResult> {
    // Validate line number
    if (!await this.fileSystem.sourceFileExists(params.filePath)) {
      throw this.createError(
        ErrorCode.FileNotFound,
        'Source file not found',
        { filePath: params.filePath }
      );
    }

    const lineCount = await this.fileSystem.getSourceFileLineCount(params.filePath);
    if (params.line < 1 || params.line > lineCount) {
      throw this.createError(
        ErrorCode.InvalidLineNumber,
        `Invalid line number: must be between 1 and ${lineCount}`,
        { filePath: params.filePath, line: params.line, fileLineCount: lineCount }
      );
    }

    // Generate IDs
    const timestamp = Date.now();
    const commentId = `c_${timestamp}`;
    const ghostMarkerId = `gm_${timestamp + 1}`;

    // Try to find symbol anchor
    const source = await this.fileSystem.readSourceFile(params.filePath);
    const anchor = await this.astParser.findSymbolAtLine(
      params.filePath,
      source,
      params.line
    );

    // Create comment object
    const comment: Comment = {
      id: commentId,
      text: params.text,
      tag: params.tag,
      author: params.author || 'ai',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      aiMeta: params.aiMeta
    };

    // Create ghost marker
    const ghostMarker: GhostMarker = {
      id: ghostMarkerId,
      commentId,
      line: params.line,
      anchor: anchor?.name,
      anchorType: anchor?.type,
      originalLine: params.line,
      isOrphaned: false
    };

    // Save to file
    await this.fileSystem.addComment(params.filePath, comment, ghostMarker);

    // Emit event
    await this.eventBus.emit<CommentAddedEvent>('comment:added', {
      filePath: params.filePath,
      comment: {
        id: comment.id,
        text: comment.text,
        tag: comment.tag
      },
      ghostMarker: {
        id: ghostMarker.id,
        line: ghostMarker.line
      }
    });

    const anchorInfo = anchor ? ` and anchored to ${anchor.type} '${anchor.name}'` : '';

    return {
      commentId,
      ghostMarkerId,
      message: `Comment added successfully at line ${params.line}${anchorInfo}`
    };
  }

  /**
   * Edit an existing comment
   */
  async editComment(params: EditCommentParams): Promise<void> {
    await this.fileSystem.updateComment(
      params.filePath,
      params.commentId,
      params.text
    );

    await this.eventBus.emit<CommentUpdatedEvent>('comment:updated', {
      filePath: params.filePath,
      commentId: params.commentId,
      newText: params.text
    });
  }

  /**
   * Delete a comment
   */
  async deleteComment(params: DeleteCommentParams): Promise<void> {
    await this.fileSystem.deleteComment(params.filePath, params.commentId);

    await this.eventBus.emit<CommentDeletedEvent>('comment:deleted', {
      filePath: params.filePath,
      commentId: params.commentId
    });
  }

  /**
   * Get all comments for a file
   */
  async getFileComments(
    filePath: string,
    includeOrphaned: boolean = true
  ): Promise<CommentFile> {
    const commentFile = await this.fileSystem.readCommentFile(filePath);

    if (!includeOrphaned) {
      commentFile.comments = commentFile.comments.filter(comment => {
        const marker = commentFile.ghostMarkers.find(gm => gm.commentId === comment.id);
        return marker && !marker.isOrphaned;
      });

      commentFile.ghostMarkers = commentFile.ghostMarkers.filter(
        gm => !gm.isOrphaned
      );
    }

    return commentFile;
  }

  /**
   * Get a specific comment
   */
  async getComment(filePath: string, commentId: string): Promise<Comment | null> {
    const commentFile = await this.fileSystem.readCommentFile(filePath);
    return commentFile.comments.find(c => c.id === commentId) || null;
  }

  /**
   * Move comment to different file/line
   */
  async moveComment(params: MoveCommentParams): Promise<void> {
    // Read source comment file
    const sourceFile = await this.fileSystem.readCommentFile(params.sourceFile);
    const commentIndex = sourceFile.comments.findIndex(c => c.id === params.commentId);

    if (commentIndex === -1) {
      throw this.createError(
        ErrorCode.CommentNotFound,
        'Comment not found in source file',
        { sourceFile: params.sourceFile, commentId: params.commentId }
      );
    }

    // Validate target line
    if (!await this.fileSystem.sourceFileExists(params.targetFile)) {
      throw this.createError(
        ErrorCode.FileNotFound,
        'Target file not found',
        { filePath: params.targetFile }
      );
    }

    const lineCount = await this.fileSystem.getSourceFileLineCount(params.targetFile);
    if (params.targetLine < 1 || params.targetLine > lineCount) {
      throw this.createError(
        ErrorCode.InvalidLineNumber,
        `Invalid target line: must be between 1 and ${lineCount}`,
        { filePath: params.targetFile, line: params.targetLine, fileLineCount: lineCount }
      );
    }

    // Get comment and ghost marker
    const comment = sourceFile.comments[commentIndex];
    const ghostMarkerIndex = sourceFile.ghostMarkers.findIndex(
      gm => gm.commentId === params.commentId
    );
    const ghostMarker = sourceFile.ghostMarkers[ghostMarkerIndex];

    // Find new anchor
    const targetSource = await this.fileSystem.readSourceFile(params.targetFile);
    const anchor = await this.astParser.findSymbolAtLine(
      params.targetFile,
      targetSource,
      params.targetLine
    );

    // Update ghost marker
    ghostMarker.line = params.targetLine;
    ghostMarker.anchor = anchor?.name;
    ghostMarker.anchorType = anchor?.type;

    // Update comment
    comment.updated = new Date().toISOString();

    // Remove from source (if different file)
    if (params.sourceFile !== params.targetFile) {
      sourceFile.comments.splice(commentIndex, 1);
      sourceFile.ghostMarkers.splice(ghostMarkerIndex, 1);
      await this.fileSystem.writeCommentFile(params.sourceFile, sourceFile);

      // Add to target
      await this.fileSystem.addComment(params.targetFile, comment, ghostMarker);
    } else {
      // Same file, just update
      await this.fileSystem.writeCommentFile(params.sourceFile, sourceFile);
    }

    await this.eventBus.emit<CommentMovedEvent>('comment:moved', {
      sourceFile: params.sourceFile,
      targetFile: params.targetFile,
      commentId: params.commentId,
      targetLine: params.targetLine
    });
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
