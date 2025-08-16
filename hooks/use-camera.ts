"use client"

import { useEffect, useRef, useState } from "react"

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [showPermissionButton, setShowPermissionButton] = useState(true)

  // Check permissions on mount
  useEffect(() => {
    checkPermissions()
    
    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera()
    }
  }, [])

  const checkPermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName })
      if (result.state === "granted") {
        await setupCamera()
      }
    } catch (error) {
      console.log("Permissions API not supported, will request directly")
    }
  }

  const requestPermissions = async () => {
    try {
      await setupCamera()
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Camera access denied. Please enable permissions in your browser settings.")
    }
  }

  const stopCamera = () => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    // Reset UI state
    setHasPermission(false)
    setShowPermissionButton(true)
  }

  const setupCamera = async () => {
    try {
      // First stop any existing camera stream
      stopCamera()
      
      const constraints = {
        video: {
          facingMode: "user", // Front camera for selfies
        },
        audio: true,
      }

      // Detect iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

      // iOS Safari sometimes needs specific audio constraints
      if (isIOS) {
        console.log("Using iOS-specific constraints")
        constraints.audio = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as unknown as boolean
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error) {
        console.log("Could not get preferred constraints, trying with defaults")
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
      }

      // Connect the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream

      // Get the actual track settings
      const videoTrack = stream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()
      console.log("Camera settings:", settings)

      // Update UI
      setHasPermission(true)
      setShowPermissionButton(false)
    } catch (error) {
      console.error("Error accessing media devices:", error)
      throw error
    }
  }

  return {
    videoRef,
    streamRef,
    hasPermission,
    showPermissionButton,
    requestPermissions,
    stopCamera,
  }
}
