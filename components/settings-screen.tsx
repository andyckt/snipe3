"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionTab, AudioLanguage, TextInput, TimeLimit } from "./question-tab"
import { ConversationTab } from "./conversation-tab"

interface SettingsScreenProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[], mode: "question" | "conversation", timeLimit: TimeLimit) => void
}

export function SettingsScreen({ onLaunch }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<"question" | "conversation">("question")
  const [language, setLanguage] = useState<AudioLanguage>("english")
  
  const handleLanguageChange = (newLanguage: AudioLanguage) => {
    setLanguage(newLanguage)
  }
  
  return (
    <div className="flex flex-col h-full w-full bg-white p-8 items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Camera Recorder Settings</h1>
      
      <Tabs 
        defaultValue="question" 
        className="w-full max-w-md mb-8"
        onValueChange={(value) => setActiveTab(value as "question" | "conversation")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="question">By Question</TabsTrigger>
          <TabsTrigger value="conversation">By Conversation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="question" className="w-full">
          <QuestionTab 
            onLaunch={onLaunch} 
            language={language} 
            onLanguageChange={handleLanguageChange} 
          />
        </TabsContent>
        
        <TabsContent value="conversation" className="w-full">
          <ConversationTab onLaunch={onLaunch} language={language} />
        </TabsContent>
      </Tabs>
    </div>
  )
}