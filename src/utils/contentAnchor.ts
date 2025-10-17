/**
 * Content Anchoring - Hash-based line tracking to detect drift
 *
 * When code lines are edited, added, or deleted, comment line numbers
 * can become misaligned. This module provides hash-based anchoring to
 * detect when lines have changed and help reconcile comment positions.
 */

import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { Comment } from '../types';

/**
 * Generate SHA-256 hash of a text line
 */
export function hashLine(text: string): string {
  const normalized = text.trim(); // Normalize whitespace
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

/**
 * Generate hash for a range of lines
 */
export function hashLineRange(lines: string[]): string {
  const combined = lines.map(l => l.trim()).join('\n');
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

/**
 * Extract line text from document
 */
export function getLineText(document: vscode.TextDocument, lineNumber: number): string | null {
  if (lineNumber < 1 || lineNumber > document.lineCount) {
    return null;
  }
  return document.lineAt(lineNumber - 1).text; // Convert to 0-indexed
}

/**
 * Extract range text from document
 */
export function getRangeText(document: vscode.TextDocument, startLine: number, endLine: number): string[] | null {
  if (startLine < 1 || endLine > document.lineCount || startLine > endLine) {
    return null;
  }

  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(document.lineAt(i - 1).text); // Convert to 0-indexed
  }

  return lines;
}

/**
 * Verify if comment anchor matches current document state
 */
export interface AnchorVerificationResult {
  /** Whether the anchor matches */
  matches: boolean;
  /** Current line hash */
  currentHash?: string;
  /** Current line text */
  currentText?: string;
  /** Suggested new line number (if drift detected) */
  suggestedLine?: number;
}

/**
 * Verify comment anchor against document
 */
export function verifyAnchor(
  document: vscode.TextDocument,
  comment: Comment
): AnchorVerificationResult {
  const line = comment.startLine ?? comment.line;
  const endLine = comment.endLine ?? line;

  // Get current text at the anchored line(s)
  if (endLine === line) {
    // Single line
    const currentText = getLineText(document, line);
    if (!currentText) {
      return { matches: false };
    }

    const currentHash = hashLine(currentText);

    // Check if hash matches
    if (comment.lineHash && currentHash === comment.lineHash) {
      return { matches: true, currentHash, currentText };
    }

    // Hash mismatch - check if text still matches (whitespace changes)
    if (comment.lineText && currentText.trim() === comment.lineText.trim()) {
      return { matches: true, currentHash, currentText };
    }

    return { matches: false, currentHash, currentText };
  } else {
    // Range of lines
    const currentLines = getRangeText(document, line, endLine);
    if (!currentLines) {
      return { matches: false };
    }

    const currentHash = hashLineRange(currentLines);
    const currentText = currentLines.join('\n');

    if (comment.lineHash && currentHash === comment.lineHash) {
      return { matches: true, currentHash, currentText };
    }

    return { matches: false, currentHash, currentText };
  }
}

/**
 * Search for drifted comment in nearby lines
 */
export function findDriftedLine(
  document: vscode.TextDocument,
  comment: Comment,
  searchRadius: number = 10
): number | null {
  if (!comment.lineHash && !comment.lineText) {
    return null;
  }

  const originalLine = comment.startLine ?? comment.line;
  const startSearch = Math.max(1, originalLine - searchRadius);
  const endSearch = Math.min(document.lineCount, originalLine + searchRadius);

  // Try exact hash match first
  if (comment.lineHash) {
    for (let i = startSearch; i <= endSearch; i++) {
      const lineText = getLineText(document, i);
      if (lineText && hashLine(lineText) === comment.lineHash) {
        return i;
      }
    }
  }

  // Try text match (more lenient)
  if (comment.lineText) {
    for (let i = startSearch; i <= endSearch; i++) {
      const lineText = getLineText(document, i);
      if (lineText && lineText.trim() === comment.lineText.trim()) {
        return i;
      }
    }
  }

  return null;
}

/**
 * Update comment anchor with current document state
 */
export function updateAnchor(
  document: vscode.TextDocument,
  comment: Comment
): Partial<Comment> {
  const line = comment.startLine ?? comment.line;
  const endLine = comment.endLine ?? line;

  if (endLine === line) {
    // Single line
    const lineText = getLineText(document, line);
    if (!lineText) {
      return {};
    }

    return {
      lineHash: hashLine(lineText),
      lineText: lineText.trim(),
    };
  } else {
    // Range
    const lines = getRangeText(document, line, endLine);
    if (!lines || lines.length === 0) {
      return {};
    }

    return {
      lineHash: hashLineRange(lines),
      lineText: lines[0]?.trim() ?? '', // Store first line for quick reference
    };
  }
}

/**
 * Batch verify all comments in a document
 */
export interface BatchVerificationResult {
  /** Comments that match their anchors */
  valid: Comment[];
  /** Comments with mismatched anchors */
  drifted: Comment[];
  /** Comments with missing line numbers */
  missing: Comment[];
}

export function batchVerifyAnchors(
  document: vscode.TextDocument,
  comments: Comment[]
): BatchVerificationResult {
  const result: BatchVerificationResult = {
    valid: [],
    drifted: [],
    missing: [],
  };

  for (const comment of comments) {
    const verification = verifyAnchor(document, comment);

    if (!verification.currentText) {
      result.missing.push(comment);
    } else if (verification.matches) {
      result.valid.push(comment);
    } else {
      result.drifted.push(comment);
    }
  }

  return result;
}
