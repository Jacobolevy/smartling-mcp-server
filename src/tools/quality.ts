import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addQualityTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_run_quality_check',
    'Run quality checks on translation content',
    {
      projectId: z.string().describe('The project ID'),
      fileUris: z.array(z.string()).optional().describe('Optional: specific file URIs to check'),
      localeIds: z.array(z.string()).optional().describe('Optional: specific locale IDs to check'),
      checkTypes: z.array(z.string()).optional().describe('Optional: specific check types (tag_consistency, glossary_compliance, spelling_check, etc.)'),
    },
    async ({ projectId, fileUris, localeIds, checkTypes }) => {
      try {
        const options: any = {};
        if (fileUris !== undefined) options.fileUris = fileUris;
        if (localeIds !== undefined) options.localeIds = localeIds;
        if (checkTypes !== undefined) options.checkTypes = checkTypes;
        
        const result = await client.runQualityCheck(projectId, options);
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
              text: `Error running quality check: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_quality_results',
    'Get quality check results for a specific file and locale',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI'),
      localeId: z.string().describe('The locale ID'),
    },
    async ({ projectId, fileUri, localeId }) => {
      try {
        const result = await client.getQualityCheckResults(projectId, fileUri, localeId);
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
              text: `Error getting quality results: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_quality_check_types',
    'Get available quality check types',
    {},
    async () => {
      try {
        const result = await client.getQualityCheckTypes();
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
              text: `Error getting quality check types: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
