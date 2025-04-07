import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  async fetchPRDiff(owner: string, repo: string, number: number): Promise<string> {
    const { data } = await this.octokit.pulls.get({ owner, repo, pull_number: number });
    return data.diff_url;
  }

  async commentOnPR(owner: string, repo: string, number: number, comment: string) {
    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body: `### 🤖 AI Review Feedback\n${comment}`,
    });
  }
}