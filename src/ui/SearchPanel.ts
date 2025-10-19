/**
 * SearchPanel - Webview for displaying search results
 *
 * Features:
 * - Search input with field:value syntax
 * - Quick filter buttons (TODO, FIXME, My Comments, etc.)
 * - Results grouped by file with sorting options
 * - Click to navigate to comment
 * - Export to Markdown
 */

import * as vscode from 'vscode';
import { CommentSearchEngine } from '../features/CommentSearchEngine';
import { CommentManager } from '../core/CommentManager';

export class SearchPanel {
  public static currentPanel: SearchPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _searchEngine: CommentSearchEngine;

  public static createOrShow(
    extensionUri: vscode.Uri,
    searchEngine: CommentSearchEngine,
    commentManager: CommentManager
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SearchPanel.currentPanel) {
      SearchPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'pairedCommentsSearch',
      'Search Comments',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    SearchPanel.currentPanel = new SearchPanel(panel, extensionUri, searchEngine, commentManager);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    _extensionUri: vscode.Uri,
    searchEngine: CommentSearchEngine,
    _commentManager: CommentManager
  ) {
    this._panel = panel;
    this._searchEngine = searchEngine;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'search':
            await this._handleSearch(message.query);
            break;
          case 'navigate':
            await this._handleNavigate(message.file, message.line);
            break;
          case 'export':
            await this._handleExport(message.results);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async _handleSearch(queryString: string) {
    try {
      const query = this._searchEngine.parseSearchString(queryString);
      const searchResult = await this._searchEngine.search(query);

      // Send results back to webview
      this._panel.webview.postMessage({
        type: 'searchResults',
        results: searchResult.results.map((r: any) => ({
          file: r.sourceFile,
          line: r.comment.line,
          author: r.comment.author,
          text: r.comment.text,
          tag: r.comment.tag,
          timestamp: r.comment.timestamp,
          highlightedText: r.highlightedText
        })),
        query: queryString
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _handleNavigate(file: string, line: number) {
    try {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
      const editor = await vscode.window.showTextDocument(doc);

      // Navigate to line
      const position = new vscode.Position(Math.max(0, line - 1), 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to navigate to ${file}:${line}`
      );
    }
  }

  private async _handleExport(results: any[]) {
    try {
      // Generate markdown
      let markdown = `# Comment Search Results\n\n`;
      markdown += `**Total Results:** ${results.length}\n\n`;

      // Group by file
      const byFile = new Map<string, any[]>();
      for (const result of results) {
        if (!byFile.has(result.file)) {
          byFile.set(result.file, []);
        }
        byFile.get(result.file)!.push(result);
      }

      // Write grouped results
      for (const [file, fileResults] of byFile) {
        markdown += `## ${file}\n\n`;
        for (const result of fileResults) {
          markdown += `### Line ${result.line} - ${result.tag || 'NOTE'}\n`;
          markdown += `**Author:** ${result.author}\n`;
          markdown += `**Date:** ${new Date(result.timestamp).toLocaleString()}\n\n`;
          markdown += `${result.text}\n\n`;
          markdown += `---\n\n`;
        }
      }

      // Save to file
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('search-results.md'),
        filters: { 'Markdown': ['md'] }
      });

      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(markdown, 'utf8'));
        vscode.window.showInformationMessage(`Exported ${results.length} results to ${uri.fsPath}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public dispose() {
    SearchPanel.currentPanel = undefined;

    // Clean up resources
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(_webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Comments</title>
  <style>
    body {
      padding: 20px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }

    .search-container {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      padding: 8px;
      font-size: 14px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
    }

    .quick-filters {
      margin-top: 10px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 6px 12px;
      font-size: 12px;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .filter-btn.active {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .results-count {
      font-weight: bold;
    }

    .export-btn {
      padding: 6px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .export-btn:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .results-container {
      margin-top: 20px;
    }

    .file-group {
      margin-bottom: 20px;
    }

    .file-header {
      font-weight: bold;
      padding: 8px;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-textLink-foreground);
      margin-bottom: 10px;
    }

    .result-item {
      padding: 10px;
      margin-bottom: 10px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 4px;
      cursor: pointer;
    }

    .result-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .result-header {
      display: flex;
      gap: 10px;
      margin-bottom: 6px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .result-tag {
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 11px;
    }

    .tag-TODO { background-color: #ff6b6b; color: white; }
    .tag-FIXME { background-color: #ff8c42; color: white; }
    .tag-NOTE { background-color: #4ecdc4; color: white; }
    .tag-REVIEW { background-color: #feca57; color: black; }
    .tag-STAR { background-color: #ffd700; color: black; }

    .result-text {
      margin-top: 6px;
      line-height: 1.5;
    }

    .highlight {
      background-color: var(--vscode-editor-findMatchHighlightBackground);
      font-weight: bold;
    }

    .no-results {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="search-container">
    <input
      type="text"
      class="search-input"
      id="searchInput"
      placeholder='Search comments... (e.g., "bug" tag:TODO author:john)'
    />

    <div class="quick-filters">
      <button class="filter-btn" data-filter="tag:TODO">TODO</button>
      <button class="filter-btn" data-filter="tag:FIXME">FIXME</button>
      <button class="filter-btn" data-filter="tag:NOTE">NOTE</button>
      <button class="filter-btn" data-filter="tag:REVIEW">REVIEW</button>
      <button class="filter-btn" data-filter="tag:STAR">STAR</button>
      <button class="filter-btn" data-filter="orphaned:true">Orphaned</button>
      <button class="filter-btn" data-filter="hasAI:true">AI-Enriched</button>
    </div>
  </div>

  <div class="results-header" id="resultsHeader" style="display: none;">
    <div class="results-count" id="resultsCount">0 results</div>
    <button class="export-btn" id="exportBtn">Export to Markdown</button>
  </div>

  <div class="results-container" id="resultsContainer">
    <div class="no-results">Enter a search query to find comments</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsCount = document.getElementById('resultsCount');
    const exportBtn = document.getElementById('exportBtn');

    let currentResults = [];

    // Search input handler
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Quick filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        searchInput.value = filter;
        performSearch();
      });
    });

    // Export button
    exportBtn.addEventListener('click', () => {
      vscode.postMessage({
        type: 'export',
        results: currentResults
      });
    });

    function performSearch() {
      const query = searchInput.value.trim();
      if (!query) {
        resultsContainer.innerHTML = '<div class="no-results">Enter a search query to find comments</div>';
        resultsHeader.style.display = 'none';
        return;
      }

      vscode.postMessage({
        type: 'search',
        query: query
      });
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'searchResults':
          displayResults(message.results);
          break;
      }
    });

    function displayResults(results) {
      currentResults = results;

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No comments found</div>';
        resultsHeader.style.display = 'none';
        return;
      }

      // Show results header
      resultsHeader.style.display = 'flex';
      resultsCount.textContent = \`\${results.length} result\${results.length === 1 ? '' : 's'}\`;

      // Group by file
      const byFile = new Map();
      results.forEach(result => {
        if (!byFile.has(result.file)) {
          byFile.set(result.file, []);
        }
        byFile.get(result.file).push(result);
      });

      // Render grouped results
      let html = '';
      byFile.forEach((fileResults, file) => {
        html += \`<div class="file-group">
          <div class="file-header">\${file} (\${fileResults.length})</div>\`;

        fileResults.forEach(result => {
          const tagClass = result.tag ? \`tag-\${result.tag}\` : 'tag-NOTE';
          const displayTag = result.tag || 'NOTE';
          const date = new Date(result.timestamp).toLocaleDateString();

          html += \`<div class="result-item" onclick="navigateTo('\${result.file}', \${result.line})">
            <div class="result-header">
              <span class="result-tag \${tagClass}">\${displayTag}</span>
              <span>Line \${result.line}</span>
              <span>\${result.author}</span>
              <span>\${date}</span>
            </div>
            <div class="result-text">\${result.highlightedText || result.text}</div>
          </div>\`;
        });

        html += '</div>';
      });

      resultsContainer.innerHTML = html;
    }

    function navigateTo(file, line) {
      vscode.postMessage({
        type: 'navigate',
        file: file,
        line: line
      });
    }
  </script>
</body>
</html>`;
  }
}
