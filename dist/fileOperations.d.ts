/**
 * File operations for prompt management (CRUD operations)
 */
import { PromptInfo } from './types.js';
import { PromptCache } from './cache.js';
export declare class PromptFileOperations {
    private promptsDir;
    private cache;
    constructor(promptsDir: string, cache: PromptCache);
    /**
     * Sanitize filename to be filesystem-safe
     */
    private sanitizeFileName;
    /**
     * Ensure prompts directory exists
     */
    private ensurePromptsDir;
    /**
     * List all prompts (uses cache for performance)
     */
    listPrompts(): Promise<PromptInfo[]>;
    /**
     * Read a specific prompt by name
     */
    readPrompt(name: string): Promise<string>;
    /**
     * Save a new prompt or update existing one
     */
    savePrompt(name: string, content: string): Promise<string>;
    /**
     * Delete a prompt by name
     */
    deletePrompt(name: string): Promise<boolean>;
    /**
     * Check if a prompt exists
     */
    promptExists(name: string): Promise<boolean>;
    /**
     * Get prompt info from cache (if available)
     */
    getPromptInfo(name: string): PromptInfo | undefined;
}
//# sourceMappingURL=fileOperations.d.ts.map