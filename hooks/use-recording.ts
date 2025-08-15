"use client"

import type React from "react"

import { useRef, useState } from "react"

export function useRecording(streamRef: React.RefObject<MediaStream | null>) {
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

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType
        const fileExtension = mimeType.includes("mp4") ? "mp4" : "webm"

        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })

        try {
          // Create a File object from the blob
          const file = new File([blob], `camera-recording.${fileExtension}`, { type: mimeType })
          
          // Create FormData and append the file
          const formData = new FormData()
          formData.append('file', file)
          
          // Upload the file to our API endpoint
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          const result = await response.json()
          
          if (result.success) {
            console.log('Video uploaded successfully:', result.fileUrl)
          } else {
            console.error('Error uploading video:', result.error)
            alert('Failed to save the recording. Please try again.')
          }
        } catch (error) {
          console.error('Error uploading video:', error)
          alert('Failed to save the recording. Please try again.')
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
