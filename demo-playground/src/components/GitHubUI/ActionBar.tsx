'use client';

interface ActionBarProps {
  onExport: () => void;
  onShare: () => void;
  onReset: () => void;
  onToggleComments: () => void;
  showComments: boolean;
}

export default function ActionBar({
  onExport,
  onShare,
  onReset,
  onToggleComments,
  showComments,
}: ActionBarProps) {
  return (
    <div className="h-14 border-b border-github-border-default bg-github-canvas-subtle flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-github-fg-default">
          Paired Comments Demo
        </h1>
        <span className="text-xs text-github-fg-muted bg-github-canvas-default px-2 py-1 rounded">
          v2.1.6
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleComments}
          className={`
            px-3 py-1.5 text-sm rounded border
            ${
              showComments
                ? 'bg-github-accent-emphasis text-white border-github-accent-emphasis'
                : 'bg-github-canvas-default text-github-fg-default border-github-border-default hover:bg-github-canvas-subtle'
            }
          `}
        >
          {showComments ? '👁️ Hide' : '👁️ Show'} Comments
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-sm rounded bg-github-canvas-default text-github-fg-default border border-github-border-default hover:bg-github-canvas-subtle"
        >
          📦 Export
        </button>
        <button
          onClick={onShare}
          className="px-3 py-1.5 text-sm rounded bg-github-canvas-default text-github-fg-default border border-github-border-default hover:bg-github-canvas-subtle"
        >
          🔗 Share
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm rounded bg-github-canvas-default text-github-fg-default border border-github-border-default hover:bg-github-canvas-subtle"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}
