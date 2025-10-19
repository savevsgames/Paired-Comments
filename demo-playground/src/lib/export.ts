/**
 * Export functionality for Paired Comments Demo
 * Exports comment files and source files
 */

import JSZip from 'jszip';

/**
 * Export all comment files as a ZIP archive
 */
export async function exportCommentsAsZip(): Promise<void> {
  try {
    const zip = new JSZip();
    const commentsFolder = zip.folder('paired-comments-export');

    if (!commentsFolder) {
      throw new Error('Failed to create ZIP folder');
    }

    // Fetch all .comments files from examples folder
    const commentFiles = [
      'javascript/react-component.js.comments',
      'javascript/async-patterns.js.comments',
      'javascript/event-emitter.js.comments',
      'javascript/closure-module.js.comments',
      'typescript/generic-repository.ts.comments',
      'typescript/dependency-injection.ts.comments',
      'python/data-pipeline.py.comments',
      'python/async-crawler.py.comments',
      'go/goroutines.go.comments',
      'sql/complex-queries.sql.comments',
    ];

    // Fetch and add each comment file to ZIP
    for (const filePath of commentFiles) {
      try {
        const response = await fetch(`/examples/${filePath}`);
        if (response.ok) {
          const content = await response.text();
          commentsFolder.file(filePath, content);
          console.log(`[Export] Added ${filePath}`);
        } else {
          console.warn(`[Export] Skipping ${filePath} (${response.status})`);
        }
      } catch (error) {
        console.warn(`[Export] Error fetching ${filePath}:`, error);
      }
    }

    // Generate ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paired-comments-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[Export] ZIP download triggered');
  } catch (error) {
    console.error('[Export] Failed to export comments:', error);
    throw error;
  }
}

/**
 * Export comments as JSON (all files combined)
 */
export async function exportCommentsAsJSON(): Promise<void> {
  try {
    const allComments: Record<string, any> = {};

    // Fetch all .comments files
    const commentFiles = [
      'javascript/react-component.js.comments',
      'javascript/async-patterns.js.comments',
      'javascript/event-emitter.js.comments',
      'javascript/closure-module.js.comments',
      'typescript/generic-repository.ts.comments',
      'typescript/dependency-injection.ts.comments',
      'python/data-pipeline.py.comments',
      'python/async-crawler.py.comments',
      'go/goroutines.go.comments',
      'sql/complex-queries.sql.comments',
    ];

    for (const filePath of commentFiles) {
      try {
        const response = await fetch(`/examples/${filePath}`);
        if (response.ok) {
          const commentData = await response.json();
          allComments[filePath] = commentData;
        }
      } catch (error) {
        console.warn(`[Export] Error fetching ${filePath}:`, error);
      }
    }

    // Create download
    const blob = new Blob([JSON.stringify(allComments, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paired-comments-all-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[Export] JSON download triggered');
  } catch (error) {
    console.error('[Export] Failed to export comments as JSON:', error);
    throw error;
  }
}

/**
 * Copy shareable link to clipboard
 */
export async function copyShareLink(): Promise<string> {
  const url = window.location.href;

  try {
    await navigator.clipboard.writeText(url);
    console.log('[Share] URL copied to clipboard:', url);
    return url;
  } catch (error) {
    console.error('[Share] Failed to copy to clipboard:', error);
    throw error;
  }
}

/**
 * Generate markdown documentation from comments
 */
export async function exportAsMarkdown(): Promise<void> {
  try {
    let markdown = '# Paired Comments Export\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += '---\n\n';

    const commentFiles = [
      'javascript/react-component.js.comments',
      'javascript/async-patterns.js.comments',
      'javascript/event-emitter.js.comments',
      'javascript/closure-module.js.comments',
      'typescript/generic-repository.ts.comments',
      'typescript/dependency-injection.ts.comments',
      'python/data-pipeline.py.comments',
      'python/async-crawler.py.comments',
      'go/goroutines.go.comments',
      'sql/complex-queries.sql.comments',
    ];

    for (const filePath of commentFiles) {
      try {
        const response = await fetch(`/examples/${filePath}`);
        if (response.ok) {
          const commentData = await response.json();

          markdown += `## ${commentData.fileName}\n\n`;

          for (const comment of commentData.comments) {
            markdown += `### Line ${comment.line} - ${comment.tag}\n\n`;
            markdown += `**Author:** ${comment.author}  \n`;
            markdown += `**Date:** ${new Date(comment.timestamp).toLocaleDateString()}  \n\n`;
            markdown += `${comment.text}\n\n`;

            if (comment.aiMeta) {
              markdown += `**AI Metadata:**\n`;
              markdown += `- Complexity: ${comment.aiMeta.complexity}\n`;
              if (comment.aiMeta.tokens) {
                markdown += `- Tokens: ${comment.aiMeta.tokens}\n`;
              }
              markdown += '\n';
            }

            markdown += '---\n\n';
          }
        }
      } catch (error) {
        console.warn(`[Export] Error fetching ${filePath}:`, error);
      }
    }

    // Create download
    const blob = new Blob([markdown], {type: 'text/markdown'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paired-comments-docs-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[Export] Markdown download triggered');
  } catch (error) {
    console.error('[Export] Failed to export as markdown:', error);
    throw error;
  }
}
