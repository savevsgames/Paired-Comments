/**
 * MCP Tools Implementation
 * Handlers for all MCP tool calls
 */

import { z } from 'zod';
import { CommentService } from '../services/CommentService.js';
import { SearchService } from '../services/SearchService.js';
import { ExportService } from '../services/ExportService.js';
import { ToolResponse } from '../types/mcp.js';

// Validation schemas
const AddCommentSchema = z.object({
  filePath: z.string().min(1).max(500),
  line: z.number().int().positive(),
  text: z.string().min(1).max(10000),
  tag: z.enum(['TODO', 'FIXME', 'NOTE', 'STAR', 'QUESTION']),
  author: z.string().min(1).max(100).optional(),
  aiMeta: z.object({
    model: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
    enrichedAt: z.string()
  }).optional()
});

const EditCommentSchema = z.object({
  filePath: z.string().min(1),
  commentId: z.string().regex(/^c_\d+$/),
  text: z.string().min(1).max(10000)
});

const DeleteCommentSchema = z.object({
  filePath: z.string().min(1),
  commentId: z.string().regex(/^c_\d+$/)
});

const SearchCommentsSchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    tag: z.enum(['TODO', 'FIXME', 'NOTE', 'STAR', 'QUESTION']).optional(),
    author: z.string().optional(),
    filePath: z.string().optional(),
    hasAIMetadata: z.boolean().optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional()
  }).optional(),
  limit: z.number().int().positive().max(1000).optional()
});

const GetFileCommentsSchema = z.object({
  filePath: z.string().min(1),
  includeOrphaned: z.boolean().optional()
});

const MoveCommentSchema = z.object({
  sourceFile: z.string().min(1),
  targetFile: z.string().min(1),
  commentId: z.string().regex(/^c_\d+$/),
  targetLine: z.number().int().positive()
});

const ExportCommentsSchema = z.object({
  format: z.enum(['json', 'markdown', 'jsonl']),
  filePath: z.string().optional(),
  options: z.object({
    includeSourceContext: z.boolean().optional(),
    contextLines: z.number().int().min(0).max(20).optional()
  }).optional()
});

export class ToolsHandler {
  constructor(
    private commentService: CommentService,
    private searchService: SearchService,
    private exportService: ExportService
  ) {}

  /**
   * Handle add_comment tool
   */
  async handleAddComment(args: unknown): Promise<ToolResponse> {
    const params = AddCommentSchema.parse(args);

    // Ensure enrichedAt is set if aiMeta is provided
    const enrichedParams = {
      ...params,
      aiMeta: params.aiMeta ? {
        ...params.aiMeta,
        enrichedAt: params.aiMeta.enrichedAt || new Date().toISOString()
      } : undefined
    };

    const result = await this.commentService.addComment(enrichedParams);

    return {
      content: [{
        type: 'text',
        text: `✅ Comment added successfully\n\nComment ID: ${result.commentId}\nGhost Marker ID: ${result.ghostMarkerId}\nFile: ${params.filePath}:${params.line}\nTag: ${params.tag}\n\n${result.message}`
      }]
    };
  }

  /**
   * Handle edit_comment tool
   */
  async handleEditComment(args: unknown): Promise<ToolResponse> {
    const params = EditCommentSchema.parse(args);
    await this.commentService.editComment(params);

    return {
      content: [{
        type: 'text',
        text: `✅ Comment edited successfully\n\nComment ID: ${params.commentId}\nFile: ${params.filePath}\nUpdated: ${new Date().toISOString()}`
      }]
    };
  }

  /**
   * Handle delete_comment tool
   */
  async handleDeleteComment(args: unknown): Promise<ToolResponse> {
    const params = DeleteCommentSchema.parse(args);
    await this.commentService.deleteComment(params);

    return {
      content: [{
        type: 'text',
        text: `✅ Comment deleted\n\nComment ID: ${params.commentId}\nFile: ${params.filePath}`
      }]
    };
  }

  /**
   * Handle search_comments tool
   */
  async handleSearchComments(args: unknown): Promise<ToolResponse> {
    const params = SearchCommentsSchema.parse(args);
    const results = await this.searchService.search(params);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No comments found matching query: "${params.query}"`
        }],
        _meta: {
          totalResults: 0,
          query: params.query
        }
      };
    }

    let text = `Found ${results.length} matching comment${results.length > 1 ? 's' : ''}:\n\n`;

    results.forEach((result, index) => {
      const { comment, ghostMarker, filePath, score } = result;
      const anchorInfo = ghostMarker.anchor ? ` (${ghostMarker.anchorType}: ${ghostMarker.anchor})` : '';

      text += `${index + 1}. 📝 ${filePath}:${ghostMarker.line}${anchorInfo} (${comment.tag})\n`;
      text += `   "${comment.text}"\n`;
      text += `   Author: ${comment.author} | Created: ${comment.created}\n`;

      if (comment.aiMeta) {
        text += `   AI: ${comment.aiMeta.model} (confidence: ${comment.aiMeta.confidence})\n`;
      }

      text += `   Score: ${score.toFixed(2)}\n\n`;
    });

    return {
      content: [{
        type: 'text',
        text
      }],
      _meta: {
        totalResults: results.length,
        query: params.query,
        filters: params.filters
      }
    };
  }

  /**
   * Handle get_file_comments tool
   */
  async handleGetFileComments(args: unknown): Promise<ToolResponse> {
    const params = GetFileCommentsSchema.parse(args);
    const commentFile = await this.commentService.getFileComments(
      params.filePath,
      params.includeOrphaned ?? true
    );

    // Count by tag
    const byTag: Record<string, number> = {};
    for (const comment of commentFile.comments) {
      byTag[comment.tag] = (byTag[comment.tag] || 0) + 1;
    }

    const orphanedCount = commentFile.ghostMarkers.filter(gm => gm.isOrphaned).length;

    let text = `Comments for ${commentFile.filePath}\n\n`;
    text += `📊 Summary:\n`;
    text += `- Total comments: ${commentFile.comments.length}\n`;

    for (const [tag, count] of Object.entries(byTag)) {
      text += `- ${tag}: ${count}\n`;
    }

    if (orphanedCount > 0) {
      text += `- Orphaned: ${orphanedCount}\n`;
    }

    text += `\n---\n\n`;

    commentFile.comments.forEach((comment, index) => {
      const marker = commentFile.ghostMarkers.find(gm => gm.commentId === comment.id);
      const line = marker?.line || '?';
      const anchor = marker?.anchor ? ` (${marker.anchorType}: ${marker.anchor})` : '';
      const orphaned = marker?.isOrphaned ? ' ⚠️ ORPHANED' : '';

      text += `${index + 1}. ${comment.tag} (Line ${line}${orphaned}) - ${comment.id}\n`;
      text += `   "${comment.text}"\n`;
      text += `   Author: ${comment.author}${anchor}\n\n`;
    });

    return {
      content: [{
        type: 'text',
        text
      }],
      _meta: {
        filePath: commentFile.filePath,
        commentCount: commentFile.comments.length,
        orphanedCount
      }
    };
  }

  /**
   * Handle move_comment tool
   */
  async handleMoveComment(args: unknown): Promise<ToolResponse> {
    const params = MoveCommentSchema.parse(args);
    await this.commentService.moveComment(params);

    return {
      content: [{
        type: 'text',
        text: `✅ Comment moved successfully\n\nFrom: ${params.sourceFile}\nTo: ${params.targetFile}:${params.targetLine}\n\nComment ID: ${params.commentId}`
      }]
    };
  }

  /**
   * Handle export_comments tool
   */
  async handleExportComments(args: unknown): Promise<ToolResponse> {
    const params = ExportCommentsSchema.parse(args);
    const exported = await this.exportService.export(params);

    const mimeTypes: Record<string, string> = {
      json: 'application/json',
      markdown: 'text/markdown',
      jsonl: 'application/x-ndjson'
    };

    return {
      content: [{
        type: 'resource',
        resource: {
          uri: `export://comments.${params.format}`,
          mimeType: mimeTypes[params.format],
          text: exported
        }
      }],
      _meta: {
        format: params.format,
        sizeBytes: Buffer.byteLength(exported, 'utf-8')
      }
    };
  }
}
