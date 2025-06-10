/**
 * File operations for prompt management (CRUD operations)
 */
import fs from 'fs/promises';
import path from 'path';
export class PromptFileOperations {
    promptsDir;
    cache;
    constructor(promptsDir, cache) {
        this.promptsDir = promptsDir;
        this.cache = cache;
    }
    /**
     * Sanitize filename to be filesystem-safe
     */
    sanitizeFileName(name) {
        return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
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
     * List all prompts (uses cache for performance)
     */
    async listPrompts() {
        // Initialize cache and file watcher if not already done
        if (this.cache.isEmpty()) {
            await this.cache.initializeCache();
            this.cache.initializeFileWatcher();
        }
        return this.cache.getAllPrompts();
    }
    /**
     * Read a specific prompt by name
     */
    async readPrompt(name) {
        const fileName = this.sanitizeFileName(name) + '.md';
        const filePath = path.join(this.promptsDir, fileName);
        try {
            return await fs.readFile(filePath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Prompt "${name}" not found`);
        }
    }
    /**
     * Save a new prompt or update existing one
     */
    async savePrompt(name, content) {
        await this.ensurePromptsDir();
        const fileName = this.sanitizeFileName(name) + '.md';
        const filePath = path.join(this.promptsDir, fileName);
        await fs.writeFile(filePath, content, 'utf-8');
        return fileName;
    }
    /**
     * Delete a prompt by name
     */
    async deletePrompt(name) {
        const fileName = this.sanitizeFileName(name) + '.md';
        const filePath = path.join(this.promptsDir, fileName);
        try {
            await fs.unlink(filePath);
            return true;
        }
        catch (error) {
            throw new Error(`Prompt "${name}" not found`);
        }
    }
    /**
     * Check if a prompt exists
     */
    async promptExists(name) {
        const fileName = this.sanitizeFileName(name) + '.md';
        const filePath = path.join(this.promptsDir, fileName);
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get prompt info from cache (if available)
     */
    getPromptInfo(name) {
        return this.cache.getPrompt(name);
    }
}
//# sourceMappingURL=fileOperations.js.map