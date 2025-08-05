import { SmartlingClient } from '../smartling-client.js';

export interface BulkJobParams {
  projectId: string;
  filePaths: string[];
  targetLocales: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: string;
}

export interface JobStatus {
  state: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  completed: number;
  total: number;
  estimatedCompletion: string;
  currentPhase: string;
  details?: any;
}

export interface JobResults {
  completionTime: string;
  totalStrings: number;
  translatedStrings: number;
  qualityMetrics?: any;
  files?: any[];
  fileSummary?: any;
  finalCost: string;
  downloadLinks: string[];
}

/**
 * Async Job Manager for Long-Running Operations
 * Handles bulk translations, quality checks, and other time-consuming tasks
 */
export class AsyncJobManager {
  private jobs: Map<string, any> = new Map();
  private jobTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private smartlingClient: SmartlingClient) {}

  /**
   * Create a bulk translation job
   */
  async createBulkJob(params: BulkJobParams): Promise<string> {
    const jobId = this.generateJobId();
    const job = {
      id: jobId,
      type: 'bulk_translation',
      status: 'queued',
      created: new Date().toISOString(),
      params: params,
      progress: {
        completed: 0,
        total: this.estimateJobSize(params),
        currentPhase: 'initializing'
      },
      estimatedDuration: this.estimateJobDuration(params)
    };

    this.jobs.set(jobId, job);
    
    // Start processing the job asynchronously
    this.processJobAsync(jobId);
    
    return jobId;
  }

  /**
   * Get job status with optional details
   */
  async getJobStatus(jobId: string, includeDetails: boolean = true): Promise<JobStatus> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Update status if job is still processing
    if (job.status === 'processing') {
      await this.updateJobProgress(jobId);
    }

    return {
      state: job.status,
      completed: job.progress.completed,
      total: job.progress.total,
      estimatedCompletion: this.calculateETA(job),
      currentPhase: job.progress.currentPhase,
      details: includeDetails ? {
        created: job.created,
        type: job.type,
        params: job.params,
        errors: job.errors || [],
        warnings: job.warnings || [],
        metrics: job.metrics || {}
      } : undefined
    };
  }

  /**
   * Get results from completed job
   */
  async getJobResults(params: {
    jobId: string;
    includeQuality: boolean;
    includeFiles: boolean;
  }): Promise<JobResults> {
    const job = this.jobs.get(params.jobId);
    
    if (!job) {
      throw new Error(`Job ${params.jobId} not found`);
    }

    if (job.status !== 'completed') {
      throw new Error(`Job ${params.jobId} is not completed. Current status: ${job.status}`);
    }

    const results = job.results || {};
    
    return {
      completionTime: job.completed || new Date().toISOString(),
      totalStrings: results.totalStrings || 0,
      translatedStrings: results.translatedStrings || 0,
      qualityMetrics: params.includeQuality ? results.qualityMetrics : undefined,
      files: params.includeFiles ? results.files : undefined,
      fileSummary: params.includeFiles ? undefined : results.fileSummary,
      finalCost: results.finalCost || '$0.00',
      downloadLinks: results.downloadLinks || []
    };
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'cancelled';
    job.cancelled = new Date().toISOString();
    
    // Clear any timers
    const timer = this.jobTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.jobTimers.delete(jobId);
    }

    // Cancel any ongoing Smartling operations
    if (job.smartlingJobIds) {
      for (const smartlingJobId of job.smartlingJobIds) {
        try {
          await this.smartlingClient.cancelJob(job.params.projectId, smartlingJobId);
        } catch (error) {
          console.error(`Failed to cancel Smartling job ${smartlingJobId}:`, error);
        }
      }
    }

    return true;
  }

  /**
   * Get all jobs (with optional filtering)
   */
  async listJobs(filters?: {
    status?: string;
    type?: string;
    projectId?: string;
  }): Promise<any[]> {
    let jobs = Array.from(this.jobs.values());

    if (filters) {
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      if (filters.type) {
        jobs = jobs.filter(job => job.type === filters.type);
      }
      if (filters.projectId) {
        jobs = jobs.filter(job => job.params.projectId === filters.projectId);
      }
    }

    return jobs.map(job => ({
      id: job.id,
      type: job.type,
      status: job.status,
      created: job.created,
      progress: job.progress,
      estimatedCompletion: this.calculateETA(job)
    }));
  }

  // ===== PRIVATE METHODS =====

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateJobSize(params: BulkJobParams): number {
    // Estimate based on files and locales
    return params.filePaths.length * params.targetLocales.length * 100; // Rough estimate
  }

  private estimateJobDuration(params: BulkJobParams): number {
    // Estimate duration in minutes
    const baseMinutes = 10;
    const filesMultiplier = params.filePaths.length * 2;
    const localesMultiplier = params.targetLocales.length * 1.5;
    
    return Math.max(baseMinutes, filesMultiplier + localesMultiplier);
  }

  private calculateETA(job: any): string {
    if (job.status === 'completed') {
      return job.completed;
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      return 'N/A';
    }

    const elapsed = Date.now() - new Date(job.created).getTime();
    const progress = job.progress.completed / job.progress.total;
    
    if (progress === 0) {
      return `~${job.estimatedDuration} minutes`;
    }

    const estimatedTotal = elapsed / progress;
    const remaining = estimatedTotal - elapsed;
    const remainingMinutes = Math.ceil(remaining / (1000 * 60));
    
    return `~${remainingMinutes} minutes`;
  }

  /**
   * Process job asynchronously
   */
  private async processJobAsync(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.started = new Date().toISOString();
      job.smartlingJobIds = [];

      // Phase 1: Upload files and create jobs
      job.progress.currentPhase = 'uploading_files';
      await this.uploadFiles(job);

      // Phase 2: Start translation jobs
      job.progress.currentPhase = 'starting_translation';
      await this.startTranslationJobs(job);

      // Phase 3: Monitor progress
      job.progress.currentPhase = 'translating';
      await this.monitorTranslationProgress(job);

      // Phase 4: Quality checks
      job.progress.currentPhase = 'quality_check';
      await this.performQualityChecks(job);

      // Phase 5: Finalize
      job.progress.currentPhase = 'finalizing';
      await this.finalizeJob(job);

      job.status = 'completed';
      job.completed = new Date().toISOString();
      
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      job.failed = new Date().toISOString();
    }
  }

  private async uploadFiles(job: any): Promise<void> {
    const { projectId, filePaths } = job.params;
    const uploadedFiles = [];

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      try {
        // Simulate file upload (replace with actual implementation)
        await this.simulateAsyncOperation(2000); // 2 second delay
        
        uploadedFiles.push({
          originalPath: filePath,
          smartlingUri: `uploaded_${i}_${Date.now()}`,
          status: 'uploaded'
        });

        job.progress.completed += 10; // Increment progress
        
      } catch (error) {
        console.error(`Failed to upload file ${filePath}:`, error);
        uploadedFiles.push({
          originalPath: filePath,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    job.uploadedFiles = uploadedFiles;
  }

  private async startTranslationJobs(job: any): Promise<void> {
    const { projectId, targetLocales } = job.params;
    const smartlingJobs = [];

    for (const locale of targetLocales) {
      try {
        // Create translation job for this locale
        const smartlingJob = await this.smartlingClient.createJob(projectId, {
          jobName: `Bulk Translation - ${locale} - ${new Date().toISOString()}`,
          targetLocaleIds: [locale],
          description: `Automated bulk translation job ${job.id}`
        });

        smartlingJobs.push({
          locale: locale,
          smartlingJobId: smartlingJob.translationJobUid,
          status: 'created'
        });

        job.smartlingJobIds.push(smartlingJob.translationJobUid);
        job.progress.completed += 20;

      } catch (error) {
        console.error(`Failed to create job for locale ${locale}:`, error);
        smartlingJobs.push({
          locale: locale,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    job.smartlingJobs = smartlingJobs;
  }

  private async monitorTranslationProgress(job: any): Promise<void> {
    const maxChecks = 30; // Maximum 30 checks (5 minutes if checking every 10 seconds)
    let checks = 0;

    while (checks < maxChecks && job.status === 'processing') {
      let allCompleted = true;
      let totalProgress = 0;

      for (const smartlingJob of job.smartlingJobs) {
        if (smartlingJob.status !== 'failed') {
          try {
            const progress = await this.smartlingClient.getJobProgress(
              job.params.projectId,
              smartlingJob.smartlingJobId
            );

            smartlingJob.progress = progress;
            totalProgress += progress.percentComplete || 0;

            if (progress.percentComplete < 100) {
              allCompleted = false;
            } else {
              smartlingJob.status = 'completed';
            }

          } catch (error) {
            console.error(`Failed to check progress for job ${smartlingJob.smartlingJobId}:`, error);
            smartlingJob.status = 'failed';
            smartlingJob.error = error instanceof Error ? error.message : String(error);
          }
        }
      }

      job.progress.completed = Math.floor(totalProgress / job.smartlingJobs.length * 0.6); // 60% of total progress

      if (allCompleted) {
        break;
      }

      await this.simulateAsyncOperation(10000); // Wait 10 seconds
      checks++;
    }
  }

  private async performQualityChecks(job: any): Promise<void> {
    // Simulate quality checks
    await this.simulateAsyncOperation(3000);
    
    job.qualityResults = {
      overallScore: 92,
      checks: ['spelling', 'grammar', 'terminology'],
      issues: [],
      passedChecks: 3
    };

    job.progress.completed += 15;
  }

  private async finalizeJob(job: any): Promise<void> {
    // Generate final results
    const results = {
      totalStrings: job.uploadedFiles.length * 100, // Estimate
      translatedStrings: job.smartlingJobs.filter(j => j.status === 'completed').length * 100,
      qualityMetrics: job.qualityResults,
      fileSummary: job.uploadedFiles.map(f => ({
        originalPath: f.originalPath,
        status: f.status,
        locales: job.smartlingJobs.filter(j => j.status === 'completed').map(j => j.locale)
      })),
      finalCost: this.calculateFinalCost(job),
      downloadLinks: this.generateDownloadLinks(job)
    };

    job.results = results;
    job.progress.completed = job.progress.total;
    job.progress.currentPhase = 'completed';
  }

  private async updateJobProgress(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'processing') return;

    // Update progress based on current phase
    const phaseProgress = {
      'initializing': 5,
      'uploading_files': 25,
      'starting_translation': 35,
      'translating': 80,
      'quality_check': 95,
      'finalizing': 100
    };

    const baseProgress = phaseProgress[job.progress.currentPhase] || 0;
    job.progress.completed = Math.min(baseProgress, job.progress.total);
  }

  private calculateFinalCost(job: any): string {
    // Simple cost calculation
    const baseRate = 0.10; // $0.10 per string
    const strings = job.results?.totalStrings || 0;
    const locales = job.params.targetLocales.length;
    
    const total = strings * locales * baseRate;
    return `$${total.toFixed(2)}`;
  }

  private generateDownloadLinks(job: any): string[] {
    // Generate mock download links
    const links = [];
    for (const smartlingJob of job.smartlingJobs) {
      if (smartlingJob.status === 'completed') {
        links.push(`https://downloads.smartling.com/jobs/${smartlingJob.smartlingJobId}/download`);
      }
    }
    return links;
  }

  private async simulateAsyncOperation(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
}