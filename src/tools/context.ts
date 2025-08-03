import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addContextTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_upload_context',
    'Upload visual context (image/screenshot) to help translators',
    {
      projectId: z.string().describe('The project ID'),
      contextType: z.enum(['image', 'video', 'html']).describe('Type of context'),
      contextName: z.string().describe('Descriptive name for the context'),
      fileContent: z.string().describe('File content (base64 encoded)'),
      contextDescription: z.string().optional().describe('Optional description of the context'),
    },
    async ({ projectId, contextType, contextName, fileContent, contextDescription }) => {
      try {
        const contextData: any = {
          contextType,
          contextName,
          fileContent,
        };
        if (contextDescription !== undefined) {
          contextData.contextDescription = contextDescription;
        }
        
        const result = await client.uploadContext(projectId, contextData);
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
              text: `Error uploading context: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_context',
    'Get details of a specific context',
    {
      projectId: z.string().describe('The project ID'),
      contextUid: z.string().describe('The context UID'),
    },
    async ({ projectId, contextUid }) => {
      try {
        const result = await client.getContext(projectId, contextUid);
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
              text: `Error getting context: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_list_contexts',
    'List all contexts in the project',
    {
      projectId: z.string().describe('The project ID'),
      limit: z.number().optional().describe('Maximum number of results to return'),
      offset: z.number().optional().describe('Number of results to skip for pagination'),
    },
    async ({ projectId, limit, offset }) => {
      try {
        const options: any = {};
        if (limit !== undefined) options.limit = limit;
        if (offset !== undefined) options.offset = offset;
        
        const result = await client.listContexts(projectId, options);
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
              text: `Error listing contexts: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_bind_context_to_string',
    'Associate visual context with specific translation strings',
    {
      projectId: z.string().describe('The project ID'),
      contextUid: z.string().describe('The context UID'),
      stringHashcodes: z.array(z.string()).describe('Array of string hashcodes to bind'),
      coordinates: z.object({
        x: z.number().describe('X coordinate'),
        y: z.number().describe('Y coordinate'),
        width: z.number().optional().describe('Width of the area'),
        height: z.number().optional().describe('Height of the area'),
      }).optional().describe('Optional coordinates where the string appears in the context'),
    },
    async ({ projectId, contextUid, stringHashcodes, coordinates }) => {
      try {
        const bindingData: any = {
          contextUid,
          stringHashcodes,
        };
        if (coordinates !== undefined) {
          bindingData.coordinates = coordinates;
        }
        
        const result = await client.bindContextToString(projectId, bindingData);
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
              text: `Error binding context to string: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_delete_context',
    'Delete a context from the project',
    {
      projectId: z.string().describe('The project ID'),
      contextUid: z.string().describe('The context UID to delete'),
    },
    async ({ projectId, contextUid }) => {
      try {
        await client.deleteContext(projectId, contextUid);
        const result = { success: true, message: 'Context deleted successfully' };
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
              text: `Error deleting context: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}; 