/**
 * MCP tool definitions and handlers
 */
import { ListToolsResult, CallToolResult, CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { PromptFileOperations } from './fileOperations.js';
export declare class PromptTools {
    private fileOps;
    constructor(fileOps: PromptFileOperations);
    /**
     * Get MCP tool definitions
     */
    getToolDefinitions(): ListToolsResult;
    /**
     * Handle MCP tool calls
     */
    handleToolCall(request: CallToolRequest): Promise<CallToolResult>;
    /**
     * Handle add_prompt tool
     */
    private handleAddPrompt;
    /**
     * Ensure content has proper YAML frontmatter metadata
     */
    private ensureMetadata;
    /**
     * Handle get_prompt tool
     */
    private handleGetPrompt;
    /**
     * Handle list_prompts tool
     */
    private handleListPrompts;
    /**
     * Handle delete_prompt tool
     */
    private handleDeletePrompt;
    /**
     * Handle create_structured_prompt tool
     */
    private handleCreateStructuredPrompt;
    /**
     * Format prompts list for display
     */
    private formatPromptsList;
}
//# sourceMappingURL=tools.d.ts.map