import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client';

export const projectTools: Tool[] = [
  {
    name: 'smartling_get_projects',
    description: 'Get all projects for a Smartling account',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'string',
          description: 'The Smartling account ID'
        }
      },
      required: ['accountId']
    }
  }
];

export async function handleProjectTools(
  name: string, 
  args: any, 
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_get_projects':
      return await client.getProjects(args.accountId);
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
