import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { GithubService } from '../github/github.service';
import { AiService } from '../ai/ai.service';
import { ConfigService } from '@nestjs/config';
import type { jobData } from '../webhook/webhook.service';

@Injectable()
export class AiWorker {
  private readonly logger = new Logger(AiWorker.name);

  constructor(
    private readonly githubService: GithubService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT');

    new Worker<jobData>(
      'pr-review-queue',
      async (job) => {
        const { owner, repo, number } = job.data;
        this.logger.log(`Processing AI PR Review for PR #${number}`);
        return this.processPR(owner, repo, number);
      },
      {
        connection: { host: redisHost, port: redisPort },
        lockDuration: 120000,
      },
    );
  }

  private async processPR(owner: string, repo: string, number: number) {
    // this.logger.log(`Fetching diff for PR #${number}`);
    const diff = await this.githubService.fetchPRDiff(owner, repo, number);

    this.logger.log(`Analyzing diff with AI for PR #${number}`);
    const aiFeedback = await this.aiService.analyzeDiff(diff);

    await this.githubService.commentOnPR(owner, repo, number, aiFeedback);
    this.logger.log(`AI PR Review completed for PR #${number}`);
    return { success: true };
  }
}
