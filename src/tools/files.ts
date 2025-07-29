import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

const createToolResponse = (data: any, isError: boolean = false, toolName: string = 'smartling-tool') => {
  const timestamp = Date.now();
  return {
    _meta: {
      requestId: `${toolName}-${timestamp}`,
      timing: { timestamp },
      source: 'smartling-api',
      version: '3.0.0'
    },
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
    ...(isError && { isError: true }),
  };
};

export const addFileTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_upload_file',
    'Upload a file to Smartling for translation',
    {
      projectId: z.string().describe('The project ID'),
      fileContent: z.string().describe('The file content (base64 encoded)'),
      fileUri: z.string().describe('The unique file URI'),
      fileType: z.string().describe('The file type (json, xml, csv, properties, etc.)'),
      authorize: z.boolean().default(true).describe('Whether to authorize the content for translation'),
      localeIdsToAuthorize: z.array(z.string()).optional().describe('Specific locales to authorize for translation'),
    },
    async ({ projectId, fileContent, fileUri, fileType, authorize, localeIdsToAuthorize }) => {
      const startTime = Date.now();
      try {
        const fileBuffer = Buffer.from(fileContent, 'base64');
        const options: any = { authorize };
        if (localeIdsToAuthorize !== undefined) options.localeIdsToAuthorize = localeIdsToAuthorize;
        
        const result = await client.uploadFile(projectId, fileBuffer, fileUri, fileType, options);
        const responseTime = Date.now() - startTime;
        
        return {
          _meta: {
            requestId: `smartling-upload-${Date.now()}`,
            timing: { duration: responseTime },
            source: 'smartling-api',
            version: '3.0.0'
          },
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error uploading file: ${errorMessage}`, true, 'smartling-upload');
      }
    }
  );

  server.tool(
    'smartling_get_file_status',
    'Get the translation status of a file',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI'),
    },
    async ({ projectId, fileUri }) => {
      try {
        const result = await client.getFileStatus(projectId, fileUri);
        return createToolResponse(result, false, 'smartling-file-status');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting file status: ${errorMessage}`, true, 'smartling-file-status');
      }
    }
  );

  server.tool(
    'smartling_download_file',
    'Download a translated file from Smartling',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI'),
      locale: z.string().describe('The target locale to download'),
      retrievalType: z.enum(['published', 'pending', 'pseudo', 'contextMatchingInstrumented']).default('published').describe('Type of content to retrieve'),
      includeOriginalStrings: z.boolean().default(false).describe('Include original strings for incomplete translations'),
    },
    async ({ projectId, fileUri, locale, retrievalType, includeOriginalStrings }) => {
      try {
        const downloadOptions: any = { retrievalType, includeOriginalStrings };
        const downloadedFile = await client.downloadFile(projectId, fileUri, locale, downloadOptions);
        
        const result = {
        content: downloadedFile.toString('base64'),
        encoding: 'base64',
        size: downloadedFile.length
      };
    
        return createToolResponse(result, false, 'smartling-download');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error downloading file: ${errorMessage}`, true, 'smartling-download');
      }
    }
  );

  server.tool(
    'smartling_delete_file',
    'Delete a file from Smartling',
    {
      projectId: z.string().describe('The project ID to delete'),
      fileUri: z.string().describe('The file URI to delete'),
    },
    async ({ projectId, fileUri }) => {
      try {
        await client.deleteFile(projectId, fileUri);
        const result = { success: true, message: 'File deleted successfully' };
        return createToolResponse(result, false, 'smartling-delete-file');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error deleting file: ${errorMessage}`, true, 'smartling-delete-file');
      }
    }
  );

  server.tool(
    'smartling_search_strings',
    'Search for strings in translation files',
    {
      projectId: z.string().describe('The project ID'),
      searchText: z.string().describe('Text to search for'),
      localeId: z.string().optional().describe('Optional: specific locale to search in'),
      fileUris: z.array(z.string()).optional().describe('Optional: specific file URIs to search in'),
      includeTimestamps: z.boolean().optional().describe('Include timestamp information'),
      limit: z.number().optional().describe('Maximum number of results to return'),
    },
    async ({ projectId, searchText, localeId, fileUris, includeTimestamps, limit }) => {
      try {
        const options: any = {};
        if (localeId !== undefined) options.localeId = localeId;
        if (fileUris !== undefined) options.fileUris = fileUris;
        if (includeTimestamps !== undefined) options.includeTimestamps = includeTimestamps;
        if (limit !== undefined) options.limit = limit;
        
        const result = await client.searchStrings(projectId, searchText, options);
        return createToolResponse(result, false, 'smartling-search-strings');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error searching strings: ${errorMessage}`, true, 'smartling-search-strings');
      }
    }
  );

  server.tool(
    'smartling_get_string_details',
    'Get detailed information about a specific string',
    {
      projectId: z.string().describe('The project ID'),
      hashcode: z.string().describe('The unique hashcode of the string'),
      localeId: z.string().describe('The locale ID'),
    },
    async ({ projectId, hashcode, localeId }) => {
      try {
        const result = await client.getStringDetails(projectId, hashcode, localeId);
        return createToolResponse(result, false, 'smartling-string-details');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting string details: ${errorMessage}`, true, 'smartling-string-details');
      }
    }
  );

  server.tool(
    'smartling_get_recently_localized',
    'Get recently localized strings for a specific locale',
    {
      projectId: z.string().describe('The project ID'),
      localeId: z.string().describe('The locale ID'),
      limit: z.number().optional().describe('Maximum number of results to return'),
      fileUris: z.array(z.string()).optional().describe('Optional: specific file URIs to check'),
    },
    async ({ projectId, localeId, limit, fileUris }) => {
      try {
        const options: any = {};
        if (limit !== undefined) options.limit = limit;
        if (fileUris !== undefined) options.fileUris = fileUris;
        
        const result = await client.getRecentlyLocalized(projectId, localeId, options);
        return createToolResponse(result, false, 'smartling-recently-localized');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting recently localized: ${errorMessage}`, true, 'smartling-recently-localized');
      }
    }
  );
};
