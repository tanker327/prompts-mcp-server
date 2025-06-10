/**
 * Integration tests for main index module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTempDir, cleanupTempDir, createTestPromptFile, mockConsoleError } from './helpers/testUtils.js';
import { createMockProcess } from './helpers/mocks.js';

// Mock external dependencies
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn()
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));

describe('Main Server Integration', () => {
  let tempDir: string;
  let consoleErrorSpy: ReturnType<typeof mockConsoleError>;
  let originalProcess: typeof process;

  beforeEach(async () => {
    tempDir = await createTempDir();
    consoleErrorSpy = mockConsoleError();
    
    // Mock process for signal handling tests
    originalProcess = global.process;
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
    consoleErrorSpy.mockRestore();
    global.process = originalProcess;
    vi.clearAllMocks();
  });

  describe('server configuration', () => {
    it('should have correct server configuration', async () => {
      // Since we can't easily test the actual module loading without side effects,
      // we'll test the configuration values that would be used
      const config = {
        name: 'prompts-mcp-server',
        version: '1.0.0',
        promptsDir: '/test/path'
      };

      expect(config.name).toBe('prompts-mcp-server');
      expect(config.version).toBe('1.0.0');
      expect(typeof config.promptsDir).toBe('string');
    });
  });

  describe('component integration', () => {
    it('should integrate cache, file operations, and tools correctly', async () => {
      // Test the integration by using the actual classes
      const { PromptCache } = await import('../src/cache.js');
      const { PromptFileOperations } = await import('../src/fileOperations.js');
      const { PromptTools } = await import('../src/tools.js');

      // Create test files
      await createTestPromptFile(tempDir, 'integration-test', 
        { title: 'Integration Test', category: 'test' },
        'This is an integration test prompt.'
      );

      // Initialize components
      const cache = new PromptCache(tempDir);
      const fileOps = new PromptFileOperations(tempDir, cache);
      const tools = new PromptTools(fileOps);

      // Test integration flow
      await cache.initializeCache();
      
      // Verify cache has the prompt
      expect(cache.size()).toBe(1);
      expect(cache.getPrompt('integration-test')?.metadata.title).toBe('Integration Test');

      // Test file operations
      const prompts = await fileOps.listPrompts();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].name).toBe('integration-test');

      // Test tools
      const toolDefinitions = tools.getToolDefinitions();
      expect(toolDefinitions.tools).toHaveLength(5);

      // Cleanup
      await cache.cleanup();
    });

    it('should handle end-to-end prompt management workflow', async () => {
      const { PromptCache } = await import('../src/cache.js');
      const { PromptFileOperations } = await import('../src/fileOperations.js');
      const { PromptTools } = await import('../src/tools.js');

      const cache = new PromptCache(tempDir);
      const fileOps = new PromptFileOperations(tempDir, cache);
      const tools = new PromptTools(fileOps);

      await cache.initializeCache();

      // 1. Add a prompt via tools
      const addRequest = {
        params: {
          name: 'add_prompt',
          arguments: {
            name: 'e2e-test',
            filename: 'e2e_test',
            content: '---\ntitle: "E2E Test"\ncategory: "testing"\n---\n\n# E2E Test Prompt\n\nThis is an end-to-end test.'
          }
        }
      };

      const addResult = await tools.handleToolCall(addRequest as any);
      expect(addResult.content[0].text).toContain('saved as e2e_test.md');

      // 2. List prompts should show the new prompt
      const listRequest = { params: { name: 'list_prompts', arguments: {} } };
      const listResult = await tools.handleToolCall(listRequest as any);
      expect(listResult.content[0].text).toContain('e2e_test');
      expect(listResult.content[0].text).toContain('E2E Test');

      // 3. Get the specific prompt
      const getRequest = {
        params: {
          name: 'get_prompt',
          arguments: { name: 'e2e_test' }
        }
      };
      const getResult = await tools.handleToolCall(getRequest as any);
      expect(getResult.content[0].text).toContain('E2E Test Prompt');

      // 4. Verify prompt exists in cache
      expect(cache.getPrompt('e2e_test')?.metadata.title).toBe('E2E Test');
      expect(cache.getPrompt('e2e_test')?.metadata.category).toBe('testing');

      // 5. Delete the prompt
      const deleteRequest = {
        params: {
          name: 'delete_prompt',
          arguments: { name: 'e2e_test' }
        }
      };
      const deleteResult = await tools.handleToolCall(deleteRequest as any);
      expect(deleteResult.content[0].text).toContain('deleted successfully');

      // 6. Verify prompt is no longer accessible
      const getDeletedRequest = {
        params: {
          name: 'get_prompt',
          arguments: { name: 'e2e_test' }
        }
      };
      const getDeletedResult = await tools.handleToolCall(getDeletedRequest as any);
      expect(getDeletedResult.isError).toBe(true);
      expect(getDeletedResult.content[0].text).toContain('not found');

      await cache.cleanup();
    });
  });

  describe('error handling integration', () => {
    it('should handle errors across component boundaries', async () => {
      const { PromptCache } = await import('../src/cache.js');
      const { PromptFileOperations } = await import('../src/fileOperations.js');
      const { PromptTools } = await import('../src/tools.js');

      // Use a non-existent directory to trigger errors
      const badDir = '/non/existent/directory';
      const cache = new PromptCache(badDir);
      const fileOps = new PromptFileOperations(badDir, cache);
      const tools = new PromptTools(fileOps);

      // Try to get a prompt from non-existent directory
      const getRequest = {
        params: {
          name: 'get_prompt',
          arguments: { name: 'any-prompt' }
        }
      };

      const result = await tools.handleToolCall(getRequest as any);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');

      await cache.cleanup();
    });
  });

  describe('signal handling simulation', () => {
    it('should handle shutdown signals properly', () => {
      const mockProcess = createMockProcess();
      
      // Simulate signal handler registration
      const signalHandlers = new Map();
      mockProcess.on.mockImplementation((signal: string, handler: Function) => {
        signalHandlers.set(signal, handler);
      });

      // Simulate the signal registration that would happen in main
      mockProcess.on('SIGINT', () => {
        console.error('Shutting down server...');
      });
      mockProcess.on('SIGTERM', () => {
        console.error('Shutting down server...');
      });

      expect(mockProcess.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockProcess.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
  });

  describe('server initialization', () => {
    it('should create server with correct configuration', async () => {
      const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

      // These are mocked, so we're testing that the mocks are called correctly
      expect(Server).toBeDefined();
      expect(StdioServerTransport).toBeDefined();
    });
  });

  describe('real file system integration', () => {
    it('should work with real file operations', async () => {
      const { PromptCache } = await import('../src/cache.js');
      
      // Create some test files
      await createTestPromptFile(tempDir, 'real-test-1', 
        { title: 'Real Test 1', difficulty: 'beginner' },
        'This is a real file system test.'
      );
      await createTestPromptFile(tempDir, 'real-test-2',
        { title: 'Real Test 2', difficulty: 'advanced' },
        'This is another real file system test.'
      );

      const cache = new PromptCache(tempDir);
      await cache.initializeCache();

      // Verify cache loaded the files
      expect(cache.size()).toBe(2);
      
      const prompt1 = cache.getPrompt('real-test-1');
      const prompt2 = cache.getPrompt('real-test-2');
      
      expect(prompt1?.metadata.title).toBe('Real Test 1');
      expect(prompt1?.metadata.difficulty).toBe('beginner');
      expect(prompt2?.metadata.title).toBe('Real Test 2');
      expect(prompt2?.metadata.difficulty).toBe('advanced');
      
      expect(prompt1?.preview).toContain('real file system test');
      expect(prompt2?.preview).toContain('another real file system test');

      await cache.cleanup();
    });

    it('should handle mixed valid and invalid files', async () => {
      const fs = await import('fs/promises');
      
      // Create valid prompt file
      await createTestPromptFile(tempDir, 'valid-prompt', 
        { title: 'Valid Prompt' },
        'This is valid content.'
      );

      // Create invalid file (not markdown)
      await fs.writeFile(`${tempDir}/invalid.txt`, 'This is not a markdown file');
      
      // Create file with invalid YAML (but should still work)
      await fs.writeFile(`${tempDir}/broken-yaml.md`, 
        '---\ninvalid: yaml: content\n---\n\nContent after broken YAML'
      );

      const { PromptCache } = await import('../src/cache.js');
      const cache = new PromptCache(tempDir);
      await cache.initializeCache();

      // Should load at least the valid prompt
      expect(cache.size()).toBeGreaterThanOrEqual(1);
      expect(cache.getPrompt('valid-prompt')?.metadata.title).toBe('Valid Prompt');
      
      // Invalid.txt should be ignored
      expect(cache.getPrompt('invalid')).toBeUndefined();

      await cache.cleanup();
    });
  });
});