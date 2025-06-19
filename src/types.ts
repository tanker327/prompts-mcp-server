/**
 * Type definitions for the prompts MCP server
 */

export interface PromptMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
  version?: string;
  [key: string]: unknown;
}

export interface PromptInfo {
  name: string;
  metadata: PromptMetadata;
  preview: string;
}

export interface ToolArguments {
  name?: string;
  filename?: string;
  content?: string;
  // Fields for create_structured_prompt
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  author?: string;
}

export interface ServerConfig {
  name: string;
  version: string;
  promptsDir: string;
  prompts_folder_path?: string;
}