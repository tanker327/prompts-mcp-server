# Prompts MCP Server

A Model Context Protocol (MCP) server for managing and providing prompts. This server allows users and LLMs to easily add, retrieve, and manage prompt templates stored as markdown files with YAML frontmatter support.

<a href="https://glama.ai/mcp/servers/@tanker327/prompts-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@tanker327/prompts-mcp-server/badge" alt="Prompts Server MCP server" />
</a>

## Quick Start

```bash
# 1. Install from NPM
npm install -g prompts-mcp-server

# 2. Add to your MCP client config (e.g., Claude Desktop)
# Add this to ~/Library/Application Support/Claude/claude_desktop_config.json:
{
  "mcpServers": {
    "prompts-mcp-server": {
      "command": "prompts-mcp-server"
    }
  }
}

# 3. Restart your MCP client and start using the tools!
```

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

### Option 1: From NPM (Recommended)

Install the package globally from NPM:
```bash
npm install -g prompts-mcp-server
```
This will make the `prompts-mcp-server` command available in your system.

After installation, you need to configure your MCP client to use it. See [MCP Client Configuration](#mcp-client-configuration).

### Option 2: From GitHub (for development)

```bash
# Clone the repository
git clone https://github.com/tanker327/prompts-mcp-server.git
cd prompts-mcp-server

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Test the installation
npm test
```

### Option 3: Direct Download

1. Download the latest release from GitHub
2. Extract to your desired location
3. Run installation steps from Option 2.

### Verification

After installation, verify the server works:

```bash
# Start the server (should show no errors)
npm start

# Or test with MCP Inspector
npx @modelcontextprotocol/inspector prompts-mcp-server
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

## MCP Client Configuration

This server can be configured with various MCP-compatible applications. Here are setup instructions for popular clients:

### Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "prompts-mcp-server": {
      "command": "prompts-mcp-server",
      "env": {
        "PROMPTS_FOLDER_PATH": "/path/to/your/prompts/directory"
      }
    }
  }
}
```

### Cline (VS Code Extension)

Add to your Cline MCP settings in VS Code:

```json
{
  "cline.mcp.servers": {
    "prompts-mcp-server": {
      "command": "prompts-mcp-server",
      "env": {
        "PROMPTS_FOLDER_PATH": "/path/to/your/prompts/directory"
      }
    }
  }
}
```

### Continue.dev

In your `~/.continue/config.json`:

```json
{
  "mcpServers": [
    {
      "name": "prompts-mcp-server",
      "command": "prompts-mcp-server",
      "env": {
        "PROMPTS_FOLDER_PATH": "/path/to/your/prompts/directory"
      }
    }
  ]
}
```

### Zed Editor

In your Zed settings (`~/.config/zed/settings.json`):

```json
{
  "assistant": {
    "mcp_servers": {
      "prompts-mcp-server": {
        "command": "prompts-mcp-server",
        "env": {
          "PROMPTS_DIR": "/path/to/your/prompts/directory"
        }
      }
    }
  }
}
```

### Custom MCP Client

For any MCP-compatible application, use these connection details:

- **Protocol**: Model Context Protocol (MCP)
- **Transport**: stdio
- **Command**: `prompts-mcp-server`
- **Environment Variables**: 
  - `PROMPTS_FOLDER_PATH`: Custom directory for storing prompts (optional, defaults to `./prompts`)

### Development/Testing Setup

For development or testing with the MCP Inspector:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run the server with inspector
npx @modelcontextprotocol/inspector prompts-mcp-server
```

### Docker Configuration

Create a `docker-compose.yml` for containerized deployment:

```yaml
version: '3.8'
services:
  prompts-mcp-server:
    build: .
    environment:
      - PROMPTS_FOLDER_PATH=/app/prompts
    volumes:
      - ./prompts:/app/prompts
    stdin_open: true
    tty: true
```

## Server Configuration

- The server automatically creates the `prompts/` directory if it doesn't exist
- Prompt files are automatically sanitized to use safe filenames (alphanumeric characters, hyphens, and underscores only)
- File changes are monitored in real-time and cache is updated automatically
- Prompts directory can be customized via the `PROMPTS_FOLDER_PATH` environment variable

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMPTS_FOLDER_PATH` | Custom directory to store prompt files (overrides default) | (not set) |
| `NODE_ENV` | Environment mode | `production` |

> **Note**: If `PROMPTS_FOLDER_PATH` is set, it will be used as the prompts directory. If not set, the server defaults to `./prompts` relative to the server location.

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

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Ensure TypeScript is built
npm run build

# Check that dist/ directory exists and contains .js files
ls dist/
```

#### MCP client can't connect
1. Verify the server starts without errors: `npm start`
2. Check the correct path is used in client configuration
3. Ensure Node.js 18+ is installed: `node --version`
4. Test with MCP Inspector: `npx @modelcontextprotocol/inspector prompts-mcp-server`

#### Permission errors with prompts directory
```bash
# Ensure the prompts directory is writable
mkdir -p ./prompts
chmod 755 ./prompts
```

#### File watching not working
- On Linux: Install `inotify-tools`
- On macOS: No additional setup needed
- On Windows: Ensure Windows Subsystem for Linux (WSL) or native Node.js

### Debug Mode

Enable debug logging by setting environment variables:

```bash
# Enable debug mode
DEBUG=* node dist/index.js

# Or with specific debug namespace
DEBUG=prompts-mcp:* node dist/index.js
```

### Getting Help

1. Check the [GitHub Issues](https://github.com/tanker327/prompts-mcp-server/issues)
2. Review the test files for usage examples
3. Use MCP Inspector for debugging client connections
4. Check your MCP client's documentation for configuration details

### Performance Tips

- The server uses in-memory caching for fast prompt retrieval
- File watching automatically updates the cache when files change
- Large prompt collections (1000+ files) work efficiently due to caching
- Consider using SSD storage for better file I/O performance


## Community Variants & Extensions

| Project | Maintainer | Extra Features |
|---------|-----------|----------------|
| [smart-prompts-mcp](https://github.com/jezweb/smart-prompts-mcp) | [@jezweb](https://github.com/jezweb) | GitHub-hosted prompt libraries, advanced search & composition, richer TypeScript types, etc. |

👉 Have you built something cool on top of **prompts-mcp-server**?  
Open an issue or PR to add it here so others can discover your variant!

## License

MIT