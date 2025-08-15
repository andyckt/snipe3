import * as React from "react"

interface TranscriptionDisplayProps {
  transcript: string
  isRecording: boolean
}

export function TranscriptionDisplay({ transcript, isRecording }: TranscriptionDisplayProps) {
  const transcriptionContainerRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when transcript changes
  React.useEffect(() => {
    if (transcriptionContainerRef.current && isRecording) {
      transcriptionContainerRef.current.scrollTop = transcriptionContainerRef.current.scrollHeight
    }
  }, [transcript, isRecording])

  if (!isRecording || !transcript) return null

  return (
    <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
      <div 
        ref={transcriptionContainerRef}
        className="bg-black/50 text-white p-3 rounded-md max-h-32 overflow-y-auto text-sm"
      >
        {transcript}
      </div>
    </div>
  )
}