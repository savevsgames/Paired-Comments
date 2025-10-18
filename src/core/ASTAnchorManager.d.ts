/**
 * ASTAnchorManager - Uses VS Code Symbol Provider for semantic code tracking
 *
 * This manager creates and resolves AST-based anchors that track code semantically
 * rather than by line numbers. This allows comments to follow code through refactorings.
 */
import * as vscode from 'vscode';
import { ASTAnchor, AnchorResolution } from '../types/ast';
export declare class ASTAnchorManager {
    private symbolCache;
    private cacheTimeout;
    constructor();
    /**
     * Check if AST anchoring is supported for this document
     */
    isSupported(document: vscode.TextDocument): boolean;
    /**
     * Create an AST anchor for a specific line in a document
     * Returns null if:
     * - Document language not supported (use line-based fallback)
     * - No symbol found at that line (blank line, comment, etc.)
     * - Symbol provider not available
     */
    createAnchor(document: vscode.TextDocument, line: number): Promise<ASTAnchor | null>;
    /**
     * Resolve an AST anchor to current line number
     * Returns resolution with confidence level
     */
    resolveAnchor(document: vscode.TextDocument, anchor: ASTAnchor): Promise<AnchorResolution>;
    /**
     * Get all document symbols (with caching)
     */
    getAllSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]>;
    /**
     * Find the innermost symbol at a specific position
     * Returns the symbol, its path, and container name
     */
    private findSymbolAtPosition;
    /**
     * Find all symbols matching a given path
     * Returns array (may have multiple matches if symbols are ambiguous)
     */
    private findSymbolsByPath;
    /**
     * Debug: Get symbol tree as string (for logging)
     */
    getSymbolTree(document: vscode.TextDocument): Promise<string>;
    private symbolTreeToString;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=ASTAnchorManager.d.ts.map