import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { GithubModule } from '../github/github.module';
import { AiModule } from '../ai/ai.module';
import { AiWorker } from './ai.worker';
import { EslintWorker } from './eslint.worker';

@Module({
  imports: [GithubModule, AiModule],
  providers: [QueueService, AiWorker, EslintWorker],
  exports: [QueueService],
})
export class QueueModule {}
