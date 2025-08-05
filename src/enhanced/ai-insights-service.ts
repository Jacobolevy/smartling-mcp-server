import { SmartlingClient } from '../smartling-client.js';
import OpenAI from 'openai';

export interface TranslationEnhancement {
  text: string;
  confidence: number;
  alternatives: string[];
  insights: string[];
  costEstimate: string;
}

export interface ProgressMetrics {
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
  averageWordsPerDay: number;
  qualityTrend: 'improving' | 'declining' | 'stable';
  bottlenecks: string[];
  recommendations: string[];
}

export interface ProjectPredictions {
  estimatedCompletion: string;
  confidenceLevel: number;
  potentialDelays: string[];
  recommendedActions: string[];
  resourceNeeds: string[];
}

export interface QualityDashboard {
  overallScore: number;
  metrics: Record<string, any>;
  insights: string[];
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    solution: string;
  }>;
  recommendations: string[];
  trends: Record<string, any>;
}

export interface AdvancedInsights {
  analysis: string;
  recommendations: string[];
  actionItems: string[];
  confidence: number;
  costEstimate: string;
  modelUsed: string;
}

/**
 * AI-Powered Insights Service
 * Integrates with OpenAI models for advanced translation analysis
 */
export class AIInsightsService {
  private openai: OpenAI;
  private defaultModel = 'gpt-4o';
  private advancedModel = 'o1-preview'; // For complex reasoning

  constructor(private smartlingClient: SmartlingClient) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Enhance translation with AI context and alternatives
   */
  async enhanceTranslation(params: {
    text: string;
    targetLocale: string;
    sourceLocale?: string;
    context?: string;
    domain?: string;
  }): Promise<TranslationEnhancement> {
    try {
      const prompt = this.buildTranslationPrompt(params);
      
      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert translation assistant with deep knowledge of localization nuances, cultural context, and domain-specific terminology. Provide high-quality translations with alternatives and insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        text: result.translation || params.text,
        confidence: result.confidence || 0.8,
        alternatives: result.alternatives || [],
        insights: result.insights || [],
        costEstimate: this.calculateCostEstimate(response.usage)
      };
    } catch (error) {
      console.error('AI translation enhancement failed:', error);
      // Fallback to basic translation
      return {
        text: params.text,
        confidence: 0.5,
        alternatives: [],
        insights: ['AI enhancement temporarily unavailable'],
        costEstimate: '$0.00'
      };
    }
  }

  /**
   * Calculate progress metrics with AI analysis
   */
  async calculateProgressMetrics(projectId: string, timeframe: string): Promise<ProgressMetrics> {
    try {
      // Gather project data
      const projectData = await this.gatherProjectData(projectId, timeframe);
      
      const prompt = `
        Analyze this translation project data and provide insights:
        ${JSON.stringify(projectData, null, 2)}
        
        Focus on:
        1. Translation velocity trends
        2. Quality patterns
        3. Bottlenecks identification
        4. Performance recommendations
        
        Return JSON format with velocityTrend, averageWordsPerDay, qualityTrend, bottlenecks, and recommendations.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a translation project analytics expert. Analyze data patterns and provide actionable insights for project optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Progress metrics calculation failed:', error);
      return {
        velocityTrend: 'stable',
        averageWordsPerDay: 0,
        qualityTrend: 'stable',
        bottlenecks: ['Unable to analyze - check logs'],
        recommendations: ['Contact support for detailed analysis']
      };
    }
  }

  /**
   * Predict project completion with AI
   */
  async predictProjectCompletion(projectId: string): Promise<ProjectPredictions> {
    try {
      const projectData = await this.gatherProjectData(projectId, '30d');
      const currentProgress = await this.smartlingClient.getProjectProgress(projectId);
      
      const prompt = `
        Based on this project data and current progress, predict project completion:
        
        Current Progress: ${JSON.stringify(currentProgress, null, 2)}
        Historical Data: ${JSON.stringify(projectData, null, 2)}
        
        Analyze patterns and provide:
        1. Estimated completion date
        2. Confidence level (0-1)
        3. Potential delays and their causes
        4. Recommended actions to stay on track
        5. Resource needs
        
        Return JSON format.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a project completion prediction expert specializing in translation workflows. Provide realistic estimates based on historical patterns.'
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
      console.error('Project prediction failed:', error);
      return {
        estimatedCompletion: 'Unable to predict',
        confidenceLevel: 0,
        potentialDelays: ['Analysis unavailable'],
        recommendedActions: ['Manual review required'],
        resourceNeeds: ['Unknown']
      };
    }
  }

  /**
   * Generate AI-powered quality dashboard
   */
  async generateQualityDashboard(params: {
    projectId: string;
    localeId?: string;
    includeInsights: boolean;
    timeframe: string;
  }): Promise<QualityDashboard> {
    try {
      const qualityData = await this.gatherQualityData(params.projectId, params.localeId, params.timeframe);
      
      if (!params.includeInsights) {
        return {
          overallScore: qualityData.averageScore || 0,
          metrics: qualityData,
          insights: [],
          issues: [],
          recommendations: [],
          trends: {}
        };
      }

      const prompt = `
        Analyze this translation quality data and provide comprehensive insights:
        ${JSON.stringify(qualityData, null, 2)}
        
        Provide:
        1. Overall quality assessment
        2. Key quality insights
        3. Issues identification with severity levels
        4. Specific recommendations for improvement
        5. Quality trends analysis
        
        Return JSON format with overallScore, insights, issues, recommendations, and trends.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a translation quality expert. Analyze quality metrics and provide actionable insights for improvement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const aiInsights = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        overallScore: aiInsights.overallScore || qualityData.averageScore || 0,
        metrics: qualityData,
        insights: aiInsights.insights || [],
        issues: aiInsights.issues || [],
        recommendations: aiInsights.recommendations || [],
        trends: aiInsights.trends || {}
      };
    } catch (error) {
      console.error('Quality dashboard generation failed:', error);
      return {
        overallScore: 0,
        metrics: {},
        insights: ['Quality analysis temporarily unavailable'],
        issues: [],
        recommendations: ['Manual quality review recommended'],
        trends: {}
      };
    }
  }

  /**
   * Generate advanced insights for complex problems
   */
  async generateAdvancedInsights(params: {
    projectId: string;
    analysisType: string;
    complexQuery?: string;
    useAdvancedModel: boolean;
  }): Promise<AdvancedInsights> {
    try {
      const context = await this.gatherFullProjectContext(params.projectId);
      const model = params.useAdvancedModel ? this.advancedModel : this.defaultModel;
      
      const prompt = params.complexQuery ? 
        `Complex Question: ${params.complexQuery}\n\nProject Context:\n${JSON.stringify(context, null, 2)}` :
        `Perform ${params.analysisType} analysis on this project:\n${JSON.stringify(context, null, 2)}`;

      const messages = [
        {
          role: 'system',
          content: 'You are a senior translation management consultant with deep expertise in localization workflows, cost optimization, quality assurance, and project management. Provide detailed, actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: params.useAdvancedModel ? 0.1 : 0.3,
        max_tokens: params.useAdvancedModel ? 4000 : 2000
      });

      const analysis = response.choices[0].message.content || '';
      
      // Extract structured insights from the analysis
      const structuredInsights = await this.extractStructuredInsights(analysis);
      
      return {
        analysis: analysis,
        recommendations: structuredInsights.recommendations,
        actionItems: structuredInsights.actionItems,
        confidence: params.useAdvancedModel ? 0.9 : 0.7,
        costEstimate: this.calculateCostEstimate(response.usage),
        modelUsed: model
      };
    } catch (error) {
      console.error('Advanced insights generation failed:', error);
      return {
        analysis: 'Advanced analysis temporarily unavailable',
        recommendations: ['Manual review recommended'],
        actionItems: ['Check system logs', 'Contact support if needed'],
        confidence: 0,
        costEstimate: '$0.00',
        modelUsed: 'none'
      };
    }
  }

  /**
   * Optimize workflow with AI recommendations
   */
  async optimizeWorkflow(params: {
    projectId: string;
    optimizationGoal: string;
    analyzeWorkflow: boolean;
  }) {
    try {
      const workflowData = params.analyzeWorkflow ? 
        await this.analyzeCurrentWorkflow(params.projectId) : null;
      
      const prompt = `
        Optimize this translation workflow for ${params.optimizationGoal}:
        
        Current Workflow: ${workflowData ? JSON.stringify(workflowData, null, 2) : 'Not analyzed'}
        
        Provide optimization suggestions with:
        1. Current workflow assessment
        2. Specific optimization recommendations
        3. Expected improvements with metrics
        4. Implementation steps
        5. Risk assessment
        
        Return JSON format.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a workflow optimization specialist for translation projects. Provide practical, implementable recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Workflow optimization failed:', error);
      return {
        currentWorkflow: 'Analysis unavailable',
        suggestions: ['Manual workflow review recommended'],
        expectedImprovements: {},
        implementationSteps: [],
        riskAssessment: 'Unknown'
      };
    }
  }

  /**
   * Predict potential issues with AI
   */
  async predictIssues(params: {
    projectId: string;
    predictionType: string;
    timeHorizon: string;
  }) {
    try {
      const historicalData = await this.gatherHistoricalData(params.projectId, params.timeHorizon);
      const currentState = await this.gatherCurrentProjectState(params.projectId);
      
      const prompt = `
        Predict ${params.predictionType} for this project over the next ${params.timeHorizon}:
        
        Historical Data: ${JSON.stringify(historicalData, null, 2)}
        Current State: ${JSON.stringify(currentState, null, 2)}
        
        Provide:
        1. Specific predictions for each issue type
        2. Risk levels (low/medium/high)
        3. Preventive actions
        4. Confidence scores
        5. Monitoring suggestions
        
        Return JSON format.
      `;

      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a predictive analytics expert for translation projects. Identify patterns and predict potential issues with high accuracy.'
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
      console.error('Issue prediction failed:', error);
      return {
        predictions: ['Prediction analysis unavailable'],
        riskLevels: {},
        preventiveActions: ['Manual monitoring recommended'],
        confidenceScores: {},
        monitoringSuggestions: []
      };
    }
  }

  /**
   * Perform deep analysis for complex problems
   */
  async deepAnalysis(params: {
    projectId: string;
    complexQuery: string;
    context: any;
    useAdvancedModel: boolean;
  }) {
    try {
      const model = params.useAdvancedModel ? this.advancedModel : this.defaultModel;
      
      const prompt = `
        Complex Analysis Request: ${params.complexQuery}
        
        Project Context: ${params.context ? JSON.stringify(params.context, null, 2) : 'Limited context available'}
        
        Provide detailed analysis with reasoning and actionable recommendations.
      `;

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a senior translation technology consultant. Provide thorough analysis with clear reasoning and practical recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: params.useAdvancedModel ? 0.1 : 0.3
      });

      const analysis = response.choices[0].message.content || '';
      const structuredData = await this.extractStructuredInsights(analysis);
      
      return {
        result: analysis,
        reasoning: params.useAdvancedModel ? 'Advanced reasoning model used' : 'Standard analysis',
        recommendations: structuredData.recommendations,
        confidence: params.useAdvancedModel ? 0.95 : 0.8,
        costEstimate: this.calculateCostEstimate(response.usage),
        modelUsed: model
      };
    } catch (error) {
      console.error('Deep analysis failed:', error);
      return {
        result: 'Deep analysis temporarily unavailable',
        reasoning: 'Error occurred during analysis',
        recommendations: ['Manual review recommended'],
        confidence: 0,
        costEstimate: '$0.00',
        modelUsed: 'none'
      };
    }
  }

  /**
   * Gather comprehensive project context for AI analysis
   */
  async gatherFullProjectContext(projectId: string): Promise<any> {
    try {
      const [
        progress,
        files,
        jobs,
        locales,
        recentActivity
      ] = await Promise.all([
        this.smartlingClient.getProjectProgress(projectId).catch(() => null),
        this.smartlingClient.getFiles(projectId).catch(() => []),
        this.smartlingClient.getJobs(projectId).catch(() => []),
        this.smartlingClient.getProjectLocales(projectId).catch(() => []),
        this.getRecentActivity(projectId).catch(() => [])
      ]);

      return {
        projectId,
        progress,
        files: files.slice(0, 20), // Limit for token efficiency
        jobs: jobs.slice(0, 10),
        locales,
        recentActivity: recentActivity.slice(0, 50),
        contextGatheredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error gathering project context:', error);
      return {
        projectId,
        error: 'Failed to gather complete context',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private buildTranslationPrompt(params: {
    text: string;
    targetLocale: string;
    sourceLocale?: string;
    context?: string;
    domain?: string;
  }): string {
    return `
      Translate the following text from ${params.sourceLocale || 'auto-detect'} to ${params.targetLocale}:
      
      Text: "${params.text}"
      ${params.context ? `Context: ${params.context}` : ''}
      ${params.domain ? `Domain: ${params.domain}` : ''}
      
      Provide:
      1. Best translation
      2. 2-3 alternative translations
      3. Translation confidence (0-1)
      4. Cultural/linguistic insights
      5. Any special considerations
      
      Return JSON format: {
        "translation": "...",
        "alternatives": ["...", "..."],
        "confidence": 0.95,
        "insights": ["...", "..."]
      }
    `;
  }

  private async gatherProjectData(projectId: string, timeframe: string): Promise<any> {
    // Implementation would gather historical project data
    // For now, return mock structure
    return {
      projectId,
      timeframe,
      translations: [],
      quality_scores: [],
      velocity_data: [],
      bottlenecks: []
    };
  }

  private async gatherQualityData(projectId: string, localeId?: string, timeframe?: string): Promise<any> {
    // Implementation would gather quality metrics
    return {
      projectId,
      localeId,
      timeframe,
      averageScore: 85,
      scores: [],
      issues: []
    };
  }

  private async analyzeCurrentWorkflow(projectId: string): Promise<any> {
    // Implementation would analyze current workflow patterns
    return {
      projectId,
      workflow_steps: [],
      bottlenecks: [],
      efficiency_metrics: {}
    };
  }

  private async gatherHistoricalData(projectId: string, timeHorizon: string): Promise<any> {
    // Implementation would gather historical performance data
    return {
      projectId,
      timeHorizon,
      past_issues: [],
      performance_trends: {},
      patterns: []
    };
  }

  private async gatherCurrentProjectState(projectId: string): Promise<any> {
    // Implementation would gather current project state
    return {
      projectId,
      current_status: {},
      active_jobs: [],
      resource_utilization: {}
    };
  }

  private async getRecentActivity(projectId: string): Promise<any[]> {
    // Implementation would get recent project activity
    return [];
  }

  private async extractStructuredInsights(analysis: string): Promise<{
    recommendations: string[];
    actionItems: string[];
  }> {
    // Simple extraction - could be enhanced with more AI processing
    const lines = analysis.split('\n');
    const recommendations: string[] = [];
    const actionItems: string[] = [];
    
    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('recommend')) {
        currentSection = 'recommendations';
      } else if (trimmed.toLowerCase().includes('action') || trimmed.toLowerCase().includes('next step')) {
        currentSection = 'actions';
      } else if (trimmed.length > 10 && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
        if (currentSection === 'recommendations') {
          recommendations.push(trimmed.substring(1).trim());
        } else if (currentSection === 'actions') {
          actionItems.push(trimmed.substring(1).trim());
        }
      }
    }
    
    return { recommendations, actionItems };
  }

  private calculateCostEstimate(usage: any): string {
    if (!usage) return '$0.00';
    
    // Rough cost estimation based on OpenAI pricing
    const inputCost = (usage.prompt_tokens || 0) * 0.00001; // $0.01 per 1K tokens
    const outputCost = (usage.completion_tokens || 0) * 0.00003; // $0.03 per 1K tokens
    const total = inputCost + outputCost;
    
    return `$${total.toFixed(4)}`;
  }
}