'use client';

import { FileNode } from '@/lib/types';

interface EditorPaneProps {
  file: FileNode | null;
}

export default function EditorPane({ file }: EditorPaneProps) {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-github-canvas-default">
        <div className="text-center">
          <p className="text-lg text-github-fg-muted mb-2">No file selected</p>
          <p className="text-sm text-github-fg-subtle">
            Select a file from the sidebar to view its contents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-github-canvas-default overflow-auto">
      <pre className="p-4 text-sm font-mono text-github-fg-default">
        <code>{file.content || '// File content will be loaded here...'}</code>
      </pre>
    </div>
  );
}
