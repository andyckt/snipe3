"use client"

/**
 * Browser-compatible ElevenLabs API client using the Fetch API
 * Based on the ElevenLabs API documentation
 */

import { uploadAudioToS3, getAudioUrl } from './s3-service'

// Initialize the ElevenLabs client with the API key from environment variables
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
const API_BASE_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs for different languages
const VOICE_IDS = {
  english: '56AoDkrOh6qfVPDXZ7Pt',  // English voice ID
  mandarin: '9lHjugDhwqoxA5MhX0az',  // Mandarin voice ID
};

// Default voice ID (fallback)
const DEFAULT_VOICE_ID = VOICE_IDS.english;

// Voice settings based on the documentation recommendations
// Values normalized to the proper ranges (0.0 to 1.0)
const VOICE_SETTINGS = {
  stability: 0.77,         // Original value: 77 (normalized to 0-1 range)
  similarity_boost: 0.60,  // Original value: 60 (normalized to 0-1 range)
  style: 0.43,             // Original value: 43 (normalized to 0-1 range)
  use_speaker_boost: true, // Boolean value, no change needed
  speed: 0.86,             // Already in the correct range
};

// Validate that the API key is available
if (!ELEVENLABS_API_KEY) {
  console.warn('ElevenLabs API key is not set. Please add NEXT_PUBLIC_ELEVENLABS_API_KEY to your .env file.');
}

/**
 * Converts text to speech using ElevenLabs API
 * @param text - The text to convert to speech
 * @param language - Optional language selection ('english' or 'mandarin')
 * @param voiceId - Optional voice ID to override the language-based selection
 * @returns Promise with the audio blob
 */
export const textToSpeech = async (
  text: string,
  language: 'english' | 'mandarin' = 'english',
  voiceId?: string
): Promise<Blob> => {
  // Determine which voice ID to use
  const selectedVoiceId = voiceId || VOICE_IDS[language] || DEFAULT_VOICE_ID;
  console.log(`Using voice ID: ${selectedVoiceId} for language: ${language}`);
  try {
    const url = `${API_BASE_URL}/text-to-speech/${selectedVoiceId}`;
    
    // Create the request body
    const requestBody = {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128', // Adding explicit output format as per documentation
      voice_settings: VOICE_SETTINGS,
    };
    
    // Log the voice settings being used
    console.log('Using voice settings:', JSON.stringify(VOICE_SETTINGS));
    console.log('- stability:', VOICE_SETTINGS.stability);
    console.log('- similarity_boost:', VOICE_SETTINGS.similarity_boost);
    console.log('- style:', VOICE_SETTINGS.style);
    console.log('- use_speaker_boost:', VOICE_SETTINGS.use_speaker_boost);
    console.log('- speed:', VOICE_SETTINGS.speed);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
};

/**
 * Converts text to speech, uploads to S3, and returns a presigned URL
 * @param text - The text to convert to speech
 * @param language - Optional language selection ('english' or 'mandarin')
 * @returns Promise with the S3 presigned URL and the S3 key
 */
export const textToSpeechUrl = async (
  text: string,
  language: 'english' | 'mandarin' = 'english'
): Promise<{ url: string, key: string }> => {
  try {
    // Convert text to speech
    const audioBlob = await textToSpeech(text, language);
    
    // Create a prefix based on language for better organization
    const prefix = `audio/${language}/`;
    
    // Upload to S3
    const s3Key = await uploadAudioToS3(audioBlob, prefix);
    
    // Generate a presigned URL
    const url = await getAudioUrl(s3Key);
    
    return { url, key: s3Key };
  } catch (error) {
    console.error('Error converting text to speech and uploading to S3:', error);
    throw error;
  }
};

/**
 * Plays the audio from the provided URL
 * @param audioUrl - The URL of the audio to play
 */
export const playAudio = (audioUrl: string): void => {
  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
  });
};


