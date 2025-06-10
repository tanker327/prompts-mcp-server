/**
 * MCP tool definitions and handlers
 */

import {
  ListToolsResult,
  CallToolResult,
  CallToolRequest,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolArguments, PromptInfo } from './types.js';
import { PromptFileOperations } from './fileOperations.js';

export class PromptTools {
  constructor(private fileOps: PromptFileOperations) {}

  /**
   * Get MCP tool definitions
   */
  getToolDefinitions(): ListToolsResult {
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
              filename: {
                type: 'string',
                description: 'English filename for the prompt file (without .md extension)',
              },
              content: {
                type: 'string',
                description: 'Content of the prompt in markdown format',
              },
            },
            required: ['name', 'filename', 'content'],
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
        {
          name: 'create_structured_prompt',
          description: 'Create a new prompt with guided metadata structure',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the prompt',
              },
              title: {
                type: 'string',
                description: 'Human-readable title for the prompt',
              },
              description: {
                type: 'string',
                description: 'Brief description of what the prompt does',
              },
              category: {
                type: 'string',
                description: 'Category (e.g., development, writing, analysis)',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of tags for categorization',
              },
              difficulty: {
                type: 'string',
                enum: ['beginner', 'intermediate', 'advanced'],
                description: 'Difficulty level of the prompt',
              },
              author: {
                type: 'string',
                description: 'Author of the prompt',
              },
              content: {
                type: 'string',
                description: 'The actual prompt content (markdown)',
              },
            },
            required: ['name', 'title', 'description', 'content'],
          },
        },
      ],
    };
  }

  /**
   * Handle MCP tool calls
   */
  async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;
    const toolArgs = (args || {}) as ToolArguments;

    try {
      switch (name) {
        case 'add_prompt':
          return await this.handleAddPrompt(toolArgs);
        case 'get_prompt':
          return await this.handleGetPrompt(toolArgs);
        case 'list_prompts':
          return await this.handleListPrompts();
        case 'delete_prompt':
          return await this.handleDeletePrompt(toolArgs);
        case 'create_structured_prompt':
          return await this.handleCreateStructuredPrompt(toolArgs);
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
  }

  /**
   * Handle add_prompt tool
   */
  private async handleAddPrompt(args: ToolArguments): Promise<CallToolResult> {
    if (!args.name || !args.filename || !args.content) {
      throw new Error('Name, filename, and content are required for add_prompt');
    }
    
    // Validate and enhance content with metadata if needed
    const processedContent = this.ensureMetadata(args.content, args.name);
    
    const fileName = await this.fileOps.savePromptWithFilename(args.filename, processedContent);
    return {
      content: [
        {
          type: 'text',
          text: `Prompt "${args.name}" saved as ${fileName}`,
        } as TextContent,
      ],
    };
  }

  /**
   * Ensure content has proper YAML frontmatter metadata
   */
  private ensureMetadata(content: string, promptName: string): string {
    // Check if content already has frontmatter
    if (content.trim().startsWith('---')) {
      return content; // Already has frontmatter, keep as-is
    }

    // Add default frontmatter if missing
    const defaultMetadata = `---
title: "${promptName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"
description: "A prompt for ${promptName.replace(/-/g, ' ')}"
category: "general"
tags: ["general"]
difficulty: "beginner"
author: "User"
version: "1.0"
created: "${new Date().toISOString().split('T')[0]}"
---

`;

    return defaultMetadata + content;
  }

  /**
   * Handle get_prompt tool
   */
  private async handleGetPrompt(args: ToolArguments): Promise<CallToolResult> {
    if (!args.name) {
      throw new Error('Name is required for get_prompt');
    }
    
    const content = await this.fileOps.readPrompt(args.name);
    return {
      content: [
        {
          type: 'text',
          text: content,
        } as TextContent,
      ],
    };
  }

  /**
   * Handle list_prompts tool
   */
  private async handleListPrompts(): Promise<CallToolResult> {
    const prompts = await this.fileOps.listPrompts();
    
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

    const text = this.formatPromptsList(prompts);
    
    return {
      content: [
        {
          type: 'text',
          text,
        } as TextContent,
      ],
    };
  }

  /**
   * Handle delete_prompt tool
   */
  private async handleDeletePrompt(args: ToolArguments): Promise<CallToolResult> {
    if (!args.name) {
      throw new Error('Name is required for delete_prompt');
    }
    
    await this.fileOps.deletePrompt(args.name);
    return {
      content: [
        {
          type: 'text',
          text: `Prompt "${args.name}" deleted successfully`,
        } as TextContent,
      ],
    };
  }

  /**
   * Handle create_structured_prompt tool
   */
  private async handleCreateStructuredPrompt(args: ToolArguments): Promise<CallToolResult> {
    if (!args.name || !args.content || !args.title || !args.description) {
      throw new Error('Name, content, title, and description are required for create_structured_prompt');
    }

    // Build structured frontmatter with provided metadata
    const metadata = {
      title: args.title,
      description: args.description,
      category: args.category || 'general',
      tags: args.tags || ['general'],
      difficulty: args.difficulty || 'beginner',
      author: args.author || 'User',
      version: '1.0',
      created: new Date().toISOString().split('T')[0],
    };

    // Create YAML frontmatter
    const frontmatter = `---
title: "${metadata.title}"
description: "${metadata.description}"
category: "${metadata.category}"
tags: ${JSON.stringify(metadata.tags)}
difficulty: "${metadata.difficulty}"
author: "${metadata.author}"
version: "${metadata.version}"
created: "${metadata.created}"
---

`;

    const fullContent = frontmatter + args.content;
    const fileName = await this.fileOps.savePrompt(args.name, fullContent);
    
    return {
      content: [
        {
          type: 'text',
          text: `Structured prompt "${args.name}" created successfully as ${fileName} with metadata:\n- Title: ${metadata.title}\n- Category: ${metadata.category}\n- Tags: ${metadata.tags.join(', ')}\n- Difficulty: ${metadata.difficulty}`,
        } as TextContent,
      ],
    };
  }

  /**
   * Format prompts list for display
   */
  private formatPromptsList(prompts: PromptInfo[]): string {
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

    return `# Available Prompts\n\n${prompts.map(formatPrompt).join('\n---\n\n')}`;
  }
}