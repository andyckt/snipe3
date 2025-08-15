import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `recording-${Date.now()}.${file.name.split('.').pop()}`;
    
    // Ensure the recordings directory exists
    const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
    await mkdir(recordingsDir, { recursive: true });
    
    // Save the file
    const filePath = path.join(recordingsDir, fileName);
    await writeFile(filePath, buffer);
    
    // Return the public URL to the file
    const fileUrl = `/recordings/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      fileName,
      fileUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// Increase the body size limit for the API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
