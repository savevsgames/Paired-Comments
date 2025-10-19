'use client';

import { fileSystem } from '../filesystem/indexeddb';
import { Uri, TextDocument, FileSystemProvider } from './types';
import { EventEmitter } from './events';

/**
 * VS Code Workspace API Shim
 * Minimal implementation for browser environment
 */

class WorkspaceFileSystemProvider implements FileSystemProvider {
  async readFile(uri: Uri): Promise<Uint8Array> {
    const content = await fileSystem.readFile(uri.fsPath);
    return new TextEncoder().encode(content);
  }

  async writeFile(uri: Uri, content: Uint8Array): Promise<void> {
    const text = new TextDecoder().decode(content);
    await fileSystem.writeFile(uri.fsPath, text);
  }

  async stat(uri: Uri): Promise<{ type: number; size: number; mtime: number }> {
    const file = await fileSystem.getFile(uri.fsPath);
    if (!file) {
      throw new Error(`File not found: ${uri.fsPath}`);
    }
    return {
      type: 1, // File type
      size: file.content.length,
      mtime: file.mtime,
    };
  }

  async delete(uri: Uri): Promise<void> {
    await fileSystem.delete(uri.fsPath);
  }
}

class Workspace {
  private fsProvider = new WorkspaceFileSystemProvider();
  private onDidChangeTextDocumentEmitter = new EventEmitter<{ document: TextDocument }>();
  private onDidSaveTextDocumentEmitter = new EventEmitter<TextDocument>();

  readonly fs = {
    readFile: (uri: Uri) => this.fsProvider.readFile(uri),
    writeFile: (uri: Uri, content: Uint8Array) => this.fsProvider.writeFile(uri, content),
    stat: (uri: Uri) => this.fsProvider.stat(uri),
    delete: (uri: Uri) => this.fsProvider.delete(uri),
  };

  readonly onDidChangeTextDocument = this.onDidChangeTextDocumentEmitter.event;
  readonly onDidSaveTextDocument = this.onDidSaveTextDocumentEmitter.event;

  async openTextDocument(uri: Uri | string): Promise<TextDocument> {
    const path = typeof uri === 'string' ? uri : uri.fsPath;
    const content = await fileSystem.readFile(path);
    const file = await fileSystem.getFile(path);

    return {
      uri: typeof uri === 'string' ? Uri.file(uri) : uri,
      fileName: path,
      languageId: file?.language || 'plaintext',
      version: 1,
      getText: () => content,
      lineAt: (line: number) => ({
        text: content.split('\n')[line] || '',
        lineNumber: line,
        range: {
          start: { line, character: 0 },
          end: { line, character: content.split('\n')[line]?.length || 0 },
        },
      }),
      lineCount: content.split('\n').length,
      positionAt: (offset: number) => {
        const lines = content.split('\n');
        let currentOffset = 0;
        for (let i = 0; i < lines.length; i++) {
          if (currentOffset + lines[i].length >= offset) {
            return { line: i, character: offset - currentOffset };
          }
          currentOffset += lines[i].length + 1; // +1 for newline
        }
        return { line: lines.length - 1, character: 0 };
      },
      offsetAt: (position: { line: number; character: number }) => {
        const lines = content.split('\n');
        let offset = 0;
        for (let i = 0; i < position.line; i++) {
          offset += lines[i].length + 1; // +1 for newline
        }
        offset += position.character;
        return offset;
      },
      save: async () => {
        await fileSystem.writeFile(path, content, file?.language);
        this.onDidSaveTextDocumentEmitter.fire({
          uri: typeof uri === 'string' ? Uri.file(uri) : uri,
          fileName: path,
          languageId: file?.language || 'plaintext',
          version: 1,
          getText: () => content,
          lineAt: () => ({ text: '', lineNumber: 0, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } }),
          lineCount: content.split('\n').length,
          positionAt: () => ({ line: 0, character: 0 }),
          offsetAt: () => 0,
          save: async () => true,
        });
        return true;
      },
    };
  }

  /**
   * Notify that a text document has changed
   * Called by Monaco editor onChange handler
   */
  notifyDocumentChanged(document: TextDocument): void {
    this.onDidChangeTextDocumentEmitter.fire({ document });
  }
}

export const workspace = new Workspace();
