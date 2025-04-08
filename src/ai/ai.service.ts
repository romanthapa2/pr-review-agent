import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeDiff(diff: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const prompt = `You are a senior engineer reviewing a PR. Provide constructive feedback on this PR diff:\n\n${diff}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const content = response.text();
      
      if (!content) {
        throw new Error('Received empty content from Gemini response');
      }
      return content;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Unable to analyze this PR due to an API error. Please check your Google API key and model configuration.';
    }
  }
}
