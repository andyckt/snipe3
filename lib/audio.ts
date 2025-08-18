"use client"

// Audio cache to prevent reloading audio files
const audioCache: Record<string, HTMLAudioElement> = {}

/**
 * Preloads an audio file for faster playback
 * @param src Path to the audio file
 * @returns The audio element
 */
export function preloadAudio(src: string): HTMLAudioElement {
  if (!audioCache[src]) {
    const audio = new Audio(src)
    audio.load()
    audioCache[src] = audio
  }
  return audioCache[src]
}

// Create a single AudioContext for the entire application
// We'll initialize it on first user interaction
let audioContext: AudioContext | null = null;

// Flag to track if we've unlocked audio on mobile
let audioUnlocked = false;

/**
 * Unlocks audio on mobile devices - must be called in response to a user gesture
 */
export function unlockAudio(): void {
  if (audioUnlocked) return;
  
  // Create AudioContext if it doesn't exist
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  
  // Resume the audio context if it's suspended
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed successfully');
      audioUnlocked = true;
    }).catch(err => {
      console.error('Failed to resume AudioContext:', err);
    });
  }
  
  // Also try to unlock using empty sound (works on some older browsers)
  const silentSound = new Audio();
  silentSound.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
  
  // Play and immediately stop the silent sound
  const promise = silentSound.play();
  if (promise !== undefined) {
    promise.then(() => {
      silentSound.pause();
      silentSound.currentTime = 0;
      audioUnlocked = true;
      console.log('Audio unlocked via silent sound');
    }).catch(err => {
      console.error('Silent sound failed to play:', err);
    });
  }
}

/**
 * Plays an audio file
 * @param src Path to the audio file
 * @param volume Volume level (0.0 to 1.0)
 * @returns Promise that resolves when audio playback ends
 */
export function playAudio(src: string, volume = 1.0): Promise<void> {
  let audio: HTMLAudioElement
  
  if (audioCache[src]) {
    audio = audioCache[src]
  } else {
    audio = new Audio(src)
    audioCache[src] = audio
  }
  
  // Reset audio to beginning
  audio.currentTime = 0
  audio.volume = volume
  
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve()
    audio.onerror = (e) => reject(e)
    
    // Try to play the audio
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Audio playback failed:", error)
        
        // If we haven't unlocked audio yet, try to unlock it
        if (!audioUnlocked) {
          console.warn("Attempting to unlock audio...")
          unlockAudio()
        }
        
        // Resolve anyway to prevent hanging promises
        resolve()
      })
    }
  })
}

/**
 * Stops an audio file that's currently playing
 * @param src Path to the audio file
 */
export function stopAudio(src: string): void {
  if (audioCache[src]) {
    const audio = audioCache[src]
    audio.pause()
    audio.currentTime = 0
  }
}
