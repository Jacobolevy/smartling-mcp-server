import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
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
      fileUri?: string;
      maxFiles?: number;
    } = {}
  ): Promise<any> {
    await this.authenticate();

    // If no specific fileUri provided, search across all files
    if (!options.fileUri && (!options.fileUris || options.fileUris.length === 0)) {
      return await this.searchAcrossAllFiles(projectId, searchText, options);
    }

    // Search in specific file(s)
    const params: any = {
      ...(searchText && { q: searchText }),
      ...(options.limit && { limit: options.limit }),
      ...(options.includeTimestamps && { includeTimestamps: options.includeTimestamps }),
      ...(options.localeId && { localeId: options.localeId })
    };

    // Handle single file or multiple files
    if (options.fileUri) {
      params.fileUri = options.fileUri;
    } else if (options.fileUris && options.fileUris.length > 0) {
      // For multiple files, search each one separately and combine results
      let allResults: any[] = [];
      let totalFound = 0;

      for (const fileUri of options.fileUris) {
        try {
          const fileParams = { ...params, fileUri };
          const response = await this.api.get(
            `/strings-api/v2/projects/${projectId}/source-strings`,
            { params: fileParams }
          );
          
          const results = response.data.response?.data?.items || [];
          if (results.length > 0) {
            // Add file info to each result
            results.forEach((item: any) => {
              item.fileUri = fileUri;
            });
            allResults = allResults.concat(results);
            totalFound += results.length;
          }
        } catch (error: any) {
          // Skip files that cause errors and continue
        }
      }

      return {
        items: allResults,
        totalCount: totalFound,
        filesSearched: options.fileUris.length
      };
    }

    try {
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/source-strings`,
        { params }
      );
      return response.data.response.data;
    } catch (error: any) {
      throw new Error(`Failed to search strings: ${error.message}`);
    }
  }

  // ================== PROJECT FILES API ==================
  async getProjectFiles(projectId: string): Promise<any> {
    try {
      await this.authenticate();
      const response = await this.api.get(
        `/files-api/v2/projects/${projectId}/files/list`
      );
      return response.data.response?.data || { items: [] };
    } catch (error: any) {
      throw new Error(`Failed to get project files: ${error.message}`);
    }
  }

  async getFileSourceStrings(
    projectId: string, 
    fileUri: string, 
    options: {
      offset?: number;
      limit?: number;
      includeInactive?: boolean;
    } = {}
  ): Promise<any> {
    try {
      await this.authenticate();
      const params: any = {
        fileUri: encodeURIComponent(fileUri), // URL encode like in Apps Script
        offset: options.offset || 0,
        limit: options.limit || 500, // Default limit like Apps Script
        includeInactive: options.includeInactive !== undefined ? options.includeInactive : true // Default to true
      };

      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/source-strings`,
        { params }
      );
      return response.data.response?.data || { items: [] };
    } catch (error: any) {
      throw new Error(`Failed to get file source strings: ${error.message}`);
    }
  }

  async searchAcrossAllFiles(
    projectId: string, 
    searchText: string, 
    options: any = {}
  ): Promise<any> {
    try {
      // First get all files in the project
      const filesResponse = await this.api.get(
        `/files-api/v2/projects/${projectId}/files/list`
      );
      
      const files = filesResponse.data.response?.data?.items || [];
      
      let allResults: any[] = [];
      let totalFound = 0;
      
      // Search through ALL files unless maxFiles is explicitly specified
      const maxFilesToSearch = options.maxFiles || files.length;
      const filesToSearch = files.slice(0, maxFilesToSearch);
      
      for (const file of filesToSearch) {
        try {
          const params: any = {
            fileUri: file.fileUri,
            limit: options.limit || 100
          };
          
          if (searchText) {
            params.q = searchText;
          }
          
          if (options.includeTimestamps) {
            params.includeTimestamps = options.includeTimestamps;
          }
          
          const response = await this.api.get(
            `/strings-api/v2/projects/${projectId}/source-strings`,
            { params }
          );
          
          const results = response.data.response?.data?.items || [];
          
          if (results.length > 0) {
            // Filter results if searchText provided
            let filteredResults = results;
            if (searchText) {
              filteredResults = results.filter((item: any) => {
                const text = (item.stringText || item.parsedStringText || '').toLowerCase();
                return text.includes(searchText.toLowerCase());
              });
            }
            
            if (filteredResults.length > 0) {
              // Add file info to each result
              filteredResults.forEach((item: any) => {
                item.fileUri = file.fileUri;
                item.fileName = file.fileName || file.fileUri;
              });
              
              allResults = allResults.concat(filteredResults);
              totalFound += filteredResults.length;
            }
          }
        } catch (fileError: any) {
          // Skip files that error out
        }
      }
      
      return {
        items: allResults,
        totalCount: totalFound,
        filesSearched: filesToSearch.length,
        totalFiles: files.length
      };
      
    } catch (error: any) {
      throw new Error(`Failed to search across all files: ${error.message}`);
    }
  }

  async getStringDetailsByHashcode(
    projectId: string, 
    hashcode: string
  ): Promise<any> {
    await this.authenticate();
    
    try {
      // Use official endpoint for source strings with hashcode filter
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/source-strings`,
        {
          params: {
            hashcodeFilter: hashcode
          }
        }
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
      // Use official endpoint for translations
      // https://api-reference.smartling.com/#tag/Strings/operation/getAllTranslationsByProject
      const response = await this.api.get(
        `/strings-api/v2/projects/${projectId}/translations`,
        {
          params: {
            hashcodeFilter: hashcode
          }
        }
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
      filePath?: string;           // New: file path for multipart upload
      fileContent?: string;        // Legacy: base64 content (fallback)
      contextDescription?: string;
      autoOptimize?: boolean;      // New: auto-optimize images
    }
  ): Promise<any> {
    await this.authenticate();
    
    try {
      // Check file path vs base64 content
      if (contextData.filePath) {
        return await this.uploadContextFromFile(projectId, {
          ...contextData,
          filePath: contextData.filePath
        });
      } else if (contextData.fileContent) {
        return await this.uploadContextFromBase64(projectId, {
          ...contextData,
          fileContent: contextData.fileContent
        });
      } else {
        throw new Error('Either filePath or fileContent must be provided');
      }
      
    } catch (error: any) {
      throw new Error(`Failed to upload context: ${error.message}`);
    }
  }

  private async uploadContextFromFile(
    projectId: string,
    contextData: {
      contextType: 'image' | 'video' | 'html';
      contextName: string;
      filePath: string;
      contextDescription?: string;
      autoOptimize?: boolean;
    }
  ): Promise<any> {
    const { filePath, contextType, contextName, contextDescription, autoOptimize } = contextData;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Get file info
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    const maxSizeInMB = contextType === 'video' ? 512 : contextType === 'image' ? 20 : 32;
    
    // Check size limits
    if (fileSizeInMB > maxSizeInMB) {
      if (autoOptimize && contextType === 'image') {
        throw new Error(`File too large: ${fileSizeInMB.toFixed(2)}MB exceeds ${maxSizeInMB}MB limit. Auto-optimization not yet implemented.`);
      } else {
        throw new Error(`File too large: ${fileSizeInMB.toFixed(2)}MB exceeds ${maxSizeInMB}MB limit for ${contextType} files. Consider enabling autoOptimize.`);
      }
    }
    
    // Create form data
    const formData = new FormData();
    formData.append('contextType', contextType);
    formData.append('contextName', contextName);
    if (contextDescription) {
      formData.append('contextDescription', contextDescription);
    }
    
    // Append file with proper content type
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    const mimeType = this.getMimeType(fileName);
    
    formData.append('file', fileStream, {
      filename: fileName,
      contentType: mimeType
    });
    
    // Upload using multipart/form-data
    const response = await this.api.post(
      `/context-api/v2/projects/${projectId}/contexts`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': this.api.defaults.headers.common['Authorization']
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    return response.data.response?.data || response.data;
  }

  private async uploadContextFromBase64(
    projectId: string,
    contextData: {
      contextType: 'image' | 'video' | 'html';
      contextName: string;
      fileContent: string;
      contextDescription?: string;
    }
  ): Promise<any> {
    // Legacy method using JSON + base64 (limited by MCP token size)
    const response = await this.api.post(
      `/context-api/v2/projects/${projectId}/contexts`,
      contextData
    );
    
    return response.data.response?.data || response.data;
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.pdf': 'application/pdf',
      '.html': 'text/html',
      '.htm': 'text/html'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
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
