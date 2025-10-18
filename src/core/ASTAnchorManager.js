"use strict";
/**
 * ASTAnchorManager - Uses VS Code Symbol Provider for semantic code tracking
 *
 * This manager creates and resolves AST-based anchors that track code semantically
 * rather than by line numbers. This allows comments to follow code through refactorings.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTAnchorManager = void 0;
const vscode = __importStar(require("vscode"));
const ast_1 = require("../types/ast");
class ASTAnchorManager {
    symbolCache = new Map();
    cacheTimeout = 5000; // 5 seconds
    constructor() {
        // Clear cache when documents change significantly
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.contentChanges.length > 0) {
                const key = event.document.uri.toString();
                this.symbolCache.delete(key);
            }
        });
    }
    /**
     * Check if AST anchoring is supported for this document
     */
    isSupported(document) {
        return (0, ast_1.isASTSupported)(document.languageId);
    }
    /**
     * Create an AST anchor for a specific line in a document
     * Returns null if:
     * - Document language not supported (use line-based fallback)
     * - No symbol found at that line (blank line, comment, etc.)
     * - Symbol provider not available
     */
    async createAnchor(document, line // 1-indexed
    ) {
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
            const anchor = {
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
        }
        catch (error) {
            console.error(`[AST] Failed to create anchor for line ${line}:`, error);
            return null;
        }
    }
    /**
     * Resolve an AST anchor to current line number
     * Returns resolution with confidence level
     */
    async resolveAnchor(document, anchor) {
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
        }
        catch (error) {
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
    async getAllSymbols(document) {
        const key = document.uri.toString();
        // Check cache
        if (this.symbolCache.has(key)) {
            console.log(`[AST] Using cached symbols for ${document.fileName}`);
            return this.symbolCache.get(key);
        }
        console.log(`[AST] Requesting symbols for ${document.fileName} (language: ${document.languageId})`);
        // Execute symbol provider
        const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
        if (!symbols || symbols.length === 0) {
            console.log(`[AST] ⚠️ No symbols returned from VS Code Symbol Provider`);
            console.log(`[AST] Document info: uri=${document.uri.fsPath}, languageId=${document.languageId}, lineCount=${document.lineCount}`);
            // Try waiting longer and retry multiple times (document might be in transitional state during edits)
            const maxRetries = 3;
            for (let i = 0; i < maxRetries; i++) {
                const waitTime = 200 + (i * 100); // 200ms, 300ms, 400ms
                console.log(`[AST] Retry ${i + 1}/${maxRetries}: Waiting ${waitTime}ms for language server...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                const symbolsRetry = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
                if (symbolsRetry && symbolsRetry.length > 0) {
                    console.log(`[AST] ✓ Retry ${i + 1} successful! Found ${symbolsRetry.length} symbols`);
                    // Cache and return retry result
                    this.symbolCache.set(key, symbolsRetry);
                    setTimeout(() => this.symbolCache.delete(key), this.cacheTimeout);
                    return symbolsRetry;
                }
            }
            console.log(`[AST] ❌ Failed after ${maxRetries} retries. Language server may not be initialized or document is being edited.`);
            return [];
        }
        console.log(`[AST] ✓ Found ${symbols.length} top-level symbols`);
        // Cache the result
        this.symbolCache.set(key, symbols);
        // Clear cache after timeout
        setTimeout(() => {
            this.symbolCache.delete(key);
        }, this.cacheTimeout);
        return symbols;
    }
    /**
     * Find the innermost symbol at a specific position
     * Returns the symbol, its path, and container name
     */
    findSymbolAtPosition(symbols, position, parentPath = [], parentName = null) {
        for (const symbol of symbols) {
            // Check if position is within this symbol's range
            if (symbol.range.contains(position)) {
                const currentPath = [...parentPath, symbol.name];
                // Check if position is in a child symbol (deeper nesting)
                if (symbol.children && symbol.children.length > 0) {
                    const childMatch = this.findSymbolAtPosition(symbol.children, position, currentPath, symbol.name);
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
    findSymbolsByPath(symbols, path, currentDepth = 0) {
        if (path.length === 0) {
            return [];
        }
        const targetName = path[currentDepth];
        if (!targetName) {
            return [];
        }
        const matches = [];
        for (const symbol of symbols) {
            if (symbol.name === targetName) {
                // If this is the last element in the path, we found a match
                if (currentDepth === path.length - 1) {
                    matches.push(symbol);
                }
                else {
                    // Continue searching in children
                    if (symbol.children && symbol.children.length > 0) {
                        const childMatches = this.findSymbolsByPath(symbol.children, path, currentDepth + 1);
                        matches.push(...childMatches);
                    }
                }
            }
            else {
                // Also search children (symbol might be nested under a different parent)
                if (symbol.children && symbol.children.length > 0) {
                    const childMatches = this.findSymbolsByPath(symbol.children, path, currentDepth);
                    matches.push(...childMatches);
                }
            }
        }
        return matches;
    }
    /**
     * Debug: Get symbol tree as string (for logging)
     */
    async getSymbolTree(document) {
        const symbols = await this.getAllSymbols(document);
        return this.symbolTreeToString(symbols, 0);
    }
    symbolTreeToString(symbols, indent) {
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
    dispose() {
        this.symbolCache.clear();
    }
}
exports.ASTAnchorManager = ASTAnchorManager;
//# sourceMappingURL=ASTAnchorManager.js.map