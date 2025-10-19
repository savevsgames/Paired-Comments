/**
 * Type definitions for Demo Playground
 */

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  language?: string;
  children?: FileNode[];
  content?: string;
  hasComments?: boolean;
}

export interface ExampleFile {
  path: string;
  language: string;
  content: string;
  commentsContent?: string;
}

export interface AppState {
  currentFile: FileNode | null;
  files: FileNode[];
  showComments: boolean;
  sidebarWidth: number;
}

// Re-export mockFiles for filesystem preload
export { mockFiles } from './mockData';
