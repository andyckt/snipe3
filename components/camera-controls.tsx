"use client"

import { Button } from "@/components/ui/button"
import { unlockAudio } from "@/lib/audio"
import { initAudioContext } from "@/lib/mobile-audio"

interface CameraControlsProps {
  showPermissionButton: boolean
  hasPermission: boolean
  isRecording: boolean
  isCountingDown: boolean
  currentRecordingIndex: number
  totalRecordings: number
  isLastRecording: boolean
  onRequestPermissions: () => void
  onStartRecording: () => void
  onNextRecording: () => void
  onCompleteSession: () => void
}

export function CameraControls({
  showPermissionButton,
  hasPermission,
  isRecording,
  isCountingDown,
  currentRecordingIndex,
  totalRecordings,
  isLastRecording,
  onRequestPermissions,
  onStartRecording,
  onNextRecording,
  onCompleteSession,
}: CameraControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
      <div className="flex flex-col items-center gap-4">
        {/* Recording progress indicator */}
        {hasPermission && (
          <div className="text-white text-sm mb-2">
            {isRecording || isCountingDown ? (
              <span>Recording {currentRecordingIndex + 1} of {totalRecordings}</span>
            ) : (
              <span>
                {currentRecordingIndex === 0 
                  ? '' 
                  : currentRecordingIndex === totalRecordings 
                    ? 'All recordings complete' 
                    : `${currentRecordingIndex} of ${totalRecordings} recordings complete`}
              </span>
            )}
          </div>
        )}

        <div className="flex justify-center gap-4">
          {showPermissionButton && (
            <Button
              onClick={() => {
                unlockAudio(); // Unlock audio on user interaction
                initAudioContext(); // Initialize Web Audio API context
                onRequestPermissions();
              }}
              className="bg-sky-400 hover:bg-sky-500 text-white font-semibold px-6 py-3 rounded-full min-w-[120px]"
            >
              Enable Camera
            </Button>
          )}

          {hasPermission && !isRecording && !isCountingDown && currentRecordingIndex === 0 && (
            <Button
              onClick={() => {
                unlockAudio(); // Unlock audio on user interaction
                initAudioContext(); // Initialize Web Audio API context
                onStartRecording();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full min-w-[120px]"
            >
              Start Recording
            </Button>
          )}

          {isRecording && !isLastRecording && (
            <Button
              onClick={() => {
                unlockAudio(); // Unlock audio on user interaction
                initAudioContext(); // Initialize Web Audio API context
                onNextRecording();
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full min-w-[120px]"
            >
              Next
            </Button>
          )}

          {isRecording && isLastRecording && (
            <Button
              onClick={() => {
                unlockAudio(); // Unlock audio on user interaction
                initAudioContext(); // Initialize Web Audio API context
                onCompleteSession();
              }}
              className="bg-red-500 text-white font-semibold px-6 py-3 rounded-full min-w-[120px] opacity-50 hover:opacity-100 hover:bg-red-500"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
