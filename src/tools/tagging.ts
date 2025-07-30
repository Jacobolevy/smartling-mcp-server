import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

const createToolResponse = (content: any, isError: boolean = false, requestId: string) => {
  return {
    _meta: {
      requestId,
      timing: { duration: Date.now() },
      source: 'smartling-api',
      version: '3.1.0'
    },
    content: [
      {
        type: 'text' as const,
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      },
    ],
    ...(isError && { isError: true }),
  };
};

export const addTaggingTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_available_tags',
    'Get all available tags in a project',
    {
      projectId: z.string().describe('The project ID'),
    },
    async ({ projectId }) => {
      try {
        const result = await client.getAvailableTags(projectId);
        return createToolResponse(result, false, 'smartling-get-tags');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting available tags: ${errorMessage}`, true, 'smartling-get-tags');
      }
    }
  );

  server.tool(
    'smartling_add_string_tags',
    'Add tags to specific strings in a file',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI containing the strings'),
      stringUids: z.array(z.string()).describe('Array of string UIDs to tag'),
      tags: z.array(z.string()).describe('Array of tags to add to the strings'),
    },
    async ({ projectId, fileUri, stringUids, tags }) => {
      try {
        await client.addStringTags(projectId, fileUri, stringUids, tags);
        return createToolResponse({
          success: true,
          message: `Successfully added ${tags.length} tag(s) to ${stringUids.length} string(s)`,
          tags,
          stringUids,
          fileUri
        }, false, 'smartling-add-string-tags');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error adding string tags: ${errorMessage}`, true, 'smartling-add-string-tags');
      }
    }
  );

  server.tool(
    'smartling_remove_string_tags',
    'Remove tags from specific strings in a file',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI containing the strings'),
      stringUids: z.array(z.string()).describe('Array of string UIDs to remove tags from'),
      tags: z.array(z.string()).describe('Array of tags to remove from the strings'),
    },
    async ({ projectId, fileUri, stringUids, tags }) => {
      try {
        await client.removeStringTags(projectId, fileUri, stringUids, tags);
        return createToolResponse({
          success: true,
          message: `Successfully removed ${tags.length} tag(s) from ${stringUids.length} string(s)`,
          tags,
          stringUids,
          fileUri
        }, false, 'smartling-remove-string-tags');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error removing string tags: ${errorMessage}`, true, 'smartling-remove-string-tags');
      }
    }
  );

  server.tool(
    'smartling_get_strings_by_tag',
    'Get all strings that have specific tags',
    {
      projectId: z.string().describe('The project ID'),
      tags: z.array(z.string()).describe('Array of tags to search for'),
      fileUri: z.string().optional().describe('Optional: specific file URI to search in'),
    },
    async ({ projectId, tags, fileUri }) => {
      try {
        const result = await client.getStringsByTag(projectId, tags, fileUri);
        return createToolResponse(result, false, 'smartling-get-strings-by-tag');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting strings by tag: ${errorMessage}`, true, 'smartling-get-strings-by-tag');
      }
    }
  );
};
