import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubModule } from './github/github.module';
import { AiModule } from './ai/ai.module';
import { WebhookModule } from './webhook/webhook.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    //.env file access to all modules
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GithubModule, 
    AiModule, 
    WebhookModule, 
    QueueModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
