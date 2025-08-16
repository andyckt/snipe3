"use client"

import { useState } from "react"
import { CameraView } from "@/components/camera-view"
import { CameraControls } from "@/components/camera-controls"
import { SettingsScreen, AudioLanguage } from "@/components/settings-screen"

// Import TextInput type from settings-screen
interface TextInput {
  id: string;
  value: string;
}
import { useCamera } from "@/hooks/use-camera"
import { useRecording } from "@/hooks/use-recording"
import { Button } from "@/components/ui/button"

// App states
type AppState = "settings" | "recording" | "completed"

export default function CameraRecorder() {
  // State management
  const [appState, setAppState] = useState<AppState>("settings")
  const [numRecordings, setNumRecordings] = useState(3)
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>("english")
  const [textInputs, setTextInputs] = useState<TextInput[]>([{ id: "default", value: "" }])
  
  const { videoRef, streamRef, hasPermission, showPermissionButton, requestPermissions, stopCamera } = useCamera()

  const { 
    isRecording, 
    isCountingDown, 
    countdown, 
    currentRecordingIndex,
    totalRecordings,
    isLastRecording,
    isSessionComplete,
    startRecording, 
    nextRecording,
    completeSession
  } = useRecording(streamRef, { totalRecordings: numRecordings, audioLanguage })

  // Handle launching the recorder with selected settings
  const handleLaunch = (selectedNumRecordings: number, selectedLanguage: AudioLanguage, selectedTextInputs: TextInput[]) => {
    // The number of recordings is now determined by the number of text inputs
    setNumRecordings(selectedTextInputs.length)
    setAudioLanguage(selectedLanguage)
    setTextInputs(selectedTextInputs)
    setAppState("recording")
    
    // Log the text inputs for now (we'll use them properly later)
    console.log("Text inputs:", selectedTextInputs)
    console.log("Number of recordings:", selectedTextInputs.length)
  }

  // Handle starting a recording
  const handleStartRecording = async () => {
    if (!hasPermission) {
      await requestPermissions()
      return
    }
    await startRecording()
  }

  // Handle session completion
  if (isSessionComplete) {
    // Stop the camera and transition to completed state
    setTimeout(() => {
      stopCamera() // Stop the camera when recordings are complete
      setAppState("completed")
    }, 100)
  }

  // Render based on current app state
  if (appState === "settings") {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center">
        <div className="flex flex-col h-full w-full bg-white md:max-w-sm md:h-screen">
          <SettingsScreen onLaunch={handleLaunch} />
        </div>
      </div>
    )
  }
  
  if (appState === "completed") {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center">
        <div className="flex flex-col h-full w-full bg-white md:max-w-sm md:h-screen p-8 items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg">
            All {numRecordings} recordings have been completed and downloaded.
          </p>
        </div>
      </div>
    )
  }

  // Recording state
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center">
      <div className="flex flex-col h-full w-full bg-black md:max-w-sm md:h-screen">
        <CameraView videoRef={videoRef} countdown={countdown} />

        <CameraControls
          showPermissionButton={showPermissionButton}
          hasPermission={hasPermission}
          isRecording={isRecording}
          isCountingDown={isCountingDown}
          currentRecordingIndex={currentRecordingIndex}
          totalRecordings={totalRecordings}
          isLastRecording={isLastRecording}
          onRequestPermissions={requestPermissions}
          onStartRecording={handleStartRecording}
          onNextRecording={nextRecording}
          onCompleteSession={completeSession}
        />
      </div>
    </div>
  )
}
