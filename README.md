# Prompts MCP Server

A Model Context Protocol (MCP) server for managing and providing prompts. This server allows users and LLMs to easily add, retrieve, and manage prompt templates stored as markdown files.

## Features

- **Add Prompts**: Store new prompts as markdown files
- **Retrieve Prompts**: Get specific prompts by name
- **List Prompts**: View all available prompts
- **Delete Prompts**: Remove prompts from the collection
- **File-based Storage**: Prompts are stored as markdown files in the `prompts/` directory

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## MCP Tools

The server provides the following tools:

### `add_prompt`
Add a new prompt to the collection.
- **name** (string): Name of the prompt
- **content** (string): Content of the prompt in markdown format

### `get_prompt` 
Retrieve a prompt by name.
- **name** (string): Name of the prompt to retrieve

### `list_prompts`
List all available prompts. No parameters required.

### `delete_prompt`
Delete a prompt by name.
- **name** (string): Name of the prompt to delete

## Usage Examples

Once connected to an MCP client, you can use the tools like this:

```javascript
// Add a new prompt
add_prompt({
  name: "code_review",
  content: "# Code Review Prompt\n\nReview the following code..."
})

// Get a prompt
get_prompt({ name: "code_review" })

// List all prompts
list_prompts({})

// Delete a prompt
delete_prompt({ name: "old_prompt" })
```

## File Structure

```
prompts-mcp/
├── src/
│   └── index.js          # Main MCP server code
├── prompts/              # Directory for storing prompt markdown files
│   ├── code_review.md
│   ├── debugging_assistant.md
│   └── api_design.md
├── package.json
└── README.md
```

## Configuration

The server automatically creates the `prompts/` directory if it doesn't exist. Prompt files are automatically sanitized to use safe filenames (alphanumeric characters, hyphens, and underscores only).

## Requirements

- Node.js 18.0.0 or higher
- @modelcontextprotocol/sdk

## License

MIT