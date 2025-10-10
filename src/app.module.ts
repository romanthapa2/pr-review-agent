import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubModule } from './github/github.module';
import { AiModule } from './ai/ai.module';
import { WebhookModule } from './webhook/webhook.module';
import { QueueModule } from './queue/queue.module';
import { WebhookService } from './webhook/webhook.service';
import { QueueService } from './queue/queue.service';
import { EslintWorker } from './queue/eslint.worker';
import { AiWorker } from './queue/ai.worker';

@Module({
  imports: [
    //.env file access to all modules
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GithubModule,
    AiModule,
    WebhookModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebhookService, QueueService, EslintWorker, AiWorker],
})
export class AppModule {}
