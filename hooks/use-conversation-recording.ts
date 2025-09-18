"use client"

/**
 * Conversation mode recording hook
 * Derived from the original use-recording.ts file
 * Specialized for conversation mode without audio prompts
 */

import type React from "react"

import { useRef, useState } from "react"
import { TimeLimit } from "@/components/question-tab"

interface RecordingOptions {
  totalRecordings?: number
  audioLanguage?: "english" | "mandarin"
  timeLimit?: TimeLimit
}

export function useConversationRecording(streamRef: React.RefObject<MediaStream | null>, options: RecordingOptions = {}) {
  const { totalRecordings = 1, timeLimit = "no_limit" } = options
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
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
    a.download = `conversation-recording-${currentRecordingIndex + 1}.${fileExtension}`
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

  const startRecording = async (skipCountdown = false) => {
    // Reset if starting a new session
    if (isSessionComplete) {
      setCurrentRecordingIndex(0)
      setIsSessionComplete(false)
    }
    
    // Run countdown unless skipped
    if (!skipCountdown) {
      await runCountdown()
    }

    // Setup media recorder
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

      console.log("Using MIME type:", mimeType)

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
      
      // Handle time limit if enabled
      if (timeLimit !== "no_limit") {
        // Calculate time in seconds based on the selected time limit
        let timeInSeconds = 60; // Default to 1 minute
        
        if (timeLimit === "30_seconds") {
          timeInSeconds = 30;
        } else if (timeLimit === "1_minute") {
          timeInSeconds = 60;
        } else if (timeLimit === "2_minutes") {
          timeInSeconds = 120;
        } else if (timeLimit === "3_minutes") {
          timeInSeconds = 180;
        } else if (timeLimit === "5_minutes") {
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
              
              // Force completion if this is the last recording
              if (currentRecordingIndex === totalRecordings - 1) {
                // This is the last recording (with "Done" button)
                console.log(`[DEBUG] Time limit reached on last recording (${currentRecordingIndex + 1}/${totalRecordings})`);
                console.log(`[DEBUG] Current state - isRecording: ${isRecording}, isCountingDown: ${isCountingDown}, isSessionComplete: ${isSessionComplete}`);
                
                // CRITICAL: Immediately set flags to prevent any further recordings
                console.log(`[DEBUG] Setting preventFurtherRecording flag IMMEDIATELY`);
                window._preventFurtherRecording = true;
                
                // CRITICAL FIX: Stop the recording FIRST and ensure it's processed
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                  console.log(`[DEBUG] Stopping MediaRecorder (current state: ${mediaRecorderRef.current.state})`);
                  
                  // Add event listener for the 'stop' event to ensure the recording is processed
                  mediaRecorderRef.current.addEventListener('stop', () => {
                    console.log(`[DEBUG] MediaRecorder STOP event fired - recording has been processed`);
                    
                    // Now that recording is processed, proceed with completion
                    forceCompletion();
                  });
                  
                  // Stop the recording
                  mediaRecorderRef.current.stop();
                } else {
                  console.log(`[DEBUG] MediaRecorder not active or not available - proceeding directly to completion`);
                  forceCompletion();
                }
                
                // Clear any timers
                if (recordingTimerRef.current) {
                  console.log(`[DEBUG] Clearing existing timer`);
                  clearInterval(recordingTimerRef.current);
                  recordingTimerRef.current = null;
                  setRecordingTimeLeft(null);
                }
                
                // Define the force completion function
                function forceCompletion() {
                  console.log(`[DEBUG] CRITICAL FIX: Executing forceCompletion`);
                  
                  // Add visual indicator
                  document.body.classList.add('recording-complete');
                  document.body.style.border = '5px solid red';
                  
                  // CRITICAL: Directly manipulate the DOM to show completion screen
                  const completedScreen = document.createElement('div');
                  completedScreen.className = 'flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center';
                  completedScreen.innerHTML = `
                    <div class="flex flex-col h-full w-full bg-white md:max-w-sm md:h-screen p-8 items-center justify-center text-center">
                      <h1 class="text-3xl font-bold mb-4">Thank You!</h1>
                      <p class="text-lg">
                        All ${totalRecordings} recordings have been completed and downloaded.
                      </p>
                    </div>
                  `;
                  
                  // Replace the entire app content
                  const appRoot = document.querySelector('#__next') || document.body;
                  console.log(`[DEBUG] Replacing app content with Thank You screen`);
                  appRoot.innerHTML = '';
                  appRoot.appendChild(completedScreen);
                  
                  // Mark completion in the DOM
                  document.body.setAttribute('data-recording-completed', 'true');
                  
                  // Also update React state (even though we've bypassed React rendering)
                  console.log(`[DEBUG] Setting isSessionComplete to true`);
                  setIsSessionComplete(true);
                }
              } else {
                // For non-last recordings, move to next
                console.log(`[DEBUG] Moving to next recording (${currentRecordingIndex + 1} → ${currentRecordingIndex + 2}/${totalRecordings})`);
                nextRecording();
              }
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
    setCurrentRecordingIndex(nextIndex)
    
    // Check if we've reached the end of the session
    if (nextIndex >= totalRecordings) {
      setIsSessionComplete(true)
    } else {
      // Start the next recording with a small delay to ensure the previous one is processed
      setTimeout(() => {
        startRecording(false) // Start with countdown
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
