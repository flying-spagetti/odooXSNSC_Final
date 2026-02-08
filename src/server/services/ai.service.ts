/**
 * AI Service
 * Handles AI-powered features using OpenRouter API
 */

import { config } from '../config';

export interface SummarizationRequest {
  summary: {
    activeSubscriptionsCount: number;
    totalRevenue: number;
    totalPayments: number;
    overdueInvoicesCount: number;
    draftInvoicesCount: number;
    confirmedInvoicesCount: number;
    paidInvoicesCount: number;
  };
  metrics: Array<{
    status: string;
    count: number;
  }>;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export class AIService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = config.ai.openRouterApiKey;
    this.model = config.ai.summarizationModel;
  }

  async summarizeReport(data: SummarizationRequest): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set. Please configure it in your .env file.');
    }

    if (!this.model) {
      throw new Error('SUMMARIZATION_MODEL environment variable is not set. Please configure it in your .env file.');
    }

    // Format the data for the AI prompt
    const dateRangeText = data.dateRange?.from || data.dateRange?.to
      ? `Date Range: ${data.dateRange.from || 'beginning'} to ${data.dateRange.to || 'today'}`
      : 'All time data';

    const metricsText = data.metrics
      .map((m) => `- ${m.status}: ${m.count}`)
      .join('\n');

    const prompt = `You are a business analyst assistant. Analyze the following subscription business report data and provide a concise, insightful summary (2-3 paragraphs) that highlights:

1. Key business health indicators
2. Financial performance insights
3. Areas requiring attention
4. Overall business status assessment

Report Data:
${dateRangeText}

Key Metrics:
- Active Subscriptions: ${data.summary.activeSubscriptionsCount}
- Total Revenue: ₹${data.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total Payments Collected: ₹${data.summary.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Outstanding Amount: ₹${Math.max(0, data.summary.totalRevenue - data.summary.totalPayments).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Invoice Status Breakdown:
- Draft: ${data.summary.draftInvoicesCount}
- Confirmed: ${data.summary.confirmedInvoicesCount}
- Paid: ${data.summary.paidInvoicesCount}
- Overdue: ${data.summary.overdueInvoicesCount}

Subscription Status Distribution:
${metricsText}

Provide a professional, actionable summary that helps business owners understand their subscription business performance.`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Subscription Manager',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful business analyst assistant that provides clear, actionable insights from business data.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      const summary = result.choices?.[0]?.message?.content;

      if (!summary) {
        throw new Error('No summary generated from AI service');
      }

      return summary;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate AI summary');
    }
  }
}
