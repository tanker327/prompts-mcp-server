# Prompts MCP Server

A Model Context Protocol (MCP) server for managing and providing prompts. This server allows users and LLMs to easily add, retrieve, and manage prompt templates stored as markdown files with YAML frontmatter support.

## Features

- **Add Prompts**: Store new prompts as markdown files with YAML frontmatter
- **Retrieve Prompts**: Get specific prompts by name
- **List Prompts**: View all available prompts with metadata preview
- **Delete Prompts**: Remove prompts from the collection
- **File-based Storage**: Prompts are stored as markdown files in the `prompts/` directory
- **Real-time Caching**: In-memory cache with automatic file change monitoring
- **YAML Frontmatter**: Support for structured metadata (title, description, tags, etc.)
- **TypeScript**: Full TypeScript implementation with comprehensive type definitions
- **Modular Architecture**: Clean separation of concerns with dependency injection
- **Comprehensive Testing**: 95 tests with 84.53% code coverage

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Testing

Run the comprehensive test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode for development:
```bash
npm run test:watch
```

## MCP Tools

The server provides the following tools:

### `add_prompt`
Add a new prompt to the collection. If no YAML frontmatter is provided, default metadata will be automatically added.
- **name** (string): Name of the prompt
- **content** (string): Content of the prompt in markdown format with optional YAML frontmatter

### `create_structured_prompt`
Create a new prompt with guided metadata structure and validation.
- **name** (string): Name of the prompt
- **title** (string): Human-readable title for the prompt
- **description** (string): Brief description of what the prompt does
- **category** (string, optional): Category (defaults to "general")
- **tags** (array, optional): Array of tags for categorization (defaults to ["general"])
- **difficulty** (string, optional): "beginner", "intermediate", or "advanced" (defaults to "beginner")
- **author** (string, optional): Author of the prompt (defaults to "User")
- **content** (string): The actual prompt content (markdown)

### `get_prompt` 
Retrieve a prompt by name.
- **name** (string): Name of the prompt to retrieve

### `list_prompts`
List all available prompts with metadata preview. No parameters required.

### `delete_prompt`
Delete a prompt by name.
- **name** (string): Name of the prompt to delete

## Usage Examples

Once connected to an MCP client, you can use the tools like this:

### Method 1: Quick prompt creation with automatic metadata
```javascript
// Add a prompt without frontmatter - metadata will be added automatically
add_prompt({
  name: "debug_helper",
  content: `# Debug Helper

Help me debug this issue by:
1. Analyzing the error message
2. Suggesting potential causes
3. Recommending debugging steps`
})
// This automatically adds default frontmatter with title "Debug Helper", category "general", etc.
```

### Method 2: Structured prompt creation with full metadata control
```javascript
// Create a prompt with explicit metadata using the structured tool
create_structured_prompt({
  name: "code_review",
  title: "Code Review Assistant",
  description: "Helps review code for best practices and potential issues",
  category: "development",
  tags: ["code", "review", "quality"],
  difficulty: "intermediate",
  author: "Development Team",
  content: `# Code Review Prompt

Please review the following code for:
- Code quality and best practices
- Potential bugs or issues
- Performance considerations
- Security vulnerabilities

## Code to Review
[Insert code here]`
})
```

### Method 3: Manual frontmatter (preserves existing metadata)
```javascript
// Add a prompt with existing frontmatter - no changes made
add_prompt({
  name: "custom_prompt",
  content: `---
title: "Custom Assistant"
category: "specialized"
tags: ["custom", "specific"]
difficulty: "advanced"
---

# Custom Prompt Content
Your specific prompt here...`
})
```

### Other operations
```javascript
// Get a prompt
get_prompt({ name: "code_review" })

// List all prompts (shows metadata preview)
list_prompts({})

// Delete a prompt
delete_prompt({ name: "old_prompt" })
```

## File Structure

```
prompts-mcp-server/
├── src/
│   ├── index.ts          # Main server orchestration
│   ├── types.ts          # TypeScript type definitions
│   ├── cache.ts          # Caching system with file watching
│   ├── fileOperations.ts # File I/O operations
│   └── tools.ts          # MCP tool definitions and handlers
├── tests/
│   ├── helpers/
│   │   ├── testUtils.ts  # Test utilities
│   │   └── mocks.ts      # Mock implementations
│   ├── cache.test.ts     # Cache module tests
│   ├── fileOperations.test.ts # File operations tests
│   ├── tools.test.ts     # Tools module tests
│   └── index.test.ts     # Integration tests
├── prompts/              # Directory for storing prompt markdown files
│   ├── code_review.md
│   ├── debugging_assistant.md
│   └── api_design.md
├── dist/                 # Compiled JavaScript output
├── CLAUDE.md            # Development documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

The server uses a modular architecture with the following components:

- **PromptCache**: In-memory caching with real-time file change monitoring via chokidar
- **PromptFileOperations**: File I/O operations with cache integration
- **PromptTools**: MCP tool definitions and request handlers
- **Type System**: Comprehensive TypeScript types for all data structures

## YAML Frontmatter Support

Prompts can include structured metadata using YAML frontmatter:

```yaml
---
title: "Prompt Title"
description: "Brief description of the prompt"
category: "development"
tags: ["tag1", "tag2", "tag3"]
difficulty: "beginner" | "intermediate" | "advanced"
author: "Author Name"
version: "1.0"
---

# Prompt Content

Your prompt content goes here...
```

## Configuration

- The server automatically creates the `prompts/` directory if it doesn't exist
- Prompt files are automatically sanitized to use safe filenames (alphanumeric characters, hyphens, and underscores only)
- File changes are monitored in real-time and cache is updated automatically
- Prompts directory can be customized via the `PROMPTS_DIR` environment variable

## Requirements

- Node.js 18.0.0 or higher
- TypeScript 5.0.0 or higher
- Dependencies:
  - @modelcontextprotocol/sdk ^1.0.0
  - gray-matter ^4.0.3 (YAML frontmatter parsing)
  - chokidar ^3.5.3 (file watching)

## Development

The project includes comprehensive tooling for development:

- **TypeScript**: Strict type checking and modern ES modules
- **Vitest**: Fast testing framework with 95 tests and 84.53% coverage
- **ESLint**: Code linting (if configured)
- **File Watching**: Real-time cache updates during development

## License

MIT