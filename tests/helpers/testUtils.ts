/**
 * Test utilities and helper functions
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { vi } from 'vitest';
import { PromptInfo, PromptMetadata } from '../../src/types.js';

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompts-test-'));
  return tempDir;
}

/**
 * Clean up temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Create a test prompt file
 */
export async function createTestPromptFile(
  dir: string,
  name: string,
  metadata: PromptMetadata = {},
  content: string = 'Test prompt content'
): Promise<string> {
  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });
  
  const frontmatter = Object.keys(metadata).length > 0
    ? `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`
    : '';
  
  const fullContent = frontmatter + content;
  const fileName = `${name}.md`;
  const filePath = path.join(dir, fileName);
  
  await fs.writeFile(filePath, fullContent, 'utf-8');
  return filePath;
}

/**
 * Create sample prompt info for testing
 */
export function createSamplePromptInfo(overrides: Partial<PromptInfo> = {}): PromptInfo {
  return {
    name: 'test-prompt',
    metadata: {
      title: 'Test Prompt',
      description: 'A test prompt for testing',
      category: 'test',
      tags: ['test', 'sample'],
      difficulty: 'beginner',
      author: 'Test Author',
      version: '1.0'
    },
    preview: 'This is a test prompt content for testing purposes. It contains sample text to verify functionality...',
    ...overrides
  };
}

/**
 * Mock console.error to capture error logs in tests
 */
export function mockConsoleError() {
  return vi.spyOn(console, 'error').mockImplementation(() => {});
}

/**
 * Create a mock fs module for testing
 */
export function createMockFs() {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn()
  };
}

/**
 * Create mock MCP request objects
 */
export function createMockCallToolRequest(toolName: string, args: Record<string, unknown>) {
  return {
    params: {
      name: toolName,
      arguments: args
    }
  };
}

/**
 * Create expected MCP response format
 */
export function createExpectedResponse(text: string, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text
      }
    ],
    ...(isError && { isError: true })
  };
}

/**
 * Wait for a specified amount of time (useful for file watcher tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}