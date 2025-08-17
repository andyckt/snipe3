import { NextResponse } from 'next/server';
import { checkTextToSpeechRateLimit } from '@/lib/rate-limiter';

// Voice IDs for different languages
const VOICE_IDS = {
  english: '56AoDkrOh6qfVPDXZ7Pt',  // English voice ID
  mandarin: '9lHjugDhwqoxA5MhX0az',  // Mandarin voice ID
};

// Default voice ID (fallback)
const DEFAULT_VOICE_ID = VOICE_IDS.english;

// Voice settings based on the documentation recommendations
const VOICE_SETTINGS = {
  stability: 0.77,
  similarityBoost: 0.60,
  style: 0.43,
  useSpeakerBoost: true,
  speed: 0.86,
};

/**
 * POST handler for text-to-speech conversion
 * Expects JSON body with: { text: string, language: 'english' | 'mandarin' }
 */
export async function POST(request: Request) {
  try {
    // Check rate limit
    const isAllowed = await checkTextToSpeechRateLimit();
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { text, language = 'english' } = body;
    
    // Validate inputs
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (language !== 'english' && language !== 'mandarin') {
      return NextResponse.json(
        { error: 'Language must be either "english" or "mandarin"' },
        { status: 400 }
      );
    }
    
    // Get the appropriate voice ID
    const voiceId = VOICE_IDS[language as keyof typeof VOICE_IDS] || DEFAULT_VOICE_ID;
    
    // We'll use direct fetch API instead of the SDK
    // This gives us better control over the response handling
    
    // Instead of using the SDK, let's make a direct API call for better control
    // This avoids issues with the SDK's handling of audio data
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.77,
          similarity_boost: 0.60,
          style: 0.43,
          use_speaker_boost: true,
          speed: 0.86,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }
    
    // Get the audio data as an ArrayBuffer
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert to Buffer for Next.js API response
    const audioBuffer = Buffer.from(audioArrayBuffer);
    
    // Return the audio data with appropriate headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
    
  } catch (error: any) {
    console.error('Error in text-to-speech API:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred during text-to-speech conversion' },
      { status: 500 }
    );
  }
}
