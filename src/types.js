"use strict";
/**
 * Core type definitions for the Paired Comments extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMENT_SYNTAX_MAP = exports.TAG_COLORS = exports.ContextKeys = exports.COMMENT_FILE_EXTENSION = exports.COMMENT_FILE_VERSION = exports.PairedCommentsError = exports.ErrorType = void 0;
exports.detectTag = detectTag;
exports.isRangeComment = isRangeComment;
exports.isRangeMarker = isRangeMarker;
exports.getCommentLine = getCommentLine;
exports.getCommentEndLine = getCommentEndLine;
exports.getRangeGutterCode = getRangeGutterCode;
exports.getSingleGutterCode = getSingleGutterCode;
/**
 * Error types that can occur in the extension
 */
var ErrorType;
(function (ErrorType) {
    ErrorType["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorType["FILE_READ_ERROR"] = "FILE_READ_ERROR";
    ErrorType["FILE_WRITE_ERROR"] = "FILE_WRITE_ERROR";
    ErrorType["INVALID_JSON"] = "INVALID_JSON";
    ErrorType["INVALID_SCHEMA"] = "INVALID_SCHEMA";
    ErrorType["COMMENT_NOT_FOUND"] = "COMMENT_NOT_FOUND";
    ErrorType["INVALID_LINE_NUMBER"] = "INVALID_LINE_NUMBER";
    ErrorType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    ErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
/**
 * Custom error class for extension errors
 */
class PairedCommentsError extends Error {
    type;
    cause;
    constructor(type, message, cause) {
        super(message);
        this.type = type;
        this.cause = cause;
        this.name = 'PairedCommentsError';
    }
}
exports.PairedCommentsError = PairedCommentsError;
/**
 * Schema version constant
 */
exports.COMMENT_FILE_VERSION = '2.0.6';
/**
 * File extension for comment files
 */
exports.COMMENT_FILE_EXTENSION = '.comments';
/**
 * Context keys for VS Code when clauses
 */
var ContextKeys;
(function (ContextKeys) {
    ContextKeys["VIEW_OPEN"] = "pairedComments.viewOpen";
    ContextKeys["SYNC_ENABLED"] = "pairedComments.syncEnabled";
    ContextKeys["LINE_HAS_COMMENT"] = "pairedComments.lineHasComment";
})(ContextKeys || (exports.ContextKeys = ContextKeys = {}));
/**
 * Tag colors for decoration
 */
exports.TAG_COLORS = {
    TODO: '#FFA500', // Orange
    FIXME: '#FF4444', // Red
    NOTE: '#4A90E2', // Blue
    QUESTION: '#9B59B6', // Purple
    HACK: '#E67E22', // Dark orange
    WARNING: '#F39C12', // Yellow-orange
    STAR: '#FFD700', // Gold (for bookmarked/significant comments)
};
/**
 * Detect tag from comment text
 */
function detectTag(text) {
    const upperText = text.trim().toUpperCase();
    if (upperText.startsWith('TODO:') || upperText.startsWith('TODO '))
        return 'TODO';
    if (upperText.startsWith('FIXME:') || upperText.startsWith('FIXME '))
        return 'FIXME';
    if (upperText.startsWith('NOTE:') || upperText.startsWith('NOTE '))
        return 'NOTE';
    if (upperText.startsWith('QUESTION:') || upperText.startsWith('QUESTION ') || upperText.startsWith('?'))
        return 'QUESTION';
    if (upperText.startsWith('HACK:') || upperText.startsWith('HACK '))
        return 'HACK';
    if (upperText.startsWith('WARNING:') || upperText.startsWith('WARNING ') || upperText.startsWith('WARN:'))
        return 'WARNING';
    if (upperText.startsWith('STAR:') || upperText.startsWith('STAR ') || upperText.startsWith('⭐'))
        return 'STAR';
    return null;
}
/**
 * Language-specific comment syntax map
 */
exports.COMMENT_SYNTAX_MAP = {
    // C-style languages
    javascript: { singleLine: ['//'], block: ['/*', '*/'] },
    typescript: { singleLine: ['//'], block: ['/*', '*/'] },
    java: { singleLine: ['//'], block: ['/*', '*/'] },
    c: { singleLine: ['//'], block: ['/*', '*/'] },
    cpp: { singleLine: ['//'], block: ['/*', '*/'] },
    csharp: { singleLine: ['//'], block: ['/*', '*/'] },
    go: { singleLine: ['//'], block: ['/*', '*/'] },
    rust: { singleLine: ['//'], block: ['/*', '*/'] },
    swift: { singleLine: ['//'], block: ['/*', '*/'] },
    kotlin: { singleLine: ['//'], block: ['/*', '*/'] },
    // Python-style
    python: { singleLine: ['#'], block: ['"""', '"""'] },
    ruby: { singleLine: ['#'], block: ['=begin', '=end'] },
    perl: { singleLine: ['#'], block: ['=pod', '=cut'] },
    r: { singleLine: ['#'] },
    shell: { singleLine: ['#'] },
    bash: { singleLine: ['#'] },
    powershell: { singleLine: ['#'], block: ['<#', '#>'] },
    yaml: { singleLine: ['#'] },
    // SQL-style
    sql: { singleLine: ['--'], block: ['/*', '*/'] },
    plsql: { singleLine: ['--'], block: ['/*', '*/'] },
    // Lisp-style
    lisp: { singleLine: [';'] },
    clojure: { singleLine: [';'] },
    scheme: { singleLine: [';'] },
    // Markup languages
    html: { block: ['<!--', '-->'] },
    xml: { block: ['<!--', '-->'] },
    // Lua
    lua: { singleLine: ['--'], block: ['--[[', ']]'] },
    // Haskell
    haskell: { singleLine: ['--'], block: ['{-', '-}'] },
    // MATLAB
    matlab: { singleLine: ['%'], block: ['%{', '%}'] },
    // LaTeX
    latex: { singleLine: ['%'] },
    // VB
    vb: { singleLine: ["'"] },
    // Fortran
    fortran: { singleLine: ['!'] },
    // Assembly
    asm: { singleLine: [';'] },
};
/**
 * Check if a comment is a range comment
 */
function isRangeComment(comment) {
    return comment.startLine !== undefined && comment.endLine !== undefined && comment.endLine > comment.startLine;
}
/**
 * Check if a ghost marker is a range marker
 */
function isRangeMarker(marker) {
    return marker.endLine !== undefined && marker.endLine > marker.line;
}
/**
 * Get the effective line number for a comment (handles backwards compatibility)
 */
function getCommentLine(comment) {
    return comment.startLine ?? comment.line;
}
/**
 * Get the effective end line for a comment (undefined = single line)
 */
function getCommentEndLine(comment) {
    return comment.endLine;
}
/**
 * Create two-letter gutter icon code for range markers
 * @param tag - Comment tag (TODO, FIXME, etc.)
 * @param isStart - True for start marker, false for end marker
 * @returns Two-letter code (e.g., "TS" for TODO START, "TE" for TODO END)
 */
function getRangeGutterCode(tag, isStart) {
    if (!tag)
        return isStart ? 'CS' : 'CE'; // Comment Start/End for untagged
    const firstLetter = tag.charAt(0); // T, F, N, Q, H, W, S
    const secondLetter = isStart ? 'S' : 'E'; // Start or End
    return `${firstLetter}${secondLetter}`;
}
/**
 * Get single-letter gutter icon code (for backwards compatibility with single-line comments)
 * @param tag - Comment tag
 * @returns Single-letter code (e.g., "T" for TODO, "F" for FIXME)
 */
function getSingleGutterCode(tag) {
    if (!tag)
        return 'C'; // Comment (untagged)
    return tag.charAt(0); // T, F, N, Q, H, W, S
}
//# sourceMappingURL=types.js.map