"use strict";
/**
 * CommentManager - Handles CRUD operations for comments
 * Now with ghost marker support for automatic line tracking! 👻
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
exports.CommentManager = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
class CommentManager {
    fileSystemManager;
    cache = new Map();
    ghostMarkerManager = null;
    constructor(fileSystemManager, ghostMarkerManager) {
        this.fileSystemManager = fileSystemManager;
        // Ghost markers are optional for backwards compatibility
        this.ghostMarkerManager = ghostMarkerManager || null;
    }
    /**
     * Enable ghost markers (call this after construction if needed)
     */
    enableGhostMarkers(ghostMarkerManager) {
        this.ghostMarkerManager = ghostMarkerManager;
    }
    /**
     * Load comments for a source file
     */
    async loadComments(sourceUri) {
        const key = sourceUri.fsPath;
        // Check cache first
        const cached = this.cache.get(key);
        if (cached) {
            return cached;
        }
        // Try to load from disk
        let commentFile = await this.fileSystemManager.readCommentFile(sourceUri);
        // If file doesn't exist, create an empty one
        if (!commentFile) {
            commentFile = await this.fileSystemManager.createEmptyCommentFile(sourceUri);
        }
        // Restore ghost markers if they exist
        if (this.ghostMarkerManager && commentFile.ghostMarkers) {
            await this.restoreGhostMarkers(sourceUri, commentFile);
        }
        // Cache and return
        this.cache.set(key, commentFile);
        return commentFile;
    }
    /**
     * Restore ghost markers from comment file
     */
    async restoreGhostMarkers(sourceUri, commentFile) {
        if (!this.ghostMarkerManager || !commentFile.ghostMarkers) {
            return;
        }
        const document = await vscode.workspace.openTextDocument(sourceUri);
        const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === sourceUri.toString());
        for (const marker of commentFile.ghostMarkers) {
            // Re-add marker to tracking
            this.ghostMarkerManager.addMarker(document, marker, editor);
        }
        // Verify all markers (check for drift)
        const results = await this.ghostMarkerManager.verifyMarkers(document);
        // Log any drift detected (for now just console, later we'll show UI)
        for (const result of results) {
            if (result.status !== 'valid') {
                console.log(`[GhostMarker] Drift detected:`, result);
            }
        }
    }
    /**
     * Save comments for a source file
     */
    async saveComments(sourceUri, commentFile) {
        await this.fileSystemManager.writeCommentFile(sourceUri, commentFile);
        // Update cache
        this.cache.set(sourceUri.fsPath, commentFile);
    }
    /**
     * Add a new comment
     */
    async addComment(sourceUri, options) {
        const commentFile = await this.loadComments(sourceUri);
        // Generate unique ID
        const id = this.generateId();
        const now = new Date().toISOString();
        const author = options.author || this.getDefaultAuthor();
        const tag = (0, types_1.detectTag)(options.text);
        // Create or find ghost marker for this line
        let ghostMarkerId;
        if (this.ghostMarkerManager) {
            const document = await vscode.workspace.openTextDocument(sourceUri);
            const editor = vscode.window.activeTextEditor;
            // Check if a ghost marker already exists at this line
            let existingMarker = this.ghostMarkerManager.getMarkerAtLine(sourceUri, options.line);
            if (existingMarker) {
                // Add comment to existing marker
                existingMarker.commentIds.push(id);
                ghostMarkerId = existingMarker.id;
            }
            else {
                // Create new ghost marker (now async with AST support + range support v2.0.6)
                const marker = await this.ghostMarkerManager.createMarker(document, options.line, [id], options.endLine // Pass endLine for range comments (v2.0.6)
                );
                this.ghostMarkerManager.addMarker(document, marker, editor);
                ghostMarkerId = marker.id;
                // Add marker to comment file
                if (!commentFile.ghostMarkers) {
                    commentFile.ghostMarkers = [];
                }
                commentFile.ghostMarkers.push(marker);
            }
        }
        const newComment = {
            id,
            line: options.line,
            startLine: options.line, // Always set startLine (v2.0.6)
            endLine: options.endLine, // Set endLine if provided (v2.0.6)
            text: options.text,
            author,
            created: now,
            updated: now,
            tag: tag,
            ghostMarkerId: ghostMarkerId
        };
        // Add to comments array
        commentFile.comments.push(newComment);
        // Sort by line number
        commentFile.comments.sort((a, b) => a.line - b.line);
        // Save to disk
        await this.saveComments(sourceUri, commentFile);
        return newComment;
    }
    /**
     * Update an existing comment
     */
    async updateComment(sourceUri, options) {
        const commentFile = await this.loadComments(sourceUri);
        const comment = commentFile.comments.find(c => c.id === options.id);
        if (!comment) {
            throw new Error(`Comment with ID ${options.id} not found`);
        }
        comment.text = options.text;
        comment.updated = new Date().toISOString();
        comment.tag = (0, types_1.detectTag)(options.text);
        await this.saveComments(sourceUri, commentFile);
    }
    /**
     * Delete a comment
     */
    async deleteComment(sourceUri, commentId) {
        const commentFile = await this.loadComments(sourceUri);
        const index = commentFile.comments.findIndex(c => c.id === commentId);
        if (index === -1) {
            throw new Error(`Comment with ID ${commentId} not found`);
        }
        const comment = commentFile.comments[index];
        if (!comment) {
            throw new Error(`Comment at index ${index} not found`);
        }
        // Remove comment from ghost marker
        if (this.ghostMarkerManager && comment.ghostMarkerId) {
            const marker = this.ghostMarkerManager.getMarkerById(sourceUri, comment.ghostMarkerId);
            if (marker) {
                // Remove comment ID from marker
                marker.commentIds = marker.commentIds.filter(id => id !== commentId);
                // If marker has no more comments, remove it entirely
                if (marker.commentIds.length === 0) {
                    this.ghostMarkerManager.removeMarker(sourceUri, marker.id);
                    // Remove from comment file too
                    if (commentFile.ghostMarkers) {
                        commentFile.ghostMarkers = commentFile.ghostMarkers.filter(m => m.id !== marker.id);
                    }
                }
            }
        }
        // Remove comment
        commentFile.comments.splice(index, 1);
        await this.saveComments(sourceUri, commentFile);
    }
    /**
     * Get all comments for a specific line
     */
    getCommentsForLine(sourceUri, line) {
        const commentFile = this.cache.get(sourceUri.fsPath);
        if (!commentFile) {
            return [];
        }
        return commentFile.comments.filter(c => c.line === line);
    }
    /**
     * Get a comment by ID
     */
    getCommentById(sourceUri, commentId) {
        const commentFile = this.cache.get(sourceUri.fsPath);
        if (!commentFile) {
            return undefined;
        }
        return commentFile.comments.find(c => c.id === commentId);
    }
    /**
     * Reload comments from disk (invalidate cache)
     */
    async reloadComments(sourceUri) {
        this.cache.delete(sourceUri.fsPath);
        await this.loadComments(sourceUri);
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Generate a unique ID for a comment
     */
    generateId() {
        // Simple UUID v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    /**
     * Get the default author name
     */
    getDefaultAuthor() {
        const config = vscode.workspace.getConfiguration('pairedComments');
        return config.get('defaultAuthor') || 'Unknown';
    }
}
exports.CommentManager = CommentManager;
//# sourceMappingURL=CommentManager.js.map