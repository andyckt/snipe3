"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, MinusCircle, Volume2, Loader2, GripVertical } from "lucide-react"
import { textToSpeechUrl, playAudio } from "@/lib/elevenlabs-browser"
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
  audioUrl?: string;
  isGenerating?: boolean;
  // No need to explicitly store order as the array index will determine order
}

interface QuestionTabProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[], mode: "question" | "conversation") => void;
  language: AudioLanguage;
  onLanguageChange: (newLanguage: AudioLanguage) => void;
}

// SortableTextInput component for drag and drop functionality
interface SortableTextInputProps {
  input: TextInput;
  onTextChange: (id: string, value: string) => void;
  onGenerateSpeech: (id: string, text: string) => void;
  onPlayAudio: (audioUrl?: string) => void;
  onRemove: (id: string) => void;
  disableRemove: boolean;
}

function SortableTextInput({ 
  input, 
  onTextChange, 
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
      
      <div className="flex gap-1">
        <Button
          onClick={() => input.audioUrl ? onPlayAudio(input.audioUrl) : onGenerateSpeech(input.id, input.value)}
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
    { id: crypto.randomUUID(), value: '', audioUrl: undefined, isGenerating: false }
  ])
  
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
      isGenerating: false
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
  
  const generateSpeech = async (id: string, text: string) => {
    if (!text.trim()) return
    
    try {
      // Update the state to show loading
      setTextInputs(prev => 
        prev.map(input => input.id === id ? { ...input, isGenerating: true } : input)
      )
      
      // Map the AudioLanguage type to the type expected by textToSpeechUrl
      const apiLanguage = language === "english" ? "english" : "mandarin"
      
      // Generate speech with the selected language
      const audioUrl = await textToSpeechUrl(text, apiLanguage)
      
      // Update the state with the audio URL
      setTextInputs(prev => 
        prev.map(input => input.id === id ? { 
          ...input, 
          audioUrl, 
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
  
  const handlePlayAudio = (audioUrl?: string) => {
    if (!audioUrl) return
    playAudio(audioUrl)
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
          onClick={() => onLaunch(textInputs.length, language, textInputs, "question")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
        >
          Launch Recorder
        </Button>
      </div>
    </div>
  )
}
