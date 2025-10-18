/**
 * PairedCommentsError - Custom error hierarchy for Paired Comments extension
 *
 * Provides structured error handling with:
 * - User-friendly messages
 * - Actionable recovery steps
 * - Error categorization
 * - Detailed context for debugging
 */

/**
 * Base error class for all Paired Comments errors
 */
export class PairedCommentsError extends Error {
  public readonly userMessage: string;
  public readonly recoverySteps: string[];
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    userMessage: string,
    recoverySteps: string[] = [],
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PairedCommentsError';
    this.userMessage = userMessage;
    this.recoverySteps = recoverySteps;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * File I/O related errors (read, write, parse)
 */
export class FileIOError extends PairedCommentsError {
  public readonly filePath: string;
  public readonly operation: 'read' | 'write' | 'parse' | 'delete' | 'backup';

  constructor(
    message: string,
    filePath: string,
    operation: 'read' | 'write' | 'parse' | 'delete' | 'backup',
    userMessage?: string,
    recoverySteps?: string[],
    context?: Record<string, unknown>
  ) {
    const defaultUserMessage = userMessage || `Failed to ${operation} file: ${filePath}`;
    const defaultRecoverySteps = recoverySteps || [
      'Check if the file exists and is accessible',
      'Verify file permissions',
      'Try reloading the VS Code window'
    ];

    super(message, defaultUserMessage, defaultRecoverySteps, {
      ...context,
      filePath,
      operation
    });
    this.name = 'FileIOError';
    this.filePath = filePath;
    this.operation = operation;
  }
}

/**
 * JSON parsing and validation errors
 */
export class ValidationError extends PairedCommentsError {
  public readonly invalidData?: unknown;
  public readonly validationType: 'json' | 'schema' | 'integrity';

  constructor(
    message: string,
    validationType: 'json' | 'schema' | 'integrity',
    userMessage?: string,
    recoverySteps?: string[],
    invalidData?: unknown,
    context?: Record<string, unknown>
  ) {
    const defaultUserMessage = userMessage || 'The .comments file contains invalid data';
    const defaultRecoverySteps = recoverySteps || [
      'Check the .comments file for syntax errors',
      'Restore from backup if available',
      'Delete the .comments file to start fresh (you will lose existing comments)'
    ];

    super(message, defaultUserMessage, defaultRecoverySteps, {
      ...context,
      validationType,
      invalidData: invalidData ? String(invalidData).substring(0, 200) : undefined
    });
    this.name = 'ValidationError';
    this.invalidData = invalidData;
    this.validationType = validationType;
  }
}

/**
 * Ghost marker tracking and persistence errors
 */
export class GhostMarkerError extends PairedCommentsError {
  public readonly markerId?: string;
  public readonly line?: number;
  public readonly errorType: 'not_found' | 'duplicate' | 'persistence' | 'tracking' | 'orphaned';

  constructor(
    message: string,
    errorType: 'not_found' | 'duplicate' | 'persistence' | 'tracking' | 'orphaned',
    userMessage?: string,
    recoverySteps?: string[],
    markerId?: string,
    line?: number,
    context?: Record<string, unknown>
  ) {
    const defaultUserMessage = userMessage || 'Ghost marker error occurred';
    const defaultRecoverySteps = recoverySteps || [
      'Try reloading the .comments file',
      'Save the document to trigger marker reconciliation',
      'If issue persists, report it with the error details'
    ];

    super(message, defaultUserMessage, defaultRecoverySteps, {
      ...context,
      markerId,
      line,
      errorType
    });
    this.name = 'GhostMarkerError';
    this.markerId = markerId;
    this.line = line;
    this.errorType = errorType;
  }
}

/**
 * AST parsing and symbol resolution errors
 */
export class ASTError extends PairedCommentsError {
  public readonly documentUri?: string;
  public readonly symbolPath?: string[];

  constructor(
    message: string,
    userMessage?: string,
    recoverySteps?: string[],
    documentUri?: string,
    symbolPath?: string[],
    context?: Record<string, unknown>
  ) {
    const defaultUserMessage = userMessage || 'Failed to analyze code structure';
    const defaultRecoverySteps = recoverySteps || [
      'Ensure the document is saved',
      'Check for syntax errors in the code',
      'Try reopening the file'
    ];

    super(message, defaultUserMessage, defaultRecoverySteps, {
      ...context,
      documentUri,
      symbolPath
    });
    this.name = 'ASTError';
    this.documentUri = documentUri;
    this.symbolPath = symbolPath;
  }
}

/**
 * Decoration rendering errors
 */
export class DecorationError extends PairedCommentsError {
  public readonly decorationType?: string;
  public readonly line?: number;

  constructor(
    message: string,
    userMessage?: string,
    recoverySteps?: string[],
    decorationType?: string,
    line?: number,
    context?: Record<string, unknown>
  ) {
    const defaultUserMessage = userMessage || 'Failed to render comment decorations';
    const defaultRecoverySteps = recoverySteps || [
      'Reload the VS Code window',
      'Check if the comment file is valid',
      'Try toggling comment visibility'
    ];

    super(message, defaultUserMessage, defaultRecoverySteps, {
      ...context,
      decorationType,
      line
    });
    this.name = 'DecorationError';
    this.decorationType = decorationType;
    this.line = line;
  }
}

/**
 * Migration errors (version upgrades)
 */
export class MigrationError extends PairedCommentsError {
  public readonly fromVersion: string;
  public readonly toVersion: string;

  constructor(
    message: string,
    fromVersion: string,
    toVersion: string,
    userMessage?: string,
    recoverySteps?: string[],
    context?: Record<string, unknown>
  ) {
    const defaultUserMessage = userMessage ||
      `Failed to migrate .comments file from v${fromVersion} to v${toVersion}`;
    const defaultRecoverySteps = recoverySteps || [
      'Create a backup of your .comments file',
      'Try manually fixing the file structure',
      'Report the issue with the file contents'
    ];

    super(message, defaultUserMessage, defaultRecoverySteps, {
      ...context,
      fromVersion,
      toVersion
    });
    this.name = 'MigrationError';
    this.fromVersion = fromVersion;
    this.toVersion = toVersion;
  }
}

/**
 * Type guard to check if an error is a PairedCommentsError
 */
export function isPairedCommentsError(error: unknown): error is PairedCommentsError {
  return error instanceof PairedCommentsError;
}

/**
 * Helper to extract user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isPairedCommentsError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Helper to extract recovery steps from any error
 */
export function getRecoverySteps(error: unknown): string[] {
  if (isPairedCommentsError(error)) {
    return error.recoverySteps;
  }
  return ['Try reloading the VS Code window', 'If issue persists, report it as a bug'];
}
