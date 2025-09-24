import { Injectable, Logger } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { AiService } from '../ai/ai.service';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService {
  private aiQueue: Queue;
  private eslintQueue: Queue;
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly githubService: GithubService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT');

    const connection = { host: redisHost, port: redisPort };

    this.logger.log(`Connecting to Redis at ${redisHost}:${redisPort}`);

    this.eslintQueue = new Queue('eslint-security-queue', { connection });

    this.aiQueue = new Queue('pr-review-queue', {
      connection,
    });

    // const worker = new Worker(
    //   'pr-review-queue',
    //   async (job) => {
    //     this.logger.log(
    //       `Processing job ${job.id}: PR #${job.data.number} in ${job.data.owner}/${job.data.repo}`,
    //     );
    //     try {
    //       const { owner, repo, number } = job.data;
    //       await this.processPR(owner, repo, number);
    //       this.logger.log(`Successfully processed PR #${number}`);
    //       return { success: true };
    //     } catch (error) {
    //       this.logger.error(`Error processing job ${job.id}:`, error);
    //       throw error;
    //     }
    //   },
    //   {
    //     connection: {
    //       host: redisHost,
    //       port: redisPort,
    //     },
    //   },
    // );

    // worker.on('completed', (job) => {
    //   this.logger.log(`Job ${job.id} completed successfully`);
    // });

    // worker.on('failed', (job, error) => {
    //   this.logger.error(`Job ${job?.id} failed:`, error);
    // });
  }

  async addLintSecurityJob(owner: string, repo: string, number: number) {
    this.logger.log(`Enqueuing ESLint/Security job for PR #${number}`);
    await this.eslintQueue.add('lint-security-task', {
      owner,
      repo,
      number,
    });
  }

  async addPRToQueue(owner: string, repo: string, number: number) {
    this.logger.log(`Adding PR #${number} from ${owner}/${repo} to queue`);
    await this.aiQueue.add('ai-pr-review-task', { owner, repo, number });
    this.logger.log(`PR #${number} added to queue successfully`);
  }

  // async processPR(owner: string, repo: string, number: number) {
  //   this.logger.log(`Fetching diff for PR #${number}`);
  //   const diff = await this.githubService.fetchPRDiff(owner, repo, number);

  //   this.logger.log(`Analyzing diff for PR #${number}`);
  //   const aiFeedback = await this.aiService.analyzeDiff(diff);

  //   this.logger.log(`Posting comment on PR #${number}`);
  //   await this.githubService.commentOnPR(owner, repo, number, aiFeedback);

  //   this.logger.log(`PR #${number} processed successfully`);
  // }
}
