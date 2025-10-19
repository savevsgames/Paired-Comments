/**
 * Comment Search Engine
 *
 * Provides advanced search and filtering capabilities for comments across the workspace.
 * Supports multi-field search with field:value syntax (e.g., "tag:TODO author:john").
 *
 * NOT YET INTEGRATED - Implementation ready for testing and integration
 */

import * as vscode from 'vscode';
import { Comment, CommentTag, CommentStatus } from '../types';
import { FileSystemManager } from '../io/FileSystemManager';
import { logger } from '../utils/Logger';

export interface SearchQuery {
  text?: string;              // Free text search in comment body
  author?: string;            // Exact or partial match on author
  tags?: CommentTag[];        // Array of tags to match
  symbol?: string;            // Symbol name (partial match)
  status?: CommentStatus[];   // Array of statuses
  createdAfter?: Date;        // Created after this date
  createdBefore?: Date;       // Created before this date
  updatedAfter?: Date;        // Updated after this date
  updatedBefore?: Date;       // Updated before this date
  hasAIMetadata?: boolean;    // Has any AI metadata
  hasComplexity?: boolean;    // Has complexity score
  hasTokens?: boolean;        // Has token estimate
  hasParameters?: boolean;    // Has parameter extraction
  isOrphaned?: boolean;       // Is orphaned (requires orphan detection)
  isRange?: boolean;          // Is a range comment
}

export interface SearchResult {
  comment: Comment;
  sourceFile: string;         // Relative path to source file
  matchScore: number;         // Relevance score (0-100)
  matchedFields: string[];    // Which fields matched (for highlighting)
  context?: string;           // Snippet with highlighted match
}

export interface SearchStats {
  totalComments: number;      // Total comments searched
  resultsCount: number;       // Number of results
  filesSearched: number;      // Number of files searched
  searchTimeMs: number;       // Time taken to search
}

/**
 * Predefined quick filters for common searches
 */
export const QUICK_FILTERS: Record<string, Partial<SearchQuery>> = {
  todos: { tags: ['TODO'], status: ['open'] },
  fixmes: { tags: ['FIXME'], status: ['open'] },
  notes: { tags: ['NOTE'] },
  questions: { tags: ['QUESTION'], status: ['open'] },
  stars: { tags: ['STAR'] },
  myComments: { author: '{current_user}' },  // Replaced at runtime
  orphaned: { isOrphaned: true },
  aiEnriched: { hasAIMetadata: true },
  recent: { createdAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },  // Last 7 days
  rangeComments: { isRange: true },
};

export class CommentSearchEngine {
  private fileSystemManager: FileSystemManager;

  constructor(fileSystemManager: FileSystemManager) {
    this.fileSystemManager = fileSystemManager;
  }

  /**
   * Parse search string into structured SearchQuery
   *
   * Examples:
   *   "refactoring" → { text: "refactoring" }
   *   "tag:TODO author:john" → { tags: ["TODO"], author: "john" }
   *   "refactoring tag:TODO created:>2025-10-01" → { text: "refactoring", tags: ["TODO"], createdAfter: Date }
   */
  parseSearchString(searchString: string): SearchQuery {
    const query: SearchQuery = {};
    const tokens = searchString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const textParts: string[] = [];

    for (const token of tokens) {
      // Check for field:value syntax
      const fieldMatch = token.match(/^(\w+):(.+)$/);

      if (fieldMatch) {
        const field = fieldMatch[1];
        const value = fieldMatch[2];
        if (!field || !value) continue; // Skip invalid matches

        const cleanValue = value.replace(/^"(.*)"$/, '$1'); // Remove quotes

        switch (field.toLowerCase()) {
          case 'tag':
            if (!query.tags) query.tags = [];
            query.tags.push(cleanValue.toUpperCase() as CommentTag);
            break;

          case 'author':
            query.author = cleanValue;
            break;

          case 'symbol':
            query.symbol = cleanValue;
            break;

          case 'status':
            if (!query.status) query.status = [];
            query.status.push(cleanValue as CommentStatus);
            break;

          case 'created':
            this.parseDateFilter(cleanValue, query, 'created');
            break;

          case 'updated':
            this.parseDateFilter(cleanValue, query, 'updated');
            break;

          case 'has':
            switch (cleanValue.toLowerCase()) {
              case 'complexity':
                query.hasComplexity = true;
                break;
              case 'tokens':
                query.hasTokens = true;
                break;
              case 'parameters':
              case 'params':
                query.hasParameters = true;
                break;
              case 'ai':
              case 'metadata':
                query.hasAIMetadata = true;
                break;
            }
            break;

          case 'is':
            switch (cleanValue.toLowerCase()) {
              case 'orphaned':
                query.isOrphaned = true;
                break;
              case 'range':
                query.isRange = true;
                break;
            }
            break;

          default:
            // Unknown field, treat as text
            textParts.push(token);
        }
      } else {
        // Plain text token
        textParts.push(token.replace(/^"(.*)"$/, '$1'));
      }
    }

    // Combine text parts
    if (textParts.length > 0) {
      query.text = textParts.join(' ');
    }

    return query;
  }

  /**
   * Parse date filter (e.g., ">2025-10-01", "<7d", "2025-10-15")
   */
  private parseDateFilter(value: string, query: SearchQuery, field: 'created' | 'updated'): void {
    const relativeMatch = value.match(/^([><])(\d+)d$/);

    if (relativeMatch) {
      // Relative date (e.g., ">7d" = more than 7 days ago)
      const operator = relativeMatch[1];
      const daysStr = relativeMatch[2];
      if (!daysStr) return; // Skip if no days specified

      const days = parseInt(daysStr, 10);
      const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      if (operator === '>') {
        if (field === 'created') query.createdAfter = date;
        else query.updatedAfter = date;
      } else {
        if (field === 'created') query.createdBefore = date;
        else query.updatedBefore = date;
      }
    } else if (value.startsWith('>')) {
      // After date (e.g., ">2025-10-01")
      const date = new Date(value.substring(1));
      if (!isNaN(date.getTime())) {
        if (field === 'created') query.createdAfter = date;
        else query.updatedAfter = date;
      }
    } else if (value.startsWith('<')) {
      // Before date (e.g., "<2025-10-01")
      const date = new Date(value.substring(1));
      if (!isNaN(date.getTime())) {
        if (field === 'created') query.createdBefore = date;
        else query.updatedBefore = date;
      }
    } else {
      // Exact date (e.g., "2025-10-15")
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Set to start and end of day
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        if (field === 'created') {
          query.createdAfter = startOfDay;
          query.createdBefore = endOfDay;
        } else {
          query.updatedAfter = startOfDay;
          query.updatedBefore = endOfDay;
        }
      }
    }
  }

  /**
   * Search across all comment files in the workspace
   */
  async search(query: SearchQuery): Promise<{ results: SearchResult[], stats: SearchStats }> {
    const startTime = Date.now();
    const results: SearchResult[] = [];
    let totalComments = 0;
    const filesSearched = new Set<string>();

    try {
      // Get all .comments files in workspace
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        logger.warn('[CommentSearchEngine] No workspace folder found');
        return {
          results: [],
          stats: { totalComments: 0, resultsCount: 0, filesSearched: 0, searchTimeMs: 0 }
        };
      }

      // Find all .comments files
      const commentFiles = await vscode.workspace.findFiles('**/*.comments');
      logger.info(`[CommentSearchEngine] Searching ${commentFiles.length} comment files`);

      // Search each file
      for (const commentFileUri of commentFiles) {
        try {
          const commentFile = await this.fileSystemManager.readCommentFile(commentFileUri);
          if (!commentFile || !commentFile.comments) continue;

          filesSearched.add(commentFile.file);
          totalComments += commentFile.comments.length;

          // Filter comments by query
          for (const comment of commentFile.comments) {
            const matchResult = this.matchComment(comment, commentFile.file, query);
            if (matchResult) {
              results.push(matchResult);
            }
          }
        } catch (error) {
          logger.warn(`[CommentSearchEngine] Error searching file ${commentFileUri.fsPath}:`, error);
        }
      }

      // Sort by relevance (highest score first)
      results.sort((a, b) => b.matchScore - a.matchScore);

      const searchTimeMs = Date.now() - startTime;
      logger.info(`[CommentSearchEngine] Found ${results.length} results in ${searchTimeMs}ms`);

      return {
        results,
        stats: {
          totalComments,
          resultsCount: results.length,
          filesSearched: filesSearched.size,
          searchTimeMs
        }
      };
    } catch (error) {
      logger.error('[CommentSearchEngine] Search failed:', error);
      throw error;
    }
  }

  /**
   * Check if a comment matches the query and calculate relevance score
   */
  private matchComment(comment: Comment, sourceFile: string, query: SearchQuery): SearchResult | null {
    let score = 0;
    const matchedFields: string[] = [];

    // Text search (highest weight)
    if (query.text) {
      const text = query.text.toLowerCase();
      const commentText = comment.text.toLowerCase();

      if (commentText.includes(text)) {
        score += 100;
        matchedFields.push('text');
      } else {
        // No text match - skip this comment
        return null;
      }
    }

    // Tag filter (high weight)
    if (query.tags && query.tags.length > 0) {
      if (!comment.tag || !query.tags.includes(comment.tag)) {
        return null;
      }
      score += 80;
      matchedFields.push('tag');
    }

    // Author filter (medium weight)
    if (query.author) {
      const author = query.author.toLowerCase();
      const commentAuthor = comment.author?.toLowerCase() || '';

      if (!commentAuthor.includes(author)) {
        return null;
      }
      score += 60;
      matchedFields.push('author');
    }

    // Symbol filter (medium weight)
    if (query.symbol) {
      const symbol = query.symbol.toLowerCase();
      const commentSymbol = (comment as any).astAnchor?.symbolPath?.join('.').toLowerCase() || '';

      if (!commentSymbol.includes(symbol)) {
        return null;
      }
      score += 60;
      matchedFields.push('symbol');
    }

    // Status filter
    if (query.status && query.status.length > 0) {
      if (!comment.status || !query.status.includes(comment.status)) {
        return null;
      }
      score += 40;
      matchedFields.push('status');
    }

    // Date filters
    if (query.createdAfter || query.createdBefore) {
      const createdDate = new Date(comment.created);

      if (query.createdAfter && createdDate < query.createdAfter) {
        return null;
      }
      if (query.createdBefore && createdDate > query.createdBefore) {
        return null;
      }
      score += 30;
      matchedFields.push('created');
    }

    if (query.updatedAfter || query.updatedBefore) {
      const updatedDate = comment.updated ? new Date(comment.updated) : new Date(comment.created);

      if (query.updatedAfter && updatedDate < query.updatedAfter) {
        return null;
      }
      if (query.updatedBefore && updatedDate > query.updatedBefore) {
        return null;
      }
      score += 30;
      matchedFields.push('updated');
    }

    // AI metadata filters (using type assertion as these are v2.1+ fields)
    if (query.hasAIMetadata !== undefined) {
      const hasAI = !!((comment as any).aiMeta && Object.keys((comment as any).aiMeta).length > 0);
      if (hasAI !== query.hasAIMetadata) {
        return null;
      }
      score += 50;
      matchedFields.push('aiMetadata');
    }

    if (query.hasComplexity !== undefined) {
      const hasComplexity = !!((comment as any).aiMeta?.complexity !== undefined);
      if (hasComplexity !== query.hasComplexity) {
        return null;
      }
      score += 50;
      matchedFields.push('complexity');
    }

    if (query.hasTokens !== undefined) {
      const hasTokens = !!((comment as any).aiMeta?.tokenEstimate !== undefined);
      if (hasTokens !== query.hasTokens) {
        return null;
      }
      score += 50;
      matchedFields.push('tokens');
    }

    if (query.hasParameters !== undefined) {
      const hasParams = !!((comment as any).params && Object.keys((comment as any).params).length > 0);
      if (hasParams !== query.hasParameters) {
        return null;
      }
      score += 50;
      matchedFields.push('parameters');
    }

    // Range comment filter
    if (query.isRange !== undefined) {
      const isRange = !!(comment.endLine && comment.endLine > comment.line);
      if (isRange !== query.isRange) {
        return null;
      }
      score += 40;
      matchedFields.push('range');
    }

    // Orphaned filter (NOTE: This requires OrphanDetector integration in the future)
    if (query.isOrphaned !== undefined) {
      // TODO: Integrate with OrphanDetector when implemented
      // For now, skip this filter
      logger.debug('[CommentSearchEngine] Orphaned filter not yet implemented');
    }

    // If no fields matched and no filters, this shouldn't happen
    if (score === 0 && Object.keys(query).length > 0) {
      return null;
    }

    // Generate context snippet
    const context = this.generateContext(comment, query);

    return {
      comment,
      sourceFile,
      matchScore: score,
      matchedFields,
      context
    };
  }

  /**
   * Generate a context snippet with highlighted match
   */
  private generateContext(comment: Comment, query: SearchQuery): string {
    const maxLength = 100;
    let text = comment.text;

    // Truncate if too long
    if (text.length > maxLength) {
      if (query.text) {
        // Try to center the match
        const matchIndex = text.toLowerCase().indexOf(query.text.toLowerCase());
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 30);
          const end = Math.min(text.length, matchIndex + query.text.length + 30);
          text = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
        } else {
          text = text.substring(0, maxLength) + '...';
        }
      } else {
        text = text.substring(0, maxLength) + '...';
      }
    }

    return text;
  }

  /**
   * Get a quick filter by name with current user substitution
   */
  getQuickFilter(filterName: string, currentUser?: string): SearchQuery | undefined {
    const filter = QUICK_FILTERS[filterName];
    if (!filter) return undefined;

    const query = { ...filter };

    // Replace {current_user} with actual user
    if (query.author === '{current_user}') {
      query.author = currentUser || 'unknown';
    }

    return query as SearchQuery;
  }
}
