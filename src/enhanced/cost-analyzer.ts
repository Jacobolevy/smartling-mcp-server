import { SmartlingClient } from '../smartling-client.js';

export interface CostAnalysisParams {
  projectId: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  includePredictions: boolean;
  includeOptimizations: boolean;
}

export interface CostSummary {
  totalCost: number;
  avgCostPerWord: number;
  avgCostPerLocale: number;
  totalWords: number;
  totalLocales: number;
  costBreakdown: {
    translation: number;
    editing: number;
    proofreading: number;
    other: number;
  };
}

export interface CostBreakdown {
  byLocale: Array<{
    locale: string;
    cost: number;
    words: number;
    avgRate: number;
  }>;
  byContentType: Array<{
    type: string;
    cost: number;
    percentage: number;
  }>;
  byTimeperiod: Array<{
    period: string;
    cost: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface CostTrends {
  monthlyTrend: 'increasing' | 'decreasing' | 'stable';
  seasonality: Array<{
    month: string;
    avgCost: number;
    deviation: number;
  }>;
  peakPeriods: Array<{
    period: string;
    cost: number;
    reason: string;
  }>;
}

export interface CostPredictions {
  nextMonth: {
    estimatedCost: number;
    confidence: number;
    factors: string[];
  };
  nextQuarter: {
    estimatedCost: number;
    confidence: number;
    budgetRecommendation: number;
  };
  yearEnd: {
    projectedTotal: number;
    confidence: number;
    varianceRange: {
      min: number;
      max: number;
    };
  };
}

export interface CostOptimizations {
  suggestions: Array<{
    type: string;
    description: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    implementation: string[];
  }>;
  bundlingOpportunities: Array<{
    locales: string[];
    estimatedSavings: number;
    description: string;
  }>;
  workflowOptimizations: Array<{
    currentStep: string;
    optimizedStep: string;
    savingsPercentage: number;
    description: string;
  }>;
}

export interface CostAnalysisResult {
  summary: CostSummary;
  breakdown: CostBreakdown;
  trends: CostTrends;
  predictions?: CostPredictions;
  optimizations?: CostOptimizations;
  potentialSavings: number;
}

/**
 * AI-Powered Cost Analyzer
 * Provides intelligent cost analysis, predictions, and optimization suggestions
 */
export class CostAnalyzer {
  constructor(private smartlingClient: SmartlingClient) {}

  /**
   * Perform comprehensive cost analysis
   */
  async analyzeCosts(params: CostAnalysisParams): Promise<CostAnalysisResult> {
    try {
      // Gather cost data from multiple sources
      const [
        billingData,
        projectData,
        historicalCosts,
        usageMetrics
      ] = await Promise.all([
        this.getBillingData(params.projectId, params.timeframe),
        this.getProjectData(params.projectId),
        this.getHistoricalCosts(params.projectId, params.timeframe),
        this.getUsageMetrics(params.projectId, params.timeframe)
      ]);

      // Generate summary
      const summary = this.generateCostSummary(billingData, usageMetrics);
      
      // Create breakdown analysis
      const breakdown = this.createCostBreakdown(billingData, projectData, params.timeframe);
      
      // Analyze trends
      const trends = this.analyzeCostTrends(historicalCosts, params.timeframe);
      
      let predictions: CostPredictions | undefined;
      let optimizations: CostOptimizations | undefined;
      
      // Generate predictions if requested
      if (params.includePredictions) {
        predictions = await this.generateCostPredictions(
          historicalCosts,
          projectData,
          trends
        );
      }
      
      // Generate optimization suggestions if requested
      if (params.includeOptimizations) {
        optimizations = await this.generateOptimizations(
          summary,
          breakdown,
          trends,
          projectData
        );
      }
      
      // Calculate potential savings
      const potentialSavings = this.calculatePotentialSavings(optimizations);
      
      return {
        summary,
        breakdown,
        trends,
        predictions,
        optimizations,
        potentialSavings
      };
      
    } catch (error) {
      console.error('Cost analysis failed:', error);
      throw new Error(`Failed to analyze costs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate cost predictions using AI models
   */
  async generateCostPredictions(
    historicalCosts: any[],
    projectData: any,
    trends: CostTrends
  ): Promise<CostPredictions> {
    try {
      // Simple prediction algorithm (could be enhanced with ML models)
      const recentAverage = this.calculateRecentAverage(historicalCosts, 30); // 30 days
      const trendMultiplier = this.getTrendMultiplier(trends.monthlyTrend);
      const seasonalityFactor = this.getSeasonalityFactor(trends.seasonality);
      
      const nextMonthBase = recentAverage * trendMultiplier * seasonalityFactor;
      const nextQuarterBase = nextMonthBase * 3;
      const yearEndBase = this.calculateYearEndProjection(historicalCosts, trends);
      
      return {
        nextMonth: {
          estimatedCost: Math.round(nextMonthBase * 100) / 100,
          confidence: this.calculateConfidence(historicalCosts, 'monthly'),
          factors: this.identifyPredictionFactors(trends, projectData)
        },
        nextQuarter: {
          estimatedCost: Math.round(nextQuarterBase * 100) / 100,
          confidence: this.calculateConfidence(historicalCosts, 'quarterly'),
          budgetRecommendation: Math.round(nextQuarterBase * 1.15 * 100) / 100 // 15% buffer
        },
        yearEnd: {
          projectedTotal: Math.round(yearEndBase * 100) / 100,
          confidence: this.calculateConfidence(historicalCosts, 'yearly'),
          varianceRange: {
            min: Math.round(yearEndBase * 0.85 * 100) / 100,
            max: Math.round(yearEndBase * 1.25 * 100) / 100
          }
        }
      };
    } catch (error) {
      console.error('Cost prediction failed:', error);
      
      // Return fallback predictions
      return {
        nextMonth: {
          estimatedCost: 0,
          confidence: 0,
          factors: ['Prediction unavailable - insufficient data']
        },
        nextQuarter: {
          estimatedCost: 0,
          confidence: 0,
          budgetRecommendation: 0
        },
        yearEnd: {
          projectedTotal: 0,
          confidence: 0,
          varianceRange: { min: 0, max: 0 }
        }
      };
    }
  }

  /**
   * Generate AI-powered optimization suggestions
   */
  async generateOptimizations(
    summary: CostSummary,
    breakdown: CostBreakdown,
    trends: CostTrends,
    projectData: any
  ): Promise<CostOptimizations> {
    try {
      const suggestions: CostOptimizations['suggestions'] = [];
      const bundlingOpportunities: CostOptimizations['bundlingOpportunities'] = [];
      const workflowOptimizations: CostOptimizations['workflowOptimizations'] = [];

      // Analyze rate optimization opportunities
      if (summary.avgCostPerWord > 0.15) {
        suggestions.push({
          type: 'rate_negotiation',
          description: 'Your current average rate per word is above market average. Consider negotiating volume discounts.',
          potentialSavings: summary.totalCost * 0.15,
          effort: 'medium',
          timeframe: '2-4 weeks',
          implementation: [
            'Analyze historical volume',
            'Prepare cost comparison report',
            'Schedule negotiation with account manager'
          ]
        });
      }

      // Identify locale bundling opportunities
      const localeGroups = this.identifyLocaleBundles(breakdown.byLocale);
      for (const group of localeGroups) {
        bundlingOpportunities.push({
          locales: group.locales,
          estimatedSavings: group.savings,
          description: `Bundle ${group.locales.join(', ')} for ${Math.round(group.savingsPercent)}% savings`
        });
      }

      // Workflow optimization suggestions
      if (summary.costBreakdown.editing > summary.costBreakdown.translation * 0.3) {
        workflowOptimizations.push({
          currentStep: 'Manual editing after translation',
          optimizedStep: 'Enhanced QA during translation',
          savingsPercentage: 20,
          description: 'High editing costs suggest quality issues during translation. Implementing better QA upfront could reduce editing needs.'
        });
      }

      // Content type optimization
      const expensiveContent = breakdown.byContentType
        .filter(item => item.cost > summary.totalCost * 0.25)
        .sort((a, b) => b.cost - a.cost);

      for (const content of expensiveContent) {
        suggestions.push({
          type: 'content_optimization',
          description: `${content.type} content represents ${Math.round(content.percentage)}% of costs. Consider optimization strategies.`,
          potentialSavings: content.cost * 0.10,
          effort: 'medium',
          timeframe: '1-2 months',
          implementation: [
            `Analyze ${content.type} content patterns`,
            'Implement terminology management',
            'Create content guidelines',
            'Train content creators'
          ]
        });
      }

      // Seasonal optimization
      if (trends.seasonality.length > 0) {
        const peakCost = Math.max(...trends.seasonality.map(s => s.avgCost));
        const lowCost = Math.min(...trends.seasonality.map(s => s.avgCost));
        
        if ((peakCost - lowCost) / lowCost > 0.3) {
          suggestions.push({
            type: 'seasonal_planning',
            description: 'Significant seasonal cost variation detected. Plan translations during low-cost periods.',
            potentialSavings: (peakCost - lowCost) * 0.5,
            effort: 'low',
            timeframe: 'Ongoing',
            implementation: [
              'Identify seasonal patterns',
              'Create translation calendar',
              'Pre-plan high-volume periods',
              'Negotiate seasonal rates'
            ]
          });
        }
      }

      // Technology optimization
      suggestions.push({
        type: 'automation',
        description: 'Implement translation automation for repetitive content types.',
        potentialSavings: summary.totalCost * 0.25,
        effort: 'high',
        timeframe: '3-6 months',
        implementation: [
          'Audit repetitive content',
          'Implement TM leverage',
          'Set up automated workflows',
          'Train team on new processes'
        ]
      });

      return {
        suggestions,
        bundlingOpportunities,
        workflowOptimizations
      };
      
    } catch (error) {
      console.error('Optimization generation failed:', error);
      
      return {
        suggestions: [{
          type: 'manual_review',
          description: 'Automated optimization analysis unavailable. Manual cost review recommended.',
          potentialSavings: 0,
          effort: 'medium',
          timeframe: '1-2 weeks',
          implementation: ['Contact account manager for manual cost review']
        }],
        bundlingOpportunities: [],
        workflowOptimizations: []
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async getBillingData(projectId: string, timeframe: string): Promise<any[]> {
    try {
      // This would integrate with Smartling billing API
      // For now, return mock data structure
      return [
        {
          period: '2024-01',
          totalCost: 1250.50,
          words: 12500,
          locales: ['es-ES', 'fr-FR', 'de-DE'],
          breakdown: {
            translation: 1000.00,
            editing: 200.00,
            proofreading: 50.50
          }
        }
      ];
    } catch (error) {
      console.error('Failed to get billing data:', error);
      return [];
    }
  }

  private async getProjectData(projectId: string): Promise<any> {
    try {
      return await this.smartlingClient.getProject(projectId);
    } catch (error) {
      console.error('Failed to get project data:', error);
      return {};
    }
  }

  private async getHistoricalCosts(projectId: string, timeframe: string): Promise<any[]> {
    // This would fetch historical cost data
    // For now, return mock data
    return Array.from({ length: 12 }, (_, i) => ({
      month: 2024 - Math.floor(i / 12),
      period: String(((11 - i) % 12) + 1).padStart(2, '0'),
      cost: 1000 + Math.random() * 500,
      words: 10000 + Math.random() * 5000
    }));
  }

  private async getUsageMetrics(projectId: string, timeframe: string): Promise<any> {
    // This would fetch usage metrics
    return {
      totalWords: 50000,
      totalJobs: 25,
      averageJobSize: 2000,
      utilizationRate: 0.85
    };
  }

  private generateCostSummary(billingData: any[], usageMetrics: any): CostSummary {
    const totalCost = billingData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalWords = usageMetrics.totalWords || 0;
    const totalLocales = billingData.reduce((count, item) => count + item.locales.length, 0);
    
    const costBreakdown = billingData.reduce((acc, item) => ({
      translation: acc.translation + (item.breakdown?.translation || 0),
      editing: acc.editing + (item.breakdown?.editing || 0),
      proofreading: acc.proofreading + (item.breakdown?.proofreading || 0),
      other: acc.other + (item.breakdown?.other || 0)
    }), { translation: 0, editing: 0, proofreading: 0, other: 0 });

    return {
      totalCost,
      avgCostPerWord: totalWords > 0 ? totalCost / totalWords : 0,
      avgCostPerLocale: totalLocales > 0 ? totalCost / totalLocales : 0,
      totalWords,
      totalLocales,
      costBreakdown
    };
  }

  private createCostBreakdown(billingData: any[], projectData: any, timeframe: string): CostBreakdown {
    // Create locale breakdown
    const localeMap = new Map<string, { cost: number; words: number; }>();
    billingData.forEach(item => {
      item.locales.forEach((locale: string) => {
        const existing = localeMap.get(locale) || { cost: 0, words: 0 };
        localeMap.set(locale, {
          cost: existing.cost + (item.totalCost / item.locales.length),
          words: existing.words + (item.words / item.locales.length)
        });
      });
    });

    const byLocale = Array.from(localeMap.entries()).map(([locale, data]) => ({
      locale,
      cost: Math.round(data.cost * 100) / 100,
      words: Math.round(data.words),
      avgRate: data.words > 0 ? Math.round((data.cost / data.words) * 10000) / 10000 : 0
    }));

    // Create content type breakdown (mock data)
    const byContentType = [
      { type: 'Marketing', cost: 500, percentage: 40 },
      { type: 'Documentation', cost: 400, percentage: 32 },
      { type: 'UI/UX', cost: 200, percentage: 16 },
      { type: 'Legal', cost: 150, percentage: 12 }
    ];

    // Create time period breakdown
    const byTimeperiod = billingData.map(item => ({
      period: item.period,
      cost: item.totalCost,
      trend: this.calculateTrend(billingData, item.period) as 'up' | 'down' | 'stable'
    }));

    return {
      byLocale,
      byContentType,
      byTimeperiod
    };
  }

  private analyzeCostTrends(historicalCosts: any[], timeframe: string): CostTrends {
    const monthlyCosts = historicalCosts.slice(-12); // Last 12 months
    
    // Calculate monthly trend
    const recentCosts = monthlyCosts.slice(-3).map(item => item.cost);
    const olderCosts = monthlyCosts.slice(-6, -3).map(item => item.cost);
    
    const recentAvg = recentCosts.reduce((a, b) => a + b, 0) / recentCosts.length;
    const olderAvg = olderCosts.reduce((a, b) => a + b, 0) / olderCosts.length;
    
    let monthlyTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.1) monthlyTrend = 'increasing';
    else if (recentAvg < olderAvg * 0.9) monthlyTrend = 'decreasing';

    // Calculate seasonality
    const seasonality = monthlyCosts.map(item => {
      const avg = monthlyCosts.reduce((a, b) => a + b.cost, 0) / monthlyCosts.length;
      return {
        month: `${item.month}-${item.period}`,
        avgCost: item.cost,
        deviation: ((item.cost - avg) / avg) * 100
      };
    });

    // Identify peak periods
    const avgCost = monthlyCosts.reduce((a, b) => a + b.cost, 0) / monthlyCosts.length;
    const peakPeriods = monthlyCosts
      .filter(item => item.cost > avgCost * 1.2)
      .map(item => ({
        period: `${item.month}-${item.period}`,
        cost: item.cost,
        reason: 'High translation volume'
      }));

    return {
      monthlyTrend,
      seasonality,
      peakPeriods
    };
  }

  private calculateRecentAverage(costs: any[], days: number): number {
    const recent = costs.slice(-Math.ceil(days / 30)); // Approximate months
    return recent.reduce((sum, item) => sum + item.cost, 0) / recent.length;
  }

  private getTrendMultiplier(trend: string): number {
    switch (trend) {
      case 'increasing': return 1.1;
      case 'decreasing': return 0.9;
      default: return 1.0;
    }
  }

  private getSeasonalityFactor(seasonality: any[]): number {
    const currentMonth = new Date().getMonth();
    const seasonal = seasonality[currentMonth % seasonality.length];
    return seasonal ? 1 + (seasonal.deviation / 100) : 1.0;
  }

  private calculateYearEndProjection(historicalCosts: any[], trends: CostTrends): number {
    const monthlyAverage = historicalCosts.reduce((sum, item) => sum + item.cost, 0) / historicalCosts.length;
    const remainingMonths = 12 - new Date().getMonth();
    const trendMultiplier = this.getTrendMultiplier(trends.monthlyTrend);
    
    return monthlyAverage * remainingMonths * trendMultiplier;
  }

  private calculateConfidence(historicalCosts: any[], period: string): number {
    const variance = this.calculateVariance(historicalCosts.map(item => item.cost));
    const mean = historicalCosts.reduce((sum, item) => sum + item.cost, 0) / historicalCosts.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation
    
    // Higher confidence for lower variability
    return Math.max(0.1, Math.min(0.95, 1 - cv));
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  private identifyPredictionFactors(trends: CostTrends, projectData: any): string[] {
    const factors = [];
    
    if (trends.monthlyTrend === 'increasing') {
      factors.push('Increasing cost trend detected');
    }
    
    if (trends.peakPeriods.length > 0) {
      factors.push('Seasonal peaks identified');
    }
    
    if (projectData.upcomingReleases) {
      factors.push('Upcoming product releases');
    }
    
    return factors.length > 0 ? factors : ['Historical patterns', 'Current project scope'];
  }

  private identifyLocaleBundles(localeData: any[]): Array<{
    locales: string[];
    savings: number;
    savingsPercent: number;
  }> {
    const bundles = [];
    
    // Simple bundling logic - similar language families
    const languageFamilies = {
      romance: ['es-ES', 'fr-FR', 'it-IT', 'pt-BR'],
      germanic: ['de-DE', 'nl-NL', 'da-DK', 'sv-SE'],
      slavic: ['ru-RU', 'pl-PL', 'cs-CZ']
    };
    
    for (const [family, locales] of Object.entries(languageFamilies)) {
      const availableLocales = localeData
        .filter(item => locales.includes(item.locale))
        .map(item => item.locale);
      
      if (availableLocales.length >= 2) {
        const totalCost = localeData
          .filter(item => availableLocales.includes(item.locale))
          .reduce((sum, item) => sum + item.cost, 0);
        
        bundles.push({
          locales: availableLocales,
          savings: totalCost * 0.15, // 15% bundle discount
          savingsPercent: 15
        });
      }
    }
    
    return bundles;
  }

  private calculateTrend(data: any[], currentPeriod: string): string {
    const currentIndex = data.findIndex(item => item.period === currentPeriod);
    if (currentIndex <= 0) return 'stable';
    
    const current = data[currentIndex].totalCost;
    const previous = data[currentIndex - 1].totalCost;
    
    if (current > previous * 1.05) return 'up';
    if (current < previous * 0.95) return 'down';
    return 'stable';
  }

  private calculatePotentialSavings(optimizations?: CostOptimizations): number {
    if (!optimizations) return 0;
    
    const suggestionSavings = optimizations.suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
    const bundlingSavings = optimizations.bundlingOpportunities.reduce((sum, b) => sum + b.estimatedSavings, 0);
    
    return Math.round((suggestionSavings + bundlingSavings) * 100) / 100;
  }
}