"use client"

import { CameraView } from "@/components/camera-view"
import { CameraControls } from "@/components/camera-controls"
import { useCamera } from "@/hooks/use-camera"
import { useRecording } from "@/hooks/use-recording"

export default function CameraRecorder() {
  // For now, we'll set a fixed number of recordings (2)
  // This could be made configurable via props or state in the future
  const TOTAL_RECORDINGS = 2
  
  const { videoRef, streamRef, hasPermission, showPermissionButton, requestPermissions } = useCamera()

  const { 
    isRecording, 
    isCountingDown, 
    countdown, 
    currentRecordingIndex,
    totalRecordings,
    isLastRecording,
    startRecording, 
    nextRecording,
    completeSession
  } = useRecording(streamRef, { totalRecordings: TOTAL_RECORDINGS })

  const handleStartRecording = async () => {
    if (!hasPermission) {
      await requestPermissions()
      return
    }
    await startRecording()
  }

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
