/**
 * @jest-environment jsdom
 */

import { fileSystem } from '../indexeddb';

describe('IndexedDB Filesystem', () => {
  beforeEach(async () => {
    // Clear database before each test
    await fileSystem.clear();
  });

  describe('writeFile and readFile', () => {
    it('should write and read a file', async () => {
      const path = 'test/example.ts';
      const content = 'const foo = "bar";';
      const language = 'typescript';

      await fileSystem.writeFile(path, content, language);
      const result = await fileSystem.readFile(path);

      expect(result).toBe(content);
    });

    it('should throw error when reading non-existent file', async () => {
      await expect(fileSystem.readFile('nonexistent.ts')).rejects.toThrow(
        'File not found: nonexistent.ts'
      );
    });

    it('should overwrite existing file', async () => {
      const path = 'test/file.js';

      await fileSystem.writeFile(path, 'original content');
      await fileSystem.writeFile(path, 'updated content');

      const result = await fileSystem.readFile(path);
      expect(result).toBe('updated content');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await fileSystem.writeFile('exists.js', 'content');

      const result = await fileSystem.exists('exists.js');

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const result = await fileSystem.exists('does-not-exist.js');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      const path = 'delete-me.js';

      await fileSystem.writeFile(path, 'content');
      expect(await fileSystem.exists(path)).toBe(true);

      await fileSystem.delete(path);
      expect(await fileSystem.exists(path)).toBe(false);
    });

    it('should not throw when deleting non-existent file', async () => {
      await expect(fileSystem.delete('non-existent.js')).resolves.not.toThrow();
    });
  });

  describe('listFiles', () => {
    it('should return empty array when no files', async () => {
      const files = await fileSystem.listFiles();

      expect(files).toEqual([]);
    });

    it('should return all file paths', async () => {
      await fileSystem.writeFile('file1.js', 'content1');
      await fileSystem.writeFile('file2.ts', 'content2');
      await fileSystem.writeFile('file3.py', 'content3');

      const files = await fileSystem.listFiles();

      expect(files).toHaveLength(3);
      expect(files).toContain('file1.js');
      expect(files).toContain('file2.ts');
      expect(files).toContain('file3.py');
    });
  });

  describe('getFile', () => {
    it('should return file with metadata', async () => {
      const path = 'meta.ts';
      const content = 'code here';
      const language = 'typescript';

      await fileSystem.writeFile(path, content, language);
      const file = await fileSystem.getFile(path);

      expect(file).not.toBeNull();
      expect(file?.path).toBe(path);
      expect(file?.content).toBe(content);
      expect(file?.language).toBe(language);
      expect(file?.mtime).toBeGreaterThan(0);
    });

    it('should return null for non-existent file', async () => {
      const file = await fileSystem.getFile('nope.js');

      expect(file).toBeNull();
    });
  });

  describe('getAllFiles', () => {
    it('should return all files with metadata', async () => {
      await fileSystem.writeFile('a.js', 'content a', 'javascript');
      await fileSystem.writeFile('b.ts', 'content b', 'typescript');

      const files = await fileSystem.getAllFiles();

      expect(files).toHaveLength(2);
      expect(files[0].path).toBeDefined();
      expect(files[0].content).toBeDefined();
      expect(files[0].language).toBeDefined();
      expect(files[0].mtime).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all files', async () => {
      await fileSystem.writeFile('file1.js', 'content1');
      await fileSystem.writeFile('file2.js', 'content2');

      expect(await fileSystem.listFiles()).toHaveLength(2);

      await fileSystem.clear();

      expect(await fileSystem.listFiles()).toHaveLength(0);
    });
  });
});
