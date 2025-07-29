import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addWebhookTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_webhooks',
    'Get all webhooks for a project',
    {
      projectId: z.string().describe('The project ID'),
    },
    async ({ projectId }) => {
      try {
        const result = await client.getWebhooks(projectId);
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
              text: `Error getting webhooks: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_create_webhook',
    'Create a new webhook for a project',
    {
      projectId: z.string().describe('The project ID'),
      name: z.string().describe('Name for the webhook'),
      url: z.string().describe('The webhook URL'),
      events: z.array(z.string()).describe('Array of events to subscribe to'),
      description: z.string().optional().describe('Optional description for the webhook'),
    },
    async ({ projectId, name, url, events, description }) => {
      try {
        const webhookConfig: any = { name, url, events };
        if (description !== undefined) webhookConfig.description = description;
        
        const result = await client.createWebhook(projectId, webhookConfig);
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
              text: `Error creating webhook: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_delete_webhook',
    'Delete a webhook from a project',
    {
      projectId: z.string().describe('The project ID'),
      webhookId: z.string().describe('The webhook ID to delete'),
    },
    async ({ projectId, webhookId }) => {
      try {
        await client.deleteWebhook(projectId, webhookId);
        const result = { success: true, message: 'Webhook deleted successfully' };
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
              text: `Error deleting webhook: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
