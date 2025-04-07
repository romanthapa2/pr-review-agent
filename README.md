# AI Agent to Review GitHub PRs

An automated AI service that reviews GitHub pull requests and provides feedback using Gemini AI.

## Setup

1. Clone the repository
2. Create a `.env` file with the following variables:
   ```
   GITHUB_TOKEN=your_github_token
   GOOGLE_API_KEY=your_gemini_api_key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=3000
   ```
   - Get a GitHub token with `repo` permissions
   - Get a Google API key for Gemini

## Running the Service

### Using Docker

```bash
# Build the Docker image
docker build -t ai-pr-reviewer .

# Run the service
docker run -p 3000:3000 --env-file .env ai-pr-reviewer

# Run Redis in background for queue processing
docker-compose up -d
```

### Without Docker

```bash
# Install dependencies
npm install

# Start the service
npm run start
```

## Testing the PR Reviewer

1. **Expose your local server** 
   - Use a tool like ngrok to expose your local server to the internet
   ```bash
   ngrok http 3000
   ```
   - Note the generated URL (e.g., `https://abc123.ngrok.io`)

2. **Set up a GitHub webhook**
   - Go to your GitHub repository > Settings > Webhooks > Add webhook
   - Set the Payload URL to `https://your-ngrok-url/webhook`
   - Set Content type to `application/json`
   - Select "Let me select individual events" and choose only "Pull requests"
   - Ensure webhook is active and click "Add webhook"

3. **Create a test PR**
   - Create a new branch in your repository
   - Make some changes
   - Create a pull request

The service will:
1. Receive the webhook when the PR is created
2. Add the PR to a queue
3. Process the PR by fetching the diff
4. Analyze the diff using Gemini AI
5. Post a comment on the PR with the AI feedback

## Troubleshooting

- Check Redis is running: `docker ps`
- Verify env variables are set correctly
- Check webhook delivery in GitHub repository settings
