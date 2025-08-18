"use client"

import { Button } from "@/components/ui/button"
import { AudioLanguage, TextInput } from "./question-tab"
import { unlockAudio } from "@/lib/audio"

interface ConversationTabProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[], mode: "question" | "conversation") => void
  language: AudioLanguage
}

export function ConversationTab({ onLaunch, language }: ConversationTabProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="flex-1 w-full flex items-center justify-center mb-8">
        <Button 
          onClick={() => {
            unlockAudio(); // Unlock audio on user interaction
            onLaunch(1, language, [{ id: "conversation", value: "" }], "conversation");
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
        >
          Launch Recorder
        </Button>
      </div>
    </div>
  )
}
