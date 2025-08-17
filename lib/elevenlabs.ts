"use client"

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { v4 as uuid } from 'uuid';

// Initialize the ElevenLabs client with the API key from environment variables
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';

// Validate that the API key is available
if (!ELEVENLABS_API_KEY) {
  console.warn('ElevenLabs API key is not set. Please add NEXT_PUBLIC_ELEVENLABS_API_KEY to your .env file.');
}

// Voice settings based on the documentation recommendations
const VOICE_SETTINGS = {
  stability: 77,
  similarityBoost: 60,
  style: 43,
  useSpeakerBoost: true,
  speed: 0.86,
};

// Default voice ID - Rachel voice
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

/**
 * Creates an instance of the ElevenLabs client
 * @returns ElevenLabsClient instance
 */
export const createElevenLabsClient = () => {
  return new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
  });
};

/**
 * Converts text to speech using ElevenLabs API
 * @param text - The text to convert to speech
 * @param voiceId - Optional voice ID to override the default
 * @returns Promise with the audio data
 */
export const textToSpeech = async (
  text: string, 
  voiceId: string = DEFAULT_VOICE_ID
) => {
  try {
    const client = createElevenLabsClient();
    
    const audio = await client.textToSpeech.convert(voiceId, {
      modelId: 'eleven_multilingual_v2',
      text,
      outputFormat: 'mp3_44100_128',
      voiceSettings: VOICE_SETTINGS,
    });
    
    return audio;
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
    const audio = await textToSpeech(text);
    
    // Convert the audio to a blob URL that can be played in the browser
    const blob = await audio.blob();
    const url = URL.createObjectURL(blob);
    
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


