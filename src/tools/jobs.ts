import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';

export const addJobTools = (server: McpServer, client: SmartlingClient) => {
  server.tool(
    'smartling_create_job',
    'Create a new translation job in Smartling',
    {
      projectId: z.string().describe('The project ID'),
      jobName: z.string().describe('Name for the translation job'),
      targetLocaleIds: z.array(z.string()).describe('Target locale IDs for translation'),
      description: z.string().optional().describe('Optional job description'),
      dueDate: z.string().optional().describe('Due date in ISO format (YYYY-MM-DDTHH:MM:SSZ)'),
      callbackUrl: z.string().optional().describe('Optional webhook URL for job completion callback'),
      callbackMethod: z.enum(['GET', 'POST']).optional().default('POST').describe('HTTP method for callback'),
    },
    async ({ projectId, jobName, targetLocaleIds, description, dueDate, callbackUrl, callbackMethod }) => {
      try {
        const options: any = { jobName, targetLocaleIds };
        if (description !== undefined) options.description = description;
        if (dueDate !== undefined) options.dueDate = dueDate;
        if (callbackUrl !== undefined) options.callbackUrl = callbackUrl;
        if (callbackMethod !== undefined) options.callbackMethod = callbackMethod;
        
        const result = await client.createJob(projectId, options);
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
              text: `Error creating job: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_jobs',
    'Get all jobs for a project',
    {
      projectId: z.string().describe('The project ID'),
      status: z.enum(['AWAITING_AUTHORIZATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().describe('Filter by job status'),
    },
    async ({ projectId, status }) => {
      try {
        const result = await client.getJobs(projectId, status);
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
              text: `Error getting jobs: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_job',
    'Get details for a specific job',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
    },
    async ({ projectId, jobId }) => {
      try {
        const result = await client.getJob(projectId, jobId);
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
              text: `Error getting job: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_add_files_to_job',
    'Add files to an existing job',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
      fileUris: z.array(z.string()).describe('Array of file URIs to add to the job'),
    },
    async ({ projectId, jobId, fileUris }) => {
      try {
        await client.addFilesToJob(projectId, jobId, fileUris);
        const result = { success: true, message: 'Files added to job successfully' };
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
              text: `Error adding files to job: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_remove_files_from_job',
    'Remove files from an existing job',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
      fileUris: z.array(z.string()).describe('Array of file URIs to remove from the job'),
    },
    async ({ projectId, jobId, fileUris }) => {
      try {
        await client.removeFilesFromJob(projectId, jobId, fileUris);
        const result = { success: true, message: 'Files removed from job successfully' };
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
              text: `Error removing files from job: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_authorize_job',
    'Authorize a job for translation',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
    },
    async ({ projectId, jobId }) => {
      try {
        await client.authorizeJob(projectId, jobId);
        const result = { success: true, message: 'Job authorized successfully' };
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
              text: `Error authorizing job: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_cancel_job',
    'Cancel a job',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID'),
      reason: z.string().optional().describe('Optional reason for cancellation'),
    },
    async ({ projectId, jobId, reason }) => {
      try {
        await client.cancelJob(projectId, jobId, reason);
        const result = { success: true, message: 'Job cancelled successfully' };
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
              text: `Error cancelling job: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'smartling_get_job_progress',
    'Get detailed translation progress for a specific job, including progress by locale',
    {
      projectId: z.string().describe('The project ID'),
      jobId: z.string().describe('The job ID (translationJobUid)'),
      localeIds: z.array(z.string()).optional().describe('Optional: specific locale IDs to get progress for'),
    },
    async ({ projectId, jobId, localeIds }) => {
      if (!projectId || !jobId) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: projectId and jobId are required parameters',
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await client.getJobProgress(projectId, jobId, localeIds);
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
              text: `Error getting job progress: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};
