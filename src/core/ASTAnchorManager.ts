/**
 * ASTAnchorManager - Uses VS Code Symbol Provider for semantic code tracking
 *
 * This manager creates and resolves AST-based anchors that track code semantically
 * rather than by line numbers. This allows comments to follow code through refactorings.
 */

import * as vscode from 'vscode';
import { ASTAnchor, AnchorResolution, isASTSupported } from '../types/ast';
import { ASTCacheManager } from './ASTCacheManager';

export class ASTAnchorManager {
  private astCacheManager: ASTCacheManager | null = null;

  constructor(astCacheManager?: ASTCacheManager) {
    // v2.1.4: Use ASTCacheManager if provided, otherwise create a new one
    this.astCacheManager = astCacheManager || null;
  }

  /**
   * Set the AST cache manager (v2.1.4)
   */
  setASTCacheManager(cacheManager: ASTCacheManager): void {
    this.astCacheManager = cacheManager;
  }

  /**
   * Check if AST anchoring is supported for this document
   */
  isSupported(document: vscode.TextDocument): boolean {
    return isASTSupported(document.languageId);
  }

  /**
   * Create an AST anchor for a specific line in a document
   * Returns null if:
   * - Document language not supported (use line-based fallback)
   * - No symbol found at that line (blank line, comment, etc.)
   * - Symbol provider not available
   */
  async createAnchor(
    document: vscode.TextDocument,
    line: number // 1-indexed
  ): Promise<ASTAnchor | null> {
    // Check if AST is supported for this language
    if (!this.isSupported(document)) {
      console.log(`[AST] Language ${document.languageId} not supported, use line-based fallback`);
      return null;
    }

    try {
      // Get all symbols in the document
      const symbols = await this.getAllSymbols(document);
      if (!symbols || symbols.length === 0) {
        console.log(`[AST] No symbols found in document`);
        return null;
      }

      // Find the symbol at this line (0-indexed for VS Code API)
      const zeroIndexedLine = line - 1;
      const position = new vscode.Position(zeroIndexedLine, 0);

      const symbolInfo = this.findSymbolAtPosition(symbols, position);
      if (!symbolInfo) {
        console.log(`[AST] No symbol found at line ${line}`);
        return null;
      }

      // Calculate offset within the symbol
      const symbolStartLine = symbolInfo.symbol.range.start.line;
      const offset = zeroIndexedLine - symbolStartLine;

      // Build the anchor
      const anchor: ASTAnchor = {
        symbolPath: symbolInfo.path,
        symbolKind: vscode.SymbolKind[symbolInfo.symbol.kind],
        containerName: symbolInfo.containerName,
        offset: offset
      };

      console.log(`[AST] Created anchor for line ${line}:`, {
        path: anchor.symbolPath.join('.'),
        kind: anchor.symbolKind,
        offset: anchor.offset
      });

      return anchor;

    } catch (error) {
      console.error(`[AST] Failed to create anchor for line ${line}:`, error);
      return null;
    }
  }

  /**
   * Resolve an AST anchor to current line number
   * Returns resolution with confidence level
   */
  async resolveAnchor(
    document: vscode.TextDocument,
    anchor: ASTAnchor
  ): Promise<AnchorResolution> {
    console.log(`[AST] 🔍 Resolving anchor: ${anchor.symbolPath.join('.')} (kind: ${anchor.symbolKind}, offset: ${anchor.offset})`);

    // Check if AST is supported
    if (!this.isSupported(document)) {
      console.log(`[AST] ❌ Language ${document.languageId} not supported`);
      return {
        line: null,
        confidence: 'not_found',
        message: `Language ${document.languageId} not supported for AST anchoring`
      };
    }

    try {
      // Get all symbols
      const symbols = await this.getAllSymbols(document);
      if (!symbols || symbols.length === 0) {
        console.log(`[AST] ❌ No symbols available for resolution`);
        return {
          line: null,
          confidence: 'not_found',
          message: 'No symbols found in document'
        };
      }

      console.log(`[AST] Searching for symbol path: [${anchor.symbolPath.join(' → ')}]`);

      // Find symbol matching the path
      const matches = this.findSymbolsByPath(symbols, anchor.symbolPath);

      console.log(`[AST] Found ${matches.length} matching symbol(s)`);

      if (matches.length === 0) {
        console.log(`[AST] ❌ Symbol ${anchor.symbolPath.join('.')} not found`);
        return {
          line: null,
          confidence: 'not_found',
          message: `Symbol ${anchor.symbolPath.join('.')} not found`
        };
      }

      if (matches.length > 1) {
        // Ambiguous - multiple symbols match the path
        // Use the first one but mark as ambiguous
        const symbol = matches[0];
        if (!symbol) {
          return {
            line: null,
            confidence: 'not_found',
            message: 'Symbol array empty (unexpected)'
          };
        }
        const resolvedLine = symbol.range.start.line + anchor.offset + 1; // Convert to 1-indexed
        console.log(`[AST] ⚠️ Ambiguous: Found ${matches.length} matches, using line ${resolvedLine}`);

        return {
          line: resolvedLine,
          confidence: 'ambiguous',
          symbol: symbol,
          message: `Found ${matches.length} symbols matching path, using first match`
        };
      }

      // Exact match found
      const symbol = matches[0];
      if (!symbol) {
        return {
          line: null,
          confidence: 'not_found',
          message: 'Symbol not found (unexpected)'
        };
      }
      const resolvedLine = symbol.range.start.line + anchor.offset + 1; // Convert to 1-indexed
      console.log(`[AST] ✅ Symbol found at line ${resolvedLine} (symbol starts at ${symbol.range.start.line + 1}, offset: ${anchor.offset})`);

      return {
        line: resolvedLine,
        confidence: 'exact',
        symbol: symbol,
        message: `Symbol ${anchor.symbolPath.join('.')} found`
      };

    } catch (error) {
      console.error(`[AST] Failed to resolve anchor:`, error);
      return {
        line: null,
        confidence: 'not_found',
        message: `Error resolving anchor: ${String(error)}`
      };
    }
  }

  /**
   * Get all document symbols (with caching)
   */
  async getAllSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
    // Use ASTCacheManager if available (v2.1.4 - provides 60-90x speedup)
    if (this.astCacheManager) {
      return await this.astCacheManager.getSymbols(document);
    }

    // Fallback to direct symbol provider call (legacy mode - no caching)
    console.log(`[AST] ASTCacheManager not available, using direct symbol provider (legacy mode)`);
    console.log(`[AST] Requesting symbols for ${document.fileName} (language: ${document.languageId})`);

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    if (!symbols || symbols.length === 0) {
      console.log(`[AST] ⚠️ No symbols returned`);
      return [];
    }

    console.log(`[AST] ✓ Found ${symbols.length} top-level symbols`);
    return symbols;
  }

  /**
   * Find the innermost symbol at a specific position
   * Returns the symbol, its path, and container name
   */
  private findSymbolAtPosition(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position,
    parentPath: string[] = [],
    parentName: string | null = null
  ): { symbol: vscode.DocumentSymbol; path: string[]; containerName: string | null } | null {
    for (const symbol of symbols) {
      // Check if position is within this symbol's range
      if (symbol.range.contains(position)) {
        const currentPath = [...parentPath, symbol.name];

        // Check if position is in a child symbol (deeper nesting)
        if (symbol.children && symbol.children.length > 0) {
          const childMatch = this.findSymbolAtPosition(
            symbol.children,
            position,
            currentPath,
            symbol.name
          );
          if (childMatch) {
            return childMatch; // Return the deepest match
          }
        }

        // This is the innermost symbol containing the position
        return {
          symbol: symbol,
          path: currentPath,
          containerName: parentName
        };
      }
    }

    return null;
  }

  /**
   * Find all symbols matching a given path
   * Returns array (may have multiple matches if symbols are ambiguous)
   */
  private findSymbolsByPath(
    symbols: vscode.DocumentSymbol[],
    path: string[],
    currentDepth: number = 0
  ): vscode.DocumentSymbol[] {
    if (path.length === 0) {
      return [];
    }

    const targetName = path[currentDepth];
    if (!targetName) {
      return [];
    }

    const matches: vscode.DocumentSymbol[] = [];

    for (const symbol of symbols) {
      if (symbol.name === targetName) {
        // If this is the last element in the path, we found a match
        if (currentDepth === path.length - 1) {
          matches.push(symbol);
        } else {
          // Continue searching in children
          if (symbol.children && symbol.children.length > 0) {
            const childMatches = this.findSymbolsByPath(
              symbol.children,
              path,
              currentDepth + 1
            );
            matches.push(...childMatches);
          }
        }
      } else {
        // Also search children (symbol might be nested under a different parent)
        if (symbol.children && symbol.children.length > 0) {
          const childMatches = this.findSymbolsByPath(
            symbol.children,
            path,
            currentDepth
          );
          matches.push(...childMatches);
        }
      }
    }

    return matches;
  }

  /**
   * Debug: Get symbol tree as string (for logging)
   */
  async getSymbolTree(document: vscode.TextDocument): Promise<string> {
    const symbols = await this.getAllSymbols(document);
    return this.symbolTreeToString(symbols, 0);
  }

  private symbolTreeToString(symbols: vscode.DocumentSymbol[], indent: number): string {
    let result = '';
    const indentStr = '  '.repeat(indent);

    for (const symbol of symbols) {
      const kind = vscode.SymbolKind[symbol.kind];
      const line = symbol.range.start.line + 1;
      result += `${indentStr}${symbol.name} (${kind}) @ line ${line}\n`;

      if (symbol.children && symbol.children.length > 0) {
        result += this.symbolTreeToString(symbol.children, indent + 1);
      }
    }

    return result;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clear AST cache if available (v2.1.4)
    if (this.astCacheManager) {
      this.astCacheManager.clear();
    }
  }
}
