import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client.js';

export const taggingTools: Tool[] = [
  {
    name: 'smartling_add_string_tags',
    description: 'Add tags to specific strings in a file',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        fileUri: {
          type: 'string',
          description: 'The file URI containing the strings'
        },
        stringUids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of string UIDs to tag'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags to add'
        }
      },
      required: ['projectId', 'fileUri', 'stringUids', 'tags']
    }
  },
  {
    name: 'smartling_remove_string_tags',
    description: 'Remove tags from specific strings in a file',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        fileUri: {
          type: 'string',
          description: 'The file URI containing the strings'
        },
        stringUids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of string UIDs to remove tags from'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags to remove'
        }
      },
      required: ['projectId', 'fileUri', 'stringUids', 'tags']
    }
  },
  {
    name: 'smartling_get_strings_by_tag',
    description: 'Search for strings by tags',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to search for'
        },
        fileUri: {
          type: 'string',
          description: 'Optional: limit search to specific file'
        }
      },
      required: ['projectId', 'tags']
    }
  },
  {
    name: 'smartling_get_available_tags',
    description: 'Get all available tags in a project',
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
  }
];

export async function handleTaggingTools(
  name: string,
  args: any,
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_add_string_tags':
      await client.addStringTags(
        args.projectId,
        args.fileUri,
        args.stringUids,
        args.tags
      );
      return { success: true, message: 'Tags added successfully' };

    case 'smartling_remove_string_tags':
      await client.removeStringTags(
        args.projectId,
        args.fileUri,
        args.stringUids,
        args.tags
      );
      return { success: true, message: 'Tags removed successfully' };

    case 'smartling_get_strings_by_tag':
      return await client.getStringsByTag(
        args.projectId,
        args.tags,
        args.fileUri
      );

    case 'smartling_get_available_tags':
      return await client.getAvailableTags(args.projectId);

    default:
      throw new Error(`Unknown tagging tool: ${name}`);
  }
}
