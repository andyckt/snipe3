"use client"

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { v4 as uuid } from 'uuid'

// Initialize the S3 client with credentials from environment variables
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
  }
})

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'camera-recorder-audio'

/**
 * Uploads an audio blob to S3 and returns the key (filename)
 * @param audioBlob - The audio blob to upload
 * @param prefix - Optional prefix for the S3 key (folder path)
 * @returns The S3 key of the uploaded file
 */
export const uploadAudioToS3 = async (
  audioBlob: Blob,
  prefix: string = 'audio/'
): Promise<string> => {
  try {
    // Generate a unique filename
    const filename = `${prefix}${uuid()}.mp3`
    
    // Create the upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: await audioBlob.arrayBuffer(),
      ContentType: 'audio/mpeg'
    })
    
    // Upload the file to S3
    await s3Client.send(uploadCommand)
    
    console.log(`Audio uploaded successfully to S3: ${filename}`)
    return filename
  } catch (error) {
    console.error('Error uploading audio to S3:', error)
    throw error
  }
}

/**
 * Generates a presigned URL for accessing an S3 object
 * @param key - The S3 key (filename) of the object
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns A presigned URL for accessing the object
 */
export const getAudioUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })
    
    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw error
  }
}

/**
 * Deletes an audio file from S3
 * @param key - The S3 key (filename) of the object to delete
 */
export const deleteAudioFromS3 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    })
    
    await s3Client.send(command)
    console.log(`Audio deleted from S3: ${key}`)
  } catch (error) {
    console.error('Error deleting audio from S3:', error)
    throw error
  }
}
