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
    // Use provided accountId or fall back to default from config
    const targetAccountId = accountId || this.config.accountId;
    
    try {
      await this.authenticate();
      const url = targetAccountId ? 
        `/accounts-api/v2/accounts/${targetAccountId}/projects` : 
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
          accountUid: targetAccountId || 'demo-account',
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
          accountUid: targetAccountId || 'demo-account',
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
    
    // Also try sourceKeyword parameter as seen in web interface
    const paramsSourceKeyword = new URLSearchParams();
    paramsSourceKeyword.append('sourceKeyword', searchText);
    
    if (options.localeId) {
      params.append('localeId', options.localeId);
      paramsSourceKeyword.append('localeId', options.localeId);
    }
    if (options.fileUris) {
      options.fileUris.forEach(uri => {
        params.append('fileUri', uri);
        paramsSourceKeyword.append('fileUri', uri);
      });
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
      paramsSourceKeyword.append('limit', options.limit.toString());
    }
    if (options.includeTimestamps) {
      params.append('includeTimestamps', 'true');
      paramsSourceKeyword.append('includeTimestamps', 'true');
    }

    try {
      // Try different endpoint variations based on Smartling web interface patterns
      
      // First try: strings-api/v2 with search
      console.log(`[DEBUG] Trying POST: /strings-api/v2/projects/${projectId}/strings/search`);
      const postResponse = await this.api.post(
        `/strings-api/v2/projects/${projectId}/strings/search`,
        {
          q: searchText,
          localeId: options.localeId,
          fileUris: options.fileUris,
          limit: options.limit,
          includeTimestamps: options.includeTimestamps
        }
      );
      return postResponse.data.response.data;
    } catch (postError: any) {
      console.log(`[DEBUG] POST failed: ${postError.message}`);
      
      // Second try: strings-api/v2 with GET
      try {
        console.log(`[DEBUG] Trying GET: /strings-api/v2/projects/${projectId}/strings?${params.toString()}`);
        const response = await this.api.get(
          `/strings-api/v2/projects/${projectId}/strings?${params.toString()}`
        );
        return response.data.response.data;
      } catch (getError: any) {
        console.log(`[DEBUG] GET strings-api failed: ${getError.message}`);
        
        // Third try: different API version
        try {
          console.log(`[DEBUG] Trying GET: /projects-api/v2/projects/${projectId}/strings?${params.toString()}`);
          const response = await this.api.get(
            `/projects-api/v2/projects/${projectId}/strings?${params.toString()}`
          );
          return response.data.response.data;
        } catch (projectsError: any) {
          console.log(`[DEBUG] GET projects-api failed: ${projectsError.message}`);
          
          // Fourth try: sourceKeyword parameter like web interface
          try {
            console.log(`[DEBUG] Trying GET with sourceKeyword: /strings-api/v2/projects/${projectId}/strings?${paramsSourceKeyword.toString()}`);
            const response = await this.api.get(
              `/strings-api/v2/projects/${projectId}/strings?${paramsSourceKeyword.toString()}`
            );
            return response.data.response.data;
          } catch (sourceKeywordError: any) {
            console.log(`[DEBUG] GET sourceKeyword failed: ${sourceKeywordError.message}`);
            throw new Error(`Failed to search strings: ${getError.message}`);
          }
        }
      }
    }
  }

  async getStringDetailsByHashcode(
    projectId: string, 
    hashcode: string
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/strings/${hashcode}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get string details: ${error.message}`);
    }
  }

  async getStringTranslations(
    projectId: string, 
    hashcode: string
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/strings/${hashcode}/translations`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get string translations: ${error.message}`);
    }
  }

  // Backward compatibility function - maps to getStringTranslations for legacy code
  async getStringDetails(
    projectId: string, 
    hashcode: string, 
    localeId: string
  ): Promise<any> {
    // This function now delegates to getStringTranslations for backward compatibility
    // The localeId parameter is kept for compatibility but not used in the API call
    return this.getStringTranslations(projectId, hashcode);
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

  // ================== CONTEXT API ==================
  async uploadContext(
    projectId: string,
    contextData: {
      contextType: 'image' | 'video' | 'html';
      contextName: string;
      fileContent: string;
      contextDescription?: string;
    }
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/context-api/v2/projects/${projectId}/contexts`,
        contextData
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to upload context: ${error.message}`);
    }
  }

  async getContext(projectId: string, contextUid: string): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/context-api/v2/projects/${projectId}/contexts/${contextUid}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get context: ${error.message}`);
    }
  }

  async listContexts(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = {};
      if (options.limit !== undefined) params.limit = options.limit;
      if (options.offset !== undefined) params.offset = options.offset;
      
      const response = await this.api.get(
        `/context-api/v2/projects/${projectId}/contexts`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to list contexts: ${error.message}`);
    }
  }

  async bindContextToString(
    projectId: string,
    bindingData: {
      contextUid: string;
      stringHashcodes: string[];
      coordinates?: {
        x: number;
        y: number;
        width?: number;
        height?: number;
      };
    }
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/context-api/v2/projects/${projectId}/bindings`,
        bindingData
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to bind context to string: ${error.message}`);
    }
  }

  async deleteContext(projectId: string, contextUid: string): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.delete(
        `/context-api/v2/projects/${projectId}/contexts/${contextUid}`
      );
    } catch (error: any) {
      throw new Error(`Failed to delete context: ${error.message}`);
    }
  }

  // ================== LOCALES API ==================
  async getProjectLocales(projectId: string): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/projects-api/v2/projects/${projectId}/locales`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get project locales: ${error.message}`);
    }
  }

  async addLocaleToProject(
    projectId: string,
    localeId: string,
    options: {
      workflowUid?: string;
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/projects-api/v2/projects/${projectId}/locales/${localeId}`,
        options
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to add locale to project: ${error.message}`);
    }
  }

  async getLocaleDetails(projectId: string, localeId: string): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get(
        `/projects-api/v2/projects/${projectId}/locales/${localeId}`
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get locale details: ${error.message}`);
    }
  }

  async removeLocaleFromProject(projectId: string, localeId: string): Promise<void> {
    await this.authenticate();
    
    try {
      await this.api.delete(
        `/projects-api/v2/projects/${projectId}/locales/${localeId}`
      );
    } catch (error: any) {
      throw new Error(`Failed to remove locale from project: ${error.message}`);
    }
  }

  async getSupportedLocales(): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.get('/projects-api/v2/locales');
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get supported locales: ${error.message}`);
    }
  }

  // ================== REPORTS API ==================
  async getProjectSummaryReport(
    projectId: string,
    options: {
      localeIds?: string[];
      dateRange?: {
        start: string;
        end: string;
      };
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = {};
      if (options.localeIds && options.localeIds.length > 0) {
        params.localeIds = options.localeIds.join(',');
      }
      if (options.dateRange) {
        params.startDate = options.dateRange.start;
        params.endDate = options.dateRange.end;
      }
      
      const response = await this.api.get(
        `/reports-api/v2/projects/${projectId}/summary`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get project summary report: ${error.message}`);
    }
  }

  async getJobProgressReport(
    projectId: string,
    jobId: string,
    options: {
      includeWordCounts?: boolean;
      includeProgress?: boolean;
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = {};
      if (options.includeWordCounts !== undefined) params.includeWordCounts = options.includeWordCounts;
      if (options.includeProgress !== undefined) params.includeProgress = options.includeProgress;
      
      const response = await this.api.get(
        `/reports-api/v2/projects/${projectId}/jobs/${jobId}/progress`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get job progress report: ${error.message}`);
    }
  }

  async getCostEstimate(
    projectId: string,
    estimateData: {
      fileUris: string[];
      targetLocaleIds: string[];
      workflowUid?: string;
    }
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const response = await this.api.post(
        `/reports-api/v2/projects/${projectId}/cost-estimate`,
        estimateData
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get cost estimate: ${error.message}`);
    }
  }

  async getTranslationVelocityReport(
    projectId: string,
    period: 'daily' | 'weekly' | 'monthly',
    options: {
      localeIds?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = { period };
      if (options.localeIds && options.localeIds.length > 0) {
        params.localeIds = options.localeIds.join(',');
      }
      if (options.startDate) params.startDate = options.startDate;
      if (options.endDate) params.endDate = options.endDate;
      
      const response = await this.api.get(
        `/reports-api/v2/projects/${projectId}/velocity`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get translation velocity report: ${error.message}`);
    }
  }

  async getWordCountReport(
    projectId: string,
    options: {
      fileUris?: string[];
      localeIds?: string[];
      includeInProgressContent?: boolean;
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = {};
      if (options.fileUris && options.fileUris.length > 0) {
        params.fileUris = options.fileUris.join(',');
      }
      if (options.localeIds && options.localeIds.length > 0) {
        params.localeIds = options.localeIds.join(',');
      }
      if (options.includeInProgressContent !== undefined) {
        params.includeInProgressContent = options.includeInProgressContent;
      }
      
      const response = await this.api.get(
        `/reports-api/v2/projects/${projectId}/word-counts`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get word count report: ${error.message}`);
    }
  }

  async getQualityScoreReport(
    projectId: string,
    options: {
      localeIds?: string[];
      dateRange?: {
        start: string;
        end: string;
      };
      includeDetails?: boolean;
    } = {}
  ): Promise<any> {
    await this.authenticate();
    
    try {
      const params: any = {};
      if (options.localeIds && options.localeIds.length > 0) {
        params.localeIds = options.localeIds.join(',');
      }
      if (options.dateRange) {
        params.startDate = options.dateRange.start;
        params.endDate = options.dateRange.end;
      }
      if (options.includeDetails !== undefined) {
        params.includeDetails = options.includeDetails;
      }
      
      const response = await this.api.get(
        `/reports-api/v2/projects/${projectId}/quality-scores`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to get quality score report: ${error.message}`);
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

  async getGlossaries(accountId?: string): Promise<Glossary[]> {
    await this.authenticate();
    
    // Use provided accountId or fall back to default from config
    const targetAccountId = accountId || this.config.accountId;
    if (!targetAccountId) {
      throw new Error('Account ID is required. Please provide accountId parameter or set SMARTLING_ACCOUNT_ID in environment variables.');
    }
    
    try {
      const response = await this.api.get(`/glossary-api/v2/accounts/${targetAccountId}/glossaries`);
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
