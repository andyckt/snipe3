"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { PlusCircle, MinusCircle, Volume2, Loader2, GripVertical, Clock } from "lucide-react"
import { textToSpeechAndUpload, playAudio, getPresignedUrl } from "@/lib/api-service"
import { unlockAudio } from "@/lib/audio"
import { initAudioContext, playMobileAudio } from "@/lib/mobile-audio"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type AudioLanguage = "english" | "mandarin"

export interface TextInput {
  id: string;
  value: string;
  audioUrl?: string;  // S3 presigned URL
  audioKey?: string;  // S3 key for the audio file
  isGenerating?: boolean;
  timeLimit?: TimeLimit; // Individual time limit for this question
  // No need to explicitly store order as the array index will determine order
}

// Time limit options for recordings
export type TimeLimit = "no_limit" | "30_seconds" | "1_minute" | "2_minutes" | "3_minutes" | "5_minutes";

interface QuestionTabProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[], mode: "question" | "conversation", timeLimit: TimeLimit) => void;
  language: AudioLanguage;
  onLanguageChange: (newLanguage: AudioLanguage) => void;
}

// SortableTextInput component for drag and drop functionality
interface SortableTextInputProps {
  input: TextInput;
  onTextChange: (id: string, value: string) => void;
  onTimeLimitChange: (id: string, timeLimit: TimeLimit) => void;
  onGenerateSpeech: (id: string, text: string) => void;
  onPlayAudio: (audioUrl?: string, audioKey?: string) => void;
  onRemove: (id: string) => void;
  disableRemove: boolean;
}

function SortableTextInput({ 
  input, 
  onTextChange,
  onTimeLimitChange,
  onGenerateSpeech, 
  onPlayAudio, 
  onRemove,
  disableRemove
}: SortableTextInputProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: input.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-2 w-full p-1 rounded-md ${isDragging ? 'bg-gray-100' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 touch-none"
      >
        <GripVertical size={20} />
      </div>
      
      <Input
        value={input.value}
        onChange={(e) => onTextChange(input.id, e.target.value)}
        placeholder="Enter text..."
        className="flex-1"
      />
      
      <div className="flex gap-1 items-center">
        {/* Time limit select */}
        <div className="flex items-center">
          <Select
            value={input.timeLimit || "no_limit"}
            onValueChange={(value) => onTimeLimitChange(input.id, value as TimeLimit)}
          >
            <SelectTrigger className="h-8 px-2 py-1 text-xs gap-1">
              <Clock size={14} className="text-gray-500" />
              <SelectValue>
                {input.timeLimit === "30_seconds" && "30s"}
                {input.timeLimit === "1_minute" && "1m"}
                {input.timeLimit === "2_minutes" && "2m"}
                {input.timeLimit === "3_minutes" && "3m"}
                {input.timeLimit === "5_minutes" && "5m"}
                {(!input.timeLimit || input.timeLimit === "no_limit") && "No limit"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_limit">No limit</SelectItem>
              <SelectItem value="30_seconds">30 seconds</SelectItem>
              <SelectItem value="1_minute">1 minute</SelectItem>
              <SelectItem value="2_minutes">2 minutes</SelectItem>
              <SelectItem value="3_minutes">3 minutes</SelectItem>
              <SelectItem value="5_minutes">5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            unlockAudio(); // Unlock audio on user interaction
            initAudioContext(); // Initialize Web Audio API context
            input.audioUrl ? onPlayAudio(input.audioUrl, input.audioKey) : onGenerateSpeech(input.id, input.value);
          }}
          disabled={!input.value.trim() || input.isGenerating}
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-full ${
            input.audioUrl 
              ? "text-green-500 hover:text-green-700 hover:bg-green-50" 
              : "text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          }`}
          title={input.audioUrl ? "Play generated audio" : "Generate audio"}
        >
          {input.isGenerating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Volume2 size={20} />
          )}
        </Button>
        
        <Button 
          onClick={() => onRemove(input.id)} 
          disabled={disableRemove} 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <MinusCircle size={20} />
        </Button>
      </div>
    </div>
  );
}

export function QuestionTab({ onLaunch, language, onLanguageChange }: QuestionTabProps) {
  const [textInputs, setTextInputs] = useState<TextInput[]>([
    { 
      id: crypto.randomUUID(), 
      value: '', 
      audioUrl: undefined, 
      audioKey: undefined, 
      isGenerating: false,
      timeLimit: "no_limit"
    }
  ])
  
  // Try to unlock audio on component mount and on any user interaction
  useEffect(() => {
    // Try to initialize audio context immediately
    initAudioContext();
    
    // Add event listeners to unlock audio on any user interaction
    const unlockOnUserInteraction = () => {
      unlockAudio();
      initAudioContext();
      // Remove event listeners after first interaction
      document.removeEventListener('click', unlockOnUserInteraction);
      document.removeEventListener('touchstart', unlockOnUserInteraction);
      document.removeEventListener('touchend', unlockOnUserInteraction);
    };
    
    document.addEventListener('click', unlockOnUserInteraction);
    document.addEventListener('touchstart', unlockOnUserInteraction);
    document.addEventListener('touchend', unlockOnUserInteraction);
    
    return () => {
      document.removeEventListener('click', unlockOnUserInteraction);
      document.removeEventListener('touchstart', unlockOnUserInteraction);
      document.removeEventListener('touchend', unlockOnUserInteraction);
    };
  }, [])
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // This ensures a small movement is needed before drag starts
        // to avoid conflicts with click events
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const handleAddTextInput = () => {
    setTextInputs(prev => [...prev, { 
      id: crypto.randomUUID(), 
      value: '',
      audioUrl: undefined,
      audioKey: undefined,
      isGenerating: false,
      timeLimit: "no_limit"
    }])
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
  
  const handleTimeLimitChange = (id: string, timeLimit: TimeLimit) => {
    setTextInputs(prev => 
      prev.map(input => input.id === id ? { ...input, timeLimit } : input)
    )
  }
  
  const generateSpeech = async (id: string, text: string) => {
    if (!text.trim()) return
    
    try {
      // Update the state to show loading
      setTextInputs(prev => 
        prev.map(input => input.id === id ? { ...input, isGenerating: true } : input)
      )
      
      // Map the AudioLanguage type to the type expected by API
      const apiLanguage = language === "english" ? "english" : "mandarin"
      console.log(`Generating speech for language: ${language}, mapped to API language: ${apiLanguage}`)
      
      // Generate speech with the selected language and upload to S3 using our API service
      const { url, key } = await textToSpeechAndUpload(text, apiLanguage)
      
      console.log(`Audio uploaded to S3. Key: ${key}, URL: ${url}`)
      
      // Update the state with the audio URL and S3 key
      setTextInputs(prev => 
        prev.map(input => input.id === id ? { 
          ...input, 
          audioUrl: url,
          audioKey: key,
          isGenerating: false 
        } : input)
      )
    } catch (error) {
      console.error('Error generating speech:', error)
      
      // Update the state to show error
      setTextInputs(prev => 
        prev.map(input => input.id === id ? { ...input, isGenerating: false } : input)
      )
      
      // Show an alert
      alert('Failed to generate speech. Please try again.')
    }
  }
  
  const handlePlayAudio = async (audioUrl?: string, audioKey?: string) => {
    if (!audioUrl) return
    
    try {
      // Initialize audio context
      initAudioContext();
      
      // If we have a key, get a fresh presigned URL (in case the old one expired)
      let urlToPlay = audioUrl
      if (audioKey) {
        urlToPlay = await getPresignedUrl(audioKey)
        
        // Update the stored URL in state
        setTextInputs(prev => 
          prev.map(input => input.audioKey === audioKey ? { 
            ...input, 
            audioUrl: urlToPlay
          } : input)
        )
      }
      
      // Play the audio using mobile-friendly method
      console.log("Playing audio preview...");
      try {
        await playMobileAudio(urlToPlay);
        console.log("Audio preview played successfully");
      } catch (error) {
        console.error("Mobile audio playback failed, falling back to standard method:", error);
        // Fallback to standard method
        playAudio(urlToPlay);
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      alert('Failed to play audio. Please try again.')
    }
  }
  
  // Handle the end of a drag operation
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    // If no over element or same element, no reordering needed
    if (!over || active.id === over.id) {
      return
    }
    
    // Find the indices of the dragged item and the drop target
    const oldIndex = textInputs.findIndex(input => input.id === active.id)
    const newIndex = textInputs.findIndex(input => input.id === over.id)
    
    // Update the array order using arrayMove from dnd-kit
    setTextInputs(arrayMove(textInputs, oldIndex, newIndex))
  }
  
  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-xl font-semibold mb-6">Audio Language</h2>
        
        <div className="flex gap-4">
          <Button
            onClick={() => onLanguageChange("english")}
            className={`px-6 py-2 rounded-full ${
              language === "english" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            English
          </Button>
          
          <Button
            onClick={() => onLanguageChange("mandarin")}
            className={`px-6 py-2 rounded-full ${
              language === "mandarin" 
                ? "bg-blue-500 text-white" 
                : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            Mandarin
          </Button>
        </div>
      </div>
      

      

      
      <div className="flex flex-col items-center mb-12 w-full">
        <h2 className="text-xl font-semibold mb-2">Custom Text Fields</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Each text field will correspond to one recording. Drag to reorder.</p>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-3 w-full">
            <SortableContext 
              items={textInputs.map(input => input.id)}
              strategy={verticalListSortingStrategy}
            >
              {textInputs.map((input) => (
                <SortableTextInput
                  key={input.id}
                  input={input}
                  onTextChange={handleTextInputChange}
                  onTimeLimitChange={handleTimeLimitChange}
                  onGenerateSpeech={generateSpeech}
                  onPlayAudio={handlePlayAudio}
                  onRemove={handleRemoveTextInput}
                  disableRemove={textInputs.length <= 1}
                />
              ))}
            </SortableContext>
            
            <Button
              onClick={handleAddTextInput}
              variant="outline"
              className="mt-2 flex items-center gap-2 text-blue-500 hover:text-blue-700 border-dashed"
            >
              <PlusCircle size={18} /> Add Text Field
            </Button>
          </div>
        </DndContext>
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={() => {
            unlockAudio(); // Unlock audio on user interaction
            initAudioContext(); // Initialize Web Audio API context
            onLaunch(textInputs.length, language, textInputs, "question", "no_limit");
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
        >
          Launch Recorder
        </Button>
      </div>
    </div>
  )
}
