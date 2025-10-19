'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { FileNode } from '@/lib/types';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@/components/Monaco/MonacoEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-github-canvas-default">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-github-accent-fg mx-auto mb-4"></div>
          <p className="text-sm text-github-fg-muted">Loading editor...</p>
        </div>
      </div>
    ),
  }
);

interface EditorPaneProps {
  file: FileNode | null;
  onChange?: (content: string) => void;
}

export default function EditorPane({ file, onChange }: EditorPaneProps) {
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-github-canvas-default">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-lg text-github-fg-muted mb-2">No file selected</p>
          <p className="text-sm text-github-fg-subtle">
            Select a file from the sidebar to view its contents
          </p>
        </div>
      </div>
    );
  }

  const getLanguage = (lang: string | undefined): string => {
    if (!lang) return 'plaintext';

    const languageMap: Record<string, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      go: 'go',
      rust: 'rust',
      java: 'java',
      csharp: 'csharp',
      sql: 'sql',
      json: 'json',
      html: 'html',
      css: 'css',
      markdown: 'markdown',
    };

    return languageMap[lang.toLowerCase()] || 'plaintext';
  };

  const handleChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="h-full bg-github-canvas-default">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center">
            <p className="text-github-fg-muted">Loading editor...</p>
          </div>
        }
      >
        <MonacoEditor
          value={file.content || '// File content loading...'}
          language={getLanguage(file.language)}
          onChange={handleChange}
          readOnly={false}
          filePath={file.path}
        />
      </Suspense>
    </div>
  );
}
