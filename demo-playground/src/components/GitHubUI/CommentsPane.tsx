'use client';

import { FileNode } from '@/lib/types';

interface CommentsPaneProps {
  file: FileNode | null;
  visible: boolean;
}

export default function CommentsPane({ file, visible }: CommentsPaneProps) {
  if (!visible) {
    return null;
  }

  if (!file || !file.hasComments) {
    return (
      <div className="w-96 border-l border-github-border-default bg-github-canvas-subtle h-full overflow-auto">
        <div className="p-4 border-b border-github-border-default">
          <h3 className="text-sm font-semibold text-github-fg-default">
            📝 Paired Comments
          </h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-github-fg-muted">No comments for this file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l border-github-border-default bg-github-canvas-subtle h-full overflow-auto">
      <div className="p-4 border-b border-github-border-default">
        <h3 className="text-sm font-semibold text-github-fg-default">
          📝 {file.name}.comments
        </h3>
      </div>
      <div className="p-4">
        <pre className="text-xs font-mono text-github-fg-default whitespace-pre-wrap">
          <code>
            {file.hasComments
              ? '// Comments content will be loaded here...\n// (Phase 3: Monaco Editor Integration)'
              : 'No comments'}
          </code>
        </pre>
      </div>
    </div>
  );
}
