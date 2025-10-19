'use client';

import { useState } from 'react';
import { FileNode } from '@/lib/types';

interface FileTreeProps {
  files: FileNode[];
  currentFile: FileNode | null;
  onFileSelect: (file: FileNode) => void;
}

export default function FileTree({ files, currentFile, onFileSelect }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (nodeId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpanded(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expanded.has(node.id);
    const isSelected = currentFile?.id === node.id;
    const isFolder = node.type === 'folder';

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1 cursor-pointer
            hover:bg-github-canvas-subtle
            ${isSelected ? 'bg-github-canvas-subtle' : ''}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
            } else {
              onFileSelect(node);
            }
          }}
        >
          {isFolder ? (
            <span className="text-github-fg-muted">
              {isExpanded ? '📂' : '📁'}
            </span>
          ) : (
            <span className="text-github-fg-muted">
              {getFileIcon(node.language || '')}
            </span>
          )}
          <span
            className={`
              text-sm
              ${isSelected ? 'text-github-fg-default font-semibold' : 'text-github-fg-default'}
            `}
          >
            {node.name}
          </span>
          {node.hasComments && (
            <span className="ml-auto text-xs text-github-accent-fg">💬</span>
          )}
        </div>
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full border-r border-github-border-default bg-github-canvas-default overflow-y-auto">
      <div className="p-3 border-b border-github-border-default">
        <h2 className="text-sm font-semibold text-github-fg-default">Files</h2>
      </div>
      <div className="py-2">
        {files.map(node => renderNode(node, 0))}
      </div>
    </div>
  );
}

function getFileIcon(language: string): string {
  const icons: Record<string, string> = {
    javascript: '🟨',
    typescript: '🔷',
    python: '🐍',
    go: '🔵',
    rust: '🦀',
    java: '☕',
    csharp: '#️⃣',
    sql: '🗄️',
    json: '📄',
  };
  return icons[language.toLowerCase()] || '📄';
}
