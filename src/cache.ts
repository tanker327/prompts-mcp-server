/**
 * Caching and file watching functionality for prompt metadata
 */

import fs from 'fs/promises';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import matter from 'gray-matter';
import { PromptInfo, PromptMetadata } from './types.js';

export class PromptCache {
  private cache = new Map<string, PromptInfo>();
  private watcher: FSWatcher | null = null;
  private isWatcherInitialized = false;

  constructor(private promptsDir: string) {}

  /**
   * Get all cached prompts
   */
  getAllPrompts(): PromptInfo[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get a specific prompt from cache
   */
  getPrompt(name: string): PromptInfo | undefined {
    return this.cache.get(name);
  }

  /**
   * Check if cache is empty
   */
  isEmpty(): boolean {
    return this.cache.size === 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Load prompt metadata from a file
   */
  private async loadPromptMetadata(fileName: string): Promise<PromptInfo | null> {
    const filePath = path.join(this.promptsDir, fileName);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const name = fileName.replace('.md', '');
      
      return {
        name,
        metadata: parsed.data as PromptMetadata,
        preview: parsed.content.substring(0, 100).replace(/\n/g, ' ').trim() + '...'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to load prompt metadata for ${fileName}:`, errorMessage);
      return null;
    }
  }

  /**
   * Update cache for a specific file
   */
  private async updateCacheForFile(fileName: string): Promise<void> {
    if (!fileName.endsWith('.md')) return;
    
    const metadata = await this.loadPromptMetadata(fileName);
    if (metadata) {
      this.cache.set(metadata.name, metadata);
    }
  }

  /**
   * Remove a file from cache
   */
  private async removeFromCache(fileName: string): Promise<void> {
    if (!fileName.endsWith('.md')) return;
    
    const name = fileName.replace('.md', '');
    this.cache.delete(name);
  }

  /**
   * Ensure prompts directory exists
   */
  private async ensurePromptsDir(): Promise<void> {
    try {
      await fs.access(this.promptsDir);
    } catch {
      await fs.mkdir(this.promptsDir, { recursive: true });
    }
  }

  /**
   * Initialize cache by loading all prompt files
   */
  async initializeCache(): Promise<void> {
    await this.ensurePromptsDir();
    
    try {
      const files = await fs.readdir(this.promptsDir);
      const mdFiles = files.filter(file => file.endsWith('.md'));
      
      // Clear existing cache
      this.cache.clear();
      
      // Load all prompt metadata
      await Promise.all(
        mdFiles.map(async (file) => {
          await this.updateCacheForFile(file);
        })
      );
      
      console.error(`Loaded ${this.cache.size} prompts into cache`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to initialize cache:', errorMessage);
    }
  }

  /**
   * Initialize file watcher to monitor changes
   */
  initializeFileWatcher(): void {
    if (this.isWatcherInitialized) return;
    
    this.watcher = chokidar.watch(path.join(this.promptsDir, '*.md'), {
      ignored: /^\./, // ignore dotfiles
      persistent: true,
      ignoreInitial: true // don't fire events for initial scan
    });

    this.watcher
      .on('add', async (filePath: string) => {
        const fileName = path.basename(filePath);
        console.error(`Prompt added: ${fileName}`);
        await this.updateCacheForFile(fileName);
      })
      .on('change', async (filePath: string) => {
        const fileName = path.basename(filePath);
        console.error(`Prompt updated: ${fileName}`);
        await this.updateCacheForFile(fileName);
      })
      .on('unlink', async (filePath: string) => {
        const fileName = path.basename(filePath);
        console.error(`Prompt deleted: ${fileName}`);
        await this.removeFromCache(fileName);
      })
      .on('error', (error: Error) => {
        console.error('File watcher error:', error);
      });

    this.isWatcherInitialized = true;
    console.error('File watcher initialized for prompts directory');
  }

  /**
   * Stop file watcher and cleanup
   */
  async cleanup(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.isWatcherInitialized = false;
    }
  }
}