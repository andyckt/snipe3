import type React from "react"
interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  countdown: number | null
  recordingTimeLeft?: number | null
}

export function CameraView({ videoRef, countdown, recordingTimeLeft }: CameraViewProps) {
  return (
    <div className="relative flex-1 flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover scale-x-[-1]" // Mirror the video
      />

      {/* Countdown Overlay */}
      {countdown && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-8xl font-bold drop-shadow-lg">{countdown}</div>
        </div>
      )}

      {/* Recording Time Left */}
      {recordingTimeLeft !== null && (
        <div className="absolute top-12 left-0 right-0 flex justify-center">
          <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <div className="text-white text-2xl font-semibold">
              {Math.floor(recordingTimeLeft / 60)}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
