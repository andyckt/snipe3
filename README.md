# Camera Recorder App

A web application for recording videos with text-to-speech capabilities using ElevenLabs API and AWS S3 storage.

## Deployment to Vercel

### Prerequisites

1. An AWS account with an S3 bucket created
2. An ElevenLabs account with an API key
3. A Vercel account

### Environment Variables

Set up the following environment variables in your Vercel project:

```
ELEVENLABS_API_KEY=your_elevenlabs_api_key
AWS_REGION=us-east-1 (or your preferred region)
AWS_S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### Deployment Steps

1. Push your code to a GitHub repository
2. Log in to Vercel and create a new project
3. Connect your GitHub repository
4. Configure the environment variables as listed above
5. Deploy the project

## Local Development

1. Clone the repository
2. Create a `.env.local` file with the environment variables listed above
3. Install dependencies: `pnpm install`
4. Start the development server: `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Security Features

This application implements several security best practices:

1. Server-side API routes to protect API keys
2. Rate limiting to prevent abuse
3. Secure presigned URLs for S3 access
4. No client-side exposure of sensitive credentials
