/**
 * ParamManager - Handles dynamic parameter interpolation in comment text
 *
 * Supports variable interpolation syntax: ${variableName}
 *
 * Example:
 * text: "The ${functionName} takes ${paramCount} parameters (~${tokens} tokens)"
 * params: {
 *   functionName: { value: "processUserData", type: "dynamic", source: "function.name" },
 *   paramCount: { value: 3, type: "computed", source: "aiMeta.paramCount" },
 *   tokens: { value: 450, type: "computed", source: "aiMeta.tokens" }
 * }
 * result: "The processUserData takes 3 parameters (~450 tokens)"
 */

import * as vscode from 'vscode';
import { Comment, CommentParameter } from '../types';
import { logger } from '../utils/Logger';
import { ASTAnchorManager } from './ASTAnchorManager';

/**
 * Options for extracting parameters from code
 */
export interface ExtractParamsOptions {
  /** Source file URI */
  sourceUri: vscode.Uri;
  /** Line number to analyze */
  lineNumber: number;
  /** Document to analyze */
  document: vscode.TextDocument;
  /** AI metadata if available */
  aiMetadata?: Comment['aiMetadata'];
}

/**
 * ParamManager - Evaluates and interpolates dynamic parameters in comments
 */
export class ParamManager {
  constructor(private astAnchorManager: ASTAnchorManager) {}

  /**
   * Interpolate a comment's text with its parameters
   *
   * @param comment - Comment with text and params
   * @returns Interpolated text with parameters substituted
   *
   * @example
   * const comment = {
   *   text: "The ${functionName} has ${complexity} complexity",
   *   params: {
   *     functionName: { value: "processUser", type: "dynamic" },
   *     complexity: { value: 8, type: "computed" }
   *   }
   * };
   * interpolate(comment) // => "The processUser has 8 complexity"
   */
  interpolate(comment: Comment): string {
    if (!comment.params || Object.keys(comment.params).length === 0) {
      return comment.text;
    }

    let result = comment.text;

    // Find all ${variableName} patterns
    const paramRegex = /\$\{(\w+)\}/g;
    const matches = [...comment.text.matchAll(paramRegex)];

    for (const match of matches) {
      const paramName = match[1];
      if (!paramName) continue;

      const param = comment.params[paramName];

      if (param) {
        // Replace ${variableName} with the parameter value
        result = result.replace(match[0], String(param.value));
      } else {
        // Log warning if parameter is not found
        logger.warn(`Parameter ${paramName} not found in comment params`, {
          commentId: comment.id,
          availableParams: Object.keys(comment.params)
        });
      }
    }

    return result;
  }

  /**
   * Extract parameter names from comment text
   *
   * @param text - Comment text with ${variableName} patterns
   * @returns Array of parameter names found in text
   *
   * @example
   * extractParamNames("The ${functionName} has ${complexity}") // => ["functionName", "complexity"]
   */
  extractParamNames(text: string): string[] {
    const paramRegex = /\$\{(\w+)\}/g;
    const matches = [...text.matchAll(paramRegex)];
    return matches.map(m => m[1]).filter((name): name is string => name !== undefined);
  }

  /**
   * Auto-detect and extract parameters from code context
   *
   * This analyzes the code at the comment's line and tries to extract
   * dynamic parameters like function name, class name, etc.
   *
   * @param options - Extraction options
   * @returns Record of auto-detected parameters
   */
  async extractFromCode(options: ExtractParamsOptions): Promise<Record<string, CommentParameter>> {
    const { lineNumber, document, aiMetadata } = options;
    const params: Record<string, CommentParameter> = {};

    try {
      // Try to get AST anchor for this line
      const astAnchor = await this.astAnchorManager.createAnchor(document, lineNumber - 1);

      if (astAnchor) {
        // Convert symbolKind string back to number for comparison
        const kind = parseInt(astAnchor.symbolKind, 10);

        // Extract function name if it's a function
        if (kind === vscode.SymbolKind.Function || kind === vscode.SymbolKind.Method) {
          const functionName = this.extractFunctionNameFromPath(astAnchor.symbolPath);
          if (functionName) {
            params['functionName'] = {
              value: functionName,
              type: 'dynamic',
              source: 'function.name',
              updatedAt: new Date().toISOString()
            };
          }
        }

        // Extract class name if it's a class or method
        if (kind === vscode.SymbolKind.Class || kind === vscode.SymbolKind.Method) {
          const className = this.extractClassNameFromPath(astAnchor.symbolPath);
          if (className) {
            params['className'] = {
              value: className,
              type: 'dynamic',
              source: 'class.name',
              updatedAt: new Date().toISOString()
            };
          }
        }

        // Extract variable name if it's a variable
        if (kind === vscode.SymbolKind.Variable || kind === vscode.SymbolKind.Constant) {
          const variableName = this.extractVariableNameFromPath(astAnchor.symbolPath);
          if (variableName) {
            params['variableName'] = {
              value: variableName,
              type: 'dynamic',
              source: 'variable.name',
              updatedAt: new Date().toISOString()
            };
          }
        }
      }

      // Extract computed parameters from AI metadata
      if (aiMetadata) {
        if (aiMetadata.tokens) {
          params['tokens'] = {
            value: aiMetadata.tokens.validated || aiMetadata.tokens.heuristic,
            type: 'computed',
            source: 'aiMeta.tokens',
            updatedAt: new Date().toISOString()
          };
        }

        if (aiMetadata.complexity) {
          params['complexity'] = {
            value: aiMetadata.complexity.cyclomatic,
            type: 'computed',
            source: 'aiMeta.complexity',
            updatedAt: new Date().toISOString()
          };

          params['cognitiveComplexity'] = {
            value: aiMetadata.complexity.cognitive,
            type: 'computed',
            source: 'aiMeta.complexity',
            updatedAt: new Date().toISOString()
          };
        }

        if (aiMetadata.parameters) {
          params['paramCount'] = {
            value: aiMetadata.parameters.parameters.length,
            type: 'computed',
            source: 'aiMeta.paramCount',
            updatedAt: new Date().toISOString()
          };
        }
      }

      logger.debug('Extracted parameters from code', {
        lineNumber,
        paramCount: Object.keys(params).length,
        paramNames: Object.keys(params)
      });

      return params;
    } catch (error) {
      logger.error('Failed to extract parameters from code', error);
      return {};
    }
  }

  /**
   * Update dynamic parameters by re-analyzing the code
   *
   * This is called when the code changes to keep dynamic params in sync
   *
   * @param comment - Comment to update
   * @param options - Extraction options
   * @returns Updated comment with refreshed parameters
   */
  async updateDynamicParams(comment: Comment, options: ExtractParamsOptions): Promise<Comment> {
    if (!comment.params) {
      return comment;
    }

    // Extract fresh parameters from code
    const freshParams = await this.extractFromCode(options);

    // Update only dynamic and computed parameters (keep static params unchanged)
    for (const [paramName, param] of Object.entries(comment.params)) {
      if (param.type === 'dynamic' || param.type === 'computed') {
        // Update if we have a fresh value
        if (freshParams[paramName]) {
          comment.params[paramName] = freshParams[paramName];
        }
      }
    }

    return comment;
  }

  /**
   * Create parameters for a new comment with AI metadata
   *
   * @param text - Comment text (may contain ${variableName} patterns)
   * @param options - Extraction options
   * @returns Parameters record
   */
  async createParams(text: string, options: ExtractParamsOptions): Promise<Record<string, CommentParameter> | undefined> {
    const paramNames = this.extractParamNames(text);

    if (paramNames.length === 0) {
      // No parameters in text
      return undefined;
    }

    // Extract all available parameters from code
    const availableParams = await this.extractFromCode(options);

    // Build params object with only the parameters referenced in text
    const params: Record<string, CommentParameter> = {};

    for (const paramName of paramNames) {
      if (availableParams[paramName]) {
        params[paramName] = availableParams[paramName];
      } else {
        // Parameter not found - create a placeholder
        logger.warn(`Parameter ${paramName} referenced in text but not found in code`, {
          text,
          availableParams: Object.keys(availableParams)
        });

        params[paramName] = {
          value: `[${paramName}]`, // Placeholder value
          type: 'manual',
          source: 'manual',
          updatedAt: new Date().toISOString()
        };
      }
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  /**
   * Validate that all parameters in text have corresponding param definitions
   *
   * @param comment - Comment to validate
   * @returns True if all parameters are defined
   */
  validate(comment: Comment): boolean {
    const paramNames = this.extractParamNames(comment.text);

    if (paramNames.length === 0) {
      return true; // No parameters to validate
    }

    if (!comment.params) {
      logger.warn('Comment text has parameters but no params object', {
        commentId: comment.id,
        paramNames
      });
      return false;
    }

    // Check if all referenced parameters are defined
    for (const paramName of paramNames) {
      if (!comment.params[paramName]) {
        logger.warn(`Parameter ${paramName} referenced in text but not defined in params`, {
          commentId: comment.id,
          paramNames,
          definedParams: Object.keys(comment.params)
        });
        return false;
      }
    }

    return true;
  }

  // Helper methods for extracting names from symbol paths

  private extractFunctionNameFromPath(symbolPath: string[]): string | null {
    // Symbol path is like ["ClassName", "methodName"] or ["functionName"]
    // Return the last element (the function/method name)
    return symbolPath.length > 0 ? (symbolPath[symbolPath.length - 1] ?? null) : null;
  }

  private extractClassNameFromPath(symbolPath: string[]): string | null {
    // For methods, class is the first element
    // For classes, it's the only element
    if (symbolPath.length === 1) {
      return symbolPath[0] ?? null; // Class declaration
    } else if (symbolPath.length > 1) {
      return symbolPath[0] ?? null; // Method in class
    }
    return null;
  }

  private extractVariableNameFromPath(symbolPath: string[]): string | null {
    // Variables are usually top-level, return the first element
    return symbolPath.length > 0 ? (symbolPath[0] ?? null) : null;
  }
}
