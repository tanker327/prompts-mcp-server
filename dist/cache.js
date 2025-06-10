/**
 * Caching and file watching functionality for prompt metadata
 */
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import matter from 'gray-matter';
export class PromptCache {
    promptsDir;
    cache = new Map();
    watcher = null;
    isWatcherInitialized = false;
    constructor(promptsDir) {
        this.promptsDir = promptsDir;
    }
    /**
     * Get all cached prompts
     */
    getAllPrompts() {
        return Array.from(this.cache.values());
    }
    /**
     * Get a specific prompt from cache
     */
    getPrompt(name) {
        return this.cache.get(name);
    }
    /**
     * Check if cache is empty
     */
    isEmpty() {
        return this.cache.size === 0;
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Load prompt metadata from a file
     */
    async loadPromptMetadata(fileName) {
        const filePath = path.join(this.promptsDir, fileName);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = matter(content);
            const name = fileName.replace('.md', '');
            return {
                name,
                metadata: parsed.data,
                preview: parsed.content.substring(0, 100).replace(/\n/g, ' ').trim() + '...'
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Failed to load prompt metadata for ${fileName}:`, errorMessage);
            return null;
        }
    }
    /**
     * Update cache for a specific file
     */
    async updateCacheForFile(fileName) {
        if (!fileName.endsWith('.md'))
            return;
        const metadata = await this.loadPromptMetadata(fileName);
        if (metadata) {
            this.cache.set(metadata.name, metadata);
        }
    }
    /**
     * Remove a file from cache
     */
    async removeFromCache(fileName) {
        if (!fileName.endsWith('.md'))
            return;
        const name = fileName.replace('.md', '');
        this.cache.delete(name);
    }
    /**
     * Ensure prompts directory exists
     */
    async ensurePromptsDir() {
        try {
            await fs.access(this.promptsDir);
        }
        catch {
            await fs.mkdir(this.promptsDir, { recursive: true });
        }
    }
    /**
     * Initialize cache by loading all prompt files
     */
    async initializeCache() {
        await this.ensurePromptsDir();
        try {
            const files = await fs.readdir(this.promptsDir);
            const mdFiles = files.filter(file => file.endsWith('.md'));
            // Clear existing cache
            this.cache.clear();
            // Load all prompt metadata
            await Promise.all(mdFiles.map(async (file) => {
                await this.updateCacheForFile(file);
            }));
            console.error(`Loaded ${this.cache.size} prompts into cache`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to initialize cache:', errorMessage);
        }
    }
    /**
     * Initialize file watcher to monitor changes
     */
    initializeFileWatcher() {
        if (this.isWatcherInitialized)
            return;
        this.watcher = chokidar.watch(path.join(this.promptsDir, '*.md'), {
            ignored: /^\./, // ignore dotfiles
            persistent: true,
            ignoreInitial: true // don't fire events for initial scan
        });
        this.watcher
            .on('add', async (filePath) => {
            const fileName = path.basename(filePath);
            console.error(`Prompt added: ${fileName}`);
            await this.updateCacheForFile(fileName);
        })
            .on('change', async (filePath) => {
            const fileName = path.basename(filePath);
            console.error(`Prompt updated: ${fileName}`);
            await this.updateCacheForFile(fileName);
        })
            .on('unlink', async (filePath) => {
            const fileName = path.basename(filePath);
            console.error(`Prompt deleted: ${fileName}`);
            await this.removeFromCache(fileName);
        })
            .on('error', (error) => {
            console.error('File watcher error:', error);
        });
        this.isWatcherInitialized = true;
        console.error('File watcher initialized for prompts directory');
    }
    /**
     * Stop file watcher and cleanup
     */
    async cleanup() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            this.isWatcherInitialized = false;
        }
    }
}
//# sourceMappingURL=cache.js.map