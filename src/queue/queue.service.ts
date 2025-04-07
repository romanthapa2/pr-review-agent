import { Injectable } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { AiService } from '../ai/ai.service';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService {
  private prQueue: Queue;

  constructor(
    private readonly githubService: GithubService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService
  ) {
    this.prQueue = new Queue('pr-review-queue', {
      connection: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
    });

    const worker = new Worker('pr-review-queue', async (job) => {
      const { owner, repo, number } = job.data;
      await this.processPR(owner, repo, number);
    }, {
      connection: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
    });
  }

  async addPRToQueue(owner: string, repo: string, number: number) {
    await this.prQueue.add('pr-review-task', { owner, repo, number });
  }

  async processPR(owner: string, repo: string, number: number) {
    const diff = await this.githubService.fetchPRDiff(owner, repo, number);
    const aiFeedback = await this.aiService.analyzeDiff(diff);
    await this.githubService.commentOnPR(owner, repo, number, aiFeedback);
  }
}
