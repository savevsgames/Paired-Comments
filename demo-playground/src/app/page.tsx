'use client';

import { useState, useEffect } from 'react';
import FileTree from '@/components/GitHubUI/FileTree';
import FileHeader from '@/components/GitHubUI/FileHeader';
import EditorPane from '@/components/GitHubUI/EditorPane';
import CommentsPane from '@/components/GitHubUI/CommentsPane';
import ActionBar from '@/components/GitHubUI/ActionBar';
import { FileNode } from '@/lib/types';
import { mockFiles } from '@/lib/mockData';
import { preloadExampleFiles, resetToExamples } from '@/lib/filesystem/preload';
import '@/lib/vscode-shim'; // Initialize VS Code API shim

export default function Home() {
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize filesystem on app startup
  useEffect(() => {
    const initFilesystem = async () => {
      try {
        console.log('[App] Initializing filesystem...');
        await preloadExampleFiles();
        setIsInitialized(true);
        console.log('[App] Filesystem initialized');
      } catch (error) {
        console.error('[App] Failed to initialize filesystem:', error);
      }
    };

    initFilesystem();
  }, []);

  const handleFileSelect = (file: FileNode) => {
    setCurrentFile(file);
  };

  const handleExport = () => {
    alert('Export functionality coming in Phase 7!');
  };

  const handleShare = () => {
    alert('Share functionality coming in Phase 7!');
  };

  const handleReset = async () => {
    try {
      await resetToExamples();
      setCurrentFile(null);
      alert('Reset complete! Files restored to original examples.');
    } catch (error) {
      console.error('[App] Reset failed:', error);
      alert('Reset failed. Check console for details.');
    }
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  const handleContentChange = (content: string) => {
    // Update file content when edited
    // Will wire up to IndexedDB in Phase 4
    console.log('Content changed:', content.substring(0, 50) + '...');
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-github-canvas-default">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-github-accent-fg mx-auto mb-4"></div>
          <p className="text-lg text-github-fg-muted mb-2">Initializing Demo Playground...</p>
          <p className="text-sm text-github-fg-subtle">Loading example files and VS Code API shim</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-github-canvas-default">
      {/* Action Bar */}
      <ActionBar
        onExport={handleExport}
        onShare={handleShare}
        onReset={handleReset}
        onToggleComments={handleToggleComments}
        showComments={showComments}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 flex-shrink-0">
          <FileTree
            files={mockFiles}
            currentFile={currentFile}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <FileHeader file={currentFile} />
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            <div className="flex-1 overflow-auto">
              <EditorPane file={currentFile} onChange={handleContentChange} />
            </div>

            {/* Comments Pane */}
            {showComments && (
              <CommentsPane file={currentFile} visible={showComments} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
