"use client"

/**
 * Question mode recording hook
 * Derived from the original use-recording.ts file
 * Specialized for question mode with audio prompts
 */

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { preloadAudio, playAudio } from "@/lib/audio"
import { initAudioContext, playMobileAudio, preloadMobileAudio } from "@/lib/mobile-audio"
import { TextInput, TimeLimit } from "@/components/question-tab"

interface RecordingOptions {
  totalRecordings?: number
  audioLanguage?: "english" | "mandarin"
  textInputs?: TextInput[] // Add textInputs to options
  timeLimit?: TimeLimit // Add time limit option
}

export function useQuestionRecording(streamRef: React.RefObject<MediaStream | null>, options: RecordingOptions = {}) {
  const { totalRecordings = 1, audioLanguage = "english", textInputs = [], timeLimit = "no_limit" } = options
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const startAudioRef = useRef<HTMLAudioElement | null>(null)
  const isFirstRecordingRef = useRef(true) // Track if this is the first recording in the session
  const textInputsRef = useRef<TextInput[]>(textInputs) // Store the text inputs for access during recording
  
  // Get the audio file path based on language
  const getAudioPath = () => {
    return audioLanguage === "english" 
      ? '/audio/englishstarter.mp3' 
      : '/audio/mandarinstarter.mp3'
  }
  
  // Preload the starter audio
  useEffect(() => {
    // Initialize audio context
    initAudioContext();
    
    // Preload the audio using both methods for compatibility
    startAudioRef.current = preloadAudio(getAudioPath());
    preloadMobileAudio(getAudioPath()).catch(err => console.error("Error preloading mobile audio:", err));
  }, [audioLanguage])
  
  // Update textInputsRef when textInputs change
  useEffect(() => {
    textInputsRef.current = textInputs
  }, [textInputs])

  const runCountdown = async () => {
    setIsCountingDown(true)
    for (let i = 3; i >= 1; i--) {
      setCountdown(i)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    setCountdown(null)
    setIsCountingDown(false)
  }

  const downloadRecording = () => {
    if (recordedChunksRef.current.length === 0) return

    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder) return

    const mimeType = mediaRecorder.mimeType
    const fileExtension = mimeType.includes("mp4") ? "mp4" : "webm"
    
    // Create a blob from the recorded chunks
    const blob = new Blob(recordedChunksRef.current, { type: mimeType })
    
    // Create a download link for the recorded video
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = `question-recording-${currentRecordingIndex + 1}.${fileExtension}`
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 100)
    
    // Clear chunks for next recording
    recordedChunksRef.current = []
  }

  // Helper function to play the appropriate audio for a specific recording index
  const playAudioForRecording = async (recordingIndex: number) => {
    try {
      // Make sure audio context is initialized
      initAudioContext();
      
      if (recordingIndex === 0 && isFirstRecordingRef.current) {
        // For the first recording, play starter audio followed by the first text input audio
        console.log("Playing starter audio...");
        
        // First play the starter audio using mobile-friendly method with volume boost
        try {
          // Apply a volume boost of 8.0 to compensate for the automatic volume reduction during recording
          await playMobileAudio(getAudioPath(), 8.0);
          console.log("Starter audio played successfully with volume boost");
        } catch (error) {
          console.error("Mobile audio playback failed, falling back to standard method:", error);
          // Fallback to standard method with maximum volume
          await playAudio(getAudioPath(), 1.0);
        }
        
        // Then play the first generated audio if available
        if (textInputsRef.current.length > 0 && 
            textInputsRef.current[0].audioUrl && 
            textInputsRef.current[0].audioKey) {
          
          // Get a fresh presigned URL if we have the key (in case the old one expired)
          let urlToPlay = textInputsRef.current[0].audioUrl;
          try {
            // Import the getPresignedUrl function
            const { getPresignedUrl } = await import('@/lib/api-service');
            urlToPlay = await getPresignedUrl(textInputsRef.current[0].audioKey!);
            console.log("Got fresh presigned URL for first audio");
          } catch (err) {
            console.log("Using existing URL for first audio");
          }
          
          console.log("Playing first generated audio...");
          
          // Play the first generated audio immediately after starter audio with volume boost
          try {
            // Apply a volume boost of 8.0 to compensate for the automatic volume reduction during recording
            await playMobileAudio(urlToPlay, 8.0);
            console.log("First generated audio played successfully with volume boost");
          } catch (error) {
            console.error("Mobile audio playback failed, falling back to standard method:", error);
            // Fallback to standard method with maximum volume
            await playAudio(urlToPlay, 1.0);
          }
        }
        
        isFirstRecordingRef.current = false; // Mark that we've played the starter audio
      } else {
        // For subsequent recordings, play the corresponding text input audio
        if (textInputsRef.current.length > recordingIndex && 
            textInputsRef.current[recordingIndex].audioUrl && 
            textInputsRef.current[recordingIndex].audioKey) {
          
          // Get a fresh presigned URL if we have the key (in case the old one expired)
          let urlToPlay = textInputsRef.current[recordingIndex].audioUrl;
          try {
            // Import the getPresignedUrl function
            const { getPresignedUrl } = await import('@/lib/api-service');
            urlToPlay = await getPresignedUrl(textInputsRef.current[recordingIndex].audioKey!);
            console.log(`Got fresh presigned URL for recording ${recordingIndex + 1} audio`);
          } catch (err) {
            console.log(`Using existing URL for recording ${recordingIndex + 1} audio`);
          }
          
          console.log(`Playing recording ${recordingIndex + 1} audio...`);
          
          // Play the audio for this recording using mobile-friendly method with volume boost
          try {
            // Apply a volume boost of 8.0 to compensate for the automatic volume reduction during recording
            await playMobileAudio(urlToPlay, 8.0);
            console.log(`Recording ${recordingIndex + 1} audio played successfully with volume boost`);
          } catch (error) {
            console.error("Mobile audio playback failed, falling back to standard method:", error);
            // Fallback to standard method with maximum volume
            await playAudio(urlToPlay, 1.0);
          }
        }
      }
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  }
  
  // Start recording with a specific index (used by nextRecording)
  const startRecordingWithIndex = async (recordingIndex: number, skipCountdown = false) => {
    // Run countdown unless skipped
    if (!skipCountdown) {
      await runCountdown()
    }

    // Setup media recorder first - this starts the recording
    try {
      let mimeType = "video/webm"

      // Try to find a supported MIME type
      if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4"
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9"
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8"
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm"
      }

      if (!streamRef.current) {
        throw new Error("No stream available")
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      // MediaRecorder event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        downloadRecording()
        setIsRecording(false)
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data in 1-second chunks
      setIsRecording(true)

      // After recording has started, play the appropriate audio for the specified index
      await playAudioForRecording(recordingIndex)
      
      // Get the current question's time limit if available
      const currentQuestionTimeLimit = textInputsRef.current[recordingIndex]?.timeLimit || timeLimit || "no_limit";
      
      // Handle time limit if enabled
      if (currentQuestionTimeLimit !== "no_limit") {
        // Calculate time in seconds based on the selected time limit
        let timeInSeconds = 60; // Default to 1 minute
        
        if (currentQuestionTimeLimit === "30_seconds") {
          timeInSeconds = 30;
        } else if (currentQuestionTimeLimit === "1_minute") {
          timeInSeconds = 60;
        } else if (currentQuestionTimeLimit === "2_minutes") {
          timeInSeconds = 120;
        } else if (currentQuestionTimeLimit === "3_minutes") {
          timeInSeconds = 180;
        } else if (currentQuestionTimeLimit === "5_minutes") {
          timeInSeconds = 300;
        }
        
        // Set initial time left
        setRecordingTimeLeft(timeInSeconds);
        
        // Clear any existing timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        
        // Start countdown timer with slightly longer interval (1050ms instead of 1000ms)
        // to compensate for the timer running slightly fast
        recordingTimerRef.current = setInterval(() => {
          setRecordingTimeLeft(prev => {
            if (prev === null || prev <= 1) {
              // Time's up - stop the recording and clear the interval
              if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
              }
              
              // Automatically move to the next recording
              nextRecording();
              return null;
            }
            return prev - 1;
          });
        }, 1050); // Increased from 1000ms to 1050ms to slow down the timer slightly
      }
      
    } catch (err) {
      console.error("MediaRecorder error:", err)
      alert("Failed to start recording. Please try again. Error: " + (err as Error).message)
    }
  }
  
  const startRecording = async (skipCountdown = false) => {
    // Reset if starting a new session
    if (isSessionComplete) {
      setCurrentRecordingIndex(0)
      setIsSessionComplete(false)
      isFirstRecordingRef.current = true // Reset first recording flag
    }
    
    // Use the current recording index
    await startRecordingWithIndex(currentRecordingIndex, skipCountdown)
  }

  const stopRecording = () => {
    // Clear the recording timer if it exists
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
      setRecordingTimeLeft(null)
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }
  
  const nextRecording = async () => {
    // Stop the current recording
    stopRecording()
    
    // Move to the next recording index
    const nextIndex = currentRecordingIndex + 1
    
    // Update the current recording index state
    setCurrentRecordingIndex(nextIndex)
    
    // Check if we've reached the end of the session
    if (nextIndex >= totalRecordings) {
      setIsSessionComplete(true)
    } else {
      // Start the next recording with a small delay to ensure the previous one is processed
      setTimeout(() => {
        startRecordingWithIndex(nextIndex, false) // Start with countdown and specify index
      }, 500)
    }
  }
  
  const completeSession = () => {
    stopRecording()
    setIsSessionComplete(true)
  }

  return {
    isRecording,
    isCountingDown,
    countdown,
    currentRecordingIndex,
    totalRecordings,
    isLastRecording: currentRecordingIndex === totalRecordings - 1,
    isSessionComplete,
    recordingTimeLeft,
    startRecording,
    stopRecording,
    nextRecording,
    completeSession
  }
}
