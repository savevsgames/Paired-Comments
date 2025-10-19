'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FileSystemDB extends DBSchema {
  files: {
    key: string; // file path
    value: {
      path: string;
      content: string;
      mtime: number; // last modified time
      language?: string;
    };
  };
}

class IndexedDBFileSystem {
  private db: IDBPDatabase<FileSystemDB> | null = null;
  private readonly DB_NAME = 'paired-comments-fs';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<FileSystemDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create files store if it doesn't exist
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'path' });
        }
      },
    });
  }

  async readFile(path: string): Promise<string> {
    await this.init();
    const file = await this.db!.get('files', path);
    if (!file) {
      throw new Error(`File not found: ${path}`);
    }
    return file.content;
  }

  async writeFile(path: string, content: string, language?: string): Promise<void> {
    await this.init();
    await this.db!.put('files', {
      path,
      content,
      mtime: Date.now(),
      language,
    });
  }

  async exists(path: string): Promise<boolean> {
    await this.init();
    const file = await this.db!.get('files', path);
    return !!file;
  }

  async delete(path: string): Promise<void> {
    await this.init();
    await this.db!.delete('files', path);
  }

  async listFiles(): Promise<string[]> {
    await this.init();
    const files = await this.db!.getAllKeys('files');
    return files;
  }

  async getFile(path: string): Promise<{
    path: string;
    content: string;
    mtime: number;
    language?: string;
  } | null> {
    await this.init();
    const file = await this.db!.get('files', path);
    return file || null;
  }

  async clear(): Promise<void> {
    await this.init();
    await this.db!.clear('files');
  }

  async getAllFiles(): Promise<
    Array<{
      path: string;
      content: string;
      mtime: number;
      language?: string;
    }>
  > {
    await this.init();
    return await this.db!.getAll('files');
  }
}

// Singleton instance
export const fileSystem = new IndexedDBFileSystem();
