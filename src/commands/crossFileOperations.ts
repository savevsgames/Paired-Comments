/**
 * Cross-File Comment Operations
 *
 * Functions for moving and copying comments between files while preserving
 * ghost markers, AI metadata, and parameters.
 *
 * NOT YET INTEGRATED - Implementation ready for testing and integration
 * No commands registered yet - these are pure functions
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { Comment, CommentFile } from '../types';
import { FileSystemManager } from '../io/FileSystemManager';
import { GhostMarkerManager } from '../core/GhostMarkerManager';
import { logger } from '../utils/Logger';

/**
 * Generate a unique ID for a comment
 */
function generateId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface MoveCommentOptions {
  commentId: string;
  sourceUri: vscode.Uri;
  targetUri: vscode.Uri;
  targetLine: number;
  preserveMetadata: boolean;    // Keep AI metadata, params
}

export interface BulkMoveOptions {
  commentIds: string[];         // Array of comment IDs to move
  sourceUri: vscode.Uri;
  targetUri: vscode.Uri;
  targetStartLine: number;      // Where to start placing comments
  preserveRelativeSpacing: boolean;  // Keep relative line positions
}

export interface CopyCommentOptions extends MoveCommentOptions {
  // Same as MoveCommentOptions, but will duplicate instead of move
}

/**
 * Move a comment from one file to another
 *
 * Workflow:
 * 1. Load source .comments file
 * 2. Find comment to move
 * 3. Load target .comments file (create if doesn't exist)
 * 4. Create new ghost marker in target file
 * 5. Update comment to reference new location
 * 6. Remove from source, add to target
 * 7. Remove old ghost marker from source
 * 8. Save both files
 * 9. Update decorations
 */
export async function moveComment(
  options: MoveCommentOptions,
  fileSystemManager: FileSystemManager,
  ghostMarkerManager: GhostMarkerManager
): Promise<void> {
  logger.info(`[CrossFile] Moving comment ${options.commentId} from ${options.sourceUri.fsPath} to ${options.targetUri.fsPath}:${options.targetLine}`);

  try {
    // Step 1: Load source .comments file
    const sourceComments = await fileSystemManager.readCommentFile(options.sourceUri);
    if (!sourceComments) {
      throw new Error(`Source .comments file not found: ${options.sourceUri.fsPath}`);
    }

    // Step 2: Find comment to move
    const commentIndex = sourceComments.comments.findIndex(c => c.id === options.commentId);
    if (commentIndex === -1) {
      throw new Error(`Comment not found: ${options.commentId}`);
    }

    const comment = sourceComments.comments[commentIndex];
    if (!comment) {
      throw new Error(`Comment at index ${commentIndex} is undefined`);
    }

    const oldGhostMarkerId = comment.ghostMarkerId;

    // Step 3: Load target .comments file (create if doesn't exist)
    let targetComments = await fileSystemManager.readCommentFile(options.targetUri);
    if (!targetComments) {
      logger.debug('[CrossFile] Target .comments file does not exist, creating new one');
      targetComments = await createEmptyCommentFile(options.targetUri, fileSystemManager);
    }

    // Step 4: Open target document and create new ghost marker
    const targetDoc = await vscode.workspace.openTextDocument(options.targetUri);

    // Validate target line
    if (options.targetLine < 1 || options.targetLine > targetDoc.lineCount) {
      throw new Error(`Invalid target line: ${options.targetLine} (file has ${targetDoc.lineCount} lines)`);
    }

    const newMarker = await ghostMarkerManager.createMarker(
      targetDoc,
      options.targetLine,
      [comment.id]  // Reuse same comment ID
    );

    // Step 5: Update comment to reference new location
    comment.line = options.targetLine;
    comment.startLine = options.targetLine;
    comment.ghostMarkerId = newMarker.id;
    comment.updated = new Date().toISOString();

    // Optionally strip metadata (using type assertion since Comment doesn't define these as optional)
    if (!options.preserveMetadata) {
      (comment as any).aiMeta = undefined;
      (comment as any).params = undefined;
    }

    // Step 6: Remove from source, add to target
    sourceComments.comments.splice(commentIndex, 1);
    targetComments.comments.push(comment);

    // Step 7: Remove old ghost marker from source
    if (oldGhostMarkerId) {
      const oldMarker = ghostMarkerManager.getMarkerById(options.sourceUri, oldGhostMarkerId);
      if (oldMarker) {
        ghostMarkerManager.removeMarker(options.sourceUri, oldMarker.id);
        logger.debug(`[CrossFile] Removed old ghost marker ${oldGhostMarkerId}`);
      }
    }

    // Step 8: Save both files
    await Promise.all([
      fileSystemManager.writeCommentFile(options.sourceUri, sourceComments),
      fileSystemManager.writeCommentFile(options.targetUri, targetComments)
    ]);

    logger.info(`[CrossFile] Successfully moved comment ${options.commentId} to ${options.targetUri.fsPath}:${options.targetLine}`);

  } catch (error) {
    logger.error('[CrossFile] Error moving comment:', error);
    throw error;
  }
}

/**
 * Copy a comment from one file to another
 *
 * Similar to moveComment, but:
 * - Generates new UUID for copied comment
 * - Creates new ghost marker
 * - Leaves original comment intact
 * - Updates author field to indicate copy
 */
export async function copyComment(
  options: CopyCommentOptions,
  fileSystemManager: FileSystemManager,
  ghostMarkerManager: GhostMarkerManager
): Promise<void> {
  logger.info(`[CrossFile] Copying comment ${options.commentId} from ${options.sourceUri.fsPath} to ${options.targetUri.fsPath}:${options.targetLine}`);

  try {
    // Step 1: Load source .comments file
    const sourceComments = await fileSystemManager.readCommentFile(options.sourceUri);
    if (!sourceComments) {
      throw new Error(`Source .comments file not found: ${options.sourceUri.fsPath}`);
    }

    // Step 2: Find comment to copy
    const comment = sourceComments.comments.find(c => c.id === options.commentId);
    if (!comment) {
      throw new Error(`Comment not found: ${options.commentId}`);
    }

    // Step 3: Load target .comments file (create if doesn't exist)
    let targetComments = await fileSystemManager.readCommentFile(options.targetUri);
    if (!targetComments) {
      logger.debug('[CrossFile] Target .comments file does not exist, creating new one');
      targetComments = await createEmptyCommentFile(options.targetUri, fileSystemManager);
    }

    // Step 4: Generate new ID for copied comment
    const copiedComment: Comment = {
      ...comment,
      id: generateId(),
      line: options.targetLine,
      startLine: options.targetLine,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      author: `${comment.author} (copied from ${path.basename(options.sourceUri.fsPath)})`
    };

    // Optionally strip metadata (using type assertion since Comment doesn't define these as optional)
    if (!options.preserveMetadata) {
      (copiedComment as any).aiMeta = undefined;
      (copiedComment as any).params = undefined;
    }

    // Step 5: Open target document and create new ghost marker
    const targetDoc = await vscode.workspace.openTextDocument(options.targetUri);

    // Validate target line
    if (options.targetLine < 1 || options.targetLine > targetDoc.lineCount) {
      throw new Error(`Invalid target line: ${options.targetLine} (file has ${targetDoc.lineCount} lines)`);
    }

    const newMarker = await ghostMarkerManager.createMarker(
      targetDoc,
      options.targetLine,
      [copiedComment.id]
    );

    copiedComment.ghostMarkerId = newMarker.id;

    // Step 6: Add to target (don't remove from source)
    targetComments.comments.push(copiedComment);

    // Step 7: Save only target file
    await fileSystemManager.writeCommentFile(options.targetUri, targetComments);

    logger.info(`[CrossFile] Successfully copied comment to ${options.targetUri.fsPath}:${options.targetLine} with new ID ${copiedComment.id}`);

  } catch (error) {
    logger.error('[CrossFile] Error copying comment:', error);
    throw error;
  }
}

/**
 * Move multiple comments at once
 *
 * Use case: Moving an entire class with 10 comments from UserService.ts to AccountService.ts
 */
export async function bulkMoveComments(
  options: BulkMoveOptions,
  fileSystemManager: FileSystemManager,
  ghostMarkerManager: GhostMarkerManager
): Promise<{ succeeded: number, failed: number, errors: string[] }> {
  logger.info(`[CrossFile] Bulk moving ${options.commentIds.length} comments from ${options.sourceUri.fsPath} to ${options.targetUri.fsPath}`);

  const results = {
    succeeded: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Load source file to get original line positions
    const sourceComments = await fileSystemManager.readCommentFile(options.sourceUri);
    if (!sourceComments) {
      throw new Error(`Source .comments file not found: ${options.sourceUri.fsPath}`);
    }

    // Calculate target lines for each comment
    const moves: MoveCommentOptions[] = [];

    // Get all comments to move and sort by line number
    const commentsToMove = options.commentIds
      .map(id => sourceComments.comments.find(c => c.id === id))
      .filter(c => c !== undefined) as Comment[];

    commentsToMove.sort((a, b) => a.line - b.line);

    // Calculate relative offsets
    const firstCommentLine = commentsToMove[0]?.line || 0;

    for (const comment of commentsToMove) {
      const relativeOffset = options.preserveRelativeSpacing
        ? comment.line - firstCommentLine
        : 0;

      moves.push({
        commentId: comment.id,
        sourceUri: options.sourceUri,
        targetUri: options.targetUri,
        targetLine: options.targetStartLine + relativeOffset,
        preserveMetadata: true
      });
    }

    // Perform all moves sequentially (to avoid race conditions)
    for (const move of moves) {
      try {
        await moveComment(move, fileSystemManager, ghostMarkerManager);
        results.succeeded++;
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to move comment ${move.commentId}: ${error}`;
        results.errors.push(errorMsg);
        logger.error(`[CrossFile] ${errorMsg}`);
      }
    }

    logger.info(`[CrossFile] Bulk move complete: ${results.succeeded} succeeded, ${results.failed} failed`);

    return results;

  } catch (error) {
    logger.error('[CrossFile] Error in bulk move:', error);
    throw error;
  }
}

/**
 * Export comments to JSON format for cross-workspace import
 */
export interface ExportedComments {
  version: string;
  sourceFile: string;
  exportedAt: string;
  comments: Comment[];
}

export async function exportComments(
  sourceUri: vscode.Uri,
  commentIds: string[],
  fileSystemManager: FileSystemManager
): Promise<ExportedComments> {
  logger.info(`[CrossFile] Exporting ${commentIds.length} comments from ${sourceUri.fsPath}`);

  const sourceComments = await fileSystemManager.readCommentFile(sourceUri);
  if (!sourceComments) {
    throw new Error(`Source .comments file not found: ${sourceUri.fsPath}`);
  }

  const commentsToExport = sourceComments.comments.filter(c => commentIds.includes(c.id));

  return {
    version: '2.1.0',
    sourceFile: path.relative(
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
      sourceUri.fsPath
    ),
    exportedAt: new Date().toISOString(),
    comments: commentsToExport
  };
}

/**
 * Import comments from exported JSON
 */
export async function importComments(
  targetUri: vscode.Uri,
  exportedData: ExportedComments,
  targetStartLine: number,
  fileSystemManager: FileSystemManager,
  ghostMarkerManager: GhostMarkerManager
): Promise<{ imported: number, errors: string[] }> {
  logger.info(`[CrossFile] Importing ${exportedData.comments.length} comments to ${targetUri.fsPath}`);

  const results = {
    imported: 0,
    errors: [] as string[]
  };

  try {
    // Load target .comments file (create if doesn't exist)
    let targetComments = await fileSystemManager.readCommentFile(targetUri);
    if (!targetComments) {
      targetComments = await createEmptyCommentFile(targetUri, fileSystemManager);
    }

    // Open target document
    const targetDoc = await vscode.workspace.openTextDocument(targetUri);

    // Import each comment
    for (const comment of exportedData.comments) {
      try {
        // Generate new ID
        const importedComment: Comment = {
          ...comment,
          id: generateId(),
          line: targetStartLine,
          startLine: targetStartLine,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          author: `${comment.author} (imported from ${exportedData.sourceFile})`
        };

        // Create ghost marker
        const marker = await ghostMarkerManager.createMarker(
          targetDoc,
          targetStartLine,
          [importedComment.id]
        );

        importedComment.ghostMarkerId = marker.id;

        // Add to target
        targetComments.comments.push(importedComment);
        results.imported++;

      } catch (error) {
        results.errors.push(`Failed to import comment: ${error}`);
        logger.error('[CrossFile] Import error:', error);
      }
    }

    // Save target file
    await fileSystemManager.writeCommentFile(targetUri, targetComments);

    logger.info(`[CrossFile] Import complete: ${results.imported} imported, ${results.errors.length} failed`);

    return results;

  } catch (error) {
    logger.error('[CrossFile] Error importing comments:', error);
    throw error;
  }
}

/**
 * Create an empty .comments file
 */
async function createEmptyCommentFile(
  sourceUri: vscode.Uri,
  fileSystemManager: FileSystemManager
): Promise<CommentFile> {
  const emptyFile: CommentFile = {
    version: '2.1.0',
    file: path.relative(
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
      sourceUri.fsPath
    ),
    comments: [],
    ghostMarkers: []
  };

  await fileSystemManager.writeCommentFile(sourceUri, emptyFile);
  return emptyFile;
}
