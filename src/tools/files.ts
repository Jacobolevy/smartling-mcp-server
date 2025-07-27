import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client';

export const fileTools: Tool[] = [
  {
    name: 'smartling_upload_file',
    description: 'Upload a file to Smartling for translation',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        fileContent: {
          type: 'string',
          description: 'The file content (base64 encoded)'
        },
        fileUri: {
          type: 'string',
          description: 'The unique file URI'
        },
        fileType: {
          type: 'string',
          description: 'The file type (json, xml, csv, properties, etc.)'
        },
        authorize: {
          type: 'boolean',
          description: 'Whether to authorize the content for translation',
          default: true
        },
        localeIdsToAuthorize: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific locales to authorize for translation'
        }
      },
      required: ['projectId', 'fileContent', 'fileUri', 'fileType']
    }
  },
  {
    name: 'smartling_get_file_status',
    description: 'Get the translation status of a file',
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
        }
      },
      required: ['projectId', 'fileUri']
    }
  },
  {
    name: 'smartling_download_file',
    description: 'Download a translated file from Smartling',
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
        locale: {
          type: 'string',
          description: 'The target locale to download'
        },
        retrievalType: {
          type: 'string',
          description: 'Type of content to retrieve',
          enum: ['published', 'pending', 'pseudo', 'contextMatchingInstrumented'],
          default: 'published'
        },
        includeOriginalStrings: {
          type: 'boolean',
          description: 'Include original strings for incomplete translations',
          default: false
        }
      },
      required: ['projectId', 'fileUri', 'locale']
    }
  },
  {
    name: 'smartling_delete_file',
    description: 'Delete a file from Smartling',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID to delete'
        },
        fileUri: {
          type: 'string',
          description: 'The file URI to delete'
        }
      },
      required: ['projectId', 'fileUri']
    }
  },
  {
    name: 'smartling_search_strings',
    description: 'Search for strings by content across files and get metadata including timestamps',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        searchText: {
          type: 'string',
          description: 'Text to search for in source strings'
        },
        localeId: {
          type: 'string',
          description: 'Target locale to search translations (e.g., "es-ES" for Spanish)'
        },
        fileUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: limit search to specific files'
        },
        includeTimestamps: {
          type: 'boolean',
          description: 'Include creation and modification timestamps',
          default: true
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 50
        }
      },
      required: ['projectId', 'searchText']
    }
  },
  {
    name: 'smartling_get_string_details',
    description: 'Get detailed information about a specific string including timestamps and translation history',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        hashcode: {
          type: 'string',
          description: 'The string hashcode/UID'
        },
        localeId: {
          type: 'string',
          description: 'The target locale ID'
        }
      },
      required: ['projectId', 'hashcode', 'localeId']
    }
  },
  {
    name: 'smartling_get_recently_localized',
    description: 'Get recently localized strings sorted by modification date',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        localeId: {
          type: 'string',
          description: 'The target locale ID (e.g., "es-ES")'
        },
        limit: {
          type: 'number',
          description: 'Number of recent results to return',
          default: 20
        },
        fileUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: limit to specific files'
        }
      },
      required: ['projectId', 'localeId']
    }
  }
];

export async function handleFileTools(
  name: string, 
  args: any, 
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_upload_file':
      const fileBuffer = Buffer.from(args.fileContent, 'base64');
      const options: any = {};
      
      if (args.authorize !== undefined) options.authorize = args.authorize;
      if (args.localeIdsToAuthorize) options.localeIdsToAuthorize = args.localeIdsToAuthorize.join(',');
      
      return await client.uploadFile(
        args.projectId, 
        fileBuffer, 
        args.fileUri, 
        args.fileType,
        options
      );
    
    case 'smartling_get_file_status':
      return await client.getFileStatus(args.projectId, args.fileUri);
    
    case 'smartling_download_file':
      const downloadOptions: any = {};
      if (args.retrievalType) downloadOptions.retrievalType = args.retrievalType;
      if (args.includeOriginalStrings) downloadOptions.includeOriginalStrings = args.includeOriginalStrings;
      
      const downloadedFile = await client.downloadFile(
        args.projectId, 
        args.fileUri, 
        args.locale, 
        downloadOptions
      );
      
      return {
        content: downloadedFile.toString('base64'),
        encoding: 'base64',
        size: downloadedFile.length
      };
    
    case 'smartling_delete_file':
      await client.deleteFile(args.projectId, args.fileUri);
      return { success: true, message: 'File deleted successfully' };

    case 'smartling_search_strings':
      return await client.searchStrings(
        args.projectId,
        args.searchText,
        {
          localeId: args.localeId,
          fileUris: args.fileUris,
          includeTimestamps: args.includeTimestamps,
          limit: args.limit
        }
      );

    case 'smartling_get_string_details':
      return await client.getStringDetails(
        args.projectId,
        args.hashcode,
        args.localeId
      );

    case 'smartling_get_recently_localized':
      return await client.getRecentlyLocalized(
        args.projectId,
        args.localeId,
        {
          limit: args.limit,
          fileUris: args.fileUris
        }
      );
    
    default:
      throw new Error(`Unknown file tool: ${name}`);
  }
}
