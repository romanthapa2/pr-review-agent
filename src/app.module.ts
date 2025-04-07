import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { GithubModule } from './github/github.module';
import { QueueModule } from './queue/queue.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [AiModule, GithubModule, QueueModule, WebhookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
