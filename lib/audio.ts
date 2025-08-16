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
    
    // Use catch to handle autoplay restrictions
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Audio playback failed:", error)
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
