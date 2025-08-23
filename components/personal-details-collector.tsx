"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowRight, Check } from "lucide-react"

export interface PersonalDetailField {
  id: string
  label: string
  type: "text" | "dropdown" | "checkbox"
  required: boolean
  dropdownOptions?: string[]
  allowMultiple?: boolean
}

export interface PersonalDetailsConfig {
  includePersonalDetails: boolean
  personalFields: PersonalDetailField[]
}

export interface PersonalDetailsResponse {
  [key: string]: string | string[] | boolean
}

interface PersonalDetailsCollectorProps {
  config: PersonalDetailsConfig
  onComplete: (responses: PersonalDetailsResponse) => void
  onSkip: () => void
}

export default function PersonalDetailsCollector({ config, onComplete, onSkip }: PersonalDetailsCollectorProps) {
  const { includePersonalDetails, personalFields } = config
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [responses, setResponses] = useState<PersonalDetailsResponse>({})
  const [currentResponse, setCurrentResponse] = useState<string | string[] | boolean>("")

  // If personal details collection is disabled, skip immediately
  React.useEffect(() => {
    if (!includePersonalDetails || personalFields.length === 0) {
      onSkip()
    }
  }, [includePersonalDetails, personalFields, onSkip])

  if (!includePersonalDetails || personalFields.length === 0) {
    return null
  }

  const currentField = personalFields[currentFieldIndex]
  const isLastField = currentFieldIndex === personalFields.length - 1
  const progress = ((currentFieldIndex + 1) / personalFields.length) * 100

  const handleNext = () => {
    // Save current response
    setResponses(prev => ({
      ...prev,
      [currentField.id]: currentResponse
    }))

    if (isLastField) {
      // Complete the form
      onComplete({
        ...responses,
        [currentField.id]: currentResponse
      })
    } else {
      // Move to next field
      setCurrentFieldIndex(prev => prev + 1)
      // Reset current response based on the next field type
      const nextField = personalFields[currentFieldIndex + 1]
      if (nextField.type === "checkbox") {
        setCurrentResponse(false)
      } else if (nextField.type === "dropdown" && nextField.allowMultiple) {
        setCurrentResponse([])
      } else {
        setCurrentResponse("")
      }
    }
  }

  const isNextDisabled = () => {
    if (!currentField.required) return false
    
    if (typeof currentResponse === "string") {
      return currentResponse.trim() === ""
    } else if (Array.isArray(currentResponse)) {
      return currentResponse.length === 0
    }
    
    return false
  }

  const renderField = () => {
    switch (currentField.type) {
      case "text":
        return (
          <Input
            value={currentResponse as string}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder={`Enter ${currentField.label.toLowerCase()}`}
            className="w-full text-lg p-4 h-14"
            autoFocus
          />
        )
      case "dropdown":
        if (currentField.allowMultiple) {
          return (
            <div className="space-y-3">
              {currentField.dropdownOptions?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${index}`}
                    checked={(currentResponse as string[]).includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCurrentResponse([...(currentResponse as string[]), option])
                      } else {
                        setCurrentResponse((currentResponse as string[]).filter(item => item !== option))
                      }
                    }}
                  />
                  <Label htmlFor={`option-${index}`} className="text-lg">{option}</Label>
                </div>
              ))}
            </div>
          )
        } else {
          return (
            <Select
              value={currentResponse as string}
              onValueChange={setCurrentResponse as (value: string) => void}
            >
              <SelectTrigger className="w-full text-lg p-4 h-14">
                <SelectValue placeholder={`Select ${currentField.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {currentField.dropdownOptions?.map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
      case "checkbox":
        return (
          <div className="flex items-center space-x-3">
            <Checkbox
              id="terms"
              checked={currentResponse as boolean}
              onCheckedChange={setCurrentResponse as (checked: boolean) => void}
            />
            <Label htmlFor="terms" className="text-lg">{currentField.label}</Label>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100">
        <div 
          className="h-full bg-blue-500 transition-all duration-500 ease-in-out" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full">
        <div className="w-full space-y-8 animate-fadeIn">
          <h2 className="text-2xl font-bold text-center">{currentField.label}</h2>
          
          <div className="w-full">
            {renderField()}
          </div>

          <div className="flex justify-between pt-4">
            {currentFieldIndex > 0 ? (
              <Button 
                variant="ghost"
                onClick={() => {
                  setCurrentFieldIndex(prev => prev - 1)
                  // Restore previous response
                  const prevField = personalFields[currentFieldIndex - 1]
                  setCurrentResponse(responses[prevField.id] || "")
                }}
              >
                Back
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={onSkip}
              >
                Skip
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
            >
              {isLastField ? (
                <>
                  Complete <Check className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
