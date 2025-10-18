"use strict";
/**
 * Content Anchoring - Hash-based line tracking to detect drift
 *
 * When code lines are edited, added, or deleted, comment line numbers
 * can become misaligned. This module provides hash-based anchoring to
 * detect when lines have changed and help reconcile comment positions.
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
exports.hashLine = hashLine;
exports.hashLineRange = hashLineRange;
exports.getLineText = getLineText;
exports.getRangeText = getRangeText;
exports.verifyAnchor = verifyAnchor;
exports.findDriftedLine = findDriftedLine;
exports.updateAnchor = updateAnchor;
exports.batchVerifyAnchors = batchVerifyAnchors;
const crypto = __importStar(require("crypto"));
/**
 * Generate SHA-256 hash of a text line
 */
function hashLine(text) {
    const normalized = text.trim(); // Normalize whitespace
    return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}
/**
 * Generate hash for a range of lines
 */
function hashLineRange(lines) {
    const combined = lines.map(l => l.trim()).join('\n');
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}
/**
 * Extract line text from document
 */
function getLineText(document, lineNumber) {
    if (lineNumber < 1 || lineNumber > document.lineCount) {
        return null;
    }
    return document.lineAt(lineNumber - 1).text; // Convert to 0-indexed
}
/**
 * Extract range text from document
 */
function getRangeText(document, startLine, endLine) {
    if (startLine < 1 || endLine > document.lineCount || startLine > endLine) {
        return null;
    }
    const lines = [];
    for (let i = startLine; i <= endLine; i++) {
        lines.push(document.lineAt(i - 1).text); // Convert to 0-indexed
    }
    return lines;
}
/**
 * Verify comment anchor against document
 */
function verifyAnchor(document, comment) {
    const line = comment.startLine ?? comment.line;
    const endLine = comment.endLine ?? line;
    // Get current text at the anchored line(s)
    if (endLine === line) {
        // Single line
        const currentText = getLineText(document, line);
        if (!currentText) {
            return { matches: false };
        }
        const currentHash = hashLine(currentText);
        // Check if hash matches
        if (comment.lineHash && currentHash === comment.lineHash) {
            return { matches: true, currentHash, currentText };
        }
        // Hash mismatch - check if text still matches (whitespace changes)
        if (comment.lineText && currentText.trim() === comment.lineText.trim()) {
            return { matches: true, currentHash, currentText };
        }
        return { matches: false, currentHash, currentText };
    }
    else {
        // Range of lines
        const currentLines = getRangeText(document, line, endLine);
        if (!currentLines) {
            return { matches: false };
        }
        const currentHash = hashLineRange(currentLines);
        const currentText = currentLines.join('\n');
        if (comment.lineHash && currentHash === comment.lineHash) {
            return { matches: true, currentHash, currentText };
        }
        return { matches: false, currentHash, currentText };
    }
}
/**
 * Search for drifted comment in nearby lines
 */
function findDriftedLine(document, comment, searchRadius = 10) {
    if (!comment.lineHash && !comment.lineText) {
        return null;
    }
    const originalLine = comment.startLine ?? comment.line;
    const startSearch = Math.max(1, originalLine - searchRadius);
    const endSearch = Math.min(document.lineCount, originalLine + searchRadius);
    // Try exact hash match first
    if (comment.lineHash) {
        for (let i = startSearch; i <= endSearch; i++) {
            const lineText = getLineText(document, i);
            if (lineText && hashLine(lineText) === comment.lineHash) {
                return i;
            }
        }
    }
    // Try text match (more lenient)
    if (comment.lineText) {
        for (let i = startSearch; i <= endSearch; i++) {
            const lineText = getLineText(document, i);
            if (lineText && lineText.trim() === comment.lineText.trim()) {
                return i;
            }
        }
    }
    return null;
}
/**
 * Update comment anchor with current document state
 */
function updateAnchor(document, comment) {
    const line = comment.startLine ?? comment.line;
    const endLine = comment.endLine ?? line;
    if (endLine === line) {
        // Single line
        const lineText = getLineText(document, line);
        if (!lineText) {
            return {};
        }
        return {
            lineHash: hashLine(lineText),
            lineText: lineText.trim(),
        };
    }
    else {
        // Range
        const lines = getRangeText(document, line, endLine);
        if (!lines || lines.length === 0) {
            return {};
        }
        return {
            lineHash: hashLineRange(lines),
            lineText: lines[0]?.trim() ?? '', // Store first line for quick reference
        };
    }
}
function batchVerifyAnchors(document, comments) {
    const result = {
        valid: [],
        drifted: [],
        missing: [],
    };
    for (const comment of comments) {
        const verification = verifyAnchor(document, comment);
        if (!verification.currentText) {
            result.missing.push(comment);
        }
        else if (verification.matches) {
            result.valid.push(comment);
        }
        else {
            result.drifted.push(comment);
        }
    }
    return result;
}
//# sourceMappingURL=contentAnchor.js.map