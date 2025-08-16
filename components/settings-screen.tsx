"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SettingsScreenProps {
  onLaunch: (numRecordings: number) => void
}

export function SettingsScreen({ onLaunch }: SettingsScreenProps) {
  const [numRecordings, setNumRecordings] = useState(2)
  
  const handleIncrease = () => {
    setNumRecordings(prev => Math.min(prev + 1, 10)) // Maximum 10 recordings
  }
  
  const handleDecrease = () => {
    setNumRecordings(prev => Math.max(prev - 1, 1)) // Minimum 1 recording
  }
  
  return (
    <div className="flex flex-col h-full w-full bg-white p-8 items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Camera Recorder Settings</h1>
      
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-xl font-semibold mb-6">Number of Recordings</h2>
        
        <div className="flex items-center gap-6">
          <Button 
            onClick={handleDecrease}
            disabled={numRecordings <= 1}
            className="bg-gray-200 hover:bg-gray-300 text-black font-bold text-xl h-12 w-12 rounded-full"
          >
            -
          </Button>
          
          <span className="text-4xl font-bold">{numRecordings}</span>
          
          <Button 
            onClick={handleIncrease}
            disabled={numRecordings >= 10}
            className="bg-gray-200 hover:bg-gray-300 text-black font-bold text-xl h-12 w-12 rounded-full"
          >
            +
          </Button>
        </div>
      </div>
      
      <Button 
        onClick={() => onLaunch(numRecordings)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
      >
        Launch Recorder
      </Button>
    </div>
  )
}
