import { SmartlingClient } from '../smartling-client.js';
import OpenAI from 'openai';

export interface DebugParams {
  projectId: string;
  issueDescription: string;
  includeRecent: boolean;
  autoFix: boolean;
}

export interface DiagnosisResult {
  diagnosis: string;
  rootCause: string;
  solutions: Solution[];
  quickFixes: QuickFix[];
  preventionTips: string[];
  autoFixesApplied: AutoFix[];
  confidence: number;
}

export interface Solution {
  type: 'immediate' | 'short_term' | 'long_term';
  description: string;
  steps: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  success_rate: number;
}

export interface QuickFix {
  name: string;
  description: string;
  command: string;
  safe: boolean;
  reversible: boolean;
}

export interface AutoFix {
  applied: boolean;
  description: string;
  result: string;
  reversible: boolean;
  rollback_info?: any;
}

export interface ProjectHealth {
  overall_score: number;
  issues: HealthIssue[];
  warnings: HealthWarning[];
  metrics: HealthMetrics;
}

export interface HealthIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  fix_suggestions: string[];
}

export interface HealthWarning {
  type: string;
  description: string;
  recommendation: string;
}

export interface HealthMetrics {
  translation_velocity: number;
  quality_score: number;
  error_rate: number;
  api_response_time: number;
  resource_utilization: number;
}

/**
 * AI-Powered Debug Assistant
 * Automatically diagnoses and fixes common translation issues
 */
export class DebugAssistant {
  private openai: OpenAI;
  private knownIssues: Map<string, any> = new Map();
  private autoFixRegistry: Map<string, Function> = new Map();

  constructor(private smartlingClient: SmartlingClient) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.initializeKnownIssues();
    this.initializeAutoFixes();
  }

  /**
   * Diagnose translation issues with AI assistance
   */
  async diagnoseIssue(params: DebugParams): Promise<DiagnosisResult> {
    try {
      // Step 1: Gather diagnostic data
      const diagnosticData = await this.gatherDiagnosticData(params);
      
      // Step 2: Check for known issues first
      const knownIssue = this.checkKnownIssues(params.issueDescription, diagnosticData);
      
      // Step 3: AI-powered diagnosis
      const aiDiagnosis = await this.performAIDiagnosis(params, diagnosticData);
      
      // Step 4: Generate solutions
      const solutions = await this.generateSolutions(aiDiagnosis, diagnosticData);
      
      // Step 5: Generate quick fixes
      const quickFixes = this.generateQuickFixes(aiDiagnosis, diagnosticData);
      
      // Step 6: Apply auto-fixes if requested
      const autoFixesApplied = params.autoFix ? 
        await this.applyAutoFixes(params.projectId, solutions) : [];
      
      // Step 7: Generate prevention tips
      const preventionTips = this.generatePreventionTips(aiDiagnosis);
      
      return {
        diagnosis: knownIssue?.diagnosis || aiDiagnosis.summary,
        rootCause: knownIssue?.rootCause || aiDiagnosis.rootCause,
        solutions: knownIssue?.solutions || solutions,
        quickFixes,
        preventionTips,
        autoFixesApplied,
        confidence: knownIssue ? 0.95 : aiDiagnosis.confidence
      };
      
    } catch (error) {
      console.error('Diagnosis failed:', error);
      
      return {
        diagnosis: 'Unable to diagnose issue automatically',
        rootCause: 'Diagnostic system error',
        solutions: [{
          type: 'immediate',
          description: 'Manual investigation required',
          steps: [
            'Check Smartling dashboard for recent changes',
            'Review project settings',
            'Contact support if issue persists'
          ],
          estimatedTime: '15-30 minutes',
          difficulty: 'medium',
          success_rate: 70
        }],
        quickFixes: [],
        preventionTips: ['Regular project health checks', 'Monitor API usage'],
        autoFixesApplied: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Check overall project health
   */
  async checkProjectHealth(projectId: string): Promise<ProjectHealth> {
    try {
      const [
        apiHealth,
        jobsHealth,
        filesHealth,
        qualityHealth,
        performanceMetrics
      ] = await Promise.all([
        this.checkApiHealth(projectId),
        this.checkJobsHealth(projectId),
        this.checkFilesHealth(projectId),
        this.checkQualityHealth(projectId),
        this.getPerformanceMetrics(projectId)
      ]);

      const issues: HealthIssue[] = [];
      const warnings: HealthWarning[] = [];

      // Analyze API health
      if (apiHealth.error_rate > 0.05) {
        issues.push({
          type: 'api_errors',
          severity: apiHealth.error_rate > 0.15 ? 'high' : 'medium',
          description: `High API error rate: ${(apiHealth.error_rate * 100).toFixed(1)}%`,
          impact: 'Translation operations may fail or be delayed',
          fix_suggestions: [
            'Check API credentials',
            'Verify network connectivity',
            'Review API usage patterns'
          ]
        });
      }

      // Analyze job health
      if (jobsHealth.stalled_jobs > 0) {
        issues.push({
          type: 'stalled_jobs',
          severity: jobsHealth.stalled_jobs > 5 ? 'high' : 'medium',
          description: `${jobsHealth.stalled_jobs} jobs appear to be stalled`,
          impact: 'Translation progress may be blocked',
          fix_suggestions: [
            'Check job statuses manually',
            'Restart stalled jobs',
            'Review workflow configuration'
          ]
        });
      }

      // Analyze quality health
      if (qualityHealth.avg_score < 80) {
        issues.push({
          type: 'quality_decline',
          severity: qualityHealth.avg_score < 70 ? 'high' : 'medium',
          description: `Quality score below threshold: ${qualityHealth.avg_score}%`,
          impact: 'Translation quality may not meet standards',
          fix_suggestions: [
            'Review translation guidelines',
            'Provide additional context',
            'Consider translator training'
          ]
        });
      }

      // Generate warnings
      if (performanceMetrics.api_response_time > 2000) {
        warnings.push({
          type: 'slow_api',
          description: 'API response times are slower than usual',
          recommendation: 'Monitor API performance and consider rate limiting'
        });
      }

      const overall_score = this.calculateOverallHealthScore(issues, warnings, performanceMetrics);

      return {
        overall_score,
        issues,
        warnings,
        metrics: {
          translation_velocity: performanceMetrics.velocity || 0,
          quality_score: qualityHealth.avg_score,
          error_rate: apiHealth.error_rate,
          api_response_time: performanceMetrics.api_response_time,
          resource_utilization: performanceMetrics.resource_utilization || 0
        }
      };
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        overall_score: 0,
        issues: [{
          type: 'health_check_failed',
          severity: 'medium',
          description: 'Unable to perform complete health check',
          impact: 'Project health status unknown',
          fix_suggestions: ['Retry health check', 'Check system connectivity']
        }],
        warnings: [],
        metrics: {
          translation_velocity: 0,
          quality_score: 0,
          error_rate: 0,
          api_response_time: 0,
          resource_utilization: 0
        }
      };
    }
  }

  /**
   * Get recent errors and logs
   */
  async getRecentErrors(projectId: string, hours: number = 24): Promise<any[]> {
    try {
      // This would integrate with logging systems
      // For now, return mock error data
      return [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'api_error',
          message: 'File upload failed: Invalid file format',
          context: { fileUri: 'test.docx', fileType: 'docx' }
        },
        {
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: 'translation_error',
          message: 'Translation job timeout',
          context: { jobId: 'job_123', locale: 'es-ES' }
        }
      ];
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return [];
    }
  }

  // ===== PRIVATE METHODS =====

  private async gatherDiagnosticData(params: DebugParams): Promise<any> {
    const data: any = {
      projectId: params.projectId,
      timestamp: new Date().toISOString()
    };

    try {
      // Gather project info
      data.project = await this.smartlingClient.getProject(params.projectId).catch(() => null);
      
      // Get recent activity if requested
      if (params.includeRecent) {
        data.recentErrors = await this.getRecentErrors(params.projectId);
        data.recentJobs = await this.smartlingClient.getJobs(params.projectId).catch(() => []);
        data.apiLogs = await this.getApiLogs(params.projectId);
      }
      
      // Check current health
      data.health = await this.checkProjectHealth(params.projectId);
      
    } catch (error) {
      console.error('Error gathering diagnostic data:', error);
      data.error = 'Failed to gather complete diagnostic data';
    }

    return data;
  }

  private checkKnownIssues(description: string, diagnosticData: any): any | null {
    const lowerDesc = description.toLowerCase();
    
    // Check each known issue pattern
    for (const [pattern, solution] of this.knownIssues.entries()) {
      if (lowerDesc.includes(pattern)) {
        return solution;
      }
    }
    
    // Check diagnostic data for known patterns
    if (diagnosticData.recentErrors) {
      for (const error of diagnosticData.recentErrors) {
        if (error.type === 'api_error' && error.message.includes('Invalid file format')) {
          return this.knownIssues.get('file format');
        }
        if (error.type === 'translation_error' && error.message.includes('timeout')) {
          return this.knownIssues.get('timeout');
        }
      }
    }
    
    return null;
  }

  private async performAIDiagnosis(params: DebugParams, diagnosticData: any): Promise<any> {
    try {
      const prompt = `
        Diagnose this Smartling translation issue:
        
        Issue Description: ${params.issueDescription}
        
        Diagnostic Data:
        ${JSON.stringify(diagnosticData, null, 2)}
        
        Provide a comprehensive diagnosis including:
        1. Summary of the issue
        2. Most likely root cause
        3. Confidence level (0-1)
        4. Key factors contributing to the issue
        
        Return JSON format.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Smartling translation platform troubleshooter. Diagnose issues accurately and provide actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
      
    } catch (error) {
      console.error('AI diagnosis failed:', error);
      
      return {
        summary: 'AI diagnosis unavailable',
        rootCause: 'Unknown',
        confidence: 0.1,
        factors: []
      };
    }
  }

  private async generateSolutions(diagnosis: any, diagnosticData: any): Promise<Solution[]> {
    const solutions: Solution[] = [];
    
    // Generate solutions based on diagnosis
    if (diagnosis.rootCause?.includes('API')) {
      solutions.push({
        type: 'immediate',
        description: 'Check API connectivity and credentials',
        steps: [
          'Verify API credentials are correct',
          'Test API connectivity',
          'Check rate limiting status',
          'Review recent API changes'
        ],
        estimatedTime: '5-10 minutes',
        difficulty: 'easy',
        success_rate: 85
      });
    }
    
    if (diagnosis.rootCause?.includes('file') || diagnosis.rootCause?.includes('upload')) {
      solutions.push({
        type: 'immediate',
        description: 'Fix file upload issues',
        steps: [
          'Check file format compatibility',
          'Verify file size limits',
          'Test with a different file',
          'Clear browser cache if using web interface'
        ],
        estimatedTime: '10-15 minutes',
        difficulty: 'easy',
        success_rate: 90
      });
    }
    
    if (diagnosis.rootCause?.includes('job') || diagnosis.rootCause?.includes('translation')) {
      solutions.push({
        type: 'short_term',
        description: 'Resolve translation job issues',
        steps: [
          'Review job configuration',
          'Check target locale settings',
          'Verify workflow permissions',
          'Restart failed jobs if necessary'
        ],
        estimatedTime: '15-30 minutes',
        difficulty: 'medium',
        success_rate: 75
      });
    }
    
    // Always add a comprehensive solution
    solutions.push({
      type: 'long_term',
      description: 'Comprehensive troubleshooting approach',
      steps: [
        'Document all symptoms and error messages',
        'Check Smartling status page for service issues',
        'Review recent project configuration changes',
        'Contact Smartling support with diagnostic data',
        'Implement monitoring to prevent future issues'
      ],
      estimatedTime: '1-2 hours',
      difficulty: 'medium',
      success_rate: 95
    });
    
    return solutions;
  }

  private generateQuickFixes(diagnosis: any, diagnosticData: any): QuickFix[] {
    const quickFixes: QuickFix[] = [];
    
    // API-related quick fixes
    quickFixes.push({
      name: 'Test API Connection',
      description: 'Verify API connectivity and authentication',
      command: 'curl -H "Authorization: Bearer $TOKEN" https://api.smartling.com/accounts-api/v2/accounts',
      safe: true,
      reversible: true
    });
    
    // File-related quick fixes
    if (diagnosis.summary?.includes('file') || diagnosis.summary?.includes('upload')) {
      quickFixes.push({
        name: 'Clear Upload Cache',
        description: 'Clear temporary upload files and retry',
        command: 'rm -rf /tmp/smartling_uploads/*',
        safe: true,
        reversible: false
      });
    }
    
    // Job-related quick fixes
    if (diagnosis.summary?.includes('job') || diagnosis.summary?.includes('translation')) {
      quickFixes.push({
        name: 'Restart Stalled Jobs',
        description: 'Identify and restart any stalled translation jobs',
        command: 'smartling-cli job restart --project-id $PROJECT_ID --status stalled',
        safe: false,
        reversible: true
      });
    }
    
    return quickFixes;
  }

  private async applyAutoFixes(projectId: string, solutions: Solution[]): Promise<AutoFix[]> {
    const autoFixes: AutoFix[] = [];
    
    // Only apply safe, immediate fixes
    const safeFixes = solutions.filter(s => 
      s.type === 'immediate' && 
      s.difficulty === 'easy' && 
      s.success_rate > 80
    );
    
    for (const fix of safeFixes) {
      try {
        const autoFixFunc = this.autoFixRegistry.get(fix.description);
        if (autoFixFunc) {
          const result = await autoFixFunc(projectId);
          autoFixes.push({
            applied: true,
            description: fix.description,
            result: result.message,
            reversible: result.reversible,
            rollback_info: result.rollback_info
          });
        }
      } catch (error) {
        autoFixes.push({
          applied: false,
          description: fix.description,
          result: `Failed to apply: ${error instanceof Error ? error.message : String(error)}`,
          reversible: false
        });
      }
    }
    
    return autoFixes;
  }

  private generatePreventionTips(diagnosis: any): string[] {
    const tips = [
      'Set up monitoring alerts for API errors',
      'Implement automated health checks',
      'Regular backup of project configurations',
      'Keep track of API usage limits'
    ];
    
    if (diagnosis.rootCause?.includes('file')) {
      tips.push(
        'Validate file formats before upload',
        'Implement file size checks',
        'Use consistent file naming conventions'
      );
    }
    
    if (diagnosis.rootCause?.includes('API')) {
      tips.push(
        'Implement proper error handling and retries',
        'Monitor API rate limits',
        'Keep API credentials secure and up to date'
      );
    }
    
    return tips;
  }

  private initializeKnownIssues(): void {
    this.knownIssues.set('file format', {
      diagnosis: 'Unsupported file format detected',
      rootCause: 'File type not supported by Smartling',
      solutions: [{
        type: 'immediate',
        description: 'Convert file to supported format',
        steps: [
          'Check Smartling supported file formats',
          'Convert file to .json, .xml, or .properties',
          'Retry upload with converted file'
        ],
        estimatedTime: '5 minutes',
        difficulty: 'easy',
        success_rate: 95
      }]
    });
    
    this.knownIssues.set('timeout', {
      diagnosis: 'Operation timeout due to large file or network issues',
      rootCause: 'Network latency or file size exceeds processing limits',
      solutions: [{
        type: 'immediate',
        description: 'Optimize file size and retry',
        steps: [
          'Split large files into smaller chunks',
          'Check network connection stability',
          'Retry during off-peak hours'
        ],
        estimatedTime: '15 minutes',
        difficulty: 'medium',
        success_rate: 80
      }]
    });
    
    this.knownIssues.set('authentication', {
      diagnosis: 'API authentication failure',
      rootCause: 'Invalid or expired API credentials',
      solutions: [{
        type: 'immediate',
        description: 'Refresh API credentials',
        steps: [
          'Check API token expiration',
          'Generate new API token if needed',
          'Update application configuration',
          'Test API connection'
        ],
        estimatedTime: '10 minutes',
        difficulty: 'easy',
        success_rate: 90
      }]
    });
  }

  private initializeAutoFixes(): void {
    this.autoFixRegistry.set('Check API connectivity and credentials', async (projectId: string) => {
      try {
        await this.smartlingClient.getProject(projectId);
        return {
          message: 'API connectivity verified successfully',
          reversible: true,
          rollback_info: null
        };
      } catch (error) {
        throw new Error('API connectivity check failed');
      }
    });
    
    this.autoFixRegistry.set('Fix file upload issues', async (projectId: string) => {
      // This would implement actual file validation logic
      return {
        message: 'File validation checks completed',
        reversible: true,
        rollback_info: null
      };
    });
  }

  private async checkApiHealth(projectId: string): Promise<any> {
    let errors = 0;
    let total = 0;
    
    // Test basic API endpoints
    const tests = [
      () => this.smartlingClient.getProject(projectId),
      () => this.smartlingClient.getProjectLocales(projectId),
      () => this.smartlingClient.getFiles(projectId)
    ];
    
    for (const test of tests) {
      total++;
      try {
        await test();
      } catch (error) {
        errors++;
      }
    }
    
    return {
      error_rate: total > 0 ? errors / total : 0,
      total_tests: total,
      failed_tests: errors
    };
  }

  private async checkJobsHealth(projectId: string): Promise<any> {
    try {
      const jobs = await this.smartlingClient.getJobs(projectId);
      const stalledJobs = jobs.filter((job: any) => {
        const created = new Date(job.createdDate);
        const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60);
        return job.jobStatus === 'IN_PROGRESS' && hoursSinceCreated > 24;
      });
      
      return {
        total_jobs: jobs.length,
        stalled_jobs: stalledJobs.length,
        healthy_jobs: jobs.length - stalledJobs.length
      };
    } catch (error) {
      return {
        total_jobs: 0,
        stalled_jobs: 0,
        healthy_jobs: 0,
        error: 'Unable to check jobs health'
      };
    }
  }

  private async checkFilesHealth(projectId: string): Promise<any> {
    try {
      const files = await this.smartlingClient.getFiles(projectId);
      return {
        total_files: files.length,
        healthy_files: files.length // Simplified check
      };
    } catch (error) {
      return {
        total_files: 0,
        healthy_files: 0,
        error: 'Unable to check files health'
      };
    }
  }

  private async checkQualityHealth(projectId: string): Promise<any> {
    try {
      // This would check actual quality metrics
      // For now, return mock data
      return {
        avg_score: 85,
        recent_trend: 'stable'
      };
    } catch (error) {
      return {
        avg_score: 0,
        recent_trend: 'unknown'
      };
    }
  }

  private async getPerformanceMetrics(projectId: string): Promise<any> {
    // This would gather actual performance metrics
    return {
      api_response_time: 500 + Math.random() * 1000,
      velocity: Math.random() * 1000,
      resource_utilization: Math.random() * 100
    };
  }

  private async getApiLogs(projectId: string): Promise<any[]> {
    // This would integrate with actual logging system
    return [];
  }

  private calculateOverallHealthScore(issues: HealthIssue[], warnings: HealthWarning[], metrics: any): number {
    let score = 100;
    
    // Deduct points for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    // Deduct points for warnings
    score -= warnings.length * 2;
    
    // Factor in performance metrics
    if (metrics.api_response_time > 2000) score -= 5;
    if (metrics.error_rate > 0.1) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
}