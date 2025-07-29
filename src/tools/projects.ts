import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addProjectTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_projects',
    'Get all projects for a Smartling account',
    {
      accountId: z
        .string()
        .describe('The Smartling account ID')
    },
    async ({ accountId }) => {
      try {
        const result = await client.getProjects(accountId);
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
              text: `Error getting projects: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
