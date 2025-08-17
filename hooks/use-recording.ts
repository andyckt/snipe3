"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { preloadAudio, playAudio } from "@/lib/audio"

interface RecordingOptions {
  totalRecordings?: number
  audioLanguage?: "english" | "chinese"
  mode?: "question" | "conversation" // New option to specify the mode
}

export function useRecording(streamRef: React.RefObject<MediaStream | null>, options: RecordingOptions = {}) {
  const { totalRecordings = 1, audioLanguage = "english", mode = "question" } = options
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const startAudioRef = useRef<HTMLAudioElement | null>(null)
  const isFirstRecordingRef = useRef(true) // Track if this is the first recording in the session
  
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
    a.download = `camera-recording-${currentRecordingIndex + 1}.${fileExtension}`
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
      isFirstRecordingRef.current = true // Reset first recording flag
    }
    
    // Run countdown unless skipped
    if (!skipCountdown) {
      await runCountdown()
    }

    // Play starter audio if this is the first recording of the session and we're in question mode
    if (isFirstRecordingRef.current && mode === "question") {
      playAudio(getAudioPath()).catch(err => {
        console.error('Failed to play starter audio:', err)
      })
      isFirstRecordingRef.current = false // Mark that we've played the audio
    } else {
      // In conversation mode or not first recording, just mark as played without audio
      isFirstRecordingRef.current = false
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
    } catch (err) {
      console.error("MediaRecorder error:", err)
      alert("Failed to start recording. Please try again. Error: " + (err as Error).message)
    }
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
    startRecording,
    stopRecording,
    nextRecording,
    completeSession
  }
}
