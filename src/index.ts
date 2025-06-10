#!/usr/bin/env node

/**
 * Main entry point for the prompts MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { PromptCache } from './cache.js';
import { PromptFileOperations } from './fileOperations.js';
import { PromptTools } from './tools.js';
import { ServerConfig } from './types.js';

// Server configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: ServerConfig = {
  name: 'prompts-mcp-server',
  version: '1.0.0',
  promptsDir: path.join(__dirname, '..', 'prompts'),
};

// Initialize components
const cache = new PromptCache(config.promptsDir);
const fileOps = new PromptFileOperations(config.promptsDir, cache);
const tools = new PromptTools(fileOps);

// Create MCP server
const server = new Server(
  {
    name: config.name,
    version: config.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return tools.getToolDefinitions();
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await tools.handleToolCall(request);
});

/**
 * Main server startup function
 */
async function main(): Promise<void> {
  try {
    // Initialize cache and file watcher on startup
    await cache.initializeCache();
    cache.initializeFileWatcher();
    
    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Prompts MCP Server running on stdio');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', errorMessage);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(): Promise<void> {
  console.error('Shutting down server...');
  try {
    await cache.cleanup();
    console.error('Server shutdown complete');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error during shutdown:', errorMessage);
  }
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Server error:', errorMessage);
  process.exit(1);
});