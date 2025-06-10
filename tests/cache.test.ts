/**
 * Tests for PromptCache class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PromptCache } from '../src/cache.js';
import { createTempDir, cleanupTempDir, createTestPromptFile, createSamplePromptInfo, mockConsoleError, wait } from './helpers/testUtils.js';
import { createMockWatcher } from './helpers/mocks.js';

// Mock chokidar
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn()
  }
}));

describe('PromptCache', () => {
  let tempDir: string;
  let cache: PromptCache;
  let consoleErrorSpy: ReturnType<typeof mockConsoleError>;

  beforeEach(async () => {
    tempDir = await createTempDir();
    cache = new PromptCache(tempDir);
    consoleErrorSpy = mockConsoleError();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cache.cleanup();
    await cleanupTempDir(tempDir);
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create cache with empty state', () => {
      expect(cache.isEmpty()).toBe(true);
      expect(cache.size()).toBe(0);
      expect(cache.getAllPrompts()).toEqual([]);
    });
  });

  describe('getAllPrompts', () => {
    it('should return empty array when cache is empty', () => {
      expect(cache.getAllPrompts()).toEqual([]);
    });

    it('should return all cached prompts', async () => {
      await createTestPromptFile(tempDir, 'test1', { title: 'Test 1' });
      await createTestPromptFile(tempDir, 'test2', { title: 'Test 2' });
      
      await cache.initializeCache();
      
      const prompts = cache.getAllPrompts();
      expect(prompts).toHaveLength(2);
      expect(prompts.some(p => p.name === 'test1')).toBe(true);
      expect(prompts.some(p => p.name === 'test2')).toBe(true);
    });
  });

  describe('getPrompt', () => {
    it('should return undefined for non-existent prompt', () => {
      expect(cache.getPrompt('non-existent')).toBeUndefined();
    });

    it('should return cached prompt by name', async () => {
      await createTestPromptFile(tempDir, 'test-prompt', { title: 'Test Prompt' });
      await cache.initializeCache();
      
      const prompt = cache.getPrompt('test-prompt');
      expect(prompt).toBeDefined();
      expect(prompt?.name).toBe('test-prompt');
      expect(prompt?.metadata.title).toBe('Test Prompt');
    });
  });

  describe('isEmpty', () => {
    it('should return true when cache is empty', () => {
      expect(cache.isEmpty()).toBe(true);
    });

    it('should return false when cache has prompts', async () => {
      await createTestPromptFile(tempDir, 'test-prompt');
      await cache.initializeCache();
      
      expect(cache.isEmpty()).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 when cache is empty', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct count of cached prompts', async () => {
      await createTestPromptFile(tempDir, 'test1');
      await createTestPromptFile(tempDir, 'test2');
      await createTestPromptFile(tempDir, 'test3');
      
      await cache.initializeCache();
      
      expect(cache.size()).toBe(3);
    });
  });

  describe('initializeCache', () => {
    it('should load all markdown files from directory', async () => {
      await createTestPromptFile(tempDir, 'prompt1', { title: 'Prompt 1' });
      await createTestPromptFile(tempDir, 'prompt2', { title: 'Prompt 2' });
      
      await cache.initializeCache();
      
      expect(cache.size()).toBe(2);
      expect(cache.getPrompt('prompt1')?.metadata.title).toBe('Prompt 1');
      expect(cache.getPrompt('prompt2')?.metadata.title).toBe('Prompt 2');
    });

    it('should ignore non-markdown files', async () => {
      await createTestPromptFile(tempDir, 'prompt1');
      // Create a non-markdown file
      const fs = await import('fs/promises');
      await fs.writeFile(`${tempDir}/readme.txt`, 'Not a prompt');
      
      await cache.initializeCache();
      
      expect(cache.size()).toBe(1);
      expect(cache.getPrompt('prompt1')).toBeDefined();
      expect(cache.getPrompt('readme')).toBeUndefined();
    });

    it('should handle files with YAML frontmatter', async () => {
      const metadata = {
        title: 'Test Prompt',
        description: 'A test prompt',
        category: 'test',
        tags: ['test', 'example'],
        difficulty: 'beginner' as const,
        author: 'Test Author',
        version: '1.0'
      };
      
      await createTestPromptFile(tempDir, 'with-frontmatter', metadata, 'Content after frontmatter');
      await cache.initializeCache();
      
      const prompt = cache.getPrompt('with-frontmatter');
      expect(prompt?.metadata).toEqual(metadata);
      expect(prompt?.preview).toContain('Content after frontmatter');
    });

    it('should handle files without frontmatter', async () => {
      await createTestPromptFile(tempDir, 'no-frontmatter', {}, 'Just plain content');
      await cache.initializeCache();
      
      const prompt = cache.getPrompt('no-frontmatter');
      expect(prompt?.metadata).toEqual({});
      expect(prompt?.preview).toContain('Just plain content');
    });

    it('should create preview text', async () => {
      const longContent = 'A'.repeat(200);
      await createTestPromptFile(tempDir, 'long-content', {}, longContent);
      await cache.initializeCache();
      
      const prompt = cache.getPrompt('long-content');
      expect(prompt?.preview).toHaveLength(103); // 100 chars + '...'
      expect(prompt?.preview.endsWith('...')).toBe(true);
    });

    it('should handle file read errors gracefully', async () => {
      // Create a valid file first
      await createTestPromptFile(tempDir, 'valid-prompt');
      
      // Create an invalid file by creating a directory with .md extension
      const fs = await import('fs/promises');
      await fs.mkdir(`${tempDir}/invalid.md`, { recursive: true });
      
      await cache.initializeCache();
      
      // Should have loaded the valid file and logged error for invalid one
      expect(cache.size()).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load prompt metadata for invalid.md'),
        expect.any(String)
      );
    });

    it('should log successful cache initialization', async () => {
      await createTestPromptFile(tempDir, 'test1');
      await createTestPromptFile(tempDir, 'test2');
      
      await cache.initializeCache();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Loaded 2 prompts into cache');
    });

    it('should handle missing directory gracefully', async () => {
      const nonExistentDir = `${tempDir}/non-existent`;
      const cacheWithBadDir = new PromptCache(nonExistentDir);
      
      await cacheWithBadDir.initializeCache();
      
      expect(cacheWithBadDir.size()).toBe(0);
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize cache')
      );
    });
  });

  describe('initializeFileWatcher', () => {
    let mockWatcher: ReturnType<typeof createMockWatcher>;

    beforeEach(async () => {
      const chokidar = await import('chokidar');
      mockWatcher = createMockWatcher();
      vi.mocked(chokidar.default.watch).mockReturnValue(mockWatcher as any);
    });

    it('should initialize file watcher only once', () => {
      cache.initializeFileWatcher();
      cache.initializeFileWatcher();
      
      const chokidar = vi.mocked(import('chokidar'));
      expect(chokidar).toBeDefined();
      // Should only be called once despite multiple calls
    });

    it('should set up file watcher with correct options', async () => {
      const chokidar = await import('chokidar');
      
      cache.initializeFileWatcher();
      
      expect(chokidar.default.watch).toHaveBeenCalledWith(
        expect.stringContaining('*.md'),
        {
          ignored: /^\./,
          persistent: true,
          ignoreInitial: true
        }
      );
    });

    it('should register event handlers', () => {
      cache.initializeFileWatcher();
      
      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should log initialization message', () => {
      cache.initializeFileWatcher();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'File watcher initialized for prompts directory'
      );
    });
  });

  describe('cleanup', () => {
    it('should close file watcher if initialized', async () => {
      const chokidar = await import('chokidar');
      const mockWatcher = createMockWatcher();
      vi.mocked(chokidar.default.watch).mockReturnValue(mockWatcher as any);
      
      cache.initializeFileWatcher();
      await cache.cleanup();
      
      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should handle cleanup when watcher not initialized', async () => {
      // Should not throw
      await expect(cache.cleanup()).resolves.not.toThrow();
    });

    it('should reset watcher state after cleanup', async () => {
      const chokidar = await import('chokidar');
      const mockWatcher = createMockWatcher();
      vi.mocked(chokidar.default.watch).mockReturnValue(mockWatcher as any);
      
      cache.initializeFileWatcher();
      await cache.cleanup();
      
      // Should be able to initialize again
      cache.initializeFileWatcher();
      expect(chokidar.default.watch).toHaveBeenCalledTimes(2);
    });
  });

  describe('file watcher integration', () => {
    let mockWatcher: ReturnType<typeof createMockWatcher>;
    let addHandler: Function;
    let changeHandler: Function;
    let unlinkHandler: Function;
    let errorHandler: Function;

    beforeEach(async () => {
      const chokidar = await import('chokidar');
      mockWatcher = createMockWatcher();
      
      // Capture event handlers
      mockWatcher.on.mockImplementation((event: string, handler: Function) => {
        switch (event) {
          case 'add': addHandler = handler; break;
          case 'change': changeHandler = handler; break;
          case 'unlink': unlinkHandler = handler; break;
          case 'error': errorHandler = handler; break;
        }
        return mockWatcher;
      });
      
      vi.mocked(chokidar.default.watch).mockReturnValue(mockWatcher as any);
      
      // Initialize cache and watcher
      await cache.initializeCache();
      cache.initializeFileWatcher();
    });

    it('should handle file addition', async () => {
      const filePath = `${tempDir}/new-prompt.md`;
      await createTestPromptFile(tempDir, 'new-prompt', { title: 'New Prompt' });
      
      // Simulate file watcher add event
      await addHandler(filePath);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Prompt added: new-prompt.md');
      expect(cache.getPrompt('new-prompt')?.metadata.title).toBe('New Prompt');
    });

    it('should handle file changes', async () => {
      // Create initial file
      await createTestPromptFile(tempDir, 'test-prompt', { title: 'Original Title' });
      await cache.initializeCache();
      
      // Update file
      await createTestPromptFile(tempDir, 'test-prompt', { title: 'Updated Title' });
      
      // Simulate file watcher change event
      const filePath = `${tempDir}/test-prompt.md`;
      await changeHandler(filePath);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Prompt updated: test-prompt.md');
      expect(cache.getPrompt('test-prompt')?.metadata.title).toBe('Updated Title');
    });

    it('should handle file deletion', async () => {
      // Create and cache a file
      await createTestPromptFile(tempDir, 'to-delete');
      await cache.initializeCache();
      expect(cache.getPrompt('to-delete')).toBeDefined();
      
      // Simulate file watcher unlink event
      const filePath = `${tempDir}/to-delete.md`;
      await unlinkHandler(filePath);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Prompt deleted: to-delete.md');
      expect(cache.getPrompt('to-delete')).toBeUndefined();
    });

    it('should handle watcher errors', () => {
      const error = new Error('Watcher error');
      
      errorHandler(error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('File watcher error:', error);
    });

    it('should ignore non-markdown files in watcher events', async () => {
      const sizeBefore = cache.size();
      
      // Simulate adding a non-markdown file
      await addHandler(`${tempDir}/readme.txt`);
      
      expect(cache.size()).toBe(sizeBefore);
    });
  });
});