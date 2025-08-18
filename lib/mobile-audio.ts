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
 * Check if the device is mobile
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Play audio from a URL using Web Audio API (mobile-friendly)
 * @param url - The URL of the audio to play
 * @param volumeMultiplier - Volume multiplier (1.0 is normal, higher values increase volume)
 */
export async function playMobileAudio(url: string, volumeMultiplier: number = 20.0): Promise<void> {
  // Adjust volume based on device type
  // Use high volume for mobile, normal volume for desktop
  const effectiveVolume = isMobileDevice() ? volumeMultiplier : 1.0;
  console.log(`Device detected as ${isMobileDevice() ? 'mobile' : 'desktop'}, using volume: ${effectiveVolume}x`);
  // Make sure audio context is initialized
  if (!audioContext) {
    if (!initAudioContext()) {
      console.error('Failed to initialize audio context');
      return;
    }
  }
  
  try {
    // Make sure we have a valid audio context
    if (!audioContext) {
      throw new Error('Audio context is null');
    }
    
    // Make sure the audio context is running
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Fetch and decode the audio
    const audioBuffer = await fetchAudio(url);
    
    // Create a source node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create a gain node to increase the volume
    const gainNode = audioContext.createGain();
    
    // Create a compressor node to make the audio louder without distortion
    const compressor = audioContext.createDynamicsCompressor();
    
    // Configure the compressor based on device type
    if (isMobileDevice()) {
      // Mobile device: Configure for maximum loudness
      // These settings will make the audio as loud as possible while minimizing distortion
      compressor.threshold.value = -50;  // Start compressing at a very low threshold
      compressor.knee.value = 40;        // Smooth compression curve
      compressor.ratio.value = 12;       // Heavy compression
      compressor.attack.value = 0;       // Immediate attack
      compressor.release.value = 0.25;   // Quick release
    } else {
      // Desktop device: Use gentler compression settings
      compressor.threshold.value = -24;  // Higher threshold for less compression
      compressor.knee.value = 30;        // Smoother knee for natural sound
      compressor.ratio.value = 4;        // Lighter compression
      compressor.attack.value = 0.003;   // Slight attack for more natural sound
      compressor.release.value = 0.25;   // Standard release
    }
    
    // Set the gain value to amplify the audio (be careful with very high values)
    // Values above 1.0 will amplify the sound
    gainNode.gain.value = effectiveVolume;
    console.log(`Setting audio gain to ${effectiveVolume}x with compression`);
    
    // Connect the source to the compressor, then to the gain node, then to the destination
    source.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Calculate audio duration in seconds
    const audioDuration = audioBuffer.duration;
    console.log(`Audio duration: ${audioDuration.toFixed(2)} seconds`);
    
    // Play the audio
    source.start(0);
    
    // Return a promise that resolves when the audio finishes playing
    // Use both the onended event AND a timeout as backup
    return new Promise((resolve) => {
      // Set up the onended event handler
      source.onended = () => {
        console.log('Audio ended event fired');
        resolve();
      };
      
      // Set up a timeout as a backup in case onended doesn't fire properly
      // Add a minimal buffer (20ms) to ensure complete playback without excessive delay
      const timeoutMs = (audioDuration * 1000) + 20;
      setTimeout(() => {
        console.log(`Audio timeout after ${timeoutMs.toFixed(0)}ms`);
        resolve();
      }, timeoutMs);
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
