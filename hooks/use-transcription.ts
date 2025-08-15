"use client"

import * as React from "react"
const { useState, useEffect, useRef } = React

// Add type definitions for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseTranscriptionProps {
  isRecording: boolean
}

export function useTranscription({ isRecording }: UseTranscriptionProps) {
  const [transcript, setTranscript] = useState<string>("")
  const recognitionRef = useRef<any | null>(null)
  const isTranscribingRef = useRef<boolean>(false)
  const finalTranscriptRef = useRef<string>("")
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser')
      return
    }
    
    // Create recognition instance
    recognitionRef.current = new SpeechRecognition()
    
    // Configure recognition
    const recognition = recognitionRef.current
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    
    // Set up recognition event handlers
    recognition.onstart = () => {
      isTranscribingRef.current = true
    }
    
    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let newFinalTranscript = ''
      
      // Process results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }
      
      // Update transcription
      if (newFinalTranscript) {
        finalTranscriptRef.current += newFinalTranscript
      }
      
      // Update state with combined transcription
      setTranscript(finalTranscriptRef.current + interimTranscript)
    }
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      
      // Try to restart if it's a non-fatal error
      if (event.error !== 'no-speech' && event.error !== 'audio-capture' && isTranscribingRef.current) {
        setTimeout(() => {
          if (isTranscribingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (err) {
              console.error('Error restarting recognition:', err)
            }
          }
        }, 1000)
      }
    }
    
    recognition.onend = () => {
      // Restart if still transcribing
      if (isTranscribingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (err) {
          console.error('Error restarting recognition:', err)
        }
      }
    }

    setIsInitialized(true)

    return () => {
      // Clean up
      if (recognitionRef.current) {
        isTranscribingRef.current = false
        try {
          recognitionRef.current.stop()
        } catch (err) {
          // Ignore errors on cleanup
        }
      }
    }
  }, [])

  // Start/stop transcription based on recording state
  useEffect(() => {
    if (!isInitialized || !recognitionRef.current) return

    if (isRecording) {
      startTranscription()
    } else {
      stopTranscription()
    }
  }, [isRecording, isInitialized])

  // Start transcription
  const startTranscription = () => {
    if (recognitionRef.current) {
      finalTranscriptRef.current = ''
      setTranscript('')
      isTranscribingRef.current = true
      
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error starting transcription:', err)
      }
    }
  }

  // Stop transcription
  const stopTranscription = () => {
    if (recognitionRef.current) {
      isTranscribingRef.current = false
      
      try {
        recognitionRef.current.stop()
      } catch (err) {
        console.error('Error stopping transcription:', err)
      }
    }
  }

  const getTranscriptForExport = () => {
    return finalTranscriptRef.current.trim()
  }

  return {
    transcript,
    getTranscriptForExport
  }
}