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
  }

  /**
   * Handle MCP tool calls
   */
  async handleToolCall(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;
    const toolArgs = args as ToolArguments;

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
    if (!args.content) {
      throw new Error('Content is required for add_prompt');
    }
    
    const fileName = await this.fileOps.savePrompt(args.name, args.content);
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
   * Handle get_prompt tool
   */
  private async handleGetPrompt(args: ToolArguments): Promise<CallToolResult> {
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