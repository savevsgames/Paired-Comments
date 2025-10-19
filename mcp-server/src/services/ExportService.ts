/**
 * Export Service
 * Export comments to various formats
 */

import { FileSystemManager } from '../core/FileSystemManager.js';
import { ASTParser } from '../core/ASTParser.js';
import { ExportCommentsParams } from '../types/comments.js';

export class ExportService {
  constructor(
    private fileSystem: FileSystemManager,
    private astParser: ASTParser
  ) {}

  /**
   * Export comments based on format
   */
  async export(params: ExportCommentsParams): Promise<string> {
    switch (params.format) {
      case 'json':
        return this.exportAsJSON(params.filePath);
      case 'markdown':
        return this.exportAsMarkdown(params.filePath);
      case 'jsonl':
        return this.exportAsJSONL(params.options);
      default:
        throw new Error(`Unsupported export format: ${params.format}`);
    }
  }

  /**
   * Export as JSON
   */
  private async exportAsJSON(filePath?: string): Promise<string> {
    if (filePath) {
      const commentFile = await this.fileSystem.readCommentFile(filePath);
      return JSON.stringify(commentFile, null, 2);
    }

    // Export all files
    const allFiles = await this.fileSystem.getAllCommentFiles();
    return JSON.stringify({
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      totalFiles: allFiles.length,
      totalComments: allFiles.reduce((sum, f) => sum + f.comments.length, 0),
      files: allFiles
    }, null, 2);
  }

  /**
   * Export as Markdown documentation
   */
  private async exportAsMarkdown(filePath?: string): Promise<string> {
    const files = filePath
      ? [await this.fileSystem.readCommentFile(filePath)]
      : await this.fileSystem.getAllCommentFiles();

    let markdown = '# Paired Comments Documentation\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += '---\n\n';

    for (const file of files) {
      markdown += `## ${file.filePath}\n\n`;

      // Group by tag
      const byTag: Record<string, typeof file.comments> = {};
      for (const comment of file.comments) {
        if (!byTag[comment.tag]) {
          byTag[comment.tag] = [];
        }
        byTag[comment.tag].push(comment);
      }

      for (const [tag, comments] of Object.entries(byTag)) {
        markdown += `### ${tag} Comments\n\n`;

        for (const comment of comments) {
          const marker = file.ghostMarkers.find(gm => gm.commentId === comment.id);
          const line = marker?.line || 'unknown';
          const anchor = marker?.anchor ? ` (${marker.anchorType}: \`${marker.anchor}\`)` : '';

          markdown += `- **Line ${line}${anchor}**\n`;
          markdown += `  \`\`\`\n`;
          markdown += `  ${comment.text}\n`;
          markdown += `  \`\`\`\n`;
          markdown += `  *Author: ${comment.author} | Created: ${comment.created}*\n\n`;

          if (comment.aiMeta) {
            markdown += `  *AI: ${comment.aiMeta.model} (confidence: ${comment.aiMeta.confidence})*\n\n`;
          }
        }
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Export as JSONL for AI training
   */
  private async exportAsJSONL(options?: {
    includeSourceContext?: boolean;
    contextLines?: number;
  }): Promise<string> {
    const allFiles = await this.fileSystem.getAllCommentFiles();
    const lines: string[] = [];

    for (const file of allFiles) {
      let sourceCode: string | undefined;

      if (options?.includeSourceContext) {
        try {
          sourceCode = await this.fileSystem.readSourceFile(file.filePath);
        } catch {
          // Source file not found, skip context
        }
      }

      for (const comment of file.comments) {
        const marker = file.ghostMarkers.find(gm => gm.commentId === comment.id);
        if (!marker) continue;

        let prompt = `Analyze this code`;

        if (marker.anchor) {
          prompt += ` (${marker.anchorType}: ${marker.anchor})`;
        }

        // Include source context if requested
        if (sourceCode && options?.includeSourceContext) {
          const context = await this.astParser.getSourceContext(
            sourceCode,
            marker.line,
            options.contextLines || 3
          );
          prompt += `:\n\`\`\`\n${context}\n\`\`\``;
        } else {
          prompt += ` at line ${marker.line} in ${file.filePath}`;
        }

        const trainingExample = {
          prompt,
          completion: comment.text,
          metadata: {
            tag: comment.tag,
            author: comment.author,
            filePath: file.filePath,
            line: marker.line,
            anchor: marker.anchor,
            aiMeta: comment.aiMeta,
            created: comment.created
          }
        };

        lines.push(JSON.stringify(trainingExample));
      }
    }

    return lines.join('\n');
  }

  /**
   * Get export statistics
   */
  async getExportStats(): Promise<{
    totalFiles: number;
    totalComments: number;
    estimatedSize: {
      json: number;
      markdown: number;
      jsonl: number;
    };
  }> {
    const allFiles = await this.fileSystem.getAllCommentFiles();
    const totalComments = allFiles.reduce((sum, f) => sum + f.comments.length, 0);

    // Estimate sizes (rough approximation)
    const jsonExport = await this.exportAsJSON();
    const markdownExport = await this.exportAsMarkdown();
    const jsonlExport = await this.exportAsJSONL();

    return {
      totalFiles: allFiles.length,
      totalComments,
      estimatedSize: {
        json: Buffer.byteLength(jsonExport, 'utf-8'),
        markdown: Buffer.byteLength(markdownExport, 'utf-8'),
        jsonl: Buffer.byteLength(jsonlExport, 'utf-8')
      }
    };
  }
}
