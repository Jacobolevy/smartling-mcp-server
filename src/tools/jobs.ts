import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartlingClient } from '../smartling-client';

export const jobTools: Tool[] = [
  {
    name: 'smartling_create_job',
    description: 'Create a new translation job in Smartling',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        jobName: {
          type: 'string',
          description: 'Name for the translation job'
        },
        targetLocaleIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target locale IDs for translation'
        },
        description: {
          type: 'string',
          description: 'Optional job description'
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format (YYYY-MM-DDTHH:MM:SSZ)'
        },
        callbackUrl: {
          type: 'string',
          description: 'Optional webhook URL for job completion callback'
        },
        callbackMethod: {
          type: 'string',
          enum: ['GET', 'POST'],
          description: 'HTTP method for callback',
          default: 'POST'
        }
      },
      required: ['projectId', 'jobName', 'targetLocaleIds']
    }
  },
  {
    name: 'smartling_get_jobs',
    description: 'Get all jobs for a project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        status: {
          type: 'string',
          description: 'Filter by job status',
          enum: ['AWAITING_AUTHORIZATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'smartling_get_job',
    description: 'Get details for a specific job',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        jobId: {
          type: 'string',
          description: 'The job ID'
        }
      },
      required: ['projectId', 'jobId']
    }
  },
  {
    name: 'smartling_add_files_to_job',
    description: 'Add files to an existing job',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        jobId: {
          type: 'string',
          description: 'The job ID'
        },
        fileUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file URIs to add to the job'
        }
      },
      required: ['projectId', 'jobId', 'fileUris']
    }
  },
  {
    name: 'smartling_remove_files_from_job',
    description: 'Remove files from an existing job',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        jobId: {
          type: 'string',
          description: 'The job ID'
        },
        fileUris: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file URIs to remove from the job'
        }
      },
      required: ['projectId', 'jobId', 'fileUris']
    }
  },
  {
    name: 'smartling_authorize_job',
    description: 'Authorize a job to begin translation',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        jobId: {
          type: 'string',
          description: 'The job ID to authorize'
        }
      },
      required: ['projectId', 'jobId']
    }
  },
  {
    name: 'smartling_cancel_job',
    description: 'Cancel a job',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'The project ID'
        },
        jobId: {
          type: 'string',
          description: 'The job ID to cancel'
        },
        reason: {
          type: 'string',
          description: 'Optional reason for cancellation'
        }
      },
      required: ['projectId', 'jobId']
    }
  }
];

export async function handleJobTools(
  name: string,
  args: any,
  client: SmartlingClient
): Promise<any> {
  switch (name) {
    case 'smartling_create_job':
      return await client.createJob(args.projectId, {
        jobName: args.jobName,
        targetLocaleIds: args.targetLocaleIds,
        description: args.description,
        dueDate: args.dueDate,
        callbackUrl: args.callbackUrl,
        callbackMethod: args.callbackMethod
      });

    case 'smartling_get_jobs':
      return await client.getJobs(args.projectId, args.status);

    case 'smartling_get_job':
      return await client.getJob(args.projectId, args.jobId);

    case 'smartling_add_files_to_job':
      await client.addFilesToJob(args.projectId, args.jobId, args.fileUris);
      return { success: true, message: 'Files added to job successfully' };

    case 'smartling_remove_files_from_job':
      await client.removeFilesFromJob(args.projectId, args.jobId, args.fileUris);
      return { success: true, message: 'Files removed from job successfully' };

    case 'smartling_authorize_job':
      await client.authorizeJob(args.projectId, args.jobId);
      return { success: true, message: 'Job authorized successfully' };

    case 'smartling_cancel_job':
      await client.cancelJob(args.projectId, args.jobId, args.reason);
      return { success: true, message: 'Job cancelled successfully' };

    default:
      throw new Error(`Unknown job tool: ${name}`);
  }
}
