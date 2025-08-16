import type React from "react"
interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  countdown: number | null
}

export function CameraView({ videoRef, countdown }: CameraViewProps) {
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
    </div>
  )
}
