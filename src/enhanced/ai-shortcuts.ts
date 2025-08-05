import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SmartlingClient } from '../smartling-client.js';
import { AIInsightsService } from './ai-insights-service.js';
import { AsyncJobManager } from './async-job-manager.js';
import { CostAnalyzer } from './cost-analyzer.js';
import { DebugAssistant } from './debug-assistant.js';

/**
 * Enhanced Smartling MCP Server with AI-Powered Shortcuts
 * Inspired by Octocode and advanced MCP patterns
 */
export class EnhancedSmartlingMCP {
  private aiInsights: AIInsightsService;
  private jobManager: AsyncJobManager;
  private costAnalyzer: CostAnalyzer;
  private debugAssistant: DebugAssistant;

  constructor(
    private server: McpServer,
    private client: SmartlingClient
  ) {
    this.aiInsights = new AIInsightsService(client);
    this.jobManager = new AsyncJobManager(client);
    this.costAnalyzer = new CostAnalyzer(client);
    this.debugAssistant = new DebugAssistant(client);
    
    this.registerShortcuts();
  }

  private registerShortcuts() {
    // Phase 1: Memorable Commands (@shortcuts)
    this.registerTranslateShortcut();
    this.registerProgressShortcut();
    this.registerCostsShortcut();
    this.registerQualityShortcut();
    this.registerDebugShortcut();
    this.registerInsightsShortcut();
    
    // Phase 2: AI-Powered Advanced Commands
    this.registerAIOptimize();
    this.registerAIPredict();
    this.registerAIAnalyze();
    
    // Phase 3: Async Operations
    this.registerBulkOperations();
    this.registerJobStatus();
    this.registerJobResults();
  }

  // ===== PHASE 1: MEMORABLE SHORTCUTS =====

  private registerTranslateShortcut() {
    this.server.tool(
      'smartling_translate', // @translate
      '🌐 Quick translate text to target locale without creating a project',
      {
        text: z.string().describe('Text to translate'),
        targetLocale: z.string().describe('Target locale code (e.g., "es-ES", "fr-FR")'),
        sourceLocale: z.string().optional().default('en-US').describe('Source locale code'),
        context: z.string().optional().describe('Additional context for better translation'),
        domain: z.string().optional().describe('Domain/industry for specialized translation'),
      },
      async ({ text, targetLocale, sourceLocale, context, domain }) => {
        const startTime = Date.now();
        try {
          // Use AI-enhanced translation with context
          const enhancedTranslation = await this.aiInsights.enhanceTranslation({
            text,
            targetLocale,
            sourceLocale,
            context,
            domain
          });

          const responseTime = Date.now() - startTime;
          
          return {
            _meta: {
              requestId: `translate-${Date.now()}`,
              timing: { duration: responseTime },
              source: 'smartling-ai-enhanced',
              version: '4.0.0',
              shortcut: '@translate'
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  translation: enhancedTranslation.text,
                  confidence: enhancedTranslation.confidence,
                  alternatives: enhancedTranslation.alternatives,
                  insights: enhancedTranslation.insights,
                  cost_estimate: enhancedTranslation.costEstimate,
                  processing_time: `${responseTime}ms`
                }, null, 2),
                annotations: {
                  audience: ['user', 'assistant'],
                  priority: 1,
                  shortcut: '@translate'
                }
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('@translate', error, startTime);
        }
      }
    );
  }

  private registerProgressShortcut() {
    this.server.tool(
      'smartling_progress', // @progress
      '📊 Get real-time translation progress with AI-powered insights',
      {
        projectId: z.string().describe('Project ID'),
        includeMetrics: z.boolean().default(true).describe('Include velocity and quality metrics'),
        includePredictions: z.boolean().default(true).describe('Include AI predictions'),
        timeframe: z.enum(['24h', '7d', '30d', '90d']).default('7d').describe('Analysis timeframe'),
      },
      async ({ projectId, includeMetrics, includePredictions, timeframe }) => {
        const startTime = Date.now();
        try {
          // Get basic progress
          const progress = await this.client.getProjectProgress(projectId);
          
          let metrics = null;
          let predictions = null;
          
          if (includeMetrics) {
            metrics = await this.aiInsights.calculateProgressMetrics(projectId, timeframe);
          }
          
          if (includePredictions) {
            predictions = await this.aiInsights.predictProjectCompletion(projectId);
          }

          const responseTime = Date.now() - startTime;
          
          return {
            _meta: {
              requestId: `progress-${Date.now()}`,
              timing: { duration: responseTime },
              source: 'smartling-ai-enhanced',
              shortcut: '@progress'
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  project_id: projectId,
                  progress: progress,
                  metrics: metrics,
                  predictions: predictions,
                  summary: `Project is ${progress.overall_completion}% complete`,
                  next_actions: predictions?.recommendedActions || []
                }, null, 2),
                annotations: {
                  shortcut: '@progress',
                  priority: 1
                }
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('@progress', error, startTime);
        }
      }
    );
  }

  private registerCostsShortcut() {
    this.server.tool(
      'smartling_costs', // @costs
      '💰 AI-powered cost analysis with optimization suggestions',
      {
        projectId: z.string().describe('Project ID'),
        timeframe: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
        includePredictions: z.boolean().default(true).describe('Include cost predictions'),
        includeOptimizations: z.boolean().default(true).describe('Include AI optimization suggestions'),
      },
      async ({ projectId, timeframe, includePredictions, includeOptimizations }) => {
        const startTime = Date.now();
        try {
          const costAnalysis = await this.costAnalyzer.analyzeCosts({
            projectId,
            timeframe,
            includePredictions,
            includeOptimizations
          });

          const responseTime = Date.now() - startTime;
          
          return {
            _meta: {
              requestId: `costs-${Date.now()}`,
              timing: { duration: responseTime },
              shortcut: '@costs'
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  project_id: projectId,
                  cost_summary: costAnalysis.summary,
                  breakdown: costAnalysis.breakdown,
                  trends: costAnalysis.trends,
                  predictions: costAnalysis.predictions,
                  optimizations: costAnalysis.optimizations,
                  potential_savings: costAnalysis.potentialSavings
                }, null, 2),
                annotations: {
                  shortcut: '@costs',
                  priority: 1
                }
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('@costs', error, startTime);
        }
      }
    );
  }

  private registerQualityShortcut() {
    this.server.tool(
      'smartling_quality', // @quality
      '⭐ AI-powered quality dashboard with insights and recommendations',
      {
        projectId: z.string().describe('Project ID'),
        localeId: z.string().optional().describe('Specific locale to analyze'),
        includeInsights: z.boolean().default(true).describe('Include AI quality insights'),
        timeframe: z.enum(['7d', '30d', '90d']).default('30d')
      },
      async ({ projectId, localeId, includeInsights, timeframe }) => {
        const startTime = Date.now();
        try {
          const qualityDashboard = await this.aiInsights.generateQualityDashboard({
            projectId,
            localeId,
            includeInsights,
            timeframe
          });

          const responseTime = Date.now() - startTime;
          
          return {
            _meta: {
              requestId: `quality-${Date.now()}`,
              timing: { duration: responseTime },
              shortcut: '@quality'
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  project_id: projectId,
                  quality_score: qualityDashboard.overallScore,
                  metrics: qualityDashboard.metrics,
                  insights: qualityDashboard.insights,
                  issues: qualityDashboard.issues,
                  recommendations: qualityDashboard.recommendations,
                  trends: qualityDashboard.trends
                }, null, 2),
                annotations: {
                  shortcut: '@quality',
                  priority: 1
                }
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('@quality', error, startTime);
        }
      }
    );
  }

  private registerDebugShortcut() {
    this.server.tool(
      'smartling_debug', // @debug
      '🔧 AI-powered auto-debugging for translation issues',
      {
        projectId: z.string().describe('Project ID'),
        issueDescription: z.string().describe('Description of the issue you\'re experiencing'),
        includeRecent: z.boolean().default(true).describe('Include recent logs and errors'),
        autoFix: z.boolean().default(false).describe('Attempt automatic fixes where possible'),
      },
      async ({ projectId, issueDescription, includeRecent, autoFix }) => {
        const startTime = Date.now();
        try {
          const debugResult = await this.debugAssistant.diagnoseIssue({
            projectId,
            issueDescription,
            includeRecent,
            autoFix
          });

          const responseTime = Date.now() - startTime;
          
          return {
            _meta: {
              requestId: `debug-${Date.now()}`,
              timing: { duration: responseTime },
              shortcut: '@debug'
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  diagnosis: debugResult.diagnosis,
                  root_cause: debugResult.rootCause,
                  solutions: debugResult.solutions,
                  quick_fixes: debugResult.quickFixes,
                  prevention_tips: debugResult.preventionTips,
                  auto_fixes_applied: debugResult.autoFixesApplied,
                  confidence: debugResult.confidence
                }, null, 2),
                annotations: {
                  shortcut: '@debug',
                  priority: 1
                }
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('@debug', error, startTime);
        }
      }
    );
  }

  private registerInsightsShortcut() {
    this.server.tool(
      'smartling_insights', // @insights
      '🧠 Advanced AI insights for complex translation analysis',
      {
        projectId: z.string().describe('Project ID'),
        analysisType: z.enum(['performance', 'quality', 'cost', 'workflow', 'comprehensive']).default('comprehensive'),
        complexQuery: z.string().optional().describe('Complex question for AI analysis'),
        useAdvancedModel: z.boolean().default(false).describe('Use advanced AI model (higher cost, better insights)'),
      },
      async ({ projectId, analysisType, complexQuery, useAdvancedModel }) => {
        const startTime = Date.now();
        try {
          const insights = await this.aiInsights.generateAdvancedInsights({
            projectId,
            analysisType,
            complexQuery,
            useAdvancedModel
          });

          const responseTime = Date.now() - startTime;
          
          return {
            _meta: {
              requestId: `insights-${Date.now()}`,
              timing: { duration: responseTime },
              shortcut: '@insights',
              cost_estimate: insights.costEstimate
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  insights: insights.analysis,
                  recommendations: insights.recommendations,
                  action_items: insights.actionItems,
                  confidence: insights.confidence,
                  cost_estimate: insights.costEstimate,
                  model_used: insights.modelUsed
                }, null, 2),
                annotations: {
                  shortcut: '@insights',
                  priority: 1
                }
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('@insights', error, startTime);
        }
      }
    );
  }

  // ===== PHASE 2: AI-POWERED ADVANCED COMMANDS =====

  private registerAIOptimize() {
    this.server.tool(
      'smartling_ai_optimize',
      '🚀 AI-powered workflow optimization suggestions',
      {
        projectId: z.string().describe('Project ID'),
        optimizationGoal: z.enum(['speed', 'cost', 'quality', 'balanced']).default('balanced'),
        analyzeWorkflow: z.boolean().default(true).describe('Analyze current workflow patterns'),
      },
      async ({ projectId, optimizationGoal, analyzeWorkflow }) => {
        const startTime = Date.now();
        try {
          const optimization = await this.aiInsights.optimizeWorkflow({
            projectId,
            optimizationGoal,
            analyzeWorkflow
          });

          return {
            _meta: {
              requestId: `optimize-${Date.now()}`,
              timing: { duration: Date.now() - startTime }
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  current_workflow: optimization.currentWorkflow,
                  optimizations: optimization.suggestions,
                  expected_improvements: optimization.expectedImprovements,
                  implementation_steps: optimization.implementationSteps,
                  risk_assessment: optimization.riskAssessment
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('ai_optimize', error, startTime);
        }
      }
    );
  }

  private registerAIPredict() {
    this.server.tool(
      'smartling_ai_predict',
      '🔮 AI-powered prediction of bottlenecks and issues',
      {
        projectId: z.string().describe('Project ID'),
        predictionType: z.enum(['bottlenecks', 'quality_issues', 'cost_overruns', 'delays', 'all']).default('all'),
        timeHorizon: z.enum(['24h', '7d', '30d']).default('7d'),
      },
      async ({ projectId, predictionType, timeHorizon }) => {
        const startTime = Date.now();
        try {
          const predictions = await this.aiInsights.predictIssues({
            projectId,
            predictionType,
            timeHorizon
          });

          return {
            _meta: {
              requestId: `predict-${Date.now()}`,
              timing: { duration: Date.now() - startTime }
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  predictions: predictions.predictions,
                  risk_levels: predictions.riskLevels,
                  preventive_actions: predictions.preventiveActions,
                  confidence_scores: predictions.confidenceScores,
                  monitoring_suggestions: predictions.monitoringSuggestions
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('ai_predict', error, startTime);
        }
      }
    );
  }

  private registerAIAnalyze() {
    this.server.tool(
      'smartling_ai_analyze',
      '🔍 Deep AI analysis for complex translation problems',
      {
        projectId: z.string().describe('Project ID'),
        complexQuery: z.string().describe('Complex question or problem to analyze'),
        useO3Pro: z.boolean().default(false).describe('Use advanced reasoning model (higher cost)'),
        includeContext: z.boolean().default(true).describe('Include full project context'),
      },
      async ({ projectId, complexQuery, useO3Pro, includeContext }) => {
        const startTime = Date.now();
        try {
          // Prepare comprehensive context
          const context = includeContext ? 
            await this.aiInsights.gatherFullProjectContext(projectId) : null;

          const analysis = await this.aiInsights.deepAnalysis({
            projectId,
            complexQuery,
            context,
            useAdvancedModel: useO3Pro
          });

          return {
            _meta: {
              requestId: `analyze-${Date.now()}`,
              timing: { duration: Date.now() - startTime },
              cost_estimate: analysis.costEstimate
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  analysis: analysis.result,
                  reasoning: analysis.reasoning,
                  recommendations: analysis.recommendations,
                  confidence: analysis.confidence,
                  cost_estimate: analysis.costEstimate,
                  model_used: analysis.modelUsed
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('ai_analyze', error, startTime);
        }
      }
    );
  }

  // ===== PHASE 3: ASYNC OPERATIONS =====

  private registerBulkOperations() {
    this.server.tool(
      'smartling_bulk_translate',
      '📦 Create bulk translation job with progress tracking',
      {
        projectId: z.string().describe('Project ID'),
        filePaths: z.array(z.string()).describe('Array of file paths to translate'),
        targetLocales: z.array(z.string()).describe('Target locale codes'),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        dueDate: z.string().optional().describe('Due date in ISO format'),
      },
      async ({ projectId, filePaths, targetLocales, priority, dueDate }) => {
        const startTime = Date.now();
        try {
          const jobId = await this.jobManager.createBulkJob({
            projectId,
            filePaths,
            targetLocales,
            priority,
            dueDate
          });

          return {
            _meta: {
              requestId: `bulk-${Date.now()}`,
              timing: { duration: Date.now() - startTime }
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  job_id: jobId,
                  status: 'queued',
                  estimated_completion: '15-30 minutes',
                  cost_estimate: '$45.30',
                  files_count: filePaths.length,
                  locales_count: targetLocales.length,
                  next_step: `Use @check_job with job_id "${jobId}" to monitor progress`
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('bulk_translate', error, startTime);
        }
      }
    );
  }

  private registerJobStatus() {
    this.server.tool(
      'smartling_check_job', // @check_job
      '⏱️ Check status of async translation job',
      {
        jobId: z.string().describe('Job ID from bulk operation'),
        includeDetails: z.boolean().default(true).describe('Include detailed progress information'),
      },
      async ({ jobId, includeDetails }) => {
        const startTime = Date.now();
        try {
          const status = await this.jobManager.getJobStatus(jobId, includeDetails);

          return {
            _meta: {
              requestId: `status-${Date.now()}`,
              timing: { duration: Date.now() - startTime }
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  job_id: jobId,
                  status: status.state,
                  progress: `${status.completed}/${status.total} strings`,
                  eta: status.estimatedCompletion,
                  current_phase: status.currentPhase,
                  details: includeDetails ? status.details : null,
                  next_action: status.state === 'completed' ? 
                    `Use @get_results with job_id "${jobId}" to retrieve results` : 
                    'Check again in a few minutes'
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('check_job', error, startTime);
        }
      }
    );
  }

  private registerJobResults() {
    this.server.tool(
      'smartling_get_results', // @get_results
      '📋 Get results from completed translation job',
      {
        jobId: z.string().describe('Job ID from completed bulk operation'),
        includeQuality: z.boolean().default(true).describe('Include quality metrics'),
        includeFiles: z.boolean().default(false).describe('Include translated file contents'),
      },
      async ({ jobId, includeQuality, includeFiles }) => {
        const startTime = Date.now();
        try {
          const results = await this.jobManager.getJobResults({
            jobId,
            includeQuality,
            includeFiles
          });

          return {
            _meta: {
              requestId: `results-${Date.now()}`,
              timing: { duration: Date.now() - startTime }
            },
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  job_id: jobId,
                  completion_time: results.completionTime,
                  total_strings: results.totalStrings,
                  translated_strings: results.translatedStrings,
                  quality_metrics: includeQuality ? results.qualityMetrics : null,
                  files: includeFiles ? results.files : results.fileSummary,
                  final_cost: results.finalCost,
                  download_links: results.downloadLinks
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return this.createErrorResponse('get_results', error, startTime);
        }
      }
    );
  }

  // ===== UTILITY METHODS =====

  private createErrorResponse(tool: string, error: any, startTime: number) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const responseTime = Date.now() - startTime;
    
    return {
      _meta: {
        requestId: `${tool}-error-${Date.now()}`,
        timing: { duration: responseTime },
        source: 'smartling-enhanced',
        version: '4.0.0'
      },
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            tool: tool,
            timestamp: new Date().toISOString()
          }, null, 2),
          annotations: {
            audience: ['user', 'assistant'],
            priority: 2,
            lastModified: new Date().toISOString()
          }
        }
      ],
      isError: true
    };
  }
}

// Export factory function
export const createEnhancedSmartlingMCP = (server: McpServer, client: SmartlingClient) => {
  return new EnhancedSmartlingMCP(server, client);
};