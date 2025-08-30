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
 * Detect device type and browser for better compatibility handling
 */
export function detectDevice() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isHuawei = /HUAWEI|Honor/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || isHuawei || /Mobile|Tablet/.test(ua);
  
  return {
    isIOS,
    isHuawei,
    isAndroid,
    isMobile
  };
}

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
        try {
          // Try with default settings first
          audioContext = new AudioContextClass();
          console.log('AudioContext created');
        } catch (err) {
          console.error('Failed to create AudioContext with default settings:', err);
          
          // Try with lower sample rate for better compatibility
          try {
            audioContext = new AudioContextClass({ sampleRate: 44100 });
            console.log('AudioContext created with 44.1kHz sample rate');
          } catch (fallbackErr) {
            console.error('Failed to create AudioContext with fallback settings:', fallbackErr);
            return false;
          }
        }
      } else {
        console.error('Web Audio API not supported');
        return false;
      }
    }
    
    // Resume the audio context if it's suspended
    if (audioContext && audioContext.state === 'suspended') {
      try {
        audioContext.resume();
        console.log('AudioContext resumed');
      } catch (resumeErr) {
        console.error('Failed to resume AudioContext:', resumeErr);
      }
    }
    
    // Play a silent sound to unlock audio on mobile devices
    try {
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (silentSoundErr) {
      console.error('Failed to play silent sound:', silentSoundErr);
      // Continue anyway, as this is just an extra unlock step
    }
    
    // Also try the HTML5 Audio approach for broader compatibility
    try {
      const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
      silentSound.play().catch(err => console.error("Failed to play silent sound:", err));
    } catch (audioErr) {
      console.error('Failed to play HTML5 Audio silent sound:', audioErr);
      // Continue anyway, as this is just an extra unlock step
    }
    
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
    
    // Detect device for special handling
    const device = detectDevice();
    
    try {
      // Decode the audio data
      const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
      
      // Cache the decoded audio
      audioBufferCache[url] = audioBuffer;
      
      return audioBuffer;
    } catch (decodeErr) {
      console.error('Error decoding audio data:', decodeErr);
      
      // Special handling for Huawei devices
      if (device.isHuawei) {
        console.log('Attempting alternative decoding method for Huawei device');
        
        // Try with a promise wrapper (some browsers need this)
        return new Promise((resolve, reject) => {
          try {
            audioContext!.decodeAudioData(
              arrayBuffer,
              (buffer) => {
                audioBufferCache[url] = buffer;
                resolve(buffer);
              },
              (err) => {
                console.error('Alternative decoding failed:', err);
                reject(err);
              }
            );
          } catch (alternativeErr) {
            console.error('Alternative decoding threw error:', alternativeErr);
            reject(alternativeErr);
          }
        });
      }
      
      throw decodeErr;
    }
  } catch (err) {
    console.error('Error fetching or decoding audio:', err);
    throw err;
  }
}

/**
 * Play audio from a URL using Web Audio API (mobile-friendly)
 * @param url The URL of the audio to play
 * @param volumeBoost Optional volume boost factor (1.0 = normal, >1.0 = louder)
 */
export async function playMobileAudio(url: string, volumeBoost: number = 1.0): Promise<void> {
  // Detect device for special handling
  const device = detectDevice();
  
  // Make sure audio context is initialized
  if (!audioContext) {
    if (!initAudioContext()) {
      console.error('Failed to initialize audio context');
      
      // Fallback to HTML5 Audio API for devices that don't support Web Audio API well
      if (device.isHuawei || device.isAndroid) {
        console.log('Attempting fallback to HTML5 Audio API');
        return playFallbackAudio(url);
      }
      return;
    }
  }
  
  try {
    // Ensure audioContext is not null (we've already checked above, but this is for TypeScript)
    if (!audioContext) {
      throw new Error('AudioContext is null');
    }
    
    // Make sure the audio context is running
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (resumeErr) {
        console.error('Failed to resume AudioContext:', resumeErr);
        
        // Fallback if resume fails
        if (device.isHuawei || device.isAndroid) {
          return playFallbackAudio(url);
        }
      }
    }
    
    try {
      // Fetch and decode the audio
      const audioBuffer = await fetchAudio(url);
      
      // Create a source node
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create a gain node for volume control
      const gainNode = audioContext.createGain();
      
      // Set gain value (volume)
      // During recording, mobile devices often reduce volume, so we boost it
      // Default is 1.0, higher values increase volume
      gainNode.gain.value = volumeBoost;
      
      // Connect source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play the audio
      source.start(0);
      
      // Return a promise that resolves when the audio finishes playing
      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (playErr) {
      console.error('Error playing audio with Web Audio API:', playErr);
      
      // Fallback to HTML5 Audio if Web Audio API fails
      if (device.isHuawei || device.isAndroid) {
        return playFallbackAudio(url);
      }
      
      return Promise.resolve(); // Resolve anyway to prevent hanging promises
    }
  } catch (err) {
    console.error('Error in playMobileAudio:', err);
    
    // Final fallback
    if (device.isHuawei || device.isAndroid) {
      return playFallbackAudio(url);
    }
    
    return Promise.resolve(); // Resolve anyway to prevent hanging promises
  }
}

/**
 * Fallback audio player using HTML5 Audio API
 * This is used when Web Audio API fails or is not supported well
 */
function playFallbackAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(url);
      
      // Set up event handlers
      audio.onended = () => resolve();
      audio.onerror = (err) => {
        console.error('HTML5 Audio playback error:', err);
        resolve(); // Resolve anyway to prevent hanging promises
      };
      
      // Try to play
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('HTML5 Audio play() rejected:', err);
          resolve(); // Resolve anyway to prevent hanging promises
        });
      }
    } catch (err) {
      console.error('Failed to create HTML5 Audio element:', err);
      resolve(); // Resolve anyway to prevent hanging promises
    }
  });
}

/**
 * Preload audio for faster playback
 */
export async function preloadMobileAudio(url: string): Promise<void> {
  const device = detectDevice();
  
  try {
    // Initialize audio context if needed
    if (!audioContext) {
      if (!initAudioContext()) {
        console.error('Failed to initialize audio context for preloading');
        
        // For Huawei devices, try preloading with HTML5 Audio as fallback
        if (device.isHuawei || device.isAndroid) {
          preloadFallbackAudio(url);
        }
        return;
      }
    }
    
    try {
      // Just fetch and cache the audio
      await fetchAudio(url);
    } catch (fetchErr) {
      console.error('Error preloading audio with Web Audio API:', fetchErr);
      
      // Fallback for Huawei devices
      if (device.isHuawei || device.isAndroid) {
        preloadFallbackAudio(url);
      }
    }
  } catch (err) {
    console.error('Error in preloadMobileAudio:', err);
    
    // Final fallback
    if (device.isHuawei || device.isAndroid) {
      preloadFallbackAudio(url);
    }
  }
}

/**
 * Fallback preload using HTML5 Audio
 */
function preloadFallbackAudio(url: string): void {
  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    
    // Just trigger loading without playing
    audio.load();
    
    console.log('Preloaded audio using HTML5 Audio fallback:', url);
  } catch (err) {
    console.error('Failed to preload audio with HTML5 Audio:', err);
  }
}
