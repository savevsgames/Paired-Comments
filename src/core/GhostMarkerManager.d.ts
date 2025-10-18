/**
 * GhostMarkerManager - Manages ghost markers for automatic line tracking
 *
 * Ghost markers are invisible decorations that track comment positions
 * and automatically move with code edits. They use AST-based anchoring
 * (v2.0.5+) with line-based fallback for unsupported languages.
 */
import * as vscode from 'vscode';
import { GhostMarker, ReconciliationResult } from '../types';
import { ASTAnchorManager } from './ASTAnchorManager';
export declare class GhostMarkerManager {
    /** Map of file URI → ghost markers */
    private markers;
    /** Debounce timer for verification */
    private verificationTimer;
    /** Verification debounce delay (ms) */
    private readonly verificationDelay;
    /** AST anchor manager for semantic tracking */
    private astManager;
    constructor();
    /**
     * Set the AST anchor manager (called after initialization)
     */
    setASTManager(astManager: ASTAnchorManager): void;
    /**
     * Create a new ghost marker for a line or range
     * Now with AST anchor support (v2.0.5+) and range support (v2.0.6+)
     */
    createMarker(document: vscode.TextDocument, line: number, commentIds: string[], endLine?: number): Promise<GhostMarker>;
    /**
     * Add a ghost marker to tracking
     */
    addMarker(document: vscode.TextDocument, marker: GhostMarker, editor?: vscode.TextEditor): void;
    /**
     * Apply decoration to editor
     */
    private applyDecoration;
    /**
     * Get all ghost markers for a document
     */
    getMarkers(uri: vscode.Uri): GhostMarker[];
    /**
     * Get ghost marker by ID
     */
    getMarkerById(uri: vscode.Uri, markerId: string): GhostMarker | undefined;
    /**
     * Get ghost marker at a specific line
     * For range markers, checks if line is within the range (start to end)
     */
    getMarkerAtLine(uri: vscode.Uri, line: number): GhostMarker | undefined;
    /**
     * Update ghost marker line position
     * For range markers, also update the end line
     */
    updateMarkerLine(document: vscode.TextDocument, markerId: string, newLine: number, editor?: vscode.TextEditor, newEndLine?: number): void;
    /**
     * Remove a ghost marker
     */
    removeMarker(uri: vscode.Uri, markerId: string): void;
    /**
     * Clear all ghost markers for a document
     */
    clearMarkers(uri: vscode.Uri): void;
    /**
     * Verify all ghost markers in a document
     */
    verifyMarkers(document: vscode.TextDocument): Promise<ReconciliationResult[]>;
    /**
     * Verify a single ghost marker
     * Uses AST resolution if available, falls back to line-based
     */
    private verifyMarker;
    /**
     * Verify marker using AST anchor resolution
     */
    private verifyMarkerWithAST;
    /**
     * Verify marker using line-based hash comparison (v2.0 fallback)
     */
    private verifyMarkerWithLine;
    /**
     * Reconcile a drifted ghost marker
     */
    private reconcileMarker;
    /**
     * Handle document change events
     */
    private onDocumentChange;
    /**
     * Update ghost marker positions based on document changes
     */
    private updateMarkerPositions;
    /**
     * Refresh decorations for a document
     */
    refreshDecorations(editor: vscode.TextEditor): void;
    /**
     * Detect and handle copied ghost markers (copy/paste detection)
     * When code is copied (not cut), we need to create new ghost markers for the pasted code
     */
    private detectAndHandleCopiedMarkers;
    /**
     * Generate unique ID for ghost marker
     */
    private generateId;
    /**
     * Dispose all resources
     */
    dispose(): void;
}
//# sourceMappingURL=GhostMarkerManager.d.ts.map