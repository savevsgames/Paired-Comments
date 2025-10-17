/**
 * InlineCommentParser - Parses inline comments from source files
 * Supports all comment types: single-line, block, and paired markers
 */

import * as vscode from 'vscode';
import { Comment, detectTag } from '../types';

export interface InlineComment extends Comment {
  source: 'inline' | 'paired-marker';
  originalLine: string;
  commentText: string;
}

export class InlineCommentParser {
  /**
   * Parse all inline comments from a document
   */
  parseDocument(document: vscode.TextDocument): InlineComment[] {
    const comments: InlineComment[] = [];
    const seenLines = new Set<number>(); // Avoid duplicates

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const lineComments = this.parseLine(line, i + 1); // 1-indexed

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
  private parseLine(line: vscode.TextLine, lineNumber: number): InlineComment[] {
    const text = line.text;
    const comments: InlineComment[] = [];

    // Pattern 1: @paired-comment: or @paired: (explicit paired comment)
    const pairedMatch = text.match(/\/\/\s*@paired(?:-comment)?:\s*(.+)$/);
    if (pairedMatch && pairedMatch[1]) {
      comments.push(this.createComment(lineNumber, pairedMatch[1], 'paired-marker', text));
      return comments; // Paired marker takes precedence
    }

    // Pattern 2: Single-line comment //
    const singleLineMatch = text.match(/\/\/\s*(.+)$/);
    if (singleLineMatch && singleLineMatch[1]) {
      const commentText = singleLineMatch[1].trim();
      // Skip certain patterns that are likely not user comments
      if (!this.isLikelyNonComment(commentText)) {
        comments.push(this.createComment(lineNumber, commentText, 'inline', text));
      }
    }

    // Pattern 3: Block comment on same line
    const blockMatch = text.match(/\/\*\s*(.+?)\s*\*\//);
    if (blockMatch && blockMatch[1] && !singleLineMatch) {
      const commentText = blockMatch[1].trim();
      if (!this.isLikelyNonComment(commentText)) {
        comments.push(this.createComment(lineNumber, commentText, 'inline', text));
      }
    }

    return comments;
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
