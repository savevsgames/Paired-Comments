/**
 * FileSystemManager - Handles file I/O for .comments files
 * Supports v1.0 (basic), v2.0 (ghost markers), and v2.0.5 (AST anchors)
 */
import * as vscode from 'vscode';
import { CommentFile } from '../types';
import { ASTAnchorManager } from '../core/ASTAnchorManager';
export declare class FileSystemManager {
    private astManager;
    constructor(astManager: ASTAnchorManager);
    /**
     * Get the URI for a comment file given a source file URI
     */
    getCommentFileUri(sourceUri: vscode.Uri): vscode.Uri;
    /**
     * Check if a file is already a .comments file
     */
    isCommentFile(uri: vscode.Uri): boolean;
    /**
     * Check if a comment file exists
     */
    commentFileExists(sourceUri: vscode.Uri): Promise<boolean>;
    /**
     * Read a comment file from disk
     * Returns null if the file doesn't exist
     */
    readCommentFile(sourceUri: vscode.Uri): Promise<CommentFile | null>;
    /**
     * Write a comment file to disk
     * Creates parent directories if needed
     */
    writeCommentFile(sourceUri: vscode.Uri, data: CommentFile): Promise<void>;
    /**
     * Create an empty comment file
     */
    createEmptyCommentFile(sourceUri: vscode.Uri): Promise<CommentFile>;
    /**
     * Migrate a comment file to the latest version (2.0.5)
     * Handles: v1.0 → v2.0 → v2.0.5
     */
    migrateToLatestVersion(data: CommentFile, sourceUri: vscode.Uri): Promise<CommentFile>;
    /**
     * Migrate v1.0 → v2.0 (add ghost markers)
     */
    private migrateV10ToV20;
    /**
     * Migrate v2.0 → v2.0.5 (add AST anchors)
     */
    private migrateV20ToV205;
    /**
     * Simple hash function for line content
     */
    private hashString;
    /**
     * Validate comment file schema
     * Supports v1.0 (basic), v2.0 (ghost markers), and v2.0.5 (AST anchors)
     */
    validateCommentFile(data: unknown): data is CommentFile;
}
//# sourceMappingURL=FileSystemManager.d.ts.map