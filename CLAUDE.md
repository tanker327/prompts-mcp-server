# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm start` - Start the MCP server 
- `npm run dev` - Start server with auto-reload for development

## Architecture Overview

This is an MCP (Model Context Protocol) server that manages prompt templates stored as markdown files with YAML frontmatter metadata.

### Core Components

**MCP Server (`src/index.js`)**
- Implements 4 MCP tools: `add_prompt`, `get_prompt`, `list_prompts`, `delete_prompt`
- Uses stdio transport for communication
- Handles tool requests through `CallToolRequestSchema` and `ListToolsRequestSchema`

**Caching System**
- `promptsCache` Map stores all prompt metadata in memory for fast access
- Cache is populated on server startup and kept synchronized with file changes
- `listPrompts()` returns cached data instead of reading files each time

**File Watcher (chokidar)**
- Monitors `prompts/*.md` files for add/change/delete events
- Automatically updates cache when files are modified
- Ensures cache stays synchronized with filesystem without manual intervention

**YAML Frontmatter Support (gray-matter)**
- Prompts support structured metadata in YAML frontmatter
- Metadata fields: `title`, `description`, `category`, `tags`, `difficulty`, `author`, `version`
- `list_prompts` displays both metadata and content preview

### Data Flow

1. **Startup**: Cache initialized from all `.md` files in `prompts/` directory
2. **File Changes**: Watcher detects changes and updates cache automatically  
3. **MCP Requests**: Tools operate on cached data for performance
4. **File Operations**: `add_prompt`/`delete_prompt` write to filesystem, watcher updates cache

### File Naming

- Prompt names are sanitized using `sanitizeFileName()`: alphanumeric, hyphens, underscores only
- All prompts stored as `.md` files in `prompts/` directory
- Filename format: `{sanitized_name}.md`

## Key Implementation Details

- Server communicates via stdio (not HTTP)
- ES modules used throughout (`type: "module"` in package.json)
- Error handling returns MCP-compatible error responses with `isError: true`
- Console.error() used for logging (stderr) to avoid interfering with stdio transport
- Cache initialization is lazy - falls back if cache is empty when `listPrompts()` called