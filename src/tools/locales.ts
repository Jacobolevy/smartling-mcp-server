import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addLocaleTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_project_locales',
    'Get all locales configured in the project',
    {
      projectId: z.string().describe('The project ID'),
    },
    async ({ projectId }) => {
      try {
        const result = await client.getProjectLocales(projectId);
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
              text: `Error getting project locales: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_add_locale_to_project',
    'Add a new locale to the project',
    {
      projectId: z.string().describe('The project ID'),
      localeId: z.string().describe('The locale ID (e.g., "es-MX", "zh-TW")'),
      workflowUid: z.string().optional().describe('Optional workflow UID to use for this locale'),
    },
    async ({ projectId, localeId, workflowUid }) => {
      try {
        const options: any = {};
        if (workflowUid !== undefined) {
          options.workflowUid = workflowUid;
        }
        
        const result = await client.addLocaleToProject(projectId, localeId, options);
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
              text: `Error adding locale to project: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_locale_details',
    'Get details of a specific locale in the project',
    {
      projectId: z.string().describe('The project ID'),
      localeId: z.string().describe('The locale ID'),
    },
    async ({ projectId, localeId }) => {
      try {
        const result = await client.getLocaleDetails(projectId, localeId);
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
              text: `Error getting locale details: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_remove_locale_from_project',
    'Remove a locale from the project',
    {
      projectId: z.string().describe('The project ID'),
      localeId: z.string().describe('The locale ID to remove'),
    },
    async ({ projectId, localeId }) => {
      try {
        await client.removeLocaleFromProject(projectId, localeId);
        const result = { success: true, message: 'Locale removed from project successfully' };
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
              text: `Error removing locale from project: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_supported_locales',
    'Get list of all locales supported by Smartling',
    {},
    async () => {
      try {
        const result = await client.getSupportedLocales();
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
              text: `Error getting supported locales: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}; 