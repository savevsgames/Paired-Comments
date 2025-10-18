/**
 * CommentManager - Handles CRUD operations for comments
 * Now with ghost marker support for automatic line tracking! 👻
 */
import * as vscode from 'vscode';
import { Comment, CommentFile, AddCommentOptions, UpdateCommentOptions } from '../types';
import { FileSystemManager } from '../io/FileSystemManager';
import { GhostMarkerManager } from './GhostMarkerManager';
export declare class CommentManager {
    private fileSystemManager;
    private cache;
    private ghostMarkerManager;
    constructor(fileSystemManager: FileSystemManager, ghostMarkerManager?: GhostMarkerManager);
    /**
     * Enable ghost markers (call this after construction if needed)
     */
    enableGhostMarkers(ghostMarkerManager: GhostMarkerManager): void;
    /**
     * Load comments for a source file
     */
    loadComments(sourceUri: vscode.Uri): Promise<CommentFile>;
    /**
     * Restore ghost markers from comment file
     */
    private restoreGhostMarkers;
    /**
     * Save comments for a source file
     */
    saveComments(sourceUri: vscode.Uri, commentFile: CommentFile): Promise<void>;
    /**
     * Add a new comment
     */
    addComment(sourceUri: vscode.Uri, options: AddCommentOptions): Promise<Comment>;
    /**
     * Update an existing comment
     */
    updateComment(sourceUri: vscode.Uri, options: UpdateCommentOptions): Promise<void>;
    /**
     * Delete a comment
     */
    deleteComment(sourceUri: vscode.Uri, commentId: string): Promise<void>;
    /**
     * Get all comments for a specific line
     */
    getCommentsForLine(sourceUri: vscode.Uri, line: number): Comment[];
    /**
     * Get a comment by ID
     */
    getCommentById(sourceUri: vscode.Uri, commentId: string): Comment | undefined;
    /**
     * Reload comments from disk (invalidate cache)
     */
    reloadComments(sourceUri: vscode.Uri): Promise<void>;
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Generate a unique ID for a comment
     */
    private generateId;
    /**
     * Get the default author name
     */
    private getDefaultAuthor;
}
//# sourceMappingURL=CommentManager.d.ts.map