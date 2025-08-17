"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { validateApiKey } from "@/lib/elevenlabs"
import { Eye, EyeOff, Check, X } from "lucide-react"

interface ApiKeyInputProps {
  onApiKeyChange: (apiKey: string) => void
  initialApiKey?: string
}

export function ApiKeyInput({ onApiKeyChange, initialApiKey = "" }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  
  // Validate API key when it changes
  useEffect(() => {
    const validateKey = async () => {
      if (!apiKey) {
        setIsValid(null)
        return
      }
      
      setIsValidating(true)
      try {
        const valid = await validateApiKey(apiKey)
        setIsValid(valid)
        if (valid) {
          onApiKeyChange(apiKey)
        }
      } catch (error) {
        console.error("Error validating API key:", error)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }
    
    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(validateKey, 500)
    return () => clearTimeout(timeoutId)
  }, [apiKey, onApiKeyChange])
  
  // Handle API key change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value
    setApiKey(newApiKey)
  }
  
  // Toggle API key visibility
  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey)
  }
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center">
        <h3 className="text-sm font-medium">ElevenLabs API Key</h3>
        {isValid === true && (
          <span className="ml-2 text-green-500 flex items-center">
            <Check size={16} />
          </span>
        )}
        {isValid === false && (
          <span className="ml-2 text-red-500 flex items-center">
            <X size={16} />
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your ElevenLabs API key"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={toggleShowApiKey}
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        Get your API key from{" "}
        <a
          href="https://elevenlabs.io/app/settings/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          ElevenLabs Dashboard
        </a>
      </p>
    </div>
  )
}
