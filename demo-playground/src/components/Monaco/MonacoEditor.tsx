'use client';

import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { createExtension, type PairedCommentsExtension } from '@/lib/extension/browser-extension';

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  fileName?: string;
}

export default function MonacoEditor({
  value,
  language,
  onChange,
  readOnly = false,
  fileName,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const extensionRef = useRef<PairedCommentsExtension | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Initialize Paired Comments extension
    extensionRef.current = createExtension();
    extensionRef.current.initialize(editor);

    console.log('[MonacoEditor] Paired Comments extension initialized');

    // Focus editor
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value);
    }
  };

  // Load comments when file changes
  useEffect(() => {
    if (!extensionRef.current || !fileName) {
      return;
    }

    // Try to load .comments file for this source file
    const loadComments = async () => {
      try {
        const response = await fetch(`/examples/${fileName}.comments`);
        if (response.ok) {
          const commentFile = await response.json();
          extensionRef.current?.loadComments(commentFile);
          console.log(`[MonacoEditor] Loaded comments for ${fileName}`);
        }
      } catch (error) {
        // No comments file - that's okay, not all files have comments
        console.log(`[MonacoEditor] No comments file for ${fileName}`);
      }
    };

    loadComments();
  }, [fileName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (extensionRef.current) {
        extensionRef.current.dispose();
        console.log('[MonacoEditor] Extension disposed');
      }
    };
  }, []);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        folding: true,
        glyphMargin: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 4,
        renderLineHighlight: 'all',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        overviewRulerBorder: false,
        overviewRulerLanes: 3,
        hideCursorInOverviewRuler: true,
        // GitHub-like styling
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
        fontLigatures: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        contextmenu: true,
        mouseWheelZoom: true,
      }}
    />
  );
}
