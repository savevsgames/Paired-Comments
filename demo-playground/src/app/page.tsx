'use client';

import { useState } from 'react';
import FileTree from '@/components/GitHubUI/FileTree';
import FileHeader from '@/components/GitHubUI/FileHeader';
import EditorPane from '@/components/GitHubUI/EditorPane';
import CommentsPane from '@/components/GitHubUI/CommentsPane';
import ActionBar from '@/components/GitHubUI/ActionBar';
import { FileNode } from '@/lib/types';
import { mockFiles } from '@/lib/mockData';

export default function Home() {
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [showComments, setShowComments] = useState(true);

  const handleFileSelect = (file: FileNode) => {
    setCurrentFile(file);
  };

  const handleExport = () => {
    alert('Export functionality coming in Phase 7!');
  };

  const handleShare = () => {
    alert('Share functionality coming in Phase 7!');
  };

  const handleReset = () => {
    setCurrentFile(null);
    alert('Reset functionality coming in Phase 7!');
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

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
              <EditorPane file={currentFile} />
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
