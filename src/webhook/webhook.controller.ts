import { Controller, Post, Req, Res } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Response } from 'express';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(@Req() req, @Res() res: Response) {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
      await this.webhookService.enqueuePR(payload);
    }

    res.sendStatus(200);
  }
}