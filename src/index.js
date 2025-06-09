#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

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

async function ensurePromptsDir() {
  try {
    await fs.access(PROMPTS_DIR);
  } catch {
    await fs.mkdir(PROMPTS_DIR, { recursive: true });
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
}

async function listPrompts() {
  await ensurePromptsDir();
  const files = await fs.readdir(PROMPTS_DIR);
  const mdFiles = files.filter(file => file.endsWith('.md'));
  
  const prompts = await Promise.all(
    mdFiles.map(async (file) => {
      const filePath = path.join(PROMPTS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      const name = file.replace('.md', '');
      
      return {
        name,
        metadata: parsed.data,
        preview: parsed.content.substring(0, 100).replace(/\n/g, ' ').trim() + '...'
      };
    })
  );
  
  return prompts;
}

async function readPrompt(name) {
  const fileName = sanitizeFileName(name) + '.md';
  const filePath = path.join(PROMPTS_DIR, fileName);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Prompt "${name}" not found`);
  }
}

async function savePrompt(name, content) {
  await ensurePromptsDir();
  const fileName = sanitizeFileName(name) + '.md';
  const filePath = path.join(PROMPTS_DIR, fileName);
  await fs.writeFile(filePath, content, 'utf-8');
  return fileName;
}

async function deletePrompt(name) {
  const fileName = sanitizeFileName(name) + '.md';
  const filePath = path.join(PROMPTS_DIR, fileName);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    throw new Error(`Prompt "${name}" not found`);
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'add_prompt': {
        const fileName = await savePrompt(args.name, args.content);
        return {
          content: [
            {
              type: 'text',
              text: `Prompt "${args.name}" saved as ${fileName}`,
            },
          ],
        };
      }

      case 'get_prompt': {
        const content = await readPrompt(args.name);
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
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
              },
            ],
          };
        }

        const formatPrompt = (prompt) => {
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
            },
          ],
        };
      }

      case 'delete_prompt': {
        await deletePrompt(args.name);
        return {
          content: [
            {
              type: 'text',
              text: `Prompt "${args.name}" deleted successfully`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Prompts MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});