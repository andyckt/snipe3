"use client"

import { CameraView } from "@/components/camera-view"
import { CameraControls } from "@/components/camera-controls"
import { useCamera } from "@/hooks/use-camera"
import { useRecording } from "@/hooks/use-recording"

export default function CameraRecorder() {
  const { videoRef, streamRef, hasPermission, showPermissionButton, requestPermissions } = useCamera()

  const { isRecording, countdown, startRecording, stopRecording } = useRecording(streamRef)

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
          onRequestPermissions={requestPermissions}
          onStartRecording={handleStartRecording}
          onStopRecording={stopRecording}
        />
      </div>
    </div>
  )
}
