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

      const prompt = `You are an expert code reviewer with deep expertise in software engineering best practices. Your role is to provide detailed, actionable feedback on code changes.

Please analyze the following code changes and provide feedback in the following format for each file. List issues in order of importance (Syntax Error > Logical Error > Security  > Bug > Performance > Code Style):

File: [filename]
Type: [error type - e.g., Syntax Error, Security, Performance, Code Style, Bug, etc.]
Issue: [brief description of the issue]
Refactored Code (line numbers and corrected code only):
\`\`\`[language]
Line [X]: [corrected code]
Line [Y]: [corrected code]
\`\`\`

Code changes to review:
${diff}`;

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
