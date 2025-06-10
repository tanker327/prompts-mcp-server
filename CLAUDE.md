# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Build and start the MCP server 
- `npm run dev` - Start server with auto-reload for development (uses tsx)
- `npm test` - Run all tests (exits automatically)
- `npm run test:watch` - Run tests in watch mode (continuous)
- `npm run test:coverage` - Run tests with coverage report (exits automatically)

## Architecture Overview

This is an MCP (Model Context Protocol) server written in TypeScript that manages prompt templates stored as markdown files with YAML frontmatter metadata.

### Core Components

**Main Server (`src/index.ts`)**
- Entry point that orchestrates all components
- Handles MCP server initialization and graceful shutdown
- Registers tool handlers and connects to stdio transport
- Minimal orchestration layer that delegates to specialized modules

**Type Definitions (`src/types.ts`)**
- Central location for all TypeScript interfaces
- `PromptMetadata`, `PromptInfo`, `ToolArguments`, `ServerConfig`
- Ensures type consistency across all modules

**Caching System (`src/cache.ts`)**
- `PromptCache` class manages in-memory prompt metadata
- File watcher integration with chokidar for real-time updates
- Handles cache initialization, updates, and cleanup
- Provides methods for cache access and management

**File Operations (`src/fileOperations.ts`)**
- `PromptFileOperations` class handles all file I/O
- CRUD operations: create, read, update, delete prompts
- Filename sanitization and directory management
- Integrates with cache for optimal performance

**MCP Tools (`src/tools.ts`)**
- `PromptTools` class implements MCP tool definitions and handlers
- Handles all 4 MCP tools: `add_prompt`, `get_prompt`, `list_prompts`, `delete_prompt`
- Tool validation, execution, and response formatting
- Clean separation between MCP protocol and business logic

### Module Dependencies

```
index.ts (main)
├── cache.ts (PromptCache)
├── fileOperations.ts (PromptFileOperations)
│   └── cache.ts (dependency)
├── tools.ts (PromptTools)
│   └── fileOperations.ts (dependency)
└── types.ts (shared interfaces)
```

### Data Flow

1. **Startup**: Main orchestrates cache initialization and file watcher setup
2. **File Changes**: PromptCache detects changes and updates cache automatically  
3. **MCP Requests**: PromptTools delegates to PromptFileOperations which uses cached data
4. **File Operations**: PromptFileOperations writes to filesystem, cache auto-updates via watcher

### Testing Strategy

Modular design enables easy unit testing:
- Each class can be tested in isolation with dependency injection
- Cache operations can be tested without file I/O
- File operations can be tested with mock cache
- Tool handlers can be tested with mock file operations

## Key Implementation Details

- **Modular Architecture**: Clean separation of concerns across 5 focused modules
- **TypeScript**: Full type safety with centralized type definitions
- **Build Process**: TypeScript compiles to `dist/` directory, source in `src/`
- **Development**: Uses `tsx` for hot-reload during development
- **Dependency Injection**: Classes accept dependencies via constructor for testability
- **Graceful Shutdown**: Proper cleanup of file watchers and resources
- Server communicates via stdio (not HTTP)
- ES modules used throughout (`type: "module"` in package.json)
- Error handling returns MCP-compatible error responses with `isError: true`
- Console.error() used for logging (stderr) to avoid interfering with stdio transport

## Module Overview

- **`types.ts`**: Shared interfaces and type definitions
- **`cache.ts`**: In-memory caching with file watching (PromptCache class)
- **`fileOperations.ts`**: File I/O operations (PromptFileOperations class)  
- **`tools.ts`**: MCP tool definitions and handlers (PromptTools class)
- **`index.ts`**: Main orchestration and server setup

Each module is independently testable and has a single responsibility.

## Testing

The project includes comprehensive test coverage using Vitest:

### Test Structure
```
tests/
├── helpers/
│   ├── testUtils.ts    # Test utilities and helper functions
│   └── mocks.ts        # Mock implementations for testing
├── types.test.ts       # Type definition tests
├── cache.test.ts       # PromptCache class tests
├── fileOperations.test.ts  # PromptFileOperations class tests
├── tools.test.ts       # PromptTools class tests
└── index.test.ts       # Integration tests
```

### Test Coverage
- **Unit Tests**: Each class tested in isolation with dependency injection
- **Integration Tests**: End-to-end workflows and component interactions
- **Error Handling**: Comprehensive error scenarios and edge cases
- **File System**: Real file operations and mock scenarios
- **MCP Protocol**: Tool definitions and request/response handling

### Testing Approach
- **Mocking**: Uses Vitest mocking for external dependencies
- **Temporary Files**: Creates isolated temp directories for file system tests
- **Real Integration**: Tests actual file I/O, caching, and file watching
- **Error Scenarios**: Tests failure modes and error propagation
- **Type Safety**: Validates TypeScript interfaces and type constraints

### Test Results
- **95 tests** across all modules with **100% pass rate**
- **84.53% overall coverage** with critical modules at 98-100% coverage
- **Fast execution** with proper test isolation and cleanup

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm test` (verifies everything works)
3. **Start development**: `npm run dev` (auto-reload)
4. **Build for production**: `npm run build`
5. **Run built server**: `npm start`

## File Structure

```
prompts-mcp/
├── src/                    # TypeScript source code
│   ├── types.ts           # Type definitions
│   ├── cache.ts           # Caching system
│   ├── fileOperations.ts  # File I/O operations
│   ├── tools.ts           # MCP tool handlers
│   └── index.ts           # Main server entry point
├── tests/                 # Comprehensive test suite
│   ├── helpers/           # Test utilities and mocks
│   └── *.test.ts          # Test files for each module
├── prompts/               # Prompt storage directory
├── dist/                  # Compiled JavaScript (after build)
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Test configuration
└── CLAUDE.md              # This documentation
```