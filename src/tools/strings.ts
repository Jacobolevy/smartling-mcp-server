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

export const addStringTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_workflow_steps',
    'Get workflow steps for a job and locale',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
      localeId: z.string().describe('The locale ID'),
    },
    async ({ projectId, jobId, localeId }) => {
      try {
        const result = await client.getWorkflowSteps(projectId, jobId, localeId);
        return createToolResponse(result, false, 'smartling-workflow-steps');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting workflow steps: ${errorMessage}`, true, 'smartling-workflow-steps');
      }
    }
  );

  server.tool(
    'smartling_assign_workflow_step',
    'Assign a workflow step to a specific user',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
      stepUid: z.string().describe('The workflow step UID'),
      assigneeUid: z.string().describe('The UID of the user to assign the step to'),
    },
    async ({ projectId, jobId, stepUid, assigneeUid }) => {
      try {
        await client.assignWorkflowStep(projectId, jobId, stepUid, assigneeUid);
        return createToolResponse({
          success: true,
          message: `Successfully assigned workflow step ${stepUid} to user ${assigneeUid}`,
          projectId,
          jobId,
          stepUid,
          assigneeUid
        }, false, 'smartling-assign-workflow');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error assigning workflow step: ${errorMessage}`, true, 'smartling-assign-workflow');
      }
    }
  );

  server.tool(
    'smartling_get_string_translations',
    'Get translations for a specific string across multiple locales',
    {
      projectId: z.string().describe('The project ID'),
      hashcode: z.string().describe('The unique hashcode of the string'),
      localeIds: z.array(z.string()).optional().describe('Optional: specific locale IDs to get translations for'),
    },
    async ({ projectId, hashcode, localeIds }) => {
      try {
        const results = [];
        
        if (localeIds && localeIds.length > 0) {
          // Get translations for specific locales
          for (const localeId of localeIds) {
            try {
              const translation = await client.getStringDetails(projectId, hashcode, localeId);
              results.push({
                localeId,
                translation,
                status: 'success'
              });
            } catch (error) {
              results.push({
                localeId,
                error: error instanceof Error ? error.message : String(error),
                status: 'error'
              });
            }
          }
        } else {
          // If no specific locales provided, get string from all available locales
          const projects = await client.getProjects();
          const project = projects.find(p => p.projectId === projectId);
          
          if (project?.targetLocales) {
            for (const locale of project.targetLocales) {
              try {
                const translation = await client.getStringDetails(projectId, hashcode, locale.localeId);
                results.push({
                  localeId: locale.localeId,
                  localeDescription: locale.description,
                  translation,
                  status: 'success'
                });
              } catch (error) {
                results.push({
                  localeId: locale.localeId,
                  localeDescription: locale.description,
                  error: error instanceof Error ? error.message : String(error),
                  status: 'error'
                });
              }
            }
          }
        }

        return createToolResponse({
          hashcode,
          projectId,
          translationsCount: results.filter(r => r.status === 'success').length,
          errorsCount: results.filter(r => r.status === 'error').length,
          translations: results
        }, false, 'smartling-string-translations');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting string translations: ${errorMessage}`, true, 'smartling-string-translations');
      }
    }
  );

  server.tool(
    'smartling_search_strings_advanced',
    'Advanced search for strings with multiple filters and sorting options',
    {
      projectId: z.string().describe('The project ID'),
      searchText: z.string().describe('Text to search for in strings'),
      localeId: z.string().optional().describe('Optional: specific locale to search in'),
      fileUris: z.array(z.string()).optional().describe('Optional: specific file URIs to search in'),
      tags: z.array(z.string()).optional().describe('Optional: filter by tags'),
      translationStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXCLUDED']).optional().describe('Optional: filter by translation status'),
      includeTimestamps: z.boolean().optional().describe('Include timestamp information'),
      limit: z.number().optional().describe('Maximum number of results to return'),
      offset: z.number().optional().describe('Number of results to skip (for pagination)'),
    },
    async ({ projectId, searchText, localeId, fileUris, tags, translationStatus, includeTimestamps, limit, offset }) => {
      try {
        // First, perform basic string search
        const searchOptions: any = {};
        if (localeId) searchOptions.localeId = localeId;
        if (fileUris) searchOptions.fileUris = fileUris;
        if (includeTimestamps) searchOptions.includeTimestamps = includeTimestamps;
        if (limit) searchOptions.limit = limit;

        let results = await client.searchStrings(projectId, searchText, searchOptions);

        // If tags filter is provided, also get strings by tags and intersect
        if (tags && tags.length > 0) {
          const taggedStrings = await client.getStringsByTag(projectId, tags, fileUris?.[0]);
          
          // Create a set of tagged string hashcodes for quick lookup
          const taggedHashcodes = new Set(
            Array.isArray(taggedStrings) ? taggedStrings.map((s: any) => s.hashcode) : []
          );

          // Filter search results to only include tagged strings
          if (Array.isArray(results.items)) {
            results.items = results.items.filter((item: any) => taggedHashcodes.has(item.hashcode));
          }
        }

        // Apply offset for pagination
        if (offset && Array.isArray(results.items)) {
          results.items = results.items.slice(offset);
        }

        // Add metadata about the search
        const searchMetadata = {
          searchText,
          filters: {
            localeId,
            fileUris,
            tags,
            translationStatus,
            limit,
            offset
          },
          resultCount: Array.isArray(results.items) ? results.items.length : 0,
          hasMoreResults: limit && Array.isArray(results.items) ? results.items.length === limit : false
        };

        return createToolResponse({
          searchMetadata,
          results
        }, false, 'smartling-advanced-search');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error in advanced string search: ${errorMessage}`, true, 'smartling-advanced-search');
      }
    }
  );

  server.tool(
    'smartling_get_translation_progress',
    'Get translation progress summary for a project or specific files',
    {
      projectId: z.string().describe('The project ID'),
      fileUris: z.array(z.string()).optional().describe('Optional: specific file URIs to check progress for'),
      localeIds: z.array(z.string()).optional().describe('Optional: specific locales to check progress for'),
    },
    async ({ projectId, fileUris, localeIds }) => {
      try {
        const progressData = [];

        // Get project information to determine target locales
        const projects = await client.getProjects();
        const project = projects.find(p => p.projectId === projectId);
        
        if (!project) {
          throw new Error(`Project ${projectId} not found`);
        }

        const targetLocales = localeIds && localeIds.length > 0 
          ? project.targetLocales?.filter(locale => localeIds.includes(locale.localeId)) || []
          : project.targetLocales || [];

        // Get file status for each file and locale combination
        if (fileUris && fileUris.length > 0) {
          for (const fileUri of fileUris) {
            try {
              const fileStatus = await client.getFileStatus(projectId, fileUri);
              progressData.push({
                fileUri,
                status: fileStatus,
                type: 'file_status'
              });
            } catch (error) {
              progressData.push({
                fileUri,
                error: error instanceof Error ? error.message : String(error),
                type: 'file_error'
              });
            }
          }
        }

        // Get recently localized strings for progress insight
        for (const locale of targetLocales) {
          try {
            const options: { limit: number; fileUris?: string[] } = { limit: 100 };
            if (fileUris && fileUris.length > 0) {
              options.fileUris = fileUris;
            }
            
            const recentlyLocalized = await client.getRecentlyLocalized(
              projectId, 
              locale.localeId, 
              options
            );
            
            progressData.push({
              localeId: locale.localeId,
              localeDescription: locale.description,
              recentlyLocalizedCount: Array.isArray(recentlyLocalized.items) ? recentlyLocalized.items.length : 0,
              recentlyLocalized: recentlyLocalized,
              type: 'locale_progress'
            });
          } catch (error) {
            progressData.push({
              localeId: locale.localeId,
              localeDescription: locale.description,
              error: error instanceof Error ? error.message : String(error),
              type: 'locale_error'
            });
          }
        }

        return createToolResponse({
          projectId,
          projectName: project.projectName,
          sourceLocale: project.sourceLocaleId,
          targetLocalesCount: targetLocales.length,
          filesChecked: fileUris?.length || 0,
          progressData
        }, false, 'smartling-translation-progress');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createToolResponse(`Error getting translation progress: ${errorMessage}`, true, 'smartling-translation-progress');
      }
    }
  );
}; 