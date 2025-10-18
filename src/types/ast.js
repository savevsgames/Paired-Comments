"use strict";
/**
 * AST-based anchoring types for semantic code tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AST_SUPPORTED_LANGUAGES = void 0;
exports.isASTSupported = isASTSupported;
/**
 * Supported file types for AST anchoring
 */
exports.AST_SUPPORTED_LANGUAGES = [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact'
];
/**
 * Helper to check if a language is supported for AST anchoring
 */
function isASTSupported(languageId) {
    return exports.AST_SUPPORTED_LANGUAGES.includes(languageId);
}
//# sourceMappingURL=ast.js.map