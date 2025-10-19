/**
 * Orphan Detector
 *
 * Detects "orphaned" comments - comments whose code has been deleted, moved, or significantly
 * changed, making the AST anchor invalid.
 *
 * NOT YET INTEGRATED - Implementation ready for testing and integration
 */

import * as vscode from 'vscode';
import { Comment, GhostMarker } from '../types';
import { ASTAnchorManager } from './ASTAnchorManager';
import { GhostMarkerManager } from './GhostMarkerManager';
import { logger } from '../utils/Logger';

export enum OrphanReason {
  AST_ANCHOR_FAILED = 'AST anchor could not resolve symbol',
  LINE_HASH_MISMATCH = 'Code at line changed significantly',
  SYMBOL_MOVED = 'Symbol found at different location',
  SYMBOL_DELETED = 'Symbol not found in file',
  FILE_DELETED = 'Source file no longer exists',
  NOT_ORPHANED = 'Comment is correctly anchored'
}

export interface OrphanStatus {
  isOrphaned: boolean;
  reason: OrphanReason;
  confidence: number;          // 0-100, how sure we are
  suggestedLocation?: {        // Where we think it should be
    file: string;
    line: number;
    symbol: string;
  };
}

export interface OrphanedComment {
  comment: Comment;
  marker: GhostMarker;
  sourceFile: string;
  status: OrphanStatus;
}

export class OrphanDetector {
  private astAnchorManager: ASTAnchorManager;
  private ghostMarkerManager: GhostMarkerManager;

  constructor(
    astAnchorManager: ASTAnchorManager,
    ghostMarkerManager: GhostMarkerManager
  ) {
    this.astAnchorManager = astAnchorManager;
    this.ghostMarkerManager = ghostMarkerManager;
  }

  /**
   * Check if a comment is orphaned
   *
   * Detection strategy:
   * 1. Check if file exists
   * 2. Try to resolve AST anchor (if present)
   * 3. Verify line hash matches
   * 4. Check 3-line fingerprint (prev/current/next)
   * 5. Search for symbol elsewhere in file
   */
  async detectOrphan(
    comment: Comment,
    marker: GhostMarker,
    document: vscode.TextDocument
  ): Promise<OrphanStatus> {
    try {
      // Step 1: Check if AST anchor exists and try to resolve it
      if (marker.astAnchor) {
        const resolved = await this.astAnchorManager.resolveAnchor(document, marker.astAnchor);

        if (!resolved) {
          // AST anchor failed - search for symbol elsewhere in file
          logger.debug(`[OrphanDetector] AST anchor failed for comment ${comment.id}, searching for symbol...`);

          const symbolLocation = await this.findSymbolInFile(document, marker.astAnchor.symbolPath);

          if (symbolLocation) {
            // Symbol found at different location
            return {
              isOrphaned: true,
              reason: OrphanReason.SYMBOL_MOVED,
              confidence: 90,
              suggestedLocation: {
                file: document.fileName,
                line: symbolLocation.line,
                symbol: marker.astAnchor.symbolPath.join('.')
              }
            };
          } else {
            // Symbol not found anywhere in file
            return {
              isOrphaned: true,
              reason: OrphanReason.SYMBOL_DELETED,
              confidence: 95
            };
          }
        }
      }

      // Step 2: Verify line hash (if marker has one)
      if (marker.lineHash) {
        const currentLine = document.lineAt(marker.line - 1);
        const currentLineHash = this.hashLine(currentLine.text);

        if (currentLineHash !== marker.lineHash) {
          logger.debug(`[OrphanDetector] Line hash mismatch for comment ${comment.id}`);

          // Check 3-line fingerprint for more confidence
          const fingerprintMatches = this.verify3LineFingerprint(document, marker);

          if (!fingerprintMatches) {
            return {
              isOrphaned: true,
              reason: OrphanReason.LINE_HASH_MISMATCH,
              confidence: 80
            };
          } else {
            // 3-line fingerprint matches, so code around it is similar
            // Likely just whitespace or minor formatting change
            logger.debug(`[OrphanDetector] 3-line fingerprint matches, not orphaned`);
          }
        }
      }

      // All checks passed - not orphaned
      return {
        isOrphaned: false,
        reason: OrphanReason.NOT_ORPHANED,
        confidence: 100
      };

    } catch (error) {
      logger.error('[OrphanDetector] Error detecting orphan:', error);
      // If we can't determine, assume not orphaned to avoid false positives
      return {
        isOrphaned: false,
        reason: OrphanReason.NOT_ORPHANED,
        confidence: 0
      };
    }
  }

  /**
   * Find all orphaned comments in a document
   */
  async findOrphans(
    document: vscode.TextDocument,
    comments: Comment[],
    markers: GhostMarker[]
  ): Promise<OrphanedComment[]> {
    const orphans: OrphanedComment[] = [];

    logger.info(`[OrphanDetector] Checking ${comments.length} comments for orphans in ${document.fileName}`);

    for (const comment of comments) {
      // Find the marker for this comment
      const marker = markers.find(m => m.commentIds.includes(comment.id));
      if (!marker) {
        logger.warn(`[OrphanDetector] No marker found for comment ${comment.id}`);
        continue;
      }

      const status = await this.detectOrphan(comment, marker, document);

      if (status.isOrphaned) {
        orphans.push({
          comment,
          marker,
          sourceFile: document.fileName,
          status
        });
      }
    }

    logger.info(`[OrphanDetector] Found ${orphans.length} orphaned comments`);
    return orphans;
  }

  /**
   * Find all orphaned comments in the workspace
   */
  async findAllOrphans(): Promise<OrphanedComment[]> {
    const allOrphans: OrphanedComment[] = [];

    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        logger.warn('[OrphanDetector] No workspace folder found');
        return [];
      }

      // Find all .comments files
      const commentFiles = await vscode.workspace.findFiles('**/*.comments');
      logger.info(`[OrphanDetector] Scanning ${commentFiles.length} comment files for orphans`);

      for (const commentFileUri of commentFiles) {
        try {
          // Get the source file URI (remove .comments extension)
          const sourceFileUri = vscode.Uri.file(commentFileUri.fsPath.replace(/\.comments$/, ''));

          // Check if source file exists
          try {
            await vscode.workspace.fs.stat(sourceFileUri);
          } catch {
            // Source file doesn't exist - all comments are orphaned
            logger.debug(`[OrphanDetector] Source file not found: ${sourceFileUri.fsPath}`);
            // TODO: Load comments and mark all as orphaned with FILE_DELETED reason
            continue;
          }

          // Open the source document (unused but kept for future integration)
          await vscode.workspace.openTextDocument(sourceFileUri);

          // Get markers for this file
          const markers = this.ghostMarkerManager.getMarkers(sourceFileUri);
          if (!markers || markers.length === 0) {
            continue;
          }

          // For now, we need to load the comment file to get the comments
          // In a real integration, this would use CommentManager
          // Skipping for now as this is just the core implementation
          logger.debug(`[OrphanDetector] Would check ${markers.length} markers in ${sourceFileUri.fsPath}`);

        } catch (error) {
          logger.warn(`[OrphanDetector] Error checking file ${commentFileUri.fsPath}:`, error);
        }
      }

      return allOrphans;

    } catch (error) {
      logger.error('[OrphanDetector] Error finding all orphans:', error);
      return [];
    }
  }

  /**
   * Find a symbol in a file by its symbol path
   *
   * Returns the line number where the symbol was found, or null if not found
   */
  private async findSymbolInFile(
    document: vscode.TextDocument,
    symbolPath: string[]
  ): Promise<{ line: number } | null> {
    try {
      // Get all symbols in the document
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      );

      if (!symbols || symbols.length === 0) {
        return null;
      }

      // Search for the symbol path
      const targetSymbol = this.findSymbolByPath(symbols, symbolPath);

      if (targetSymbol) {
        // Convert to 1-indexed line number
        return { line: targetSymbol.range.start.line + 1 };
      }

      return null;

    } catch (error) {
      logger.error('[OrphanDetector] Error finding symbol in file:', error);
      return null;
    }
  }

  /**
   * Recursively search for a symbol by its path
   */
  private findSymbolByPath(
    symbols: vscode.DocumentSymbol[],
    symbolPath: string[]
  ): vscode.DocumentSymbol | null {
    if (symbolPath.length === 0) return null;

    // Look for the first symbol in the path
    const targetName = symbolPath[0];
    const symbol = symbols.find(s => s.name === targetName);

    if (!symbol) return null;

    // If this is the last part of the path, we found it
    if (symbolPath.length === 1) {
      return symbol;
    }

    // Otherwise, search in children
    if (symbol.children && symbol.children.length > 0) {
      return this.findSymbolByPath(symbol.children, symbolPath.slice(1));
    }

    return null;
  }

  /**
   * Verify 3-line fingerprint (previous, current, next lines)
   *
   * Returns true if at least 2 of the 3 lines match their hashes
   * NOTE: prevLineHash and nextLineHash are future features, not yet implemented in GhostMarker
   */
  private verify3LineFingerprint(
    document: vscode.TextDocument,
    marker: GhostMarker
  ): boolean {
    try {
      const lineIndex = marker.line - 1;
      let matches = 0;

      // TODO: These properties don't exist yet on GhostMarker, will be added in future version
      const prevLineHash = (marker as any).prevLineHash;
      const nextLineHash = (marker as any).nextLineHash;

      // Check previous line
      if (lineIndex > 0 && prevLineHash) {
        const prevLine = document.lineAt(lineIndex - 1);
        const prevHash = this.hashLine(prevLine.text);
        if (prevHash === prevLineHash) {
          matches++;
        }
      }

      // Check current line
      if (marker.lineHash) {
        const currentLine = document.lineAt(lineIndex);
        const currentHash = this.hashLine(currentLine.text);
        if (currentHash === marker.lineHash) {
          matches++;
        }
      }

      // Check next line
      if (lineIndex < document.lineCount - 1 && nextLineHash) {
        const nextLine = document.lineAt(lineIndex + 1);
        const nextHash = this.hashLine(nextLine.text);
        if (nextHash === nextLineHash) {
          matches++;
        }
      }

      // Consider it a match if at least 2 out of 3 lines match
      return matches >= 2;

    } catch (error) {
      logger.error('[OrphanDetector] Error verifying 3-line fingerprint:', error);
      return false;
    }
  }

  /**
   * Hash a line of code (simple implementation)
   *
   * This should match the hashing function used in GhostMarkerManager
   */
  private hashLine(line: string): string {
    // Simple hash: remove whitespace and hash the remaining characters
    const normalized = line.trim().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get a user-friendly description of the orphan status
   */
  getOrphanDescription(status: OrphanStatus): string {
    switch (status.reason) {
      case OrphanReason.AST_ANCHOR_FAILED:
        return 'AST anchor could not resolve the symbol';
      case OrphanReason.LINE_HASH_MISMATCH:
        return 'Code at this line has changed significantly';
      case OrphanReason.SYMBOL_MOVED:
        return status.suggestedLocation
          ? `Symbol moved to line ${status.suggestedLocation.line}`
          : 'Symbol moved to a different location';
      case OrphanReason.SYMBOL_DELETED:
        return 'Symbol not found in file (likely deleted)';
      case OrphanReason.FILE_DELETED:
        return 'Source file no longer exists';
      case OrphanReason.NOT_ORPHANED:
        return 'Comment is correctly anchored';
      default:
        return 'Unknown orphan status';
    }
  }

  /**
   * Get recovery suggestions for an orphaned comment
   */
  getRecoverySuggestions(status: OrphanStatus): string[] {
    const suggestions: string[] = [];

    switch (status.reason) {
      case OrphanReason.SYMBOL_MOVED:
        if (status.suggestedLocation) {
          suggestions.push(`Re-anchor to line ${status.suggestedLocation.line} (symbol found there)`);
        }
        suggestions.push('Search for the symbol manually and re-anchor');
        suggestions.push('Delete this comment if the code is gone');
        break;

      case OrphanReason.SYMBOL_DELETED:
        suggestions.push('Search the file for similar code');
        suggestions.push('Delete this comment (code appears to be gone)');
        suggestions.push('Move to a different file if code was refactored');
        break;

      case OrphanReason.LINE_HASH_MISMATCH:
        suggestions.push('Re-anchor to the current line if the comment still applies');
        suggestions.push('Update the comment text to match the new code');
        suggestions.push('Delete if the comment is no longer relevant');
        break;

      case OrphanReason.FILE_DELETED:
        suggestions.push('Delete this comment (source file is gone)');
        suggestions.push('Move to a different file if code was relocated');
        break;

      default:
        suggestions.push('Review the comment and decide whether to keep, move, or delete it');
    }

    return suggestions;
  }

  /**
   * Detect all orphaned comments in a file
   * @param sourceFile - Source file path
   * @param document - VS Code document
   * @returns Array of orphaned comments with their status
   */
  async detectOrphansInFile(
    sourceFile: string,
    document: vscode.TextDocument
  ): Promise<OrphanedComment[]> {
    const orphanedComments: OrphanedComment[] = [];

    try {
      // Get all ghost markers for this file
      const markers = this.ghostMarkerManager.getMarkers(document.uri);

      // Get comment file to access comments
      const commentFileUri = vscode.Uri.file(sourceFile + '.comments');
      const commentFileData = await vscode.workspace.fs.readFile(commentFileUri);
      const commentFile = JSON.parse(Buffer.from(commentFileData).toString('utf8'));

      // Create comment map
      const commentMap = new Map<string, any>();
      for (const comment of commentFile.comments) {
        commentMap.set(comment.id, comment);
      }

      // Check each marker
      for (const marker of markers) {
        for (const commentId of marker.commentIds) {
          const comment = commentMap.get(commentId);
          if (!comment) {
            continue;
          }

          const orphanStatus = await this.detectOrphan(comment, marker, document);

          if (orphanStatus.isOrphaned && orphanStatus.confidence >= 70) {
            orphanedComments.push({
              comment,
              marker,
              sourceFile,
              status: orphanStatus
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to detect orphans in file', { sourceFile, error });
    }

    return orphanedComments;
  }
}
