/**
 * FileSystemManager - Handles file I/O for .comments files
 * MVP: Supports v2.1.0 format only (no legacy migration support)
 *
 * Features:
 * - Custom error classes with user-friendly messages
 * - Retry logic with exponential backoff
 * - Ghost marker persistence validation
 * - Backup/restore functionality
 */

import * as vscode from 'vscode';
import { CommentFile, COMMENT_FILE_EXTENSION, COMMENT_FILE_VERSION } from '../types';
import { logger } from '../utils/Logger';
import { retryFileOperation } from '../utils/RetryLogic';
import {
  FileIOError,
  ValidationError,
  GhostMarkerError
} from '../errors/PairedCommentsError';

export class FileSystemManager {
  // No longer need ASTAnchorManager - migration code removed
  constructor() {
    // Constructor now empty - kept for potential future use
  }

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
   * Uses retry logic with exponential backoff for transient failures
   */
  async readCommentFile(sourceUri: vscode.Uri): Promise<CommentFile | null> {
    const commentUri = this.getCommentFileUri(sourceUri);

    logger.debug('Reading .comments file', {
      sourceUri: sourceUri.fsPath,
      commentUri: commentUri.fsPath
    });

    try {
      // Use retry logic for file read operation
      const result = await retryFileOperation(async () => {
        const fileData = await vscode.workspace.fs.readFile(commentUri);
        const text = Buffer.from(fileData).toString('utf8');

        // Parse JSON with error handling
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          throw new ValidationError(
            `JSON parsing failed: ${parseError}`,
            'json',
            'The .comments file contains invalid JSON',
            [
              'Open the .comments file and check for syntax errors',
              'Restore from backup if available',
              'Delete the .comments file to start fresh (you will lose existing comments)'
            ],
            text.substring(0, 200),
            { parseError, filePath: commentUri.fsPath }
          );
        }

        // Validate schema
        if (!this.validateCommentFile(data)) {
          throw new ValidationError(
            'Comment file failed schema validation',
            'schema',
            'The .comments file has an invalid structure',
            [
              'Check if the file has all required fields (file, version, comments)',
              'Restore from backup if available',
              'Report this as a bug if the file was created by this extension'
            ],
            data,
            { filePath: commentUri.fsPath }
          );
        }

        return data as CommentFile;
      }, `read ${commentUri.fsPath}`);

      logger.info('Successfully loaded .comments file', {
        version: result.version,
        commentCount: result.comments.length,
        ghostMarkerCount: result.ghostMarkers?.length || 0,
        filePath: commentUri.fsPath
      });

      // No migration support - MVP uses v2.1.0 only
      return result;
    } catch (error) {
      // File not found is expected - return null
      if ((error as { code?: string }).code === 'FileNotFound') {
        logger.debug('.comments file not found, will create empty', {
          filePath: commentUri.fsPath
        });
        return null;
      }

      // For other errors, wrap and rethrow
      if (error instanceof ValidationError) {
        logger.error('Validation error reading .comments file', error);
        throw error;
      }

      // Wrap unknown errors
      const fileError = new FileIOError(
        `Failed to read .comments file: ${error}`,
        commentUri.fsPath,
        'read',
        'Could not read the .comments file',
        [
          'Check if the file is locked by another process',
          'Verify you have read permissions for the file',
          'Try reloading the VS Code window'
        ],
        { originalError: error }
      );

      logger.error('Error reading .comments file', fileError);
      throw fileError;
    }
  }

  /**
   * Write a comment file to disk
   * Creates parent directories if needed
   * Includes backup creation and validation
   */
  async writeCommentFile(sourceUri: vscode.Uri, data: CommentFile): Promise<void> {
    const commentUri = this.getCommentFileUri(sourceUri);

    logger.debug('Writing .comments file', {
      sourceUri: sourceUri.fsPath,
      commentUri: commentUri.fsPath,
      commentCount: data.comments.length,
      ghostMarkerCount: data.ghostMarkers?.length || 0
    });

    // Validate data before writing
    if (!this.validateCommentFile(data)) {
      const error = new ValidationError(
        'Attempted to write invalid comment file data',
        'schema',
        'Cannot save .comments file - data validation failed',
        ['Report this as a bug - the extension tried to save invalid data'],
        data,
        { filePath: commentUri.fsPath }
      );
      logger.error('Validation failed before write', error);
      throw error;
    }

    // Create backup if file already exists
    try {
      await this.createBackup(commentUri);
    } catch (backupError) {
      // Log backup failure but continue with write
      logger.warn('Failed to create backup before write', {
        error: backupError,
        filePath: commentUri.fsPath
      });
    }

    // Write with retry logic
    try {
      await retryFileOperation(async () => {
        const text = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(text, 'utf8');
        await vscode.workspace.fs.writeFile(commentUri, buffer);
      }, `write ${commentUri.fsPath}`);

      logger.info('Successfully wrote .comments file', {
        filePath: commentUri.fsPath,
        commentCount: data.comments.length,
        ghostMarkerCount: data.ghostMarkers?.length || 0
      });

      // Validate persistence (read back and verify ghost markers)
      // TEMPORARY: Disabled to prevent infinite recursion during migration (v2.1.1)
      // TODO: Re-enable with proper skip flag once migration is fixed
      // await this.validatePersistence(sourceUri, data);

    } catch (error) {
      const fileError = new FileIOError(
        `Failed to write .comments file: ${error}`,
        commentUri.fsPath,
        'write',
        'Could not save the .comments file',
        [
          'Check if you have write permissions for the directory',
          'Verify the disk is not full',
          'Try reloading the VS Code window',
          'Restore from backup if needed'
        ],
        { originalError: error }
      );

      logger.error('Error writing .comments file', fileError);
      throw fileError;
    }
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

  // REMOVED: Legacy migration code (migrateToLatestVersion, migrateV10ToV20, migrateV20ToV205, hashString)
  // MVP uses v2.1.0 format only - no backward compatibility needed
  // Migration support can be added post-MVP if real users need it

  /**
   * Validate comment file schema
   * MVP: Validates v2.1.0 format only - no legacy support
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

        // Validate astAnchor (optional in v2.1.0)
        if (m['astAnchor'] !== undefined && m['astAnchor'] !== null) {
          const anchor = m['astAnchor'] as Record<string, unknown>;
          if (!Array.isArray(anchor['symbolPath'])) return false;
          if (typeof anchor['symbolKind'] !== 'string') return false;
          if (anchor['containerName'] !== null && typeof anchor['containerName'] !== 'string') return false;
          if (typeof anchor['offset'] !== 'number') return false;
        }
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

      // Require created and updated fields (v2.1.0 format - no legacy support)
      if (typeof c['created'] !== 'string') return false;
      if (typeof c['updated'] !== 'string') return false;

      // ghostMarkerId should exist for all comments (v2.1.0 format)
    }

    return true;
  }

  /**
   * Create a backup of the .comments file
   * Backups are stored as .comments.backup with timestamp
   */
  private async createBackup(commentUri: vscode.Uri): Promise<void> {
    try {
      // Check if file exists
      await vscode.workspace.fs.stat(commentUri);

      // Read current file
      const fileData = await vscode.workspace.fs.readFile(commentUri);

      // Create backup with timestamp (insert before .comments extension)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const basePath = commentUri.fsPath.replace(/\.comments$/, '');
      const backupUri = vscode.Uri.file(`${basePath}.backup-${timestamp}.comments`);

      // Write backup
      await vscode.workspace.fs.writeFile(backupUri, fileData);

      logger.debug('Created backup', {
        originalFile: commentUri.fsPath,
        backupFile: backupUri.fsPath
      });

      // Clean up old backups (keep only last 5)
      await this.cleanupOldBackups(commentUri);

    } catch (error) {
      if ((error as { code?: string }).code === 'FileNotFound') {
        // No file to backup - this is fine
        return;
      }
      throw error;
    }
  }

  /**
   * Clean up old backup files, keeping only the most recent 5
   */
  private async cleanupOldBackups(commentUri: vscode.Uri): Promise<void> {
    try {
      const dirUri = vscode.Uri.file(commentUri.fsPath.substring(0, commentUri.fsPath.lastIndexOf('\\')));
      const fileName = commentUri.fsPath.substring(commentUri.fsPath.lastIndexOf('\\') + 1);
      // Get base name without .comments extension for matching backups
      const baseName = fileName.replace(/\.comments$/, '');

      // Get all backup files (format: basename.backup-timestamp.comments)
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      const backupFiles = entries
        .filter(([name]) => name.startsWith(`${baseName}.backup-`) && name.endsWith('.comments'))
        .map(([name]) => ({
          name,
          uri: vscode.Uri.file(`${dirUri.fsPath}\\${name}`)
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort descending by timestamp

      // Delete old backups (keep only 5 most recent)
      if (backupFiles.length > 5) {
        for (const backup of backupFiles.slice(5)) {
          await vscode.workspace.fs.delete(backup.uri);
          logger.debug('Deleted old backup', { backupFile: backup.uri.fsPath });
        }
      }
    } catch (error) {
      logger.warn('Failed to clean up old backups', { error });
    }
  }

  /**
   * Restore from the most recent backup
   */
  async restoreFromBackup(sourceUri: vscode.Uri): Promise<boolean> {
    const commentUri = this.getCommentFileUri(sourceUri);

    try {
      const dirUri = vscode.Uri.file(commentUri.fsPath.substring(0, commentUri.fsPath.lastIndexOf('\\')));
      const fileName = commentUri.fsPath.substring(commentUri.fsPath.lastIndexOf('\\') + 1);
      // Get base name without .comments extension for matching backups
      const baseName = fileName.replace(/\.comments$/, '');

      // Get all backup files (format: basename.backup-timestamp.comments)
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      const backupFiles = entries
        .filter(([name]) => name.startsWith(`${baseName}.backup-`) && name.endsWith('.comments'))
        .map(([name]) => ({
          name,
          uri: vscode.Uri.file(`${dirUri.fsPath}\\${name}`)
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort descending by timestamp

      if (backupFiles.length === 0) {
        logger.warn('No backup files found', { commentUri: commentUri.fsPath });
        return false;
      }

      // Restore from most recent backup
      const mostRecent = backupFiles[0];
      if (!mostRecent) {
        logger.warn('No backup files found after filtering', { commentUri: commentUri.fsPath });
        return false;
      }

      const backupData = await vscode.workspace.fs.readFile(mostRecent.uri);
      await vscode.workspace.fs.writeFile(commentUri, backupData);

      logger.info('Restored from backup', {
        backupFile: mostRecent.uri.fsPath,
        restoredTo: commentUri.fsPath
      });

      vscode.window.showInformationMessage(
        `Successfully restored .comments file from backup: ${mostRecent.name}`
      );

      return true;
    } catch (error) {
      const fileError = new FileIOError(
        `Failed to restore from backup: ${error}`,
        commentUri.fsPath,
        'backup',
        'Could not restore .comments file from backup',
        [
          'Check if backup files exist in the directory',
          'Verify file permissions',
          'Try manually copying a backup file'
        ],
        { originalError: error }
      );

      logger.error('Failed to restore from backup', fileError);
      throw fileError;
    }
  }

  /**
   * Validate that ghost markers were persisted correctly
   * This addresses the bug where markers exist in memory but not in file
   * TEMPORARY: Disabled - see writeCommentFile()
   */
  // @ts-ignore - Temporarily unused until migration fix
  private async validatePersistence(sourceUri: vscode.Uri, expectedData: CommentFile): Promise<void> {
    try {
      // Wait a brief moment for file system to flush
      await new Promise(resolve => setTimeout(resolve, 50));

      // Read back the file
      const verifyData = await this.readCommentFile(sourceUri);

      if (!verifyData) {
        throw new GhostMarkerError(
          'File was written but could not be read back',
          'persistence',
          'Ghost markers may not have been saved correctly',
          [
            'Try saving the file again',
            'Check the .comments file manually',
            'Restore from backup if needed'
          ]
        );
      }

      // Verify ghost marker count matches
      const expectedMarkerCount = expectedData.ghostMarkers?.length || 0;
      const actualMarkerCount = verifyData.ghostMarkers?.length || 0;

      if (expectedMarkerCount !== actualMarkerCount) {
        const error = new GhostMarkerError(
          `Ghost marker count mismatch: expected ${expectedMarkerCount}, got ${actualMarkerCount}`,
          'persistence',
          'Some ghost markers were not saved to the .comments file',
          [
            'This is the bug we are trying to prevent!',
            'The file will be restored from backup',
            'Please report this with the file contents'
          ],
          undefined,
          undefined,
          {
            expected: expectedMarkerCount,
            actual: actualMarkerCount,
            filePath: this.getCommentFileUri(sourceUri).fsPath
          }
        );

        logger.error('Ghost marker persistence validation FAILED', error);

        // Auto-repair: Try writing again
        logger.warn('Attempting auto-repair: re-writing file');
        await retryFileOperation(async () => {
          const text = JSON.stringify(expectedData, null, 2);
          const buffer = Buffer.from(text, 'utf8');
          await vscode.workspace.fs.writeFile(this.getCommentFileUri(sourceUri), buffer);
        }, 'persistence validation repair');

        // Show warning to user
        vscode.window.showWarningMessage(
          'Ghost marker persistence issue detected and auto-repaired. If this happens again, please report it as a bug.',
          'View Output'
        ).then(selection => {
          if (selection === 'View Output') {
            logger.show();
          }
        });

        return;
      }

      // Verify each ghost marker exists
      const expectedMarkerIds = new Set(expectedData.ghostMarkers?.map(m => m.id) || []);
      const actualMarkerIds = new Set(verifyData.ghostMarkers?.map(m => m.id) || []);

      const missingMarkers = [...expectedMarkerIds].filter(id => !actualMarkerIds.has(id));

      if (missingMarkers.length > 0) {
        const error = new GhostMarkerError(
          `Missing ghost markers after write: ${missingMarkers.join(', ')}`,
          'persistence',
          'Some ghost markers were not saved correctly',
          [
            'The extension will attempt to repair the file',
            'If this happens repeatedly, please report it as a bug'
          ],
          missingMarkers[0],
          undefined,
          { missingMarkers, filePath: this.getCommentFileUri(sourceUri).fsPath }
        );

        logger.error('Ghost marker persistence validation FAILED - missing markers', error);

        // Auto-repair: Try writing again
        logger.warn('Attempting auto-repair: re-writing file with missing markers');
        await retryFileOperation(async () => {
          const text = JSON.stringify(expectedData, null, 2);
          const buffer = Buffer.from(text, 'utf8');
          await vscode.workspace.fs.writeFile(this.getCommentFileUri(sourceUri), buffer);
        }, 'persistence validation repair');

        vscode.window.showWarningMessage(
          `Ghost marker persistence issue detected (${missingMarkers.length} markers) and auto-repaired.`,
          'View Output'
        ).then(selection => {
          if (selection === 'View Output') {
            logger.show();
          }
        });

        return;
      }

      logger.debug('Ghost marker persistence validation PASSED', {
        markerCount: actualMarkerCount,
        filePath: this.getCommentFileUri(sourceUri).fsPath
      });

    } catch (error) {
      // Log but don't throw - persistence validation is a safety check
      logger.warn('Ghost marker persistence validation encountered error (non-fatal)', {
        error,
        filePath: this.getCommentFileUri(sourceUri).fsPath
      });
    }
  }
}
