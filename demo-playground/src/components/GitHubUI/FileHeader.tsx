'use client';

import { FileNode } from '@/lib/types';

interface FileHeaderProps {
  file: FileNode | null;
}

export default function FileHeader({ file }: FileHeaderProps) {
  if (!file) {
    return (
      <div className="h-12 border-b border-github-border-default bg-github-canvas-subtle flex items-center px-4">
        <span className="text-sm text-github-fg-muted">No file selected</span>
      </div>
    );
  }

  return (
    <div className="h-12 border-b border-github-border-default bg-github-canvas-subtle flex items-center px-4 gap-3">
      <span className="text-sm font-semibold text-github-fg-default">
        {file.name}
      </span>
      {file.language && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-github-accent-emphasis text-white">
          {file.language.toUpperCase()}
        </span>
      )}
      {file.hasComments && (
        <span className="text-xs text-github-fg-muted flex items-center gap-1">
          💬 Has paired comments
        </span>
      )}
      <div className="ml-auto flex items-center gap-2 text-xs text-github-fg-subtle">
        <span>Lines: {file.content?.split('\n').length || 0}</span>
      </div>
    </div>
  );
}
