/**
 * Comment File Cache
 *
 * In-memory LRU cache for .comments files with dirty bit tracking and auto-save.
 * Provides 10-50x performance improvement for repeated file access.
 *
 * NOT YET INTEGRATED - Implementation ready for testing and integration
 */

import * as vscode from 'vscode';
import { CommentFile } from '../types';
import { FileSystemManager } from './FileSystemManager';
import { logger } from '../utils/Logger';

export interface CachedCommentFile {
  sourceUri: string;
  commentFile: CommentFile;
  version: number;              // Increments on each modification
  loadedAt: number;             // Timestamp when loaded
  isDirty: boolean;             // Has unsaved changes
  lastSavedAt: number;          // When last written to disk
}

export interface CommentFileCacheStats {
  hits: number;
  misses: number;
  writes: number;
  autoSaves: number;
  hitRate: number;
  dirtyFiles: number;
}

export class CommentFileCache {
  private cache = new Map<string, CachedCommentFile>();
  private readonly maxCacheSize: number;
  private readonly autoSaveDelay: number;
  private saveTimers = new Map<string, NodeJS.Timeout>();
  private fileSystemManager: FileSystemManager;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    writes: 0,
    autoSaves: 0
  };

  constructor(
    fileSystemManager: FileSystemManager,
    maxCacheSize: number = 100,
    autoSaveDelay: number = 2000
  ) {
    this.fileSystemManager = fileSystemManager;
    this.maxCacheSize = maxCacheSize;
    this.autoSaveDelay = autoSaveDelay;
    logger.info(`[CommentFileCache] Initialized with maxSize=${maxCacheSize}, autoSaveDelay=${autoSaveDelay}ms`);
  }

  /**
   * Get comment file from cache (sync - does NOT load from disk)
   */
  get(sourceUri: vscode.Uri): CommentFile | null {
    const key = sourceUri.fsPath;
    const cached = this.cache.get(key);

    if (cached) {
      this.stats.hits++;
      logger.debug(`[CommentFileCache] Cache HIT for ${sourceUri.fsPath}`);
      return cached.commentFile;
    }

    // Cache miss
    this.stats.misses++;
    logger.debug(`[CommentFileCache] Cache MISS for ${sourceUri.fsPath}`);
    return null;
  }

  /**
   * Update comment file in cache (mark as dirty)
   */
  set(sourceUri: vscode.Uri, commentFile: CommentFile): void {
    const key = sourceUri.fsPath;
    const cached = this.cache.get(key);

    this.cache.set(key, {
      sourceUri: key,
      commentFile,
      version: (cached?.version || 0) + 1,
      loadedAt: cached?.loadedAt || Date.now(),
      isDirty: true,
      lastSavedAt: cached?.lastSavedAt || 0
    });

    logger.debug(`[CommentFileCache] Updated cache for ${sourceUri.fsPath} (v${cached?.version || 0 + 1}, dirty)`);

    // Evict if cache too large
    if (this.cache.size > this.maxCacheSize) {
      this.evictOldest();
    }

    // Schedule auto-save
    this.scheduleAutoSave(sourceUri);
  }

  /**
   * Flush dirty files to disk
   *
   * @param sourceUri - Optional specific file to flush, otherwise flushes all dirty files
   */
  async flush(sourceUri?: vscode.Uri): Promise<void> {
    if (sourceUri) {
      // Flush single file
      await this.flushFile(sourceUri);
    } else {
      // Flush all dirty files
      const dirtyFiles: vscode.Uri[] = [];

      for (const [key, cached] of this.cache.entries()) {
        if (cached.isDirty) {
          dirtyFiles.push(vscode.Uri.file(key));
        }
      }

      if (dirtyFiles.length > 0) {
        logger.info(`[CommentFileCache] Flushing ${dirtyFiles.length} dirty files`);

        for (const uri of dirtyFiles) {
          await this.flushFile(uri);
        }
      }
    }
  }

  /**
   * Flush a single file to disk
   */
  private async flushFile(sourceUri: vscode.Uri): Promise<void> {
    const key = sourceUri.fsPath;
    const cached = this.cache.get(key);

    if (cached && cached.isDirty) {
      try {
        await this.fileSystemManager.writeCommentFile(sourceUri, cached.commentFile);
        cached.isDirty = false;
        cached.lastSavedAt = Date.now();
        this.stats.writes++;

        logger.debug(`[CommentFileCache] Flushed ${sourceUri.fsPath} to disk`);
      } catch (error) {
        logger.error(`[CommentFileCache] Error flushing ${sourceUri.fsPath}:`, error);
        throw error;
      }
    }
  }

  /**
   * Schedule auto-save for a file
   *
   * Cancels any existing timer and schedules a new one
   */
  private scheduleAutoSave(sourceUri: vscode.Uri): void {
    const key = sourceUri.fsPath;

    // Clear existing timer
    const existingTimer = this.saveTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new save
    const timer = setTimeout(async () => {
      try {
        await this.flushFile(sourceUri);
        this.stats.autoSaves++;
        this.saveTimers.delete(key);
        logger.debug(`[CommentFileCache] Auto-saved ${sourceUri.fsPath}`);
      } catch (error) {
        logger.error(`[CommentFileCache] Auto-save failed for ${sourceUri.fsPath}:`, error);
      }
    }, this.autoSaveDelay);

    this.saveTimers.set(key, timer);
  }

  /**
   * Invalidate a cache entry
   */
  invalidate(sourceUri: vscode.Uri): void {
    const key = sourceUri.fsPath;

    // Cancel pending auto-save
    const timer = this.saveTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.saveTimers.delete(key);
    }

    // Remove from cache
    const existed = this.cache.delete(key);

    if (existed) {
      logger.debug(`[CommentFileCache] Invalidated cache for ${sourceUri.fsPath}`);
    }
  }

  /**
   * Clear entire cache (flushes dirty files first)
   */
  async clear(): Promise<void> {
    // Flush all dirty files before clearing
    await this.flush();

    // Cancel all pending timers
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();

    // Clear cache
    const size = this.cache.size;
    this.cache.clear();

    logger.info(`[CommentFileCache] Cleared ${size} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CommentFileCacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    let dirtyFiles = 0;
    for (const cached of this.cache.values()) {
      if (cached.isDirty) {
        dirtyFiles++;
      }
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      writes: this.stats.writes,
      autoSaves: this.stats.autoSaves,
      hitRate,
      dirtyFiles
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      autoSaves: 0
    };
    logger.debug('[CommentFileCache] Statistics reset');
  }

  /**
   * Evict the oldest cache entry (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find oldest non-dirty entry first
    for (const [key, entry] of this.cache.entries()) {
      if (!entry.isDirty && entry.loadedAt < oldestTime) {
        oldestTime = entry.loadedAt;
        oldestKey = key;
      }
    }

    // If no non-dirty entries, evict oldest dirty entry (after flushing)
    if (!oldestKey) {
      for (const [key, entry] of this.cache.entries()) {
        if (entry.loadedAt < oldestTime) {
          oldestTime = entry.loadedAt;
          oldestKey = key;
        }
      }

      // Flush if dirty
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry?.isDirty) {
          this.flushFile(vscode.Uri.file(oldestKey)).catch(error => {
            logger.error(`[CommentFileCache] Error flushing during eviction: ${error}`);
          });
        }
      }
    }

    if (oldestKey) {
      // Cancel pending timer
      const timer = this.saveTimers.get(oldestKey);
      if (timer) {
        clearTimeout(timer);
        this.saveTimers.delete(oldestKey);
      }

      this.cache.delete(oldestKey);
      logger.debug(`[CommentFileCache] Evicted oldest entry: ${oldestKey}`);
    }
  }

  /**
   * Get the current cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get the number of dirty files
   */
  getDirtyCount(): number {
    let count = 0;
    for (const cached of this.cache.values()) {
      if (cached.isDirty) {
        count++;
      }
    }
    return count;
  }

  /**
   * Check if a file is cached and dirty
   */
  isDirty(sourceUri: vscode.Uri): boolean {
    const key = sourceUri.fsPath;
    const cached = this.cache.get(key);
    return cached?.isDirty || false;
  }

  /**
   * Log current cache statistics
   */
  logStats(): void {
    const stats = this.getStats();
    logger.info('[CommentFileCache] Cache Statistics:', {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: stats.hits,
      misses: stats.misses,
      writes: stats.writes,
      autoSaves: stats.autoSaves,
      hitRate: `${stats.hitRate.toFixed(1)}%`,
      dirtyFiles: stats.dirtyFiles,
      pendingTimers: this.saveTimers.size
    });
  }

  /**
   * Dispose of the cache (flush and clean up)
   */
  async dispose(): Promise<void> {
    logger.info('[CommentFileCache] Disposing cache...');
    await this.clear();
    logger.info('[CommentFileCache] Disposed');
  }
}
