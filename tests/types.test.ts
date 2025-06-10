/**
 * Tests for type definitions and interfaces
 */

import { describe, it, expect } from 'vitest';
import type { PromptMetadata, PromptInfo, ToolArguments, ServerConfig } from '../src/types.js';

describe('Types', () => {
  describe('PromptMetadata', () => {
    it('should allow all optional fields', () => {
      const metadata: PromptMetadata = {
        title: 'Test Title',
        description: 'Test Description',
        category: 'test',
        tags: ['tag1', 'tag2'],
        difficulty: 'beginner',
        author: 'Test Author',
        version: '1.0'
      };

      expect(metadata.title).toBe('Test Title');
      expect(metadata.description).toBe('Test Description');
      expect(metadata.category).toBe('test');
      expect(metadata.tags).toEqual(['tag1', 'tag2']);
      expect(metadata.difficulty).toBe('beginner');
      expect(metadata.author).toBe('Test Author');
      expect(metadata.version).toBe('1.0');
    });

    it('should allow empty metadata object', () => {
      const metadata: PromptMetadata = {};
      expect(Object.keys(metadata)).toHaveLength(0);
    });

    it('should allow custom fields with unknown type', () => {
      const metadata: PromptMetadata = {
        customField: 'custom value',
        customNumber: 42,
        customBoolean: true,
        customArray: [1, 2, 3],
        customObject: { nested: 'value' }
      };

      expect(metadata.customField).toBe('custom value');
      expect(metadata.customNumber).toBe(42);
      expect(metadata.customBoolean).toBe(true);
      expect(metadata.customArray).toEqual([1, 2, 3]);
      expect(metadata.customObject).toEqual({ nested: 'value' });
    });

    it('should enforce difficulty type constraints', () => {
      // These should compile without issues
      const beginner: PromptMetadata = { difficulty: 'beginner' };
      const intermediate: PromptMetadata = { difficulty: 'intermediate' };
      const advanced: PromptMetadata = { difficulty: 'advanced' };

      expect(beginner.difficulty).toBe('beginner');
      expect(intermediate.difficulty).toBe('intermediate');
      expect(advanced.difficulty).toBe('advanced');
    });
  });

  describe('PromptInfo', () => {
    it('should require all fields', () => {
      const promptInfo: PromptInfo = {
        name: 'test-prompt',
        metadata: {
          title: 'Test Prompt',
          description: 'A test prompt'
        },
        preview: 'This is a preview of the prompt content...'
      };

      expect(promptInfo.name).toBe('test-prompt');
      expect(promptInfo.metadata.title).toBe('Test Prompt');
      expect(promptInfo.metadata.description).toBe('A test prompt');
      expect(promptInfo.preview).toBe('This is a preview of the prompt content...');
    });

    it('should work with minimal metadata', () => {
      const promptInfo: PromptInfo = {
        name: 'minimal-prompt',
        metadata: {},
        preview: 'Minimal preview'
      };

      expect(promptInfo.name).toBe('minimal-prompt');
      expect(Object.keys(promptInfo.metadata)).toHaveLength(0);
      expect(promptInfo.preview).toBe('Minimal preview');
    });
  });

  describe('ToolArguments', () => {
    it('should require name field', () => {
      const args: ToolArguments = {
        name: 'test-prompt'
      };

      expect(args.name).toBe('test-prompt');
      expect(args.content).toBeUndefined();
    });

    it('should allow optional content field', () => {
      const args: ToolArguments = {
        name: 'test-prompt',
        content: 'Test content for the prompt'
      };

      expect(args.name).toBe('test-prompt');
      expect(args.content).toBe('Test content for the prompt');
    });
  });

  describe('ServerConfig', () => {
    it('should require all fields', () => {
      const config: ServerConfig = {
        name: 'test-server',
        version: '1.0.0',
        promptsDir: '/path/to/prompts'
      };

      expect(config.name).toBe('test-server');
      expect(config.version).toBe('1.0.0');
      expect(config.promptsDir).toBe('/path/to/prompts');
    });
  });

  describe('Type compatibility', () => {
    it('should work together in realistic scenarios', () => {
      const config: ServerConfig = {
        name: 'prompts-mcp-server',
        version: '1.0.0',
        promptsDir: '/app/prompts'
      };

      const metadata: PromptMetadata = {
        title: 'Code Review Assistant',
        description: 'Helps review code for quality and issues',
        category: 'development',
        tags: ['code-review', 'quality'],
        difficulty: 'intermediate',
        author: 'System',
        version: '1.0'
      };

      const promptInfo: PromptInfo = {
        name: 'code-review',
        metadata,
        preview: 'You are an experienced software engineer performing a code review...'
      };

      const toolArgs: ToolArguments = {
        name: promptInfo.name,
        content: '# Code Review Prompt\n\nYou are an experienced software engineer...'
      };

      expect(config.name).toBe('prompts-mcp-server');
      expect(promptInfo.metadata.difficulty).toBe('intermediate');
      expect(toolArgs.name).toBe('code-review');
      expect(toolArgs.content).toContain('Code Review Prompt');
    });
  });
});