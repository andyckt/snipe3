"use client"

/**
 * Browser-compatible ElevenLabs API client using the Fetch API
 * Based on the ElevenLabs API documentation
 */

// Initialize the ElevenLabs client with the API key from environment variables
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
const API_BASE_URL = 'https://api.elevenlabs.io/v1';

// Default voice ID - Rachel voice
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

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
 * @param voiceId - Optional voice ID to override the default
 * @returns Promise with the audio blob
 */
export const textToSpeech = async (
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<Blob> => {
  try {
    const url = `${API_BASE_URL}/text-to-speech/${voiceId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: VOICE_SETTINGS,
      }),
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
 * Converts text to speech and returns an audio URL
 * @param text - The text to convert to speech
 * @returns Promise with the audio URL
 */
export const textToSpeechUrl = async (
  text: string
): Promise<string> => {
  try {
    const audioBlob = await textToSpeech(text);
    const url = URL.createObjectURL(audioBlob);
    return url;
  } catch (error) {
    console.error('Error converting text to speech URL:', error);
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
