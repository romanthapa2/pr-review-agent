import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, 
    });
  }

  async analyzeDiff(diff: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a senior engineer reviewing a PR. Provide constructive feedback.' },
        { role: 'user', content: `Review this PR diff:\n\n${diff}` },
      ],
    });

    const content = response.choices[0].message.content;
    if (content === null) {
      throw new Error('Received null content from OpenAI response');
    }
    return content;
  }
}
