// Groq API Integration for JurisAI Legal Platform
// Using fetch API instead of groq-sdk to avoid dependency issues

// Initialize Groq with environment variable
const API_KEY = process.env.GROQ_API_KEY || ''; // Set GROQ_API_KEY in environment variables
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

console.log('Groq API Key check:', {
  hasKey: !!API_KEY,
  keyLength: API_KEY.length,
  apiKey: API_KEY.substring(0, 10) + '...',
  envValue: process.env.GROQ_API_KEY ? 'SET' : 'NOT SET',
  source: process.env.GROQ_API_KEY ? 'ENV' : 'FALLBACK'
});

export interface AIResponse {
  text: string;
  success: boolean;
  error?: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface LegalAnalysisRequest {
  type: 'legal-consultation' | 'document-analysis' | 'irac-analysis' | 'contract-review' | 'case-research';
  query: string;
  context?: string;
  jurisdiction?: string;
  language?: string;
}

export interface IRACAnalysis {
  issue: string;
  rule: string;
  application: string;
  conclusion: string;
  confidence: number;
  relevantLaws: string[];
}

class GoogleAIService {
  private model: string;
  private legalModel: string;

  constructor() {
    // Initialize model names
    this.model = 'llama-3.3-70b-versatile';
    this.legalModel = 'llama-3.3-70b-versatile';
    console.log('Groq models initialized successfully with llama-3.3-70b-versatile');
  }

  async generateLegalResponse(request: LegalAnalysisRequest): Promise<AIResponse> {
    try {
      // Check if API is available
      if (!API_KEY) {
        return {
          text: '',
          success: false,
          error: 'Groq API is not available'
        };
      }

      const modelName = request.type === 'irac-analysis' ? this.legalModel : this.model;
      
      const systemPrompt = this.buildSystemPrompt(request.type, request.language);
      const userPrompt = this.buildUserPrompt(request);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user", 
              content: userPrompt
            }
          ],
          temperature: request.type === 'irac-analysis' ? 0.3 : 0.7,
          max_tokens: request.type === 'irac-analysis' ? 4096 : 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || 'API request failed');
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '';

      if (!text || typeof text !== 'string') {
        return {
          text: '',
          success: false,
          error: 'Invalid response from AI model'
        };
      }

      return {
        text: text.trim(),
        success: true
      };
    } catch (error) {
      console.error('Groq AI Error:', error);
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateStreamingResponse(
    request: LegalAnalysisRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    try {
      // Check if API is available
      if (!API_KEY) {
        return {
          text: '',
          success: false,
          error: 'Groq API is not available'
        };
      }

      const modelName = request.type === 'irac-analysis' ? this.legalModel : this.model;
      
      const systemPrompt = this.buildSystemPrompt(request.type, request.language);
      const userPrompt = this.buildUserPrompt(request);
      
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user", 
              content: userPrompt
            }
          ],
          temperature: request.type === 'irac-analysis' ? 0.3 : 0.7,
          max_tokens: request.type === 'irac-analysis' ? 4096 : 2048,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      let fullText = '';
      
      // Note: Streaming with fetch requires ReadableStream processing
      // For now, we'll just get the full response
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      if (content) {
        fullText = content;
        onChunk(content);
      }

      if (!fullText) {
        return {
          text: '',
          success: false,
          error: 'No response from AI model'
        };
      }

      return {
        text: fullText.trim(),
        success: true
      };
    } catch (error) {
      console.error('Groq AI Streaming Error:', error);
      return {
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildSystemPrompt(type: string, language: string = 'uz'): string {
    const basePrompt = language === 'uz' 
      ? "Siz O'zbekiston qonunchiligi bo'yicha professional yuridik yordam beruvchi AI assistentsiz. "
      : "You are a professional legal AI assistant providing legal assistance. ";
    
    switch (type) {
      case 'irac-analysis':
        return basePrompt + (language === 'uz' 
          ? "IRAC (Issue, Rule, Application, Conclusion) metodidan foydalanib, huquqiy masalalarni chuqur tahlil qiling."
          : "Use the IRAC (Issue, Rule, Application, Conclusion) method to deeply analyze legal issues.");
      case 'document-analysis':
        return basePrompt + (language === 'uz'
          ? "Hujjatlarni huquqiy jihatdan tahlil qiling, xavflarni aniqlang va tavsiyalar bering."
          : "Analyze documents legally, identify risks and provide recommendations.");
      case 'contract-review':
        return basePrompt + (language === 'uz'
          ? "Shartnomalarni tekshiring, ularning huquqiy to'g'riligini va potentsial xavflarini baholang."
          : "Review contracts, assess their legal validity and potential risks.");
      case 'case-research':
        return basePrompt + (language === 'uz'
          ? "Huquqiy ishlar bo'yicha tadqiqot o'tkazing va tegishli qonunlarni toping."
          : "Conduct legal case research and find relevant laws.");
      default:
        return basePrompt + (language === 'uz'
          ? "Aniq va foydali yuridik maslahatlar bering."
          : "Provide accurate and helpful legal advice.");
    }
  }

  private buildUserPrompt(request: LegalAnalysisRequest): string {
    let prompt = request.query;
    
    if (request.context) {
      prompt += `\n\nKontekst: ${request.context}`;
    }
    
    if (request.jurisdiction) {
      prompt += `\n\nYurisdiktsiya: ${request.jurisdiction}`;
    }
    
    if (request.language) {
      prompt += `\n\nTil: ${request.language}`;
    }
    
    return prompt;
  }

  async performIRACAnalysis(caseText: string): Promise<IRACAnalysis> {
    try {
      const request: LegalAnalysisRequest = {
        type: 'irac-analysis',
        query: caseText,
        language: 'uz',
        jurisdiction: 'uzbekistan'
      };

      const response = await this.generateLegalResponse(request);
      
      if (!response.success) {
        throw new Error(response.error || 'IRAC analysis failed');
      }

      return this.parseIRACResponse(response.text);
    } catch (error) {
      console.error('IRAC Analysis Error:', error);
      throw error;
    }
  }

  private parseIRACResponse(response: string): IRACAnalysis {
    // Simple parsing logic - in production, use more sophisticated parsing
    const lines = response.split('\n');
    let issue = '';
    let rule = '';
    let application = '';
    let conclusion = '';
    const relevantLaws: string[] = [];

    lines.forEach(line => {
      line = line.trim();
      if (line.toLowerCase().includes('issue') || line.toLowerCase().includes('masala')) {
        issue = line.replace(/^(issue|masala)[:\s]*/i, '').trim();
      } else if (line.toLowerCase().includes('rule') || line.toLowerCase().includes('qoida')) {
        rule = line.replace(/^(rule|qoida)[:\s]*/i, '').trim();
      } else if (line.toLowerCase().includes('application') || line.toLowerCase().includes('qollash')) {
        application = line.replace(/^(application|qollash)[:\s]*/i, '').trim();
      } else if (line.toLowerCase().includes('conclusion') || line.toLowerCase().includes('xulosa')) {
        conclusion = line.replace(/^(conclusion|xulosa)[:\s]*/i, '').trim();
      }
    });

    // Extract law references
    const lawMatches = response.match(/(?:FK|JK|MK|OK|YK)\s*\d+-modda/gi);
    if (lawMatches) {
      relevantLaws.push(...lawMatches);
    }

    return {
      issue: issue || 'Muammo aniqlanmadi',
      rule: rule || 'Qoida aniqlanmadi',
      application: application || 'Qollash aniqlanmadi',
      conclusion: conclusion || 'Xulosa aniqlanmadi',
      confidence: 0.85, // Default confidence
      relevantLaws
    };
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.generateLegalResponse({
        type: 'legal-consultation',
        query: 'Test query',
        language: 'uz'
      });
      return testResponse.success;
    } catch (error) {
      console.error('AI Service Health Check Failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleAIService = new GoogleAIService();
export default googleAIService;
