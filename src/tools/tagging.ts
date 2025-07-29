import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

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
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error getting available tags: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );


};
