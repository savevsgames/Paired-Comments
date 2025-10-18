"use strict";
/**
 * FileSystemManager - Handles file I/O for .comments files
 * Supports v1.0 (basic), v2.0 (ghost markers), and v2.0.5 (AST anchors)
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
exports.FileSystemManager = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
class FileSystemManager {
    astManager;
    constructor(astManager) {
        this.astManager = astManager;
    }
    /**
     * Get the URI for a comment file given a source file URI
     */
    getCommentFileUri(sourceUri) {
        return vscode.Uri.file(sourceUri.fsPath + types_1.COMMENT_FILE_EXTENSION);
    }
    /**
     * Check if a file is already a .comments file
     */
    isCommentFile(uri) {
        return uri.fsPath.endsWith(types_1.COMMENT_FILE_EXTENSION);
    }
    /**
     * Check if a comment file exists
     */
    async commentFileExists(sourceUri) {
        const commentUri = this.getCommentFileUri(sourceUri);
        try {
            await vscode.workspace.fs.stat(commentUri);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Read a comment file from disk
     * Returns null if the file doesn't exist
     */
    async readCommentFile(sourceUri) {
        const commentUri = this.getCommentFileUri(sourceUri);
        // DEBUG: Log the paths we're using
        console.log('[FileSystemManager] Reading .comments file:');
        console.log('  Source URI:', sourceUri.fsPath);
        console.log('  Comment URI:', commentUri.fsPath);
        try {
            const fileData = await vscode.workspace.fs.readFile(commentUri);
            const text = Buffer.from(fileData).toString('utf8');
            const data = JSON.parse(text);
            if (!this.validateCommentFile(data)) {
                console.error('[FileSystemManager] Validation failed for:', commentUri.fsPath);
                throw new Error('Invalid comment file schema');
            }
            console.log('[FileSystemManager] Successfully loaded .comments file');
            console.log('  Version:', data.version);
            console.log('  Comments:', data.comments.length);
            console.log('  Ghost Markers:', data.ghostMarkers?.length || 0);
            // Auto-migrate to latest version if needed
            const migratedData = await this.migrateToLatestVersion(data, sourceUri);
            return migratedData;
        }
        catch (error) {
            if (error.code === 'FileNotFound') {
                console.log('[FileSystemManager] .comments file not found, will create empty');
                return null;
            }
            console.error('[FileSystemManager] Error reading .comments file:', error);
            throw error;
        }
    }
    /**
     * Write a comment file to disk
     * Creates parent directories if needed
     */
    async writeCommentFile(sourceUri, data) {
        const commentUri = this.getCommentFileUri(sourceUri);
        const text = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(text, 'utf8');
        await vscode.workspace.fs.writeFile(commentUri, buffer);
    }
    /**
     * Create an empty comment file
     */
    async createEmptyCommentFile(sourceUri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(sourceUri);
        const relativePath = workspaceFolder
            ? vscode.workspace.asRelativePath(sourceUri, false)
            : sourceUri.fsPath;
        const commentFile = {
            file: relativePath,
            version: types_1.COMMENT_FILE_VERSION, // Use current version (now 2.0 with ghost markers)
            ghostMarkers: [], // Initialize empty ghost markers array
            comments: []
        };
        await this.writeCommentFile(sourceUri, commentFile);
        return commentFile;
    }
    /**
     * Migrate a comment file to the latest version (2.0.5)
     * Handles: v1.0 → v2.0 → v2.0.5
     */
    async migrateToLatestVersion(data, sourceUri) {
        const currentVersion = data.version;
        // Already at latest version
        if (currentVersion === '2.0.5') {
            console.log('[Migration] Already at v2.0.5, no migration needed');
            return data;
        }
        let migratedData = data;
        // v1.0 → v2.0 (add ghost markers)
        if (currentVersion === '1.0') {
            console.log('[Migration] Migrating v1.0 → v2.0...');
            migratedData = await this.migrateV10ToV20(migratedData, sourceUri);
        }
        // v2.0 → v2.0.5 (add AST anchors)
        if (migratedData.version === '2.0') {
            console.log('[Migration] Migrating v2.0 → v2.0.5...');
            migratedData = await this.migrateV20ToV205(migratedData, sourceUri);
        }
        // Save migrated file
        if (migratedData.version !== currentVersion) {
            console.log(`[Migration] Saving migrated file (${currentVersion} → ${migratedData.version})`);
            await this.writeCommentFile(sourceUri, migratedData);
        }
        return migratedData;
    }
    /**
     * Migrate v1.0 → v2.0 (add ghost markers)
     */
    async migrateV10ToV20(data, sourceUri) {
        // This migration was already implemented in the previous version
        // Just ensure ghost markers array exists and link comments to markers
        const ghostMarkers = [];
        const lineToMarkerMap = new Map();
        // Group comments by line and create ghost markers
        const commentsByLine = new Map();
        for (const comment of data.comments) {
            const line = comment.line;
            if (!commentsByLine.has(line)) {
                commentsByLine.set(line, []);
            }
            commentsByLine.get(line).push(comment.id);
        }
        // Create ghost markers
        const document = await vscode.workspace.openTextDocument(sourceUri);
        for (const [line, commentIds] of commentsByLine.entries()) {
            const zeroIndexedLine = line - 1;
            if (zeroIndexedLine < 0 || zeroIndexedLine >= document.lineCount) {
                continue;
            }
            const lineText = document.lineAt(zeroIndexedLine).text.trim();
            const prevLineText = zeroIndexedLine > 0
                ? document.lineAt(zeroIndexedLine - 1).text.trim()
                : '';
            const nextLineText = zeroIndexedLine < document.lineCount - 1
                ? document.lineAt(zeroIndexedLine + 1).text.trim()
                : '';
            const markerId = `gm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            lineToMarkerMap.set(line, markerId);
            ghostMarkers.push({
                id: markerId,
                line: line,
                commentIds: commentIds,
                lineHash: this.hashString(lineText).substring(0, 16),
                lineText: lineText,
                prevLineText: prevLineText,
                nextLineText: nextLineText,
                lastVerified: new Date().toISOString()
            });
        }
        // Update comments with ghost marker references
        for (const comment of data.comments) {
            const markerId = lineToMarkerMap.get(comment.line);
            if (markerId) {
                comment.ghostMarkerId = markerId;
            }
        }
        return {
            ...data,
            version: '2.0',
            ghostMarkers: ghostMarkers
        };
    }
    /**
     * Migrate v2.0 → v2.0.5 (add AST anchors)
     */
    async migrateV20ToV205(data, sourceUri) {
        if (!data.ghostMarkers || data.ghostMarkers.length === 0) {
            // No ghost markers to migrate
            return {
                ...data,
                version: '2.0.5'
            };
        }
        // Open the source document
        const document = await vscode.workspace.openTextDocument(sourceUri);
        // Check if AST is supported for this file
        if (!this.astManager.isSupported(document)) {
            console.log('[Migration] AST not supported for this file type, using line-based fallback');
            return {
                ...data,
                version: '2.0.5'
            };
        }
        // Add AST anchors to each ghost marker
        for (const marker of data.ghostMarkers) {
            try {
                const astAnchor = await this.astManager.createAnchor(document, marker.line);
                marker.astAnchor = astAnchor; // May be null for non-symbolic lines
                if (astAnchor) {
                    console.log(`[Migration] Added AST anchor to marker at line ${marker.line}: ${astAnchor.symbolPath.join('.')}`);
                }
                else {
                    console.log(`[Migration] No symbol found at line ${marker.line}, using line-based fallback`);
                }
            }
            catch (error) {
                console.error(`[Migration] Failed to create AST anchor for marker at line ${marker.line}:`, error);
                marker.astAnchor = null; // Fallback to line-based
            }
        }
        return {
            ...data,
            version: '2.0.5'
        };
    }
    /**
     * Simple hash function for line content
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
    /**
     * Validate comment file schema
     * Supports v1.0 (basic), v2.0 (ghost markers), and v2.0.5 (AST anchors)
     */
    validateCommentFile(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        const obj = data;
        // Check required fields
        if (typeof obj['file'] !== 'string')
            return false;
        if (typeof obj['version'] !== 'string')
            return false;
        if (!Array.isArray(obj['comments']))
            return false;
        // Validate ghost markers (optional, only in v2.0+)
        if (obj['ghostMarkers'] !== undefined) {
            if (!Array.isArray(obj['ghostMarkers']))
                return false;
            for (const marker of obj['ghostMarkers']) {
                if (!marker || typeof marker !== 'object')
                    return false;
                const m = marker;
                if (typeof m['id'] !== 'string')
                    return false;
                if (typeof m['line'] !== 'number')
                    return false;
                if (!Array.isArray(m['commentIds']))
                    return false;
                if (typeof m['lineHash'] !== 'string')
                    return false;
                if (typeof m['lineText'] !== 'string')
                    return false;
                if (typeof m['prevLineText'] !== 'string')
                    return false;
                if (typeof m['nextLineText'] !== 'string')
                    return false;
                if (typeof m['lastVerified'] !== 'string')
                    return false;
                // Validate astAnchor (optional, only in v2.0.5+)
                if (m['astAnchor'] !== undefined && m['astAnchor'] !== null) {
                    const anchor = m['astAnchor'];
                    if (!Array.isArray(anchor['symbolPath']))
                        return false;
                    if (typeof anchor['symbolKind'] !== 'string')
                        return false;
                    if (anchor['containerName'] !== null && typeof anchor['containerName'] !== 'string')
                        return false;
                    if (typeof anchor['offset'] !== 'number')
                        return false;
                }
            }
        }
        // Validate each comment
        for (const comment of obj['comments']) {
            if (!comment || typeof comment !== 'object')
                return false;
            const c = comment;
            if (typeof c['id'] !== 'string')
                return false;
            if (typeof c['line'] !== 'number')
                return false;
            if (typeof c['text'] !== 'string')
                return false;
            if (typeof c['author'] !== 'string')
                return false;
            if (typeof c['created'] !== 'string')
                return false;
            if (typeof c['updated'] !== 'string')
                return false;
            // ghostMarkerId is optional (only in v2.0+)
        }
        return true;
    }
}
exports.FileSystemManager = FileSystemManager;
//# sourceMappingURL=FileSystemManager.js.map