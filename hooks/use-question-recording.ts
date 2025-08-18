"use client"

/**
 * Question mode recording hook
 * Derived from the original use-recording.ts file
 * Specialized for question mode with audio prompts
 */

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { preloadAudio, playAudio } from "@/lib/audio"
import { TextInput } from "@/components/question-tab"

interface RecordingOptions {
  totalRecordings?: number
  audioLanguage?: "english" | "mandarin"
  textInputs?: TextInput[] // Add textInputs to options
}

export function useQuestionRecording(streamRef: React.RefObject<MediaStream | null>, options: RecordingOptions = {}) {
  const { totalRecordings = 1, audioLanguage = "english", textInputs = [] } = options
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
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
    startAudioRef.current = preloadAudio(getAudioPath())
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
      if (recordingIndex === 0 && isFirstRecordingRef.current) {
        // For the first recording, play starter audio followed by the first text input audio
        // First play the starter audio
        await playAudio(getAudioPath())
        
        // Then play the first generated audio if available
        if (textInputsRef.current.length > 0 && 
            textInputsRef.current[0].audioUrl && 
            textInputsRef.current[0].audioKey) {
          
          // Get a fresh presigned URL if we have the key (in case the old one expired)
          let urlToPlay = textInputsRef.current[0].audioUrl
          try {
            // Import the getPresignedUrl function
            const { getPresignedUrl } = await import('@/lib/api-service')
            urlToPlay = await getPresignedUrl(textInputsRef.current[0].audioKey!)
          } catch (err) {
            // Use existing URL if we can't get a fresh one
          }
          
          // Play the first generated audio immediately after starter audio
          await playAudio(urlToPlay)
        }
        
        isFirstRecordingRef.current = false // Mark that we've played the starter audio
      } else {
        // For subsequent recordings, play the corresponding text input audio
        if (textInputsRef.current.length > recordingIndex && 
            textInputsRef.current[recordingIndex].audioUrl && 
            textInputsRef.current[recordingIndex].audioKey) {
          
          // Get a fresh presigned URL if we have the key (in case the old one expired)
          let urlToPlay = textInputsRef.current[recordingIndex].audioUrl
          try {
            // Import the getPresignedUrl function
            const { getPresignedUrl } = await import('@/lib/api-service')
            urlToPlay = await getPresignedUrl(textInputsRef.current[recordingIndex].audioKey!)
          } catch (err) {
            // Use existing URL if we can't get a fresh one
          }
          
          // Play the audio for this recording
          await playAudio(urlToPlay)
        }
      }
    } catch (err) {
      console.error('Failed to play audio:', err)
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
    startRecording,
    stopRecording,
    nextRecording,
    completeSession
  }
}
