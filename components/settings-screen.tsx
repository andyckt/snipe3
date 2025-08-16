"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, MinusCircle } from "lucide-react"

export type AudioLanguage = "english" | "chinese"

interface TextInput {
  id: string;
  value: string;
}

interface SettingsScreenProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[]) => void
}

export function SettingsScreen({ onLaunch }: SettingsScreenProps) {
  const [language, setLanguage] = useState<AudioLanguage>("english")
  const [textInputs, setTextInputs] = useState<TextInput[]>([
    { id: crypto.randomUUID(), value: '' }
  ])
  
  const handleAddTextInput = () => {
    setTextInputs(prev => [...prev, { id: crypto.randomUUID(), value: '' }])
  }
  
  const handleRemoveTextInput = (id: string) => {
    // Don't remove if it's the last input
    if (textInputs.length <= 1) return
    
    setTextInputs(prev => prev.filter(input => input.id !== id))
  }
  
  const handleTextInputChange = (id: string, value: string) => {
    setTextInputs(prev => 
      prev.map(input => input.id === id ? { ...input, value } : input)
    )
  }
  
  return (
    <div className="flex flex-col h-full w-full bg-white p-8 items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Camera Recorder Settings</h1>
      

      
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-xl font-semibold mb-6">Audio Language</h2>
        
        <div className="flex gap-4">
          <Button
            onClick={() => setLanguage("english")}
            className={`px-6 py-2 rounded-full ${
              language === "english" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            English
          </Button>
          
          <Button
            onClick={() => setLanguage("chinese")}
            className={`px-6 py-2 rounded-full ${
              language === "chinese" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            Mandarin
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col items-center mb-12 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">Custom Text Fields</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Each text field will correspond to one recording. Add as many as you need.</p>
        
        <div className="flex flex-col gap-3 w-full">
          {textInputs.map((input) => (
            <div key={input.id} className="flex items-center gap-2 w-full">
              <Input
                value={input.value}
                onChange={(e) => handleTextInputChange(input.id, e.target.value)}
                placeholder="Enter text..."
                className="flex-1"
              />
              <Button
                onClick={() => handleRemoveTextInput(input.id)}
                disabled={textInputs.length <= 1}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <MinusCircle size={20} />
              </Button>
            </div>
          ))}
          
          <Button
            onClick={handleAddTextInput}
            variant="outline"
            className="mt-2 flex items-center gap-2 text-blue-500 hover:text-blue-700 border-dashed"
          >
            <PlusCircle size={18} />
            Add Text Field
          </Button>
        </div>
      </div>
      
      <Button 
        onClick={() => onLaunch(textInputs.length, language, textInputs)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
      >
        Launch Recorder
      </Button>
    </div>
  )
}
