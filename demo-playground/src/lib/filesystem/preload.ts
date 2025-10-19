'use client';

import { fileSystem } from './indexeddb';
import { mockFiles, FileNode } from '../types';

/**
 * Preload example files into IndexedDB from mockData
 */
export async function preloadExampleFiles(): Promise<void> {
  console.log('[Filesystem] Preloading example files...');

  // Check if files are already loaded
  const existingFiles = await fileSystem.listFiles();
  if (existingFiles.length > 0) {
    console.log('[Filesystem] Files already loaded, skipping preload');
    return;
  }

  // Recursively load files from mockFiles
  const loadNode = async (node: FileNode): Promise<void> => {
    if (node.type === 'file' && node.content) {
      await fileSystem.writeFile(node.path, node.content, node.language);
      console.log(`[Filesystem] Loaded: ${node.path}`);
    } else if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        await loadNode(child);
      }
    }
  };

  for (const rootNode of mockFiles) {
    await loadNode(rootNode);
  }

  console.log('[Filesystem] Preload complete');
}

/**
 * Reset filesystem to original example files
 */
export async function resetToExamples(): Promise<void> {
  console.log('[Filesystem] Resetting to original examples...');

  await fileSystem.clear();
  await preloadExampleFiles();

  console.log('[Filesystem] Reset complete');
}

/**
 * Export all files as JSON (for download/share)
 */
export async function exportFiles(): Promise<{
  files: Array<{
    path: string;
    content: string;
    language?: string;
  }>;
  exportedAt: string;
}> {
  const allFiles = await fileSystem.getAllFiles();

  return {
    files: allFiles.map(({ path, content, language }) => ({
      path,
      content,
      language,
    })),
    exportedAt: new Date().toISOString(),
  };
}
