import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client';

export const qualityTools: Tool[] = [
  {
    name: 'smartling_run_quality_check',
    description: 'Run quality checks on translation content',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        fileUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: specific file URIs to check'
        },
        localeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: specific locale IDs to check'
        },
        checkTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: specific check types (tag_consistency, glossary_compliance, spelling_check, etc.)'
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'smartling_get_quality_results',
    description: 'Get quality check results for a specific file and locale',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        fileUri: {
          type: 'string',
          description: 'The file URI'
        },
        localeId: {
          type: 'string',
          description: 'The locale ID'
        }
      },
      required: ['projectId', 'fileUri', 'localeId']
    }
  },
  {
    name: 'smartling_get_quality_check_types',
    description: 'Get available quality check types',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

export async function handleQualityTools(
  name: string,
  args: any,
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_run_quality_check':
      return await client.runQualityCheck(args.projectId, {
        fileUris: args.fileUris,
        localeIds: args.localeIds,
        checkTypes: args.checkTypes
      });

    case 'smartling_get_quality_results':
      return await client.getQualityCheckResults(
        args.projectId,
        args.fileUri,
        args.localeId
      );

    case 'smartling_get_quality_check_types':
      return await client.getQualityCheckTypes();

    default:
      throw new Error(`Unknown quality tool: ${name}`);
  }
}
