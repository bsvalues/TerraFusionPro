import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * AI Service
 * 
 * Provides a unified interface to access different AI providers (OpenAI, Anthropic, etc.)
 */
export class AIService {
  private static instance: AIService;
  private openai: OpenAI;
  private anthropic: Anthropic;
  
  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Initialize Anthropic client
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  /**
   * Get the OpenAI client
   */
  getOpenAI(): OpenAI {
    return this.openai;
  }
  
  /**
   * Get the Anthropic client
   */
  getAnthropic(): Anthropic {
    return this.anthropic;
  }
  
  /**
   * Generate text with OpenAI
   * @param prompt The prompt to send to the model
   * @param model The model to use (defaults to gpt-4o)
   * @param options Additional options
   */
  async generateTextWithOpenAI(
    prompt: string,
    model: string = 'gpt-4o',
    options: any = {}
  ): Promise<string> {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });
    
    return response.choices[0].message.content || '';
  }
  
  /**
   * Generate text with Anthropic
   * @param prompt The prompt to send to the model
   * @param model The model to use (defaults to claude-3-7-sonnet-20250219)
   * @param options Additional options
   */
  async generateTextWithAnthropic(
    prompt: string,
    model: string = 'claude-3-7-sonnet-20250219',
    options: any = {}
  ): Promise<string> {
    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: options.max_tokens || 1024,
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });
    
    return String(response.content[0].text);
  }
  
  /**
   * Generate JSON with OpenAI
   * @param prompt The prompt to send to the model
   * @param model The model to use (defaults to gpt-4o)
   * @param options Additional options
   */
  async generateJsonWithOpenAI<T = any>(
    prompt: string,
    model: string = 'gpt-4o',
    options: any = {}
  ): Promise<T> {
    const response = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      ...options,
    });
    
    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content) as T;
  }
  
  /**
   * Generate JSON with Anthropic
   * @param prompt The prompt to send to the model
   * @param model The model to use (defaults to claude-3-7-sonnet-20250219)
   * @param options Additional options
   */
  async generateJsonWithAnthropic<T = any>(
    prompt: string,
    model: string = 'claude-3-7-sonnet-20250219',
    options: any = {}
  ): Promise<T> {
    // Add instructions to return JSON
    const jsonPrompt = `${prompt}\n\nPlease provide your response as a valid JSON object.`;
    
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: options.max_tokens || 1024,
      messages: [{ role: 'user', content: jsonPrompt }],
      ...options,
    });
    
    const content = String(response.content[0].text);
    return JSON.parse(content) as T;
  }
  
  /**
   * Generate text based on provider
   * @param prompt The prompt to send to the model
   * @param provider The AI provider to use ('openai' or 'anthropic')
   * @param model The model to use (optional)
   * @param options Additional options
   */
  async generateText(
    prompt: string,
    provider: 'openai' | 'anthropic' = 'openai',
    model?: string,
    options: any = {}
  ): Promise<string> {
    if (provider === 'anthropic') {
      return this.generateTextWithAnthropic(prompt, model, options);
    } else {
      return this.generateTextWithOpenAI(prompt, model, options);
    }
  }
  
  /**
   * Generate JSON based on provider
   * @param prompt The prompt to send to the model
   * @param provider The AI provider to use ('openai' or 'anthropic')
   * @param model The model to use (optional)
   * @param options Additional options
   */
  async generateJson<T = any>(
    prompt: string,
    provider: 'openai' | 'anthropic' = 'openai',
    model?: string,
    options: any = {}
  ): Promise<T> {
    if (provider === 'anthropic') {
      return this.generateJsonWithAnthropic<T>(prompt, model, options);
    } else {
      return this.generateJsonWithOpenAI<T>(prompt, model, options);
    }
  }
}