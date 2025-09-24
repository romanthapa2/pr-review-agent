import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

export interface jobData {
  owner: string;
  repo: string;
  number: number;
}

export interface PullRequestPayload {
  pull_request: {
    number: number;
    base: {
      repo: {
        owner: { login: string };
        name: string;
      };
    };
  };
}

@Injectable()
export class WebhookService {
  constructor(private readonly queueService: QueueService) {}

  async enqueuePR(payload: PullRequestPayload) {
    const { number, base } = payload.pull_request;
    const owner = base.repo.owner.login;
    const repo = base.repo.name;

    await this.queueService.addLintSecurityJob(owner, repo, number);
    await this.queueService.addPRToQueue(owner, repo, number);
  }
}
