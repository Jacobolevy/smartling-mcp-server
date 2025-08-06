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
        .optional()
        .describe('The Smartling account ID (optional if set in environment)')
    },
    async ({ accountId }) => {
      const startTime = Date.now();
      try {
        const result = await client.getProjects(accountId);
        const responseTime = Date.now() - startTime;
        
        return {
          _meta: {
            requestId: `smartling-projects-${Date.now()}`,
            timing: { duration: responseTime },
            source: 'smartling-api',
            version: '3.0.0'
          },
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
              annotations: {
                audience: ['user', 'assistant'],
                priority: 1,
                lastModified: new Date().toISOString()
              }
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const responseTime = Date.now() - startTime;
        
        return {
          _meta: {
            requestId: `smartling-projects-error-${Date.now()}`,
            timing: { duration: responseTime },
            source: 'smartling-api',
            version: '3.0.0'
          },
          content: [
            {
              type: 'text',
              text: `Error getting projects: ${errorMessage}`,
              annotations: {
                audience: ['user', 'assistant'],
                priority: 2,
                lastModified: new Date().toISOString()
              }
            },
          ],
          isError: true,
        };
      }
    }
  );
};
