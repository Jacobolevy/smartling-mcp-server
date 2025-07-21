import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client.js';

export const webhookTools: Tool[] = [
  {
    name: 'smartling_create_webhook',
    description: 'Create a webhook for event notifications',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        url: {
          type: 'string',
          description: 'The webhook URL endpoint'
        },
        events: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['job.completed', 'file.uploaded', 'translation.completed', 'workflow.step.completed', 'quality.check.completed']
          },
          description: 'Array of events to subscribe to'
        },
        secretKey: {
          type: 'string',
          description: 'Optional secret key for webhook validation'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the webhook is enabled',
          default: true
        }
      },
      required: ['projectId', 'url', 'events']
    }
  },
  {
    name: 'smartling_get_webhooks',
    description: 'Get all webhooks for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'smartling_update_webhook',
    description: 'Update an existing webhook',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        webhookId: {
          type: 'string',
          description: 'The webhook ID to update'
        },
        url: {
          type: 'string',
          description: 'Updated webhook URL endpoint'
        },
        events: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['job.completed', 'file.uploaded', 'translation.completed', 'workflow.step.completed', 'quality.check.completed']
          },
          description: 'Updated array of events to subscribe to'
        },
        secretKey: {
          type: 'string',
          description: 'Updated secret key for webhook validation'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the webhook is enabled'
        }
      },
      required: ['projectId', 'webhookId']
    }
  },
  {
    name: 'smartling_delete_webhook',
    description: 'Delete a webhook',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        webhookId: {
          type: 'string',
          description: 'The webhook ID to delete'
        }
      },
      required: ['projectId', 'webhookId']
    }
  }
];

export async function handleWebhookTools(
  name: string,
  args: any,
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_create_webhook':
      return await client.createWebhook(args.projectId, {
        url: args.url,
        events: args.events,
        secretKey: args.secretKey,
        enabled: args.enabled !== undefined ? args.enabled : true
      });

    case 'smartling_get_webhooks':
      return await client.getWebhooks(args.projectId);

    case 'smartling_update_webhook':
      const updates: any = {};
      if (args.url !== undefined) updates.url = args.url;
      if (args.events !== undefined) updates.events = args.events;
      if (args.secretKey !== undefined) updates.secretKey = args.secretKey;
      if (args.enabled !== undefined) updates.enabled = args.enabled;

      return await client.updateWebhook(args.projectId, args.webhookId, updates);

    case 'smartling_delete_webhook':
      await client.deleteWebhook(args.projectId, args.webhookId);
      return { success: true, message: 'Webhook deleted successfully' };

    default:
      throw new Error(`Unknown webhook tool: ${name}`);
  }
}
