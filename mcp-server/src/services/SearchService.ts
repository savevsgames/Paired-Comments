/**
 * Search Service
 * Multi-field search with relevance scoring
 */

import { FileSystemManager } from '../core/FileSystemManager.js';
import { SearchCommentParams, SearchResult, SearchFilters } from '../types/comments.js';

export class SearchService {
  constructor(private fileSystem: FileSystemManager) {}

  /**
   * Search comments across workspace
   */
  async search(params: SearchCommentParams): Promise<SearchResult[]> {
    const { query, filters, limit = 100 } = params;

    // Get all comment files
    const allFiles = await this.fileSystem.getAllCommentFiles();

    // Flatten all comments with file path
    const allResults: SearchResult[] = [];

    for (const file of allFiles) {
      for (let i = 0; i < file.comments.length; i++) {
        const comment = file.comments[i];
        const ghostMarker = file.ghostMarkers.find(gm => gm.commentId === comment.id);

        if (!ghostMarker) continue;

        // Apply filters
        if (!this.matchesFilters(comment, file.filePath, filters)) {
          continue;
        }

        // Calculate relevance score
        const score = this.calculateScore(comment, query);

        if (score > 0) {
          allResults.push({
            comment,
            ghostMarker,
            filePath: file.filePath,
            score
          });
        }
      }
    }

    // Sort by score (highest first)
    allResults.sort((a, b) => b.score - a.score);

    // Return top N results
    return allResults.slice(0, Math.min(limit, 1000));
  }

  /**
   * Check if comment matches filters
   */
  private matchesFilters(
    comment: any,
    filePath: string,
    filters?: SearchFilters
  ): boolean {
    if (!filters) return true;

    // Tag filter
    if (filters.tag && comment.tag !== filters.tag) {
      return false;
    }

    // Author filter
    if (filters.author && comment.author !== filters.author) {
      return false;
    }

    // File path filter (supports glob patterns)
    if (filters.filePath) {
      const pattern = filters.filePath.replace(/\*/g, '.*');
      const regex = new RegExp(pattern);
      if (!regex.test(filePath)) {
        return false;
      }
    }

    // AI metadata filter
    if (filters.hasAIMetadata !== undefined) {
      const hasAI = !!comment.aiMeta;
      if (hasAI !== filters.hasAIMetadata) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const created = new Date(comment.created);
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);

      if (created < start || created > end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate relevance score for comment
   * Uses simple TF-IDF-like scoring
   */
  private calculateScore(comment: any, query: string): number {
    const queryLower = query.toLowerCase();
    const textLower = comment.text.toLowerCase();

    // Exact match gets highest score
    if (textLower === queryLower) {
      return 1.0;
    }

    // Check for regex match (if query looks like regex)
    try {
      if (query.includes('|') || query.includes('[') || query.includes('(')) {
        const regex = new RegExp(query, 'i');
        if (regex.test(comment.text)) {
          return 0.9;
        }
      }
    } catch {
      // Not a valid regex, continue with text search
    }

    // Contains full query
    if (textLower.includes(queryLower)) {
      return 0.8;
    }

    // Word-based matching
    const queryWords = queryLower.split(/\s+/);
    const textWords = textLower.split(/\s+/);

    let matchedWords = 0;
    for (const queryWord of queryWords) {
      if (textWords.some((tw: string) => tw.includes(queryWord))) {
        matchedWords++;
      }
    }

    if (matchedWords === 0) {
      return 0;
    }

    // Partial word match score
    const wordScore = matchedWords / queryWords.length;

    // Boost score if tag matches query
    if (comment.tag.toLowerCase().includes(queryLower)) {
      return Math.min(wordScore + 0.3, 0.95);
    }

    // Boost score if author matches query
    if (comment.author.toLowerCase().includes(queryLower)) {
      return Math.min(wordScore + 0.2, 0.9);
    }

    return wordScore * 0.7; // Base score for partial matches
  }

  /**
   * Get statistics about comments
   */
  async getStatistics(): Promise<{
    totalComments: number;
    byTag: Record<string, number>;
    byAuthor: Record<string, number>;
    withAI: number;
    orphaned: number;
  }> {
    const allFiles = await this.fileSystem.getAllCommentFiles();

    const stats = {
      totalComments: 0,
      byTag: {} as Record<string, number>,
      byAuthor: {} as Record<string, number>,
      withAI: 0,
      orphaned: 0
    };

    for (const file of allFiles) {
      stats.totalComments += file.comments.length;

      for (const comment of file.comments) {
        // Count by tag
        stats.byTag[comment.tag] = (stats.byTag[comment.tag] || 0) + 1;

        // Count by author
        stats.byAuthor[comment.author] = (stats.byAuthor[comment.author] || 0) + 1;

        // Count AI-enriched
        if (comment.aiMeta) {
          stats.withAI++;
        }
      }

      // Count orphaned
      for (const marker of file.ghostMarkers) {
        if (marker.isOrphaned) {
          stats.orphaned++;
        }
      }
    }

    return stats;
  }
}
