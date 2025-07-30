import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

const createToolResponse = (content: any, isError: boolean = false, requestId: string) => {
  return {
    _meta: {
      requestId,
      timing: { duration: Date.now() },
      source: 'smartling-api',
      version: '3.1.0'
    },
    content: [
      {
        type: 'text' as const,
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      },
    ],
    ...(isError && { isError: true }),
  };
};

export const addTaggingTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_available_tags',
    'Get all available tags in a project',
    {
      projectId: z.string().describe('The project ID'),
    },
    async ({ projectId }) => {
      try {
        const result = await client.getAvailableTags(projectId);
        return createToolResponse(result, false, 'smartling-get-tags');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting available tags: ${errorMessage}`, true, 'smartling-get-tags');
      }
    }
  );

  server.tool(
    'smartling_add_string_tags',
    'Add tags to specific strings in a file',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI containing the strings'),
      stringUids: z.array(z.string()).describe('Array of string UIDs to tag'),
      tags: z.array(z.string()).describe('Array of tags to add to the strings'),
    },
    async ({ projectId, fileUri, stringUids, tags }) => {
      try {
        await client.addStringTags(projectId, fileUri, stringUids, tags);
        return createToolResponse({
          success: true,
          message: `Successfully added ${tags.length} tag(s) to ${stringUids.length} string(s)`,
          tags,
          stringUids,
          fileUri
        }, false, 'smartling-add-string-tags');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error adding string tags: ${errorMessage}`, true, 'smartling-add-string-tags');
      }
    }
  );

  server.tool(
    'smartling_remove_string_tags',
    'Remove tags from specific strings in a file',
    {
      projectId: z.string().describe('The project ID'),
      fileUri: z.string().describe('The file URI containing the strings'),
      stringUids: z.array(z.string()).describe('Array of string UIDs to remove tags from'),
      tags: z.array(z.string()).describe('Array of tags to remove from the strings'),
    },
    async ({ projectId, fileUri, stringUids, tags }) => {
      try {
        await client.removeStringTags(projectId, fileUri, stringUids, tags);
        return createToolResponse({
          success: true,
          message: `Successfully removed ${tags.length} tag(s) from ${stringUids.length} string(s)`,
          tags,
          stringUids,
          fileUri
        }, false, 'smartling-remove-string-tags');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error removing string tags: ${errorMessage}`, true, 'smartling-remove-string-tags');
      }
    }
  );

  server.tool(
    'smartling_get_strings_by_tag',
    'Get all strings that have specific tags',
    {
      projectId: z.string().describe('The project ID'),
      tags: z.array(z.string()).describe('Array of tags to search for'),
      fileUri: z.string().optional().describe('Optional: specific file URI to search in'),
    },
    async ({ projectId, tags, fileUri }) => {
      try {
        const result = await client.getStringsByTag(projectId, tags, fileUri);
        return createToolResponse(result, false, 'smartling-get-strings-by-tag');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting strings by tag: ${errorMessage}`, true, 'smartling-get-strings-by-tag');
      }
    }
  );

  server.tool(
    'smartling_debug_tags_search',
    'Debug tool for tag searching - provides detailed information about tags and string filtering',
    {
      projectId: z.string().describe('The project ID'),
      tags: z.array(z.string()).describe('Array of tags to search for'),
      fileUri: z.string().optional().describe('Optional: specific file URI to search in'),
      debugMode: z.boolean().optional().default(true).describe('Enable detailed debugging information'),
    },
    async ({ projectId, tags, fileUri, debugMode = true }) => {
      try {
        const debugInfo: any = {
          searchCriteria: { projectId, tags, fileUri },
          steps: []
        };

        // Step 1: Check if we can access the project
        debugInfo.steps.push('1. Checking project access...');
        try {
          const projects = await client.getProjects();
          const project = projects.find(p => p.projectId === projectId);
          if (project) {
            debugInfo.projectFound = true;
            debugInfo.projectName = project.projectName;
            debugInfo.steps.push('✅ Project found: ' + project.projectName);
          } else {
            debugInfo.projectFound = false;
            debugInfo.steps.push('❌ Project not found in your accessible projects');
            debugInfo.availableProjects = projects.map(p => ({ id: p.projectId, name: p.projectName }));
          }
        } catch (error) {
          debugInfo.steps.push('❌ Error accessing projects: ' + (error instanceof Error ? error.message : String(error)));
        }

        // Step 2: Get available tags
        debugInfo.steps.push('2. Getting available tags...');
        try {
          const availableTags = await client.getAvailableTags(projectId);
          debugInfo.availableTags = availableTags;
          debugInfo.steps.push(`✅ Found ${Array.isArray(availableTags) ? availableTags.length : 0} available tags`);
          
          // Check if requested tags exist
          if (Array.isArray(availableTags)) {
            const matchingTags = tags.filter(tag => availableTags.includes(tag));
            const missingTags = tags.filter(tag => !availableTags.includes(tag));
            
            debugInfo.matchingTags = matchingTags;
            debugInfo.missingTags = missingTags;
            
            if (matchingTags.length > 0) {
              debugInfo.steps.push(`✅ Found matching tags: ${matchingTags.join(', ')}`);
            }
            if (missingTags.length > 0) {
              debugInfo.steps.push(`⚠️ Missing tags: ${missingTags.join(', ')}`);
            }
          }
        } catch (error) {
          debugInfo.steps.push('❌ Error getting tags: ' + (error instanceof Error ? error.message : String(error)));
        }

        // Step 3: Try to get strings with tags
        debugInfo.steps.push('3. Searching for strings with specified tags...');
        try {
          const result = await client.getStringsByTag(projectId, tags, fileUri);
          debugInfo.searchResult = result;
          debugInfo.resultCount = Array.isArray(result) ? result.length : ((result as any)?.items?.length || 0);
          debugInfo.steps.push(`✅ Search completed. Found ${debugInfo.resultCount} strings`);
          
          if (debugMode && Array.isArray(result) && result.length > 0) {
            // Show sample of found strings
            debugInfo.sampleStrings = result.slice(0, 3).map((str: any) => ({
              hashcode: str.hashcode,
              stringText: str.stringText || str.parsedStringText,
              tags: str.tags,
              fileUri: str.fileUri
            }));
          }
          
        } catch (error) {
          debugInfo.steps.push('❌ Error in string search: ' + (error instanceof Error ? error.message : String(error)));
          debugInfo.searchError = error instanceof Error ? error.message : String(error);
        }

        return createToolResponse(debugInfo, false, 'smartling-debug-tags-search');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error in debug tags search: ${errorMessage}`, true, 'smartling-debug-tags-search');
      }
    }
  );
};
