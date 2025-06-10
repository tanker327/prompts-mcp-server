/**
 * Mock implementations for testing
 */

import { vi } from 'vitest';
import { PromptInfo } from '../../src/types.js';

/**
 * Mock PromptCache class
 */
export class MockPromptCache {
  private cache = new Map<string, PromptInfo>();
  
  getAllPrompts = vi.fn(() => Array.from(this.cache.values()));
  getPrompt = vi.fn((name: string) => this.cache.get(name));
  isEmpty = vi.fn(() => this.cache.size === 0);
  size = vi.fn(() => this.cache.size);
  initializeCache = vi.fn();
  initializeFileWatcher = vi.fn();
  cleanup = vi.fn();

  // Helper methods for testing
  _setPrompt(name: string, prompt: PromptInfo) {
    this.cache.set(name, prompt);
  }

  _clear() {
    this.cache.clear();
  }
}

/**
 * Mock PromptFileOperations class
 */
export class MockPromptFileOperations {
  listPrompts = vi.fn();
  readPrompt = vi.fn();
  savePrompt = vi.fn();
  savePromptWithFilename = vi.fn();
  deletePrompt = vi.fn();
  promptExists = vi.fn();
  getPromptInfo = vi.fn();
}

/**
 * Mock chokidar watcher
 */
export function createMockWatcher() {
  const watcher = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockReturnThis(),
    unwatch: vi.fn().mockReturnThis()
  };

  return watcher;
}

/**
 * Mock process for testing
 */
export function createMockProcess() {
  return {
    on: vi.fn(),
    exit: vi.fn(),
    cwd: vi.fn(() => '/test/cwd')
  };
}