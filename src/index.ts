#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  ListToolsResult,
  CallToolResult,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import chokidar, { FSWatcher } from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

// Type definitions
interface PromptMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  version?: string;
  [key: string]: unknown;
}

interface PromptInfo {
  name: string;
  metadata: PromptMetadata;
  preview: string;
}

interface ToolArguments {
  name: string;
  content?: string;
}

// Cache for prompt metadata
const promptsCache = new Map<string, PromptInfo>();
let isWatcherInitialized = false;
let fileWatcher: FSWatcher | null = null;

const server = new Server(
  {
    name: 'prompts-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

async function loadPromptMetadata(fileName: string): Promise<PromptInfo | null> {
  const filePath = path.join(PROMPTS_DIR, fileName);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const name = fileName.replace('.md', '');
    
    return {
      name,
      metadata: parsed.data as PromptMetadata,
      preview: parsed.content.substring(0, 100).replace(/\n/g, ' ').trim() + '...'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to load prompt metadata for ${fileName}:`, errorMessage);
    return null;
  }
}

async function updateCacheForFile(fileName: string): Promise<void> {
  if (!fileName.endsWith('.md')) return;
  
  const metadata = await loadPromptMetadata(fileName);
  if (metadata) {
    promptsCache.set(metadata.name, metadata);
  }
}

async function removeFromCache(fileName: string): Promise<void> {
  if (!fileName.endsWith('.md')) return;
  
  const name = fileName.replace('.md', '');
  promptsCache.delete(name);
}

async function initializeCache(): Promise<void> {
  await ensurePromptsDir();
  
  try {
    const files = await fs.readdir(PROMPTS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    // Clear existing cache
    promptsCache.clear();
    
    // Load all prompt metadata
    await Promise.all(
      mdFiles.map(async (file) => {
        await updateCacheForFile(file);
      })
    );
    
    console.error(`Loaded ${promptsCache.size} prompts into cache`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize cache:', errorMessage);
  }
}

function initializeFileWatcher(): void {
  if (isWatcherInitialized) return;
  
  fileWatcher = chokidar.watch(path.join(PROMPTS_DIR, '*.md'), {
    ignored: /^\./, // ignore dotfiles
    persistent: true,
    ignoreInitial: true // don't fire events for initial scan
  });

  fileWatcher
    .on('add', async (filePath: string) => {
      const fileName = path.basename(filePath);
      console.error(`Prompt added: ${fileName}`);
      await updateCacheForFile(fileName);
    })
    .on('change', async (filePath: string) => {
      const fileName = path.basename(filePath);
      console.error(`Prompt updated: ${fileName}`);
      await updateCacheForFile(fileName);
    })
    .on('unlink', async (filePath: string) => {
      const fileName = path.basename(filePath);
      console.error(`Prompt deleted: ${fileName}`);
      await removeFromCache(fileName);
    })
    .on('error', (error: Error) => {
      console.error('File watcher error:', error);
    });

  isWatcherInitialized = true;
  console.error('File watcher initialized for prompts directory');
}

async function ensurePromptsDir(): Promise<void> {
  try {
    await fs.access(PROMPTS_DIR);
  } catch {
    await fs.mkdir(PROMPTS_DIR, { recursive: true });
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
}

async function listPrompts(): Promise<PromptInfo[]> {
  // Initialize cache and file watcher if not already done
  if (promptsCache.size === 0) {
    await initializeCache();
    initializeFileWatcher();
  }
  
  return Array.from(promptsCache.values());
}

async function readPrompt(name: string): Promise<string> {
  const fileName = sanitizeFileName(name) + '.md';
  const filePath = path.join(PROMPTS_DIR, fileName);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Prompt "${name}" not found`);
  }
}

async function savePrompt(name: string, content: string): Promise<string> {
  await ensurePromptsDir();
  const fileName = sanitizeFileName(name) + '.md';
  const filePath = path.join(PROMPTS_DIR, fileName);
  await fs.writeFile(filePath, content, 'utf-8');
  return fileName;
}

async function deletePrompt(name: string): Promise<boolean> {
  const fileName = sanitizeFileName(name) + '.md';
  const filePath = path.join(PROMPTS_DIR, fileName);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    throw new Error(`Prompt "${name}" not found`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async (): Promise<ListToolsResult> => {
  return {
    tools: [
      {
        name: 'add_prompt',
        description: 'Add a new prompt to the collection',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the prompt',
            },
            content: {
              type: 'string',
              description: 'Content of the prompt in markdown format',
            },
          },
          required: ['name', 'content'],
        },
      },
      {
        name: 'get_prompt',
        description: 'Retrieve a prompt by name',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the prompt to retrieve',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_prompts',
        description: 'List all available prompts',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'delete_prompt',
        description: 'Delete a prompt by name',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the prompt to delete',
            },
          },
          required: ['name'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
  const { name, arguments: args } = request.params;
  const toolArgs = args as ToolArguments;

  try {
    switch (name) {
      case 'add_prompt': {
        if (!toolArgs.content) {
          throw new Error('Content is required for add_prompt');
        }
        const fileName = await savePrompt(toolArgs.name, toolArgs.content);
        return {
          content: [
            {
              type: 'text',
              text: `Prompt "${toolArgs.name}" saved as ${fileName}`,
            } as TextContent,
          ],
        };
      }

      case 'get_prompt': {
        const content = await readPrompt(toolArgs.name);
        return {
          content: [
            {
              type: 'text',
              text: content,
            } as TextContent,
          ],
        };
      }

      case 'list_prompts': {
        const prompts = await listPrompts();
        if (prompts.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No prompts available',
              } as TextContent,
            ],
          };
        }

        const formatPrompt = (prompt: PromptInfo): string => {
          let output = `## ${prompt.name}\n`;
          
          if (Object.keys(prompt.metadata).length > 0) {
            output += '**Metadata:**\n';
            Object.entries(prompt.metadata).forEach(([key, value]) => {
              output += `- ${key}: ${value}\n`;
            });
            output += '\n';
          }
          
          output += `**Preview:** ${prompt.preview}\n`;
          return output;
        };

        const text = `# Available Prompts\n\n${prompts.map(formatPrompt).join('\n---\n\n')}`;
        
        return {
          content: [
            {
              type: 'text',
              text,
            } as TextContent,
          ],
        };
      }

      case 'delete_prompt': {
        await deletePrompt(toolArgs.name);
        return {
          content: [
            {
              type: 'text',
              text: `Prompt "${toolArgs.name}" deleted successfully`,
            } as TextContent,
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        } as TextContent,
      ],
      isError: true,
    };
  }
});

async function main(): Promise<void> {
  // Initialize cache and file watcher on startup
  await initializeCache();
  initializeFileWatcher();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Prompts MCP Server running on stdio');
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Server error:', errorMessage);
  process.exit(1);
});