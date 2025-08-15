"use client"

import type React from "react"

import { useRef, useState, useCallback } from "react"

interface UseRecordingProps {
  streamRef: React.RefObject<MediaStream | null>
  getTranscriptForExport?: () => string
}

export function useRecording({ streamRef, getTranscriptForExport }: UseRecordingProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const runCountdown = async () => {
    for (let i = 3; i >= 1; i--) {
      setCountdown(i)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    setCountdown(null)
  }

  const startRecording = async () => {
    // Start countdown
    await runCountdown()

    // Setup media recorder
    recordedChunksRef.current = []

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
        const mimeType = mediaRecorder.mimeType
        const fileExtension = mimeType.includes("mp4") ? "mp4" : "webm"

        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })

        // Create a download link for the recorded video
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `camera-recording.${fileExtension}`
        document.body.appendChild(a)
        a.click()

        // Clean up
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }, 100)
        
        // Export transcript if available
        if (getTranscriptForExport) {
          const transcript = getTranscriptForExport()
          if (transcript) {
            const transcriptBlob = new Blob([transcript], { type: 'text/plain' })
            const transcriptUrl = URL.createObjectURL(transcriptBlob)
            const transcriptLink = document.createElement('a')
            transcriptLink.style.display = 'none'
            transcriptLink.href = transcriptUrl
            transcriptLink.download = 'snipe-transcription.txt'
            document.body.appendChild(transcriptLink)
            transcriptLink.click()
            
            // Clean up transcript download
            setTimeout(() => {
              document.body.removeChild(transcriptLink)
              window.URL.revokeObjectURL(transcriptUrl)
            }, 100)
          }
        }

        // Reset UI
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

  return {
    isRecording,
    countdown,
    startRecording,
    stopRecording,
  }
}
