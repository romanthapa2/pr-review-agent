import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class WebhookService {
  constructor(private readonly queueService: QueueService) {}

  async enqueuePR(payload: any) {
    const { number, base } = payload.pull_request;
    const owner = base.repo.owner.login;
    const repo = base.repo.name;

    await this.queueService.addPRToQueue(owner, repo, number);
  }
}