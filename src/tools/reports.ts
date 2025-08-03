import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addReportTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_get_project_summary_report',
    'Get project summary report with general metrics',
    {
      projectId: z.string().describe('The project ID'),
      localeIds: z.array(z.string()).optional().describe('Optional: filter by specific locales'),
      dateRange: z.object({
        start: z.string().describe('Start date (ISO format)'),
        end: z.string().describe('End date (ISO format)'),
      }).optional().describe('Optional: date range filter'),
    },
    async ({ projectId, localeIds, dateRange }) => {
      try {
        const options: any = {};
        if (localeIds !== undefined) {
          options.localeIds = localeIds;
        }
        if (dateRange !== undefined) {
          options.dateRange = dateRange;
        }
        
        const result = await client.getProjectSummaryReport(projectId, options);
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
              text: `Error getting project summary report: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_job_progress_report',
    'Get detailed progress report for a specific job',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
      includeWordCounts: z.boolean().optional().describe('Include word count statistics'),
      includeProgress: z.boolean().optional().describe('Include progress percentages'),
    },
    async ({ projectId, jobId, includeWordCounts, includeProgress }) => {
      try {
        const options: any = {};
        if (includeWordCounts !== undefined) {
          options.includeWordCounts = includeWordCounts;
        }
        if (includeProgress !== undefined) {
          options.includeProgress = includeProgress;
        }
        
        const result = await client.getJobProgressReport(projectId, jobId, options);
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
              text: `Error getting job progress report: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_cost_estimate',
    'Get cost estimate for translation content',
    {
      projectId: z.string().describe('The project ID'),
      fileUris: z.array(z.string()).describe('Array of file URIs to estimate'),
      targetLocaleIds: z.array(z.string()).describe('Target locale IDs for translation'),
      workflowUid: z.string().optional().describe('Optional specific workflow UID'),
    },
    async ({ projectId, fileUris, targetLocaleIds, workflowUid }) => {
      try {
        const estimateData: any = {
          fileUris,
          targetLocaleIds,
        };
        if (workflowUid !== undefined) {
          estimateData.workflowUid = workflowUid;
        }
        
        const result = await client.getCostEstimate(projectId, estimateData);
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
              text: `Error getting cost estimate: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_translation_velocity_report',
    'Get translation velocity report by period',
    {
      projectId: z.string().describe('The project ID'),
      period: z.enum(['daily', 'weekly', 'monthly']).describe('Report period'),
      localeIds: z.array(z.string()).optional().describe('Optional: filter by specific locales'),
      startDate: z.string().optional().describe('Optional: start date (ISO format)'),
      endDate: z.string().optional().describe('Optional: end date (ISO format)'),
    },
    async ({ projectId, period, localeIds, startDate, endDate }) => {
      try {
        const options: any = {};
        if (localeIds !== undefined) {
          options.localeIds = localeIds;
        }
        if (startDate !== undefined) {
          options.startDate = startDate;
        }
        if (endDate !== undefined) {
          options.endDate = endDate;
        }
        
        const result = await client.getTranslationVelocityReport(projectId, period, options);
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
              text: `Error getting translation velocity report: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_word_count_report',
    'Get detailed word count report',
    {
      projectId: z.string().describe('The project ID'),
      fileUris: z.array(z.string()).optional().describe('Optional: filter by specific files'),
      localeIds: z.array(z.string()).optional().describe('Optional: filter by specific locales'),
      includeInProgressContent: z.boolean().optional().describe('Include content in progress'),
    },
    async ({ projectId, fileUris, localeIds, includeInProgressContent }) => {
      try {
        const options: any = {};
        if (fileUris !== undefined) {
          options.fileUris = fileUris;
        }
        if (localeIds !== undefined) {
          options.localeIds = localeIds;
        }
        if (includeInProgressContent !== undefined) {
          options.includeInProgressContent = includeInProgressContent;
        }
        
        const result = await client.getWordCountReport(projectId, options);
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
              text: `Error getting word count report: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_quality_score_report',
    'Get quality score report for translations',
    {
      projectId: z.string().describe('The project ID'),
      localeIds: z.array(z.string()).optional().describe('Optional: filter by specific locales'),
      dateRange: z.object({
        start: z.string().describe('Start date (ISO format)'),
        end: z.string().describe('End date (ISO format)'),
      }).optional().describe('Optional: date range filter'),
      includeDetails: z.boolean().optional().describe('Include detailed quality check information'),
    },
    async ({ projectId, localeIds, dateRange, includeDetails }) => {
      try {
        const options: any = {};
        if (localeIds !== undefined) {
          options.localeIds = localeIds;
        }
        if (dateRange !== undefined) {
          options.dateRange = dateRange;
        }
        if (includeDetails !== undefined) {
          options.includeDetails = includeDetails;
        }
        
        const result = await client.getQualityScoreReport(projectId, options);
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
              text: `Error getting quality score report: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}; 