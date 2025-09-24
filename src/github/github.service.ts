import { Injectable } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

@Injectable()
export class GithubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }

  async fetchPRDiff(
    owner: string,
    repo: string,
    number: number,
  ): Promise<string> {
    try {
      // Get the PR information
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: number,
        mediaType: { format: 'diff' },
      });

      // If response already contains diff content
      if (typeof data === 'string') {
        return data;
      }

      // If we just got the URL, fetch the actual diff content
      if (data.diff_url) {
        console.log(`Fetching diff from URL: ${data.diff_url}`);
        const diffResponse = await axios.get(data.diff_url, {
          headers: {
            Accept: 'application/vnd.github.v3.diff',
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
        });
        return diffResponse.data as string;
      }

      throw new Error('Could not retrieve PR diff');
    } catch (error) {
      console.error('Error fetching PR diff:', error);
      return 'Error fetching PR diff. Please check your GitHub token and repository information.';
    }
  }

  async commentOnPR(
    owner: string,
    repo: string,
    number: number,
    comment: string,
  ) {
    try {
      await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: number,
        body: `### 🤖 AI Review Feedback\n${comment}`,
      });
      console.log(`Successfully posted comment on PR #${number}`);
    } catch (error) {
      console.error('Error posting comment on PR:', error);
    }
  }
}
