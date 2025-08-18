"use client"

/**
 * Mobile-friendly audio playback utilities using Web Audio API
 * This implementation specifically addresses mobile browser autoplay restrictions
 */

// Create a single AudioContext for the entire application
let audioContext: AudioContext | null = null;
let isAudioContextInitialized = false;

// Cache for audio buffers
const audioBufferCache: Record<string, AudioBuffer> = {};

/**
 * Initialize the audio context - must be called in response to a user gesture
 */
export function initAudioContext(): boolean {
  if (isAudioContextInitialized) return true;
  
  try {
    // Create AudioContext if it doesn't exist
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
        console.log('AudioContext created');
      } else {
        console.error('Web Audio API not supported');
        return false;
      }
    }
    
    // Resume the audio context if it's suspended
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
      console.log('AudioContext resumed');
    }
    
    // Play a silent sound to unlock audio on iOS
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    isAudioContextInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to initialize AudioContext:', err);
    return false;
  }
}

/**
 * Fetch audio data and decode it into an AudioBuffer
 */
async function fetchAudio(url: string): Promise<AudioBuffer> {
  // Check cache first
  if (audioBufferCache[url]) {
    return audioBufferCache[url];
  }
  
  // Initialize audio context if needed
  if (!audioContext) {
    if (!initAudioContext()) {
      throw new Error('Failed to initialize AudioContext');
    }
  }
  
  try {
    // Fetch the audio file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get the audio data as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
    
    // Cache the decoded audio
    audioBufferCache[url] = audioBuffer;
    
    return audioBuffer;
  } catch (err) {
    console.error('Error fetching or decoding audio:', err);
    throw err;
  }
}

/**
 * Play audio from a URL using Web Audio API (mobile-friendly)
 */
export async function playMobileAudio(url: string): Promise<void> {
  // Make sure audio context is initialized
  if (!audioContext) {
    if (!initAudioContext()) {
      console.error('Failed to initialize audio context');
      return;
    }
  }
  
  try {
    // Make sure the audio context is running
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Fetch and decode the audio
    const audioBuffer = await fetchAudio(url);
    
    // Create a source node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to destination (speakers)
    source.connect(audioContext.destination);
    
    // Play the audio
    source.start(0);
    
    // Return a promise that resolves when the audio finishes playing
    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  } catch (err) {
    console.error('Error playing audio:', err);
    return Promise.resolve(); // Resolve anyway to prevent hanging promises
  }
}

/**
 * Preload audio for faster playback
 */
export async function preloadMobileAudio(url: string): Promise<void> {
  try {
    // Initialize audio context if needed
    if (!audioContext) {
      if (!initAudioContext()) {
        return;
      }
    }
    
    // Just fetch and cache the audio
    await fetchAudio(url);
  } catch (err) {
    console.error('Error preloading audio:', err);
  }
}
