/**
 * InlineCommentParser - Parses inline comments from source files
 * Supports multi-language comment syntax and all comment types
 */

import * as vscode from 'vscode';
import { Comment, detectTag, CommentSyntax, COMMENT_SYNTAX_MAP } from '../types';

export interface InlineComment extends Comment {
  source: 'inline' | 'paired-marker';
  originalLine: string;
  commentText: string;
}

export class InlineCommentParser {
  /**
   * Get comment syntax for a document's language
   */
  private getCommentSyntax(document: vscode.TextDocument): CommentSyntax {
    const languageId = document.languageId;

    // Check if we have a predefined syntax
    if (COMMENT_SYNTAX_MAP[languageId]) {
      return COMMENT_SYNTAX_MAP[languageId];
    }

    // Try to get from VS Code's language configuration
    const config = vscode.workspace.getConfiguration('', document.uri);
    const comments = config.get<{ lineComment?: string; blockComment?: [string, string] }>('comments');

    if (comments?.lineComment || comments?.blockComment) {
      return {
        singleLine: comments.lineComment ? [comments.lineComment] : [],
        block: comments.blockComment,
      };
    }

    // Default to C-style comments if unknown
    return { singleLine: ['//'], block: ['/*', '*/'] };
  }
  /**
   * Parse all inline comments from a document
   */
  parseDocument(document: vscode.TextDocument): InlineComment[] {
    const comments: InlineComment[] = [];
    const seenLines = new Set<number>(); // Avoid duplicates
    const syntax = this.getCommentSyntax(document);

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const lineComments = this.parseLine(line, i + 1, syntax); // 1-indexed

      for (const comment of lineComments) {
        if (!seenLines.has(comment.line)) {
          comments.push(comment);
          seenLines.add(comment.line);
        }
      }
    }

    return comments;
  }

  /**
   * Parse comments from a single line
   */
  private parseLine(line: vscode.TextLine, lineNumber: number, syntax: CommentSyntax): InlineComment[] {
    const text = line.text;
    const comments: InlineComment[] = [];

    // Pattern 1: Check for @paired-comment: marker in any single-line comment syntax
    if (syntax.singleLine) {
      for (const singleLineMarker of syntax.singleLine) {
        const escapedMarker = this.escapeRegex(singleLineMarker);
        const pairedMatch = text.match(new RegExp(`${escapedMarker}\\s*@paired(?:-comment)?:\\s*(.+)$`));
        if (pairedMatch && pairedMatch[1]) {
          comments.push(this.createComment(lineNumber, pairedMatch[1], 'paired-marker', text));
          return comments; // Paired marker takes precedence
        }
      }
    }

    // Pattern 2: Single-line comments
    if (syntax.singleLine) {
      for (const singleLineMarker of syntax.singleLine) {
        const escapedMarker = this.escapeRegex(singleLineMarker);
        const singleLineMatch = text.match(new RegExp(`${escapedMarker}\\s*(.+)$`));
        if (singleLineMatch && singleLineMatch[1]) {
          const commentText = singleLineMatch[1].trim();
          // Skip certain patterns that are likely not user comments
          if (!this.isLikelyNonComment(commentText)) {
            comments.push(this.createComment(lineNumber, commentText, 'inline', text));
            return comments; // Only parse first matching comment syntax
          }
        }
      }
    }

    // Pattern 3: Block comment on same line
    if (syntax.block) {
      const [blockStart, blockEnd] = syntax.block;
      const escapedStart = this.escapeRegex(blockStart);
      const escapedEnd = this.escapeRegex(blockEnd);
      const blockMatch = text.match(new RegExp(`${escapedStart}\\s*(.+?)\\s*${escapedEnd}`));
      if (blockMatch && blockMatch[1]) {
        const commentText = blockMatch[1].trim();
        if (!this.isLikelyNonComment(commentText)) {
          comments.push(this.createComment(lineNumber, commentText, 'inline', text));
        }
      }
    }

    return comments;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Create a comment object
   */
  private createComment(
    line: number,
    text: string,
    source: 'inline' | 'paired-marker',
    originalLine: string
  ): InlineComment {
    const now = new Date().toISOString();
    const tag = detectTag(text);

    return {
      id: this.generateId(),
      line,
      text,
      author: 'Inline Comment',
      created: now,
      updated: now,
      tag,
      source,
      originalLine,
      commentText: text
    };
  }

  /**
   * Check if a comment is likely not a user comment
   * (e.g., code commented out, imports, etc.)
   */
  private isLikelyNonComment(text: string): boolean {
    // Skip if it looks like commented-out code
    const codePatterns = [
      /^import\s+/,           // import statements
      /^export\s+/,           // export statements
      /^const\s+\w+\s*=/,     // variable declarations
      /^let\s+\w+\s*=/,
      /^var\s+\w+\s*=/,
      /^function\s+\w+/,      // function declarations
      /^class\s+\w+/,         // class declarations
      /^if\s*\(/,             // control flow
      /^for\s*\(/,
      /^while\s*\(/,
      /^return\s+/,
      /^\w+\.\w+\(/,          // method calls
      /^<\w+/,                // JSX/HTML tags
      /^\/\//,                // Nested comments
      /^-{3,}/,               // Separators like ----
      /^={3,}/,               // Separators like ====
      /^#{3,}/,               // Separators like ####
    ];

    return codePatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return 'inline-' + Math.random().toString(36).substring(2, 11);
  }

  /**
   * Convert inline comment to migration format
   */
  toMigrationFormat(inlineComment: InlineComment): Comment {
    return {
      id: this.generateId(),
      line: inlineComment.line,
      text: inlineComment.text,
      author: 'Migrated',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tag: inlineComment.tag
    };
  }
}
