/**
 * MCP Resources Implementation
 * Resource providers for read-only access to comment data
 */

import { FileSystemManager } from '../core/FileSystemManager.js';
import { SearchService } from '../services/SearchService.js';
import { ResourceContents } from '../types/mcp.js';

export class ResourcesHandler {
  constructor(
    private fileSystem: FileSystemManager,
    private _searchService: SearchService
  ) {}

  /**
   * List all available resources
   */
  async listResources(): Promise<{ uri: string; name: string; description: string; mimeType: string }[]> {
    return [
      {
        uri: 'comment://workspace/all',
        name: 'All Comments',
        description: 'All comments across the workspace',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/tags/TODO',
        name: 'TODO Comments',
        description: 'All TODO comments',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/tags/FIXME',
        name: 'FIXME Comments',
        description: 'All FIXME comments',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/tags/NOTE',
        name: 'NOTE Comments',
        description: 'All NOTE comments',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/tags/STAR',
        name: 'STAR Comments',
        description: 'All STAR comments',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/tags/QUESTION',
        name: 'QUESTION Comments',
        description: 'All QUESTION comments',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/orphaned',
        name: 'Orphaned Comments',
        description: 'Comments whose anchors no longer exist',
        mimeType: 'application/json'
      },
      {
        uri: 'comment://workspace/ai-enriched',
        name: 'AI-Enriched Comments',
        description: 'Comments with AI metadata',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<ResourceContents> {
    const parsedUri = this.parseURI(uri);

    switch (parsedUri.type) {
      case 'all':
        return this.getAllComments();
      case 'file':
        return this.getFileComments(parsedUri.filePath!);
      case 'tag':
        return this.getCommentsByTag(parsedUri.tag!);
      case 'orphaned':
        return this.getOrphanedComments();
      case 'ai-enriched':
        return this.getAIEnrichedComments();
      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  /**
   * Parse resource URI
   */
  private parseURI(uri: string): {
    type: 'all' | 'file' | 'tag' | 'orphaned' | 'ai-enriched';
    filePath?: string;
    tag?: string;
  } {
    if (uri === 'comment://workspace/all') {
      return { type: 'all' };
    }

    if (uri === 'comment://workspace/orphaned') {
      return { type: 'orphaned' };
    }

    if (uri === 'comment://workspace/ai-enriched') {
      return { type: 'ai-enriched' };
    }

    if (uri.startsWith('comment://workspace/tags/')) {
      const tag = uri.replace('comment://workspace/tags/', '');
      return { type: 'tag', tag };
    }

    if (uri.startsWith('comment://workspace/') && uri.endsWith('.comments')) {
      const filePath = uri
        .replace('comment://workspace/', '')
        .replace('.comments', '');
      return { type: 'file', filePath };
    }

    throw new Error(`Invalid resource URI: ${uri}`);
  }

  /**
   * Get all comments in workspace
   */
  private async getAllComments(): Promise<ResourceContents> {
    const allFiles = await this.fileSystem.getAllCommentFiles();

    const data = {
      files: allFiles,
      totalComments: allFiles.reduce((sum, f) => sum + f.comments.length, 0),
      totalFiles: allFiles.length
    };

    return {
      uri: 'comment://workspace/all',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2)
    };
  }

  /**
   * Get comments for specific file
   */
  private async getFileComments(filePath: string): Promise<ResourceContents> {
    const commentFile = await this.fileSystem.readCommentFile(filePath);

    return {
      uri: `comment://workspace/${filePath}.comments`,
      mimeType: 'application/json',
      text: JSON.stringify(commentFile, null, 2)
    };
  }

  /**
   * Get comments by tag
   */
  private async getCommentsByTag(tag: string): Promise<ResourceContents> {
    const allFiles = await this.fileSystem.getAllCommentFiles();
    const results: Array<{
      filePath: string;
      comment: any;
      ghostMarker: any;
    }> = [];

    for (const file of allFiles) {
      for (const comment of file.comments) {
        if (comment.tag === tag) {
          const ghostMarker = file.ghostMarkers.find(gm => gm.commentId === comment.id);
          if (ghostMarker) {
            results.push({
              filePath: file.filePath,
              comment,
              ghostMarker
            });
          }
        }
      }
    }

    const data = {
      tag,
      comments: results,
      totalCount: results.length
    };

    return {
      uri: `comment://workspace/tags/${tag}`,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2)
    };
  }

  /**
   * Get orphaned comments
   */
  private async getOrphanedComments(): Promise<ResourceContents> {
    const allFiles = await this.fileSystem.getAllCommentFiles();
    const orphaned: Array<{
      filePath: string;
      comment: any;
      ghostMarker: any;
      reason: string;
    }> = [];

    for (const file of allFiles) {
      for (const marker of file.ghostMarkers) {
        if (marker.isOrphaned) {
          const comment = file.comments.find(c => c.id === marker.commentId);
          if (comment) {
            orphaned.push({
              filePath: file.filePath,
              comment,
              ghostMarker: marker,
              reason: marker.anchor
                ? `Anchor '${marker.anchor}' no longer exists`
                : 'Line number out of bounds'
            });
          }
        }
      }
    }

    const data = {
      orphanedComments: orphaned,
      totalCount: orphaned.length
    };

    return {
      uri: 'comment://workspace/orphaned',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2)
    };
  }

  /**
   * Get AI-enriched comments
   */
  private async getAIEnrichedComments(): Promise<ResourceContents> {
    const allFiles = await this.fileSystem.getAllCommentFiles();
    const aiComments: Array<{
      filePath: string;
      comment: any;
      ghostMarker: any;
    }> = [];

    const models = new Set<string>();

    for (const file of allFiles) {
      for (const comment of file.comments) {
        if (comment.aiMeta) {
          const ghostMarker = file.ghostMarkers.find(gm => gm.commentId === comment.id);
          if (ghostMarker) {
            aiComments.push({
              filePath: file.filePath,
              comment,
              ghostMarker
            });
            models.add(comment.aiMeta.model);
          }
        }
      }
    }

    const data = {
      comments: aiComments,
      totalCount: aiComments.length,
      models: Array.from(models)
    };

    return {
      uri: 'comment://workspace/ai-enriched',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2)
    };
  }
}
