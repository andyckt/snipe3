"use client"

/**
 * NOTE: This component is temporarily disabled and not in use.
 * The conversation mode will be implemented in a future update.
 * This file is kept for reference but is currently commented out in the UI.
 */

import { Button } from "@/components/ui/button"
import { AudioLanguage, TextInput, TimeLimit } from "./question-tab"
import { unlockAudio } from "@/lib/audio"
import { initAudioContext } from "@/lib/mobile-audio"

interface ConversationTabProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[], mode: "question" | "conversation", timeLimit: TimeLimit) => void
  language: AudioLanguage
}

export function ConversationTab({ onLaunch, language }: ConversationTabProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex-1 w-full flex items-center justify-center mb-8">
        <Button 
          onClick={() => {
            unlockAudio(); // Unlock audio on user interaction
            initAudioContext(); // Initialize Web Audio API context
            onLaunch(1, language, [{ id: "conversation", value: "" }], "conversation", "no_limit");
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
        >
          Launch Recorder
        </Button>
      </div>
    </div>
  )
}
