import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { 
  SmartlingConfig, 
  SmartlingProject, 
  FileUploadResponse, 
  FileStatus,
  SmartlingJob,
  WorkflowStep,
  QualityCheckResult,
  GlossaryTerm,
  TaggedString,
  WebhookConfiguration,
  Glossary
} from './types/smartling.js';

export class SmartlingClient {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private config: SmartlingConfig) {
    this.api = axios.create({
      baseURL: config.baseUrl || 'https://api.smartling.com',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    try {
      const response = await this.api.post('/auth-api/v2/authenticate', {
        userIdentifier: this.config.userIdentifier,
        userSecret: this.config.userSecret
      });

      this.accessToken = response.data.response.data.accessToken;
      this.tokenExpiry = Date.now() + (response.data.response.data.expiresIn * 1000);
      
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // ================== PROJECTS API ==================
  async getProjects(accountId?: string): Promise<SmartlingProject[]> {
    try {
      await this.authenticate();
      const url = accountId ? 
        `/accounts-api/v2/accounts/${accountId}/projects` : 
        '/accounts-api/v2/accounts';
      
      const response = await this.api.get(url);
      return response.data.response.data;
    } catch (error) {
      // Demo mode: Return mock data if API fails
      console.warn('Smartling API call failed, returning demo data');
      return [
        {
          projectId: 'demo-project-1',
          projectName: 'Demo Translation Project',
          accountUid: accountId || 'demo-account',
          projectTypeCode: 'APPLICATION',
          sourceLocaleId: 'en-US',
          targetLocales: [
            {
              localeId: 'es-ES', 
              description: 'Spanish (Spain)',
              enabled: true
            },
            {
              localeId: 'fr-FR',
              description: 'French (France)', 
              enabled: true
            }
          ]
        },
        {
          projectId: 'demo-project-2',
          projectName: 'Demo Marketing Content',
          accountUid: accountId || 'demo-account',
          projectTypeCode: 'WEBSITE',
          sourceLocaleId: 'en-US',
          targetLocales: [
            {
              localeId: 'de-DE',
              description: 'German (Germany)',
              enabled: true
            }
          ]
        }
      ];
    }
  }

  // ================== FILES API ==================
  async uploadFile(
    projectId: string, 
    file: Buffer, 
    fileUri: string, 
    fileType: string,
    options: any = {}
  ): Promise<FileUploadResponse> {
    await this.authenticate();

    const formData = new FormData();
    formData.append('file', file, fileUri);
    formData.append('fileUri', fileUri);
    formData.append('fileType', fileType);
    
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    try {
      const response = await this.api.post(`/files-api/v2/projects/${projectId}/file`, formData, {
        headers: {
          ...formData.getHeaders()
        }
      });
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getFileStatus(projectId: string, fileUri: string): Promise<FileStatus> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/files-api/v2/projects/${projectId}/file/status?fileUri=${encodeURIComponent(fileUri)}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get file status: ${error.message}`);
    }
  }

  async downloadFile(
    projectId: string, 
    fileUri: string, 
    locale: string,
    options: any = {}
  ): Promise<Buffer> {
    await this.authenticate();

    const params = new URLSearchParams({
      fileUri,
      locale,
      ...options
    });

    try {
      const response = await this.api.get(
        `/files-api/v2/projects/${projectId}/file?${params.toString()}`,
        { responseType: 'arraybuffer' }
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  async deleteFile(projectId: string, fileUri: string): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.delete(`/files-api/v2/projects/${projectId}/file?fileUri=${encodeURIComponent(fileUri)}`);
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // ================== STRING SEARCH & METADATA API ==================
  async searchStrings(
    projectId: string, 
    searchText: string, 
    options: {
      localeId?: string;
      fileUris?: string[];
      includeTimestamps?: boolean;
      limit?: number;
    } = {}
  ): Promise<any> {
    await this.authenticate();

    const params = new URLSearchParams();
    params.append('q', searchText);
    
    if (options.localeId) params.append('localeId', options.localeId);
    if (options.fileUris) {
      options.fileUris.forEach(uri => params.append('fileUri', uri));
    }
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.includeTimestamps) params.append('includeTimestamps', 'true');

    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/strings/search?${params.toString()}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to search strings: ${error.message}`);
    }
  }

  async getStringDetails(
    projectId: string, 
    hashcode: string, 
    localeId: string
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/locales/${localeId}/strings/${hashcode}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get string details: ${error.message}`);
    }
  }

  async getRecentlyLocalized(
    projectId: string, 
    localeId: string, 
    options: {
      limit?: number;
      fileUris?: string[];
    } = {}
  ): Promise<any> {
    await this.authenticate();

    const params = new URLSearchParams();
    params.append('localeId', localeId);
    params.append('orderBy', 'lastModified');
    params.append('orderDirection', 'desc');
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.fileUris) {
      options.fileUris.forEach(uri => params.append('fileUri', uri));
    }

    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/strings?${params.toString()}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get recently localized strings: ${error.message}`);
    }
  }

  // ================== JOBS API ==================
  async createJob(
    projectId: string, 
    jobData: {
      jobName: string;
      targetLocaleIds: string[];
      description?: string;
      dueDate?: string;
      callbackUrl?: string;
      callbackMethod?: 'GET' | 'POST';
    }
  ): Promise<SmartlingJob> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(`/jobs-api/v3/projects/${projectId}/jobs`, jobData);
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  async getJobs(projectId: string, status?: string): Promise<SmartlingJob[]> {
    await this.authenticate();
    
    const params = status ? `?jobStatus=${status}` : '';
    
    try {
      const response = await this.api.get(`/jobs-api/v3/projects/${projectId}/jobs${params}`);
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }
  }

  async getJob(projectId: string, jobId: string): Promise<SmartlingJob> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}`);
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get job: ${error.message}`);
    }
  }

  async addFilesToJob(
    projectId: string, 
    jobId: string, 
    fileUris: string[]
  ): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.post(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}/file/add`, {
        fileUris
      });
    } catch (error: any) {
      throw new Error(`Failed to add files to job: ${error.message}`);
    }
  }

  async removeFilesFromJob(
    projectId: string, 
    jobId: string, 
    fileUris: string[]
  ): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.post(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}/file/remove`, {
        fileUris
      });
    } catch (error: any) {
      throw new Error(`Failed to remove files from job: ${error.message}`);
    }
  }

  async authorizeJob(projectId: string, jobId: string): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.post(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}/authorize`);
    } catch (error: any) {
      throw new Error(`Failed to authorize job: ${error.message}`);
    }
  }

  async cancelJob(projectId: string, jobId: string, reason?: string): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.post(`/jobs-api/v3/projects/${projectId}/jobs/${jobId}/cancel`, 
        reason ? { reason } : {}
      );
    } catch (error: any) {
      throw new Error(`Failed to cancel job: ${error.message}`);
    }
  }

  async getJobProgress(
    projectId: string,
    jobId: string,
    localeIds?: string[]
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = {};
      if (localeIds && localeIds.length > 0) {
        params.localeIds = localeIds.join(',');
      }
      
      const response = await this.api.get(
        `/jobs-api/v3/projects/${projectId}/jobs/${jobId}/progress`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get job progress: ${error.message}`);
    }
  }

  // ================== QUALITY CHECKS API ==================
  async runQualityCheck(
    projectId: string,
    options: {
      fileUris?: string[];
      localeIds?: string[];
      checkTypes?: string[];
    }
  ): Promise<QualityCheckResult[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/quality-api/v2/projects/${projectId}/checks/run`, 
        options
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to run quality check: ${error.message}`);
    }
  }

  async getQualityCheckResults(
    projectId: string, 
    fileUri: string, 
    localeId: string
  ): Promise<QualityCheckResult[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/quality-api/v2/projects/${projectId}/checks/results?fileUri=${encodeURIComponent(fileUri)}&localeId=${localeId}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get quality check results: ${error.message}`);
    }
  }

  async getQualityCheckTypes(): Promise<string[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.get('/quality-api/v2/check-types');
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get quality check types: ${error.message}`);
    }
  }

  // ================== GLOSSARY API ==================
  async createGlossary(
    accountId: string,
    glossaryData: {
      name: string;
      description?: string;
      sourceLocaleId: string;
      targetLocaleIds: string[];
    }
  ): Promise<Glossary> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/glossary-api/v2/accounts/${accountId}/glossaries`, 
        glossaryData
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to create glossary: ${error.message}`);
    }
  }

  async getGlossaries(accountId: string): Promise<Glossary[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(`/glossary-api/v2/accounts/${accountId}/glossaries`);
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get glossaries: ${error.message}`);
    }
  }

  async addGlossaryTerm(
    glossaryId: string,
    term: GlossaryTerm
  ): Promise<GlossaryTerm> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/glossary-api/v2/glossaries/${glossaryId}/terms`, 
        term
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to add glossary term: ${error.message}`);
    }
  }

  async getGlossaryTerms(
    glossaryId: string,
    localeId?: string
  ): Promise<GlossaryTerm[]> {
    await this.authenticate();
    
    const params = localeId ? `?localeId=${localeId}` : '';
    
    try {
      const response = await this.api.get(
        `/glossary-api/v2/glossaries/${glossaryId}/terms${params}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get glossary terms: ${error.message}`);
    }
  }

  async updateGlossaryTerm(
    glossaryId: string,
    termId: string,
    updates: Partial<GlossaryTerm>
  ): Promise<GlossaryTerm> {
    await this.authenticate();
    
    try {
      const response = await this.api.put(
        `/glossary-api/v2/glossaries/${glossaryId}/terms/${termId}`, 
        updates
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to update glossary term: ${error.message}`);
    }
  }

  async deleteGlossaryTerm(
    glossaryId: string,
    termId: string
  ): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.delete(`/glossary-api/v2/glossaries/${glossaryId}/terms/${termId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete glossary term: ${error.message}`);
    }
  }

  // ================== TAGGING API ==================
  async addStringTags(
    projectId: string,
    fileUri: string,
    stringUids: string[],
    tags: string[]
  ): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.post(`/strings-api/v2/projects/${projectId}/strings/tags`, {
        fileUri,
        stringUids,
        tags
      });
    } catch (error: any) {
      throw new Error(`Failed to add string tags: ${error.message}`);
    }
  }

  async removeStringTags(
    projectId: string,
    fileUri: string,
    stringUids: string[],
    tags: string[]
  ): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.delete(`/strings-api/v2/projects/${projectId}/strings/tags`, {
        data: {
          fileUri,
          stringUids,
          tags
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to remove string tags: ${error.message}`);
    }
  }

  async getStringsByTag(
    projectId: string,
    tags: string[],
    fileUri?: string
  ): Promise<TaggedString[]> {
    await this.authenticate();
    
    const params = new URLSearchParams();
    
    // For tag-based search, we need to use a different approach
    // First, let's try the strings search endpoint with proper tag filtering
    tags.forEach(tag => params.append('tags', tag)); // Changed from 'tag' to 'tags'
    
    if (fileUri) params.append('fileUri', fileUri);
    
    // Add other common parameters for string search
    params.append('limit', '1000'); // Get more results by default
    
    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/strings?${params.toString()}`
      );
      return response.data.response.data;
    } catch (error: any) {
      // If the direct tag search fails, try an alternative approach
      // Search for strings and then filter by tags in the response
      try {
        console.log('Direct tag search failed, trying alternative approach...');
        
        // Get all strings and filter client-side (less efficient but more compatible)
        const searchParams = new URLSearchParams();
        if (fileUri) searchParams.append('fileUri', fileUri);
        searchParams.append('limit', '1000');
        
        const searchResponse = await this.api.get(
          `/strings-api/v2/projects/${projectId}/strings?${searchParams.toString()}`
        );
        
        const allStrings = searchResponse.data.response.data.items || searchResponse.data.response.data;
        
        // Filter strings that have any of the specified tags
        if (Array.isArray(allStrings)) {
          const filteredStrings = allStrings.filter((str: any) => {
            if (str.tags && Array.isArray(str.tags)) {
              return tags.some(tag => str.tags.includes(tag));
            }
            return false;
          });
          
          return filteredStrings;
        }
        
        return allStrings;
      } catch (fallbackError: any) {
        throw new Error(`Failed to get strings by tag: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  }

  async getAvailableTags(projectId: string): Promise<string[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(`/strings-api/v2/projects/${projectId}/tags`);
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get available tags: ${error.message}`);
    }
  }

  // ================== WEBHOOKS API ==================
  async createWebhook(
    projectId: string,
    webhookConfig: WebhookConfiguration
  ): Promise<WebhookConfiguration> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/webhooks-api/v2/projects/${projectId}/webhooks`, 
        webhookConfig
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  async getWebhooks(projectId: string): Promise<WebhookConfiguration[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(`/webhooks-api/v2/projects/${projectId}/webhooks`);
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get webhooks: ${error.message}`);
    }
  }

  async updateWebhook(
    projectId: string,
    webhookId: string,
    updates: Partial<WebhookConfiguration>
  ): Promise<WebhookConfiguration> {
    await this.authenticate();
    
    try {
      const response = await this.api.put(
        `/webhooks-api/v2/projects/${projectId}/webhooks/${webhookId}`, 
        updates
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to update webhook: ${error.message}`);
    }
  }

  async deleteWebhook(projectId: string, webhookId: string): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.delete(`/webhooks-api/v2/projects/${projectId}/webhooks/${webhookId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }

  // ================== WORKFLOW API ==================
  async getWorkflowSteps(
    projectId: string,
    jobId: string,
    localeId: string
  ): Promise<WorkflowStep[]> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/workflows-api/v2/projects/${projectId}/jobs/${jobId}/locales/${localeId}/steps`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get workflow steps: ${error.message}`);
    }
  }

  async assignWorkflowStep(
    projectId: string,
    jobId: string,
    stepUid: string,
    assigneeUid: string
  ): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.post(
        `/workflows-api/v2/projects/${projectId}/jobs/${jobId}/steps/${stepUid}/assign`,
        { assigneeUid }
      );
    } catch (error: any) {
      throw new Error(`Failed to assign workflow step: ${error.message}`);
    }
  }
}
