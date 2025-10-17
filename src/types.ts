/**
 * Core type definitions for the Paired Comments extension
 */

import * as vscode from 'vscode';

/**
 * Represents a single comment in a comment file
 */
export interface Comment {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Line number in the source file (1-indexed) */
  line: number;

  /** The comment text content */
  text: string;

  /** Author of the comment */
  author: string;

  /** ISO 8601 timestamp of when the comment was created */
  created: string;

  /** ISO 8601 timestamp of when the comment was last updated */
  updated: string;
}

/**
 * Represents the structure of a .comments file
 */
export interface CommentFile {
  /** Relative path to the source file */
  file: string;

  /** Schema version for future compatibility */
  version: string;

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
