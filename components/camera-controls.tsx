"use client"

import { Button } from "@/components/ui/button"

interface CameraControlsProps {
  showPermissionButton: boolean
  hasPermission: boolean
  isRecording: boolean
  isCountingDown: boolean
  onRequestPermissions: () => void
  onStartRecording: () => void
  onStopRecording: () => void
}

export function CameraControls({
  showPermissionButton,
  hasPermission,
  isRecording,
  isCountingDown,
  onRequestPermissions,
  onStartRecording,
  onStopRecording,
}: CameraControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
      <div className="flex justify-center gap-4">
        {showPermissionButton && (
          <Button
            onClick={onRequestPermissions}
            className="bg-sky-400 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-full min-w-[120px]"
          >
            Enable Camera
          </Button>
        )}

        {hasPermission && !isRecording && !isCountingDown && (
          <Button
            onClick={onStartRecording}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full min-w-[120px]"
          >
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={onStopRecording}
            className="bg-red-500 text-white font-semibold px-6 py-3 rounded-full min-w-[120px] opacity-50 hover:opacity-100 hover:bg-red-500"
          >
            Done
          </Button>
        )}
      </div>
    </div>
  )
}
