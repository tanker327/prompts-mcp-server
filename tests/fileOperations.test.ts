/**
 * Tests for PromptFileOperations class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PromptFileOperations } from '../src/fileOperations.js';
import { createTempDir, cleanupTempDir, createTestPromptFile, createSamplePromptInfo } from './helpers/testUtils.js';
import { MockPromptCache } from './helpers/mocks.js';

describe('PromptFileOperations', () => {
  let tempDir: string;
  let mockCache: MockPromptCache;
  let fileOps: PromptFileOperations;

  beforeEach(async () => {
    tempDir = await createTempDir();
    mockCache = new MockPromptCache();
    fileOps = new PromptFileOperations(tempDir, mockCache as any);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('constructor', () => {
    it('should create instance with provided directory and cache', () => {
      expect(fileOps).toBeDefined();
      expect(fileOps).toBeInstanceOf(PromptFileOperations);
    });
  });

  describe('listPrompts', () => {
    it('should initialize cache when empty', async () => {
      mockCache.isEmpty.mockReturnValue(true);
      
      await fileOps.listPrompts();
      
      expect(mockCache.initializeCache).toHaveBeenCalled();
      expect(mockCache.initializeFileWatcher).toHaveBeenCalled();
      expect(mockCache.getAllPrompts).toHaveBeenCalled();
    });

    it('should use cached data when cache is not empty', async () => {
      const samplePrompts = [createSamplePromptInfo()];
      mockCache.isEmpty.mockReturnValue(false);
      mockCache.getAllPrompts.mockReturnValue(samplePrompts);
      
      const result = await fileOps.listPrompts();
      
      expect(mockCache.initializeCache).not.toHaveBeenCalled();
      expect(mockCache.initializeFileWatcher).not.toHaveBeenCalled();
      expect(mockCache.getAllPrompts).toHaveBeenCalled();
      expect(result).toEqual(samplePrompts);
    });

    it('should return empty array when no prompts exist', async () => {
      mockCache.isEmpty.mockReturnValue(true);
      mockCache.getAllPrompts.mockReturnValue([]);
      
      const result = await fileOps.listPrompts();
      
      expect(result).toEqual([]);
    });
  });

  describe('readPrompt', () => {
    it('should read existing prompt file', async () => {
      const content = '# Test Prompt\n\nThis is a test prompt.';
      await createTestPromptFile(tempDir, 'test-prompt', {}, content);
      
      const result = await fileOps.readPrompt('test-prompt');
      
      expect(result).toContain('This is a test prompt.');
    });

    it('should sanitize prompt name for file lookup', async () => {
      const content = 'Test content';
      // Create file with sanitized name (what the sanitization function would produce)
      await createTestPromptFile(tempDir, 'test_prompt_with_special_chars___', {}, content);
      
      // Test with unsanitized name
      const result = await fileOps.readPrompt('Test Prompt With Special Chars!@#');
      
      expect(result).toContain('Test content');
    });

    it('should throw error for non-existent prompt', async () => {
      await expect(fileOps.readPrompt('non-existent')).rejects.toThrow(
        'Prompt "non-existent" not found'
      );
    });

    it('should handle file read errors', async () => {
      // Try to read from a directory that doesn't exist
      const badFileOps = new PromptFileOperations('/non/existent/path', mockCache as any);
      
      await expect(badFileOps.readPrompt('any-prompt')).rejects.toThrow(
        'Prompt "any-prompt" not found'
      );
    });
  });

  describe('savePrompt', () => {
    it('should save prompt to file', async () => {
      const content = '# New Prompt\n\nThis is a new prompt.';
      
      const fileName = await fileOps.savePrompt('new-prompt', content);
      
      expect(fileName).toBe('new-prompt.md');
      
      // Verify file was created
      const savedContent = await fileOps.readPrompt('new-prompt');
      expect(savedContent).toBe(content);
    });

    it('should sanitize filename', async () => {
      const content = 'Test content';
      
      const fileName = await fileOps.savePrompt('Test Prompt With Special Chars!@#', content);
      
      expect(fileName).toBe('test_prompt_with_special_chars___.md');
      
      // Should be readable with sanitized name
      const savedContent = await fileOps.readPrompt('test_prompt_with_special_chars___');
      expect(savedContent).toBe(content);
    });

    it('should create prompts directory if it does not exist', async () => {
      const newDir = `${tempDir}/new-prompts-dir`;
      const newFileOps = new PromptFileOperations(newDir, mockCache as any);
      
      const fileName = await newFileOps.savePrompt('test', 'content');
      
      expect(fileName).toBe('test.md');
      
      // Should be able to read the file
      const content = await newFileOps.readPrompt('test');
      expect(content).toBe('content');
    });

    it('should overwrite existing files', async () => {
      const originalContent = 'Original content';
      const updatedContent = 'Updated content';
      
      await fileOps.savePrompt('test-prompt', originalContent);
      await fileOps.savePrompt('test-prompt', updatedContent);
      
      const result = await fileOps.readPrompt('test-prompt');
      expect(result).toBe(updatedContent);
    });
  });

  describe('deletePrompt', () => {
    it('should delete existing prompt file', async () => {
      await createTestPromptFile(tempDir, 'to-delete');
      
      const result = await fileOps.deletePrompt('to-delete');
      
      expect(result).toBe(true);
      
      // File should no longer exist
      await expect(fileOps.readPrompt('to-delete')).rejects.toThrow(
        'Prompt "to-delete" not found'
      );
    });

    it('should sanitize prompt name for deletion', async () => {
      await createTestPromptFile(tempDir, 'prompt_with_special_chars___');
      
      const result = await fileOps.deletePrompt('Prompt With Special Chars!@#');
      
      expect(result).toBe(true);
      
      // Should not be readable anymore
      await expect(fileOps.readPrompt('Prompt With Special Chars!@#')).rejects.toThrow();
    });

    it('should throw error when deleting non-existent prompt', async () => {
      await expect(fileOps.deletePrompt('non-existent')).rejects.toThrow(
        'Prompt "non-existent" not found'
      );
    });
  });

  describe('promptExists', () => {
    it('should return true for existing prompt', async () => {
      await createTestPromptFile(tempDir, 'existing-prompt');
      
      const exists = await fileOps.promptExists('existing-prompt');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent prompt', async () => {
      const exists = await fileOps.promptExists('non-existent');
      
      expect(exists).toBe(false);
    });

    it('should sanitize prompt name for existence check', async () => {
      await createTestPromptFile(tempDir, 'prompt_with_special_chars___');
      
      const exists = await fileOps.promptExists('Prompt With Special Chars!@#');
      
      expect(exists).toBe(true);
    });
  });

  describe('getPromptInfo', () => {
    it('should delegate to cache', () => {
      const samplePrompt = createSamplePromptInfo();
      mockCache.getPrompt.mockReturnValue(samplePrompt);
      
      const result = fileOps.getPromptInfo('test-prompt');
      
      expect(mockCache.getPrompt).toHaveBeenCalledWith('test-prompt');
      expect(result).toBe(samplePrompt);
    });

    it('should return undefined when prompt not in cache', () => {
      mockCache.getPrompt.mockReturnValue(undefined);
      
      const result = fileOps.getPromptInfo('non-existent');
      
      expect(result).toBeUndefined();
    });
  });

  describe('filename sanitization', () => {
    it('should convert to lowercase', async () => {
      await fileOps.savePrompt('UPPERCASE', 'content');
      const content = await fileOps.readPrompt('UPPERCASE');
      expect(content).toBe('content');
    });

    it('should replace special characters with underscores', async () => {
      const testCases = [
        { input: 'hello world', expected: 'hello_world' },
        { input: 'hello@world', expected: 'hello_world' },
        { input: 'hello#world', expected: 'hello_world' },
        { input: 'UPPERCASE', expected: 'uppercase' }
      ];

      for (const testCase of testCases) {
        await fileOps.savePrompt(testCase.input, `content for ${testCase.input}`);
        const content = await fileOps.readPrompt(testCase.input);
        expect(content).toBe(`content for ${testCase.input}`);
      }
    });

    it('should preserve allowed characters', async () => {
      const allowedNames = [
        'simple-name',
        'name_with_underscores',
        'name123',
        'abc-def_ghi789'
      ];

      for (const name of allowedNames) {
        await fileOps.savePrompt(name, `content for ${name}`);
        const content = await fileOps.readPrompt(name);
        expect(content).toBe(`content for ${name}`);
      }
    });
  });

  describe('integration with cache', () => {
    it('should work correctly when cache is populated', async () => {
      const samplePrompts = [
        createSamplePromptInfo({ name: 'prompt1' }),
        createSamplePromptInfo({ name: 'prompt2' })
      ];
      
      mockCache.isEmpty.mockReturnValue(false);
      mockCache.getAllPrompts.mockReturnValue(samplePrompts);
      mockCache.getPrompt.mockImplementation(name => 
        samplePrompts.find(p => p.name === name)
      );
      
      const allPrompts = await fileOps.listPrompts();
      const specificPrompt = fileOps.getPromptInfo('prompt1');
      
      expect(allPrompts).toEqual(samplePrompts);
      expect(specificPrompt?.name).toBe('prompt1');
    });

    it('should handle cache initialization properly', async () => {
      // Create actual files
      await createTestPromptFile(tempDir, 'real-prompt1', { title: 'Real Prompt 1' });
      await createTestPromptFile(tempDir, 'real-prompt2', { title: 'Real Prompt 2' });
      
      // Use real cache for this test
      const realCache = new (await import('../src/cache.js')).PromptCache(tempDir);
      const realFileOps = new PromptFileOperations(tempDir, realCache);
      
      const prompts = await realFileOps.listPrompts();
      
      expect(prompts).toHaveLength(2);
      expect(prompts.some(p => p.name === 'real-prompt1')).toBe(true);
      expect(prompts.some(p => p.name === 'real-prompt2')).toBe(true);
      
      await realCache.cleanup();
    });
  });
});