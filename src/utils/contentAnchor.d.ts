/**
 * Content Anchoring - Hash-based line tracking to detect drift
 *
 * When code lines are edited, added, or deleted, comment line numbers
 * can become misaligned. This module provides hash-based anchoring to
 * detect when lines have changed and help reconcile comment positions.
 */
import * as vscode from 'vscode';
import { Comment } from '../types';
/**
 * Generate SHA-256 hash of a text line
 */
export declare function hashLine(text: string): string;
/**
 * Generate hash for a range of lines
 */
export declare function hashLineRange(lines: string[]): string;
/**
 * Extract line text from document
 */
export declare function getLineText(document: vscode.TextDocument, lineNumber: number): string | null;
/**
 * Extract range text from document
 */
export declare function getRangeText(document: vscode.TextDocument, startLine: number, endLine: number): string[] | null;
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
export declare function verifyAnchor(document: vscode.TextDocument, comment: Comment): AnchorVerificationResult;
/**
 * Search for drifted comment in nearby lines
 */
export declare function findDriftedLine(document: vscode.TextDocument, comment: Comment, searchRadius?: number): number | null;
/**
 * Update comment anchor with current document state
 */
export declare function updateAnchor(document: vscode.TextDocument, comment: Comment): Partial<Comment>;
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
export declare function batchVerifyAnchors(document: vscode.TextDocument, comments: Comment[]): BatchVerificationResult;
//# sourceMappingURL=contentAnchor.d.ts.map