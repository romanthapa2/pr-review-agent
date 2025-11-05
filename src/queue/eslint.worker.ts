import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, WorkerOptions } from 'bullmq';
import { GithubService } from '../github/github.service';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { jobData } from '../webhook/webhook.service';

const execAsync = promisify(exec);

// ---- Interfaces for ESLint ----
interface ESLintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
}

interface ESLintResult {
  filePath: string;
  messages: ESLintMessage[];
}

// ---- Interfaces for npm audit ----
interface AuditAdvisory {
  severity: string;
  title: string;
  url: string;
}

interface AuditResult {
  vulnerabilities?: Record<string, AuditAdvisory>;
}

@Injectable()
export class EslintWorker implements OnModuleInit {
  private readonly logger = new Logger(EslintWorker.name);
  private worker: Worker<jobData> | null = null;

  constructor(
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.initWorker();
  }

  private initWorker() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);

    const workerOptions: WorkerOptions = {
      connection: { host: redisHost, port: redisPort },
      lockDuration: 120000,
    };

    this.worker = new Worker<jobData>(
      'eslint-security-queue',
      async (job) => this.handleJob(job.data),
      workerOptions,
    );

    this.worker.on('completed', (job) =>
      this.logger.log(`✅ Job ${job.id} completed`),
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`❌ Job ${job?.id} failed: ${err.message}`),
    );

    this.logger.log('EslintWorker initialized and listening for jobs...');
  }

  private async handleJob({ owner, repo, number }: jobData) {
    this.logger.log(`Running ESLint/Security for PR #${number}`);
    return this.runLintAndSecurity(owner, repo, number);
  }

  private async runLintAndSecurity(
    owner: string,
    repo: string,
    number: number,
  ) {
    const tempDir = await mkdtemp(join(tmpdir(), 'repo-'));
    try {
      // 1. Clone repo
      const repoUrl = `https://github.com/${owner}/${repo}.git`;
      await execAsync(`git clone --depth=1 ${repoUrl} ${tempDir}`);
      this.logger.log(`Cloned ${repoUrl} into ${tempDir}`);

      // 2. Install deps
      await execAsync(`npm install --ignore-scripts`, { cwd: tempDir });

      // 3. Run ESLint
      let eslintOutput = 'No lint issues';
      try {
        const { stdout } = await execAsync(
          `npx eslint . -f json --max-warnings=0 || true`,
          { cwd: tempDir },
        );

        const parsed: unknown = stdout ? JSON.parse(stdout) : [];
        const results: ESLintResult[] = Array.isArray(parsed)
          ? (parsed as ESLintResult[])
          : [];

        eslintOutput =
          results.length > 0
            ? results
                .map(
                  (file) =>
                    `File: ${file.filePath}\n` +
                    file.messages
                      .map(
                        (m) =>
                          `  [${
                            m.severity === 2 ? 'ERROR' : 'WARN'
                          }] ${m.ruleId ?? 'unknown-rule'} - ${
                            m.message
                          } (line ${m.line})`,
                      )
                      .join('\n'),
                )
                .join('\n\n')
            : '✅ No ESLint issues found';
      } catch (err) {
        eslintOutput = `⚠️ ESLint failed: ${(err as Error).message}`;
      }

      // 4. Run npm audit
      let securityOutput = 'No vulnerabilities found';
      try {
        const { stdout } = await execAsync(`npm audit --json || true`, {
          cwd: tempDir,
        });

        const parsed: unknown = stdout ? JSON.parse(stdout) : {};
        const audit: AuditResult =
          typeof parsed === 'object' ? (parsed as AuditResult) : {};

        if (
          audit.vulnerabilities &&
          Object.keys(audit.vulnerabilities).length
        ) {
          securityOutput = Object.entries(audit.vulnerabilities)
            .map(
              ([pkg, vuln]) =>
                `Package: ${pkg}\n  Severity: ${vuln.severity}\n  Title: ${vuln.title}\n  URL: ${vuln.url}`,
            )
            .join('\n\n');
        } else {
          securityOutput = '✅ No vulnerabilities found';
        }
      } catch (err) {
        securityOutput = `⚠️ Security scan failed: ${(err as Error).message}`;
      }

      // 5. Post to GitHub
      await this.githubService.commentOnPR(
        owner,
        repo,
        number,
        [
          `### 🤖 Automated Analysis`,
          `**Lint Report:**\n${eslintOutput}`,
          `**Security Report:**\n${securityOutput}`,
        ].join('\n\n'),
      );

      this.logger.log(`Completed ESLint/Security for PR #${number}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error running analysis for PR #${number}: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
