/**
 * Core type definitions for the Paired Comments extension
 */
import * as vscode from 'vscode';
import { ASTAnchor } from './types/ast';
/**
 * Comment tags for categorization
 */
export type CommentTag = 'TODO' | 'FIXME' | 'NOTE' | 'QUESTION' | 'HACK' | 'WARNING' | 'STAR' | null;
/**
 * Comment status for lifecycle tracking
 */
export type CommentStatus = 'open' | 'resolved' | 'wontfix';
/**
 * Supported comment syntaxes by language
 */
export interface CommentSyntax {
    /** Single-line comment syntax (e.g., '//', '#', '--') */
    singleLine?: string[];
    /** Block comment syntax tuple: [start, end] (e.g., C-style or HTML-style) */
    block?: [string, string];
}
/**
 * Rich content types for comments
 */
export type CommentContentType = 'text' | 'markdown' | 'code' | 'link' | 'image';
/**
 * Reply to a comment (for threaded conversations)
 */
export interface CommentReply {
    /** Unique identifier */
    id: string;
    /** Reply text */
    text: string;
    /** Author of the reply */
    author: string;
    /** ISO 8601 timestamp */
    created: string;
    /** Content type */
    contentType?: CommentContentType;
}
/**
 * Represents a single comment in a comment file
 */
export interface Comment {
    /** Unique identifier (UUID v4) */
    id: string;
    /** Line number in the source file (1-indexed) - DEPRECATED: use ghostMarker.line as source of truth */
    line: number;
    /** Reference to the ghost marker that tracks this comment's position (v2.0+) */
    ghostMarkerId?: string;
    /** Start line for range comments (1-indexed) */
    startLine?: number;
    /** End line for range comments (1-indexed) */
    endLine?: number;
    /** Content anchor: hash of the line(s) for drift detection */
    lineHash?: string;
    /** Content anchor: actual text of the line for verification */
    lineText?: string;
    /** The comment text content */
    text: string;
    /** Content type (text, markdown, code, link, image) */
    contentType?: CommentContentType;
    /** Author of the comment */
    author: string;
    /** ISO 8601 timestamp of when the comment was created */
    created: string;
    /** ISO 8601 timestamp of when the comment was last updated */
    updated: string;
    /** Optional tag for categorization (TODO, FIXME, NOTE, etc.) */
    tag?: CommentTag;
    /** Status of the comment (open, resolved, wontfix) */
    status?: CommentStatus;
    /** Who resolved the comment */
    resolvedBy?: string;
    /** When the comment was resolved */
    resolvedAt?: string;
    /** Threaded replies to this comment */
    replies?: CommentReply[];
}
/**
 * Ghost Marker - Invisible decoration that tracks comment positions
 */
export interface GhostMarker {
    /** Unique identifier for this ghost marker */
    id: string;
    /** Current line number (1-indexed) - cached value, use AST anchor for resolution in v2.0.5+ */
    /** For range comments, this is the START line */
    line: number;
    /** End line for range comments (1-indexed) - v2.0.6+ */
    /** If undefined, this is a single-line marker */
    endLine?: number;
    /** Array of comment IDs anchored to this line */
    commentIds: string[];
    /** AST-based anchor for semantic tracking (v2.0.5+) - null for non-symbolic lines or unsupported languages */
    astAnchor?: ASTAnchor | null;
    /** SHA-256 hash (first 16 chars) of the current line text */
    lineHash: string;
    /** Actual text of the current line (trimmed, for verification) */
    lineText: string;
    /** Text of the line above (trimmed, for 3-line fingerprinting) */
    prevLineText: string;
    /** Text of the line below (trimmed, for 3-line fingerprinting) */
    nextLineText: string;
    /** ISO 8601 timestamp of last hash verification */
    lastVerified: string;
}
/**
 * Reconciliation result status
 */
export type ReconciliationStatus = 'valid' | 'auto-fixed' | 'needs-review' | 'needs-manual-fix';
/**
 * Result of ghost marker reconciliation
 */
export interface ReconciliationResult {
    /** Status of reconciliation */
    status: ReconciliationStatus;
    /** Reason for the status */
    reason: string;
    /** Old line number (if changed) */
    oldLine?: number;
    /** New line number (if changed) */
    newLine?: number;
    /** Suggested line number (if needs review) */
    suggestedLine?: number;
    /** The marker that needs manual fixing (if applicable) */
    marker?: GhostMarker;
}
/**
 * Represents the structure of a .comments file
 */
export interface CommentFile {
    /** Relative path to the source file */
    file: string;
    /** Schema version for future compatibility */
    version: string;
    /** Array of ghost markers (v2.0+) */
    ghostMarkers?: GhostMarker[];
    /** Array of comments */
    comments: Comment[];
}
/**
 * Internal state for a paired view session
 */
export interface PairedViewSession {
    /** URI of the source file */
    sourceUri: vscode.Uri;
    /** URI of the comments file */
    commentsUri: vscode.Uri;
    /** TextEditor for the source file */
    sourceEditor: vscode.TextEditor;
    /** TextEditor for the comments file */
    commentsEditor: vscode.TextEditor;
    /** Whether scroll sync is currently enabled */
    syncEnabled: boolean;
    /** Disposables for cleanup */
    disposables: vscode.Disposable[];
}
/**
 * Options for adding a new comment
 */
export interface AddCommentOptions {
    /** Line number (1-indexed) - for single-line comments or start of range */
    line: number;
    /** End line for range comments (1-indexed, optional) */
    endLine?: number;
    /** Comment text */
    text: string;
    /** Author (optional, will use default if not provided) */
    author?: string;
}
/**
 * Options for updating an existing comment
 */
export interface UpdateCommentOptions {
    /** Comment ID to update */
    id: string;
    /** New comment text */
    text: string;
}
/**
 * Result of a comment operation
 */
export interface CommentOperationResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Error message if operation failed */
    error?: string;
    /** The comment that was affected */
    comment?: Comment;
}
/**
 * Configuration settings for the extension
 */
export interface ExtensionConfig {
    /** Default author name for comments */
    defaultAuthor: string;
    /** Whether to enable scroll sync by default */
    syncByDefault: boolean;
    /** Debounce delay for saving comments (milliseconds) */
    saveDebounceDelay: number;
    /** Whether to show gutter icons */
    showGutterIcons: boolean;
    /** Whether to show hover previews */
    showHoverPreviews: boolean;
}
/**
 * Error types that can occur in the extension
 */
export declare enum ErrorType {
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FILE_READ_ERROR = "FILE_READ_ERROR",
    FILE_WRITE_ERROR = "FILE_WRITE_ERROR",
    INVALID_JSON = "INVALID_JSON",
    INVALID_SCHEMA = "INVALID_SCHEMA",
    COMMENT_NOT_FOUND = "COMMENT_NOT_FOUND",
    INVALID_LINE_NUMBER = "INVALID_LINE_NUMBER",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * Custom error class for extension errors
 */
export declare class PairedCommentsError extends Error {
    readonly type: ErrorType;
    readonly cause?: Error;
    constructor(type: ErrorType, message: string, cause?: Error);
}
/**
 * Schema version constant
 */
export declare const COMMENT_FILE_VERSION = "2.0.6";
/**
 * File extension for comment files
 */
export declare const COMMENT_FILE_EXTENSION = ".comments";
/**
 * Context keys for VS Code when clauses
 */
export declare enum ContextKeys {
    VIEW_OPEN = "pairedComments.viewOpen",
    SYNC_ENABLED = "pairedComments.syncEnabled",
    LINE_HAS_COMMENT = "pairedComments.lineHasComment"
}
/**
 * Tag colors for decoration
 */
export declare const TAG_COLORS: Record<NonNullable<CommentTag>, string>;
/**
 * Detect tag from comment text
 */
export declare function detectTag(text: string): CommentTag;
/**
 * Language-specific comment syntax map
 */
export declare const COMMENT_SYNTAX_MAP: Record<string, CommentSyntax>;
/**
 * Check if a comment is a range comment
 */
export declare function isRangeComment(comment: Comment): boolean;
/**
 * Check if a ghost marker is a range marker
 */
export declare function isRangeMarker(marker: GhostMarker): boolean;
/**
 * Get the effective line number for a comment (handles backwards compatibility)
 */
export declare function getCommentLine(comment: Comment): number;
/**
 * Get the effective end line for a comment (undefined = single line)
 */
export declare function getCommentEndLine(comment: Comment): number | undefined;
/**
 * Create two-letter gutter icon code for range markers
 * @param tag - Comment tag (TODO, FIXME, etc.)
 * @param isStart - True for start marker, false for end marker
 * @returns Two-letter code (e.g., "TS" for TODO START, "TE" for TODO END)
 */
export declare function getRangeGutterCode(tag: CommentTag, isStart: boolean): string;
/**
 * Get single-letter gutter icon code (for backwards compatibility with single-line comments)
 * @param tag - Comment tag
 * @returns Single-letter code (e.g., "T" for TODO, "F" for FIXME)
 */
export declare function getSingleGutterCode(tag: CommentTag): string;
//# sourceMappingURL=types.d.ts.map