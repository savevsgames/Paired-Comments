'use client';

import { useState } from 'react';
import { exportCommentsAsZip, exportCommentsAsJSON, exportAsMarkdown } from '@/lib/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (type: 'zip' | 'json' | 'markdown') => {
    setExporting(true);
    try {
      switch (type) {
        case 'zip':
          await exportCommentsAsZip();
          break;
        case 'json':
          await exportCommentsAsJSON();
          break;
        case 'markdown':
          await exportAsMarkdown();
          break;
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      alert('Export failed. Check console for details.');
      console.error('[ExportModal] Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-github-canvas-default border border-github-border-default rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-github-fg-default">Export Comments</h2>
          <button
            onClick={onClose}
            className="text-github-fg-muted hover:text-github-fg-default"
            disabled={exporting}
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-github-fg-muted mb-6">
          Choose an export format for all comment files:
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleExport('zip')}
            disabled={exporting}
            className="w-full flex items-center justify-between p-4 border border-github-border-default rounded hover:bg-github-canvas-subtle disabled:opacity-50"
          >
            <div className="text-left">
              <div className="font-medium text-github-fg-default">📦 ZIP Archive</div>
              <div className="text-xs text-github-fg-muted mt-1">
                Download all .comments files as a ZIP archive
              </div>
            </div>
            <span className="text-github-fg-muted">→</span>
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="w-full flex items-center justify-between p-4 border border-github-border-default rounded hover:bg-github-canvas-subtle disabled:opacity-50"
          >
            <div className="text-left">
              <div className="font-medium text-github-fg-default">📄 JSON File</div>
              <div className="text-xs text-github-fg-muted mt-1">
                Export all comments as a single JSON file
              </div>
            </div>
            <span className="text-github-fg-muted">→</span>
          </button>

          <button
            onClick={() => handleExport('markdown')}
            disabled={exporting}
            className="w-full flex items-center justify-between p-4 border border-github-border-default rounded hover:bg-github-canvas-subtle disabled:opacity-50"
          >
            <div className="text-left">
              <div className="font-medium text-github-fg-default">📝 Markdown Docs</div>
              <div className="text-xs text-github-fg-muted mt-1">
                Generate readable documentation from comments
              </div>
            </div>
            <span className="text-github-fg-muted">→</span>
          </button>
        </div>

        {exporting && (
          <div className="mt-4 text-center text-sm text-github-fg-muted">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-github-accent-fg border-t-transparent rounded-full mr-2"></div>
            Exporting...
          </div>
        )}
      </div>
    </div>
  );
}
