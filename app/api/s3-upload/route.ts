import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { checkS3RateLimit } from '@/lib/rate-limiter';

// Initialize the S3 client with credentials from environment variables
// Note: These are server-side environment variables, NOT exposed to the client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'camera-recorder-audio';

/**
 * POST handler for uploading audio to S3
 * Expects multipart form data with 'audio' file and 'language' field
 */
export async function POST(request: Request) {
  try {
    // Check rate limit
    const isAllowed = await checkS3RateLimit();
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    // Parse the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = formData.get('language') as string || 'english';
    
    // Validate inputs
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    if (language !== 'english' && language !== 'mandarin') {
      return NextResponse.json(
        { error: 'Language must be either "english" or "mandarin"' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename with language prefix
    const filename = `audio/${language}/${uuid()}.mp3`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: Buffer.from(arrayBuffer),
      ContentType: 'audio/mpeg'
    });
    
    await s3Client.send(uploadCommand);
    
    // Generate a presigned URL for accessing the file
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename
    });
    
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    
    // Return the S3 key and URL
    return NextResponse.json({
      key: filename,
      url: url
    });
    
  } catch (error: any) {
    console.error('Error in S3 upload API:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred during S3 upload' },
      { status: 500 }
    );
  }
}
