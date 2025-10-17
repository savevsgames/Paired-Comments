/**
 * AST-based anchoring types for semantic code tracking
 */

import * as vscode from 'vscode';

/**
 * AST-based anchor for tracking code semantically
 * Uses VS Code's Symbol Provider to track symbols through refactorings
 */
export interface ASTAnchor {
  /**
   * Symbol path from root to target
   * Example: ["UserManager", "addUser"] = UserManager.addUser method
   * Example: ["calculateSum"] = top-level calculateSum function
   */
  symbolPath: string[];

  /**
   * VS Code symbol kind (Function, Method, Class, etc.)
   * Stored as string for JSON serialization
   */
  symbolKind: string;

  /**
   * Container name (parent symbol)
   * Example: "UserManager" for a method inside UserManager class
   * null for top-level symbols
   */
  containerName: string | null;

  /**
   * Line offset within the symbol (0 = first line of symbol)
   * Allows comments on specific lines within a function body
   * Example: Comment on line 3 of a function that starts at line 10 = offset 2
   */
  offset: number;
}

/**
 * Result of resolving an AST anchor
 */
export interface AnchorResolution {
  /**
   * Resolved line number (1-indexed)
   * null if symbol not found
   */
  line: number | null;

  /**
   * Confidence level of the resolution
   * - exact: Symbol found at expected location with matching hash
   * - moved: Symbol found but at different location than cached
   * - ambiguous: Multiple symbols match the path
   * - not_found: Symbol doesn't exist in document
   */
  confidence: 'exact' | 'moved' | 'ambiguous' | 'not_found';

  /**
   * The symbol that was found (if any)
   */
  symbol?: vscode.DocumentSymbol;

  /**
   * Human-readable message about the resolution
   */
  message?: string;
}

/**
 * Supported file types for AST anchoring
 */
export const AST_SUPPORTED_LANGUAGES = [
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact'
];

/**
 * Helper to check if a language is supported for AST anchoring
 */
export function isASTSupported(languageId: string): boolean {
  return AST_SUPPORTED_LANGUAGES.includes(languageId);
}
