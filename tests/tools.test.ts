/**
 * Tests for PromptTools class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptTools } from '../src/tools.js';
import { createSamplePromptInfo, createMockCallToolRequest, createExpectedResponse } from './helpers/testUtils.js';
import { MockPromptFileOperations } from './helpers/mocks.js';

describe('PromptTools', () => {
  let mockFileOps: MockPromptFileOperations;
  let tools: PromptTools;

  beforeEach(() => {
    mockFileOps = new MockPromptFileOperations();
    tools = new PromptTools(mockFileOps as any);
  });

  describe('constructor', () => {
    it('should create instance with file operations dependency', () => {
      expect(tools).toBeDefined();
      expect(tools).toBeInstanceOf(PromptTools);
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all tool definitions', () => {
      const definitions = tools.getToolDefinitions();
      
      expect(definitions.tools).toHaveLength(5);
      
      const toolNames = definitions.tools.map(tool => tool.name);
      expect(toolNames).toEqual([
        'add_prompt',
        'get_prompt',
        'list_prompts',
        'delete_prompt',
        'create_structured_prompt'
      ]);
    });

    it('should have correct add_prompt tool definition', () => {
      const definitions = tools.getToolDefinitions();
      const addPromptTool = definitions.tools.find(tool => tool.name === 'add_prompt');
      
      expect(addPromptTool).toBeDefined();
      expect(addPromptTool?.description).toBe('Add a new prompt to the collection');
      expect(addPromptTool?.inputSchema.required).toEqual(['name', 'filename', 'content']);
      expect(addPromptTool?.inputSchema.properties).toHaveProperty('name');
      expect(addPromptTool?.inputSchema.properties).toHaveProperty('filename');
      expect(addPromptTool?.inputSchema.properties).toHaveProperty('content');
    });

    it('should have correct get_prompt tool definition', () => {
      const definitions = tools.getToolDefinitions();
      const getPromptTool = definitions.tools.find(tool => tool.name === 'get_prompt');
      
      expect(getPromptTool).toBeDefined();
      expect(getPromptTool?.description).toBe('Retrieve a prompt by name');
      expect(getPromptTool?.inputSchema.required).toEqual(['name']);
      expect(getPromptTool?.inputSchema.properties).toHaveProperty('name');
    });

    it('should have correct list_prompts tool definition', () => {
      const definitions = tools.getToolDefinitions();
      const listPromptsTool = definitions.tools.find(tool => tool.name === 'list_prompts');
      
      expect(listPromptsTool).toBeDefined();
      expect(listPromptsTool?.description).toBe('List all available prompts');
      expect(listPromptsTool?.inputSchema.properties).toEqual({});
    });

    it('should have correct delete_prompt tool definition', () => {
      const definitions = tools.getToolDefinitions();
      const deletePromptTool = definitions.tools.find(tool => tool.name === 'delete_prompt');
      
      expect(deletePromptTool).toBeDefined();
      expect(deletePromptTool?.description).toBe('Delete a prompt by name');
      expect(deletePromptTool?.inputSchema.required).toEqual(['name']);
      expect(deletePromptTool?.inputSchema.properties).toHaveProperty('name');
    });
  });

  describe('handleToolCall', () => {
    describe('add_prompt', () => {
      it('should add prompt with automatic metadata when none exists', async () => {
        const request = createMockCallToolRequest('add_prompt', {
          name: 'test-prompt',
          filename: 'test-prompt-file',
          content: '# Test Prompt\n\nThis is a test.'
        });
        
        mockFileOps.savePromptWithFilename.mockResolvedValue('test-prompt-file.md');
        
        const result = await tools.handleToolCall(request as any);
        
        // Should call savePromptWithFilename with content enhanced with metadata
        expect(mockFileOps.savePromptWithFilename).toHaveBeenCalledWith(
          'test-prompt-file',
          expect.stringContaining('title: "Test Prompt"')
        );
        expect(mockFileOps.savePromptWithFilename).toHaveBeenCalledWith(
          'test-prompt-file',
          expect.stringContaining('# Test Prompt\n\nThis is a test.')
        );
        expect(result).toEqual(createExpectedResponse(
          'Prompt "test-prompt" saved as test-prompt-file.md'
        ));
      });

      it('should preserve existing frontmatter when present', async () => {
        const contentWithFrontmatter = `---
title: "Existing Title"
category: "custom"
---

# Test Prompt

This already has metadata.`;
        
        const request = createMockCallToolRequest('add_prompt', {
          name: 'test-prompt',
          filename: 'test-prompt-file',
          content: contentWithFrontmatter
        });
        
        mockFileOps.savePromptWithFilename.mockResolvedValue('test-prompt-file.md');
        
        const result = await tools.handleToolCall(request as any);
        
        // Should call savePromptWithFilename with original content unchanged
        expect(mockFileOps.savePromptWithFilename).toHaveBeenCalledWith(
          'test-prompt-file',
          contentWithFrontmatter
        );
        expect(result).toEqual(createExpectedResponse(
          'Prompt "test-prompt" saved as test-prompt-file.md'
        ));
      });

      it('should handle missing content parameter', async () => {
        const request = createMockCallToolRequest('add_prompt', {
          name: 'test-prompt'
          // filename and content are missing
        });
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Name, filename, and content are required for add_prompt',
          true
        ));
        expect(mockFileOps.savePrompt).not.toHaveBeenCalled();
      });

      it('should handle file operation errors', async () => {
        const request = createMockCallToolRequest('add_prompt', {
          name: 'test-prompt',
          filename: 'test-prompt-file',
          content: 'test content'
        });
        
        mockFileOps.savePromptWithFilename.mockRejectedValue(new Error('Disk full'));
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Disk full',
          true
        ));
      });
    });

    describe('get_prompt', () => {
      it('should retrieve prompt successfully', async () => {
        const request = createMockCallToolRequest('get_prompt', {
          name: 'test-prompt'
        });
        
        const promptContent = '# Test Prompt\n\nThis is the full content.';
        mockFileOps.readPrompt.mockResolvedValue(promptContent);
        
        const result = await tools.handleToolCall(request as any);
        
        expect(mockFileOps.readPrompt).toHaveBeenCalledWith('test-prompt');
        expect(result).toEqual(createExpectedResponse(promptContent));
      });

      it('should handle non-existent prompt', async () => {
        const request = createMockCallToolRequest('get_prompt', {
          name: 'non-existent'
        });
        
        mockFileOps.readPrompt.mockRejectedValue(new Error('Prompt "non-existent" not found'));
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Prompt "non-existent" not found',
          true
        ));
      });
    });

    describe('list_prompts', () => {
      it('should list prompts with metadata formatting', async () => {
        const request = createMockCallToolRequest('list_prompts', {});
        
        const samplePrompts = [
          createSamplePromptInfo({
            name: 'prompt1',
            metadata: { title: 'Prompt 1', category: 'test' },
            preview: 'This is prompt 1 preview...'
          }),
          createSamplePromptInfo({
            name: 'prompt2',
            metadata: { title: 'Prompt 2', difficulty: 'advanced' },
            preview: 'This is prompt 2 preview...'
          })
        ];
        
        mockFileOps.listPrompts.mockResolvedValue(samplePrompts);
        
        const result = await tools.handleToolCall(request as any);
        
        expect(mockFileOps.listPrompts).toHaveBeenCalled();
        expect(result.content[0].type).toBe('text');
        
        const text = result.content[0].text as string;
        expect(text).toContain('# Available Prompts');
        expect(text).toContain('## prompt1');
        expect(text).toContain('## prompt2');
        expect(text).toContain('**Metadata:**');
        expect(text).toContain('- title: Prompt 1');
        expect(text).toContain('- category: test');
        expect(text).toContain('**Preview:** This is prompt 1 preview...');
        expect(text).toContain('---'); // Separator between prompts
      });

      it('should handle empty prompt list', async () => {
        const request = createMockCallToolRequest('list_prompts', {});
        
        mockFileOps.listPrompts.mockResolvedValue([]);
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse('No prompts available'));
      });

      it('should handle prompts with no metadata', async () => {
        const request = createMockCallToolRequest('list_prompts', {});
        
        const promptWithoutMetadata = createSamplePromptInfo({
          name: 'simple-prompt',
          metadata: {},
          preview: 'Simple prompt preview...'
        });
        
        mockFileOps.listPrompts.mockResolvedValue([promptWithoutMetadata]);
        
        const result = await tools.handleToolCall(request as any);
        
        const text = result.content[0].text as string;
        expect(text).toContain('## simple-prompt');
        expect(text).not.toContain('**Metadata:**');
        expect(text).toContain('**Preview:** Simple prompt preview...');
      });

      it('should handle file operation errors', async () => {
        const request = createMockCallToolRequest('list_prompts', {});
        
        mockFileOps.listPrompts.mockRejectedValue(new Error('Directory not accessible'));
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Directory not accessible',
          true
        ));
      });
    });

    describe('delete_prompt', () => {
      it('should delete prompt successfully', async () => {
        const request = createMockCallToolRequest('delete_prompt', {
          name: 'test-prompt'
        });
        
        mockFileOps.deletePrompt.mockResolvedValue(true);
        
        const result = await tools.handleToolCall(request as any);
        
        expect(mockFileOps.deletePrompt).toHaveBeenCalledWith('test-prompt');
        expect(result).toEqual(createExpectedResponse(
          'Prompt "test-prompt" deleted successfully'
        ));
      });

      it('should handle non-existent prompt deletion', async () => {
        const request = createMockCallToolRequest('delete_prompt', {
          name: 'non-existent'
        });
        
        mockFileOps.deletePrompt.mockRejectedValue(new Error('Prompt "non-existent" not found'));
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Prompt "non-existent" not found',
          true
        ));
      });
    });

    describe('unknown tool', () => {
      it('should handle unknown tool name', async () => {
        const request = createMockCallToolRequest('unknown_tool', {});
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Unknown tool: unknown_tool',
          true
        ));
      });
    });

    describe('error handling', () => {
      it('should handle non-Error exceptions', async () => {
        const request = createMockCallToolRequest('get_prompt', { name: 'test' });
        
        // Mock a non-Error exception
        mockFileOps.readPrompt.mockRejectedValue('String error');
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Unknown error',
          true
        ));
      });

      it('should handle null/undefined exceptions', async () => {
        const request = createMockCallToolRequest('get_prompt', { name: 'test' });
        
        mockFileOps.readPrompt.mockRejectedValue(null);
        
        const result = await tools.handleToolCall(request as any);
        
        expect(result).toEqual(createExpectedResponse(
          'Error: Unknown error',
          true
        ));
      });
    });
  });

  describe('formatPromptsList', () => {
    it('should format single prompt correctly', async () => {
      const request = createMockCallToolRequest('list_prompts', {});
      
      const singlePrompt = createSamplePromptInfo({
        name: 'single-prompt',
        metadata: {
          title: 'Single Prompt',
          description: 'A single test prompt',
          tags: ['test']
        },
        preview: 'This is the preview text...'
      });
      
      mockFileOps.listPrompts.mockResolvedValue([singlePrompt]);
      
      const result = await tools.handleToolCall(request as any);
      const text = result.content[0].text as string;
      
      expect(text).toContain('# Available Prompts');
      expect(text).toContain('## single-prompt');
      expect(text).toContain('- title: Single Prompt');
      expect(text).toContain('- description: A single test prompt');
      expect(text).toContain('- tags: test');
      expect(text).toContain('**Preview:** This is the preview text...');
      expect(text).not.toContain('---'); // No separator for single prompt
    });

    it('should handle complex metadata values', async () => {
      const request = createMockCallToolRequest('list_prompts', {});
      
      const complexPrompt = createSamplePromptInfo({
        name: 'complex-prompt',
        metadata: {
          title: 'Complex Prompt',
          tags: ['tag1', 'tag2', 'tag3'],
          customObject: { nested: 'value', array: [1, 2, 3] },
          customBoolean: true,
          customNumber: 42
        },
        preview: 'Complex preview...'
      });
      
      mockFileOps.listPrompts.mockResolvedValue([complexPrompt]);
      
      const result = await tools.handleToolCall(request as any);
      const text = result.content[0].text as string;
      
      expect(text).toContain('- tags: tag1,tag2,tag3');
      expect(text).toContain('- customBoolean: true');
      expect(text).toContain('- customNumber: 42');
      expect(text).toContain('- customObject: [object Object]');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow', async () => {
      // Add a prompt
      const addRequest = createMockCallToolRequest('add_prompt', {
        name: 'workflow-test',
        filename: 'workflow-test-file',
        content: '# Workflow Test\n\nTest content'
      });
      
      mockFileOps.savePromptWithFilename.mockResolvedValue('workflow-test-file.md');
      
      let result = await tools.handleToolCall(addRequest as any);
      expect(result.content[0].text).toContain('saved as workflow-test-file.md');
      
      // List prompts
      const listRequest = createMockCallToolRequest('list_prompts', {});
      const samplePrompt = createSamplePromptInfo({ name: 'workflow-test' });
      mockFileOps.listPrompts.mockResolvedValue([samplePrompt]);
      
      result = await tools.handleToolCall(listRequest as any);
      expect(result.content[0].text).toContain('workflow-test');
      
      // Get specific prompt
      const getRequest = createMockCallToolRequest('get_prompt', {
        name: 'workflow-test'
      });
      
      mockFileOps.readPrompt.mockResolvedValue('# Workflow Test\n\nTest content');
      
      result = await tools.handleToolCall(getRequest as any);
      expect(result.content[0].text).toContain('Test content');
      
      // Delete prompt
      const deleteRequest = createMockCallToolRequest('delete_prompt', {
        name: 'workflow-test'
      });
      
      mockFileOps.deletePrompt.mockResolvedValue(true);
      
      result = await tools.handleToolCall(deleteRequest as any);
      expect(result.content[0].text).toContain('deleted successfully');
    });
  });

  describe('create_structured_prompt', () => {
    it('should create structured prompt with all metadata', async () => {
      const request = createMockCallToolRequest('create_structured_prompt', {
        name: 'test-structured',
        title: 'Test Structured Prompt',
        description: 'A test prompt with full metadata',
        category: 'testing',
        tags: ['test', 'structured'],
        difficulty: 'intermediate',
        author: 'Test Author',
        content: '# Test Content\n\nThis is structured content.'
      });
      
      mockFileOps.savePrompt.mockResolvedValue('test-structured.md');
      
      const result = await tools.handleToolCall(request as any);
      
      // Should call savePrompt with structured frontmatter
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'test-structured',
        expect.stringContaining('title: "Test Structured Prompt"')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'test-structured',
        expect.stringContaining('category: "testing"')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'test-structured',
        expect.stringContaining('tags: ["test","structured"]')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'test-structured',
        expect.stringContaining('difficulty: "intermediate"')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'test-structured',
        expect.stringContaining('# Test Content')
      );
      
      expect(result.content[0].text).toContain('Structured prompt "test-structured" created successfully');
      expect(result.content[0].text).toContain('Category: testing');
      expect(result.content[0].text).toContain('Tags: test, structured');
    });

    it('should use defaults for optional fields', async () => {
      const request = createMockCallToolRequest('create_structured_prompt', {
        name: 'minimal-structured',
        title: 'Minimal Prompt',
        description: 'A minimal prompt',
        content: 'Just content.'
      });
      
      mockFileOps.savePrompt.mockResolvedValue('minimal-structured.md');
      
      const result = await tools.handleToolCall(request as any);
      
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'minimal-structured',
        expect.stringContaining('category: "general"')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'minimal-structured',
        expect.stringContaining('tags: ["general"]')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'minimal-structured',
        expect.stringContaining('difficulty: "beginner"')
      );
      expect(mockFileOps.savePrompt).toHaveBeenCalledWith(
        'minimal-structured',
        expect.stringContaining('author: "User"')
      );
    });

    it('should handle missing required fields', async () => {
      const request = createMockCallToolRequest('create_structured_prompt', {
        name: 'incomplete',
        title: 'Missing Description'
        // Missing description and content
      });
      
      const result = await tools.handleToolCall(request as any);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Name, content, title, and description are required');
    });
  });
});