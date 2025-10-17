/**
 * Core type definitions for the Paired Comments extension
 */

import * as vscode from 'vscode';

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

  /** Current line number (1-indexed) - source of truth for comment positions */
  line: number;

  /** Array of comment IDs anchored to this line */
  commentIds: string[];

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
  /** Line number (1-indexed) */
  line: number;

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
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  INVALID_JSON = 'INVALID_JSON',
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  COMMENT_NOT_FOUND = 'COMMENT_NOT_FOUND',
  INVALID_LINE_NUMBER = 'INVALID_LINE_NUMBER',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for extension errors
 */
export class PairedCommentsError extends Error {
  public readonly type: ErrorType;
  public override readonly cause?: Error;

  constructor(type: ErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.cause = cause;
    this.name = 'PairedCommentsError';
  }
}

/**
 * Schema version constant
 */
export const COMMENT_FILE_VERSION = '1.0';

/**
 * File extension for comment files
 */
export const COMMENT_FILE_EXTENSION = '.comments';

/**
 * Context keys for VS Code when clauses
 */
export enum ContextKeys {
  VIEW_OPEN = 'pairedComments.viewOpen',
  SYNC_ENABLED = 'pairedComments.syncEnabled',
  LINE_HAS_COMMENT = 'pairedComments.lineHasComment',
}

/**
 * Tag colors for decoration
 */
export const TAG_COLORS: Record<NonNullable<CommentTag>, string> = {
  TODO: '#FFA500',      // Orange
  FIXME: '#FF4444',     // Red
  NOTE: '#4A90E2',      // Blue
  QUESTION: '#9B59B6',  // Purple
  HACK: '#E67E22',      // Dark orange
  WARNING: '#F39C12',   // Yellow-orange
  STAR: '#FFD700',      // Gold (for bookmarked/significant comments)
};

/**
 * Detect tag from comment text
 */
export function detectTag(text: string): CommentTag {
  const upperText = text.trim().toUpperCase();

  if (upperText.startsWith('TODO:') || upperText.startsWith('TODO ')) return 'TODO';
  if (upperText.startsWith('FIXME:') || upperText.startsWith('FIXME ')) return 'FIXME';
  if (upperText.startsWith('NOTE:') || upperText.startsWith('NOTE ')) return 'NOTE';
  if (upperText.startsWith('QUESTION:') || upperText.startsWith('QUESTION ') || upperText.startsWith('?')) return 'QUESTION';
  if (upperText.startsWith('HACK:') || upperText.startsWith('HACK ')) return 'HACK';
  if (upperText.startsWith('WARNING:') || upperText.startsWith('WARNING ') || upperText.startsWith('WARN:')) return 'WARNING';
  if (upperText.startsWith('STAR:') || upperText.startsWith('STAR ') || upperText.startsWith('⭐')) return 'STAR';

  return null;
}

/**
 * Language-specific comment syntax map
 */
export const COMMENT_SYNTAX_MAP: Record<string, CommentSyntax> = {
  // C-style languages
  javascript: { singleLine: ['//'], block: ['/*', '*/'] },
  typescript: { singleLine: ['//'], block: ['/*', '*/'] },
  java: { singleLine: ['//'], block: ['/*', '*/'] },
  c: { singleLine: ['//'], block: ['/*', '*/'] },
  cpp: { singleLine: ['//'], block: ['/*', '*/'] },
  csharp: { singleLine: ['//'], block: ['/*', '*/'] },
  go: { singleLine: ['//'], block: ['/*', '*/'] },
  rust: { singleLine: ['//'], block: ['/*', '*/'] },
  swift: { singleLine: ['//'], block: ['/*', '*/'] },
  kotlin: { singleLine: ['//'], block: ['/*', '*/'] },

  // Python-style
  python: { singleLine: ['#'], block: ['"""', '"""'] },
  ruby: { singleLine: ['#'], block: ['=begin', '=end'] },
  perl: { singleLine: ['#'], block: ['=pod', '=cut'] },
  r: { singleLine: ['#'] },
  shell: { singleLine: ['#'] },
  bash: { singleLine: ['#'] },
  powershell: { singleLine: ['#'], block: ['<#', '#>'] },
  yaml: { singleLine: ['#'] },

  // SQL-style
  sql: { singleLine: ['--'], block: ['/*', '*/'] },
  plsql: { singleLine: ['--'], block: ['/*', '*/'] },

  // Lisp-style
  lisp: { singleLine: [';'] },
  clojure: { singleLine: [';'] },
  scheme: { singleLine: [';'] },

  // Markup languages
  html: { block: ['<!--', '-->'] },
  xml: { block: ['<!--', '-->'] },

  // Lua
  lua: { singleLine: ['--'], block: ['--[[', ']]'] },

  // Haskell
  haskell: { singleLine: ['--'], block: ['{-', '-}'] },

  // MATLAB
  matlab: { singleLine: ['%'], block: ['%{', '%}'] },

  // LaTeX
  latex: { singleLine: ['%'] },

  // VB
  vb: { singleLine: ["'"] },

  // Fortran
  fortran: { singleLine: ['!'] },

  // Assembly
  asm: { singleLine: [';'] },
};
