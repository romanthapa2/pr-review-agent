import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { GithubModule } from '../github/github.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [GithubModule, AiModule],
  providers: [QueueService],
  exports: [QueueService]
})
export class QueueModule {}
