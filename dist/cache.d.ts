/**
 * Caching and file watching functionality for prompt metadata
 */
import { PromptInfo } from './types.js';
export declare class PromptCache {
    private promptsDir;
    private cache;
    private watcher;
    private isWatcherInitialized;
    constructor(promptsDir: string);
    /**
     * Get all cached prompts
     */
    getAllPrompts(): PromptInfo[];
    /**
     * Get a specific prompt from cache
     */
    getPrompt(name: string): PromptInfo | undefined;
    /**
     * Check if cache is empty
     */
    isEmpty(): boolean;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Load prompt metadata from a file
     */
    private loadPromptMetadata;
    /**
     * Update cache for a specific file
     */
    private updateCacheForFile;
    /**
     * Remove a file from cache
     */
    private removeFromCache;
    /**
     * Ensure prompts directory exists
     */
    private ensurePromptsDir;
    /**
     * Initialize cache by loading all prompt files
     */
    initializeCache(): Promise<void>;
    /**
     * Initialize file watcher to monitor changes
     */
    initializeFileWatcher(): void;
    /**
     * Stop file watcher and cleanup
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=cache.d.ts.map