"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuestionTab, AudioLanguage, TextInput, TimeLimit } from "./question-tab"
import { ConversationTab } from "./conversation-tab"
import PersonalDetailsSettings from "./personal-details-settings"
import { PersonalDetailsConfig } from "./personal-details-collector"

interface SettingsScreenProps {
  onLaunch: (numRecordings: number, language: AudioLanguage, textInputs: TextInput[], mode: "question" | "conversation", timeLimit: TimeLimit) => void
  personalDetailsConfig: PersonalDetailsConfig
  onPersonalDetailsConfigChange: (config: PersonalDetailsConfig) => void
}

export function SettingsScreen({ onLaunch, personalDetailsConfig, onPersonalDetailsConfigChange }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<"question" | "conversation" | "personal_details">("question")
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
        onValueChange={(value) => setActiveTab(value as "question" | "conversation" | "personal_details")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="question">By Question</TabsTrigger>
          {/* Conversation mode temporarily disabled until future implementation */}
          {/* <TabsTrigger value="conversation">By Conversation</TabsTrigger> */}
          <TabsTrigger value="personal_details">Personal Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="question" className="w-full">
          <QuestionTab 
            onLaunch={onLaunch} 
            language={language} 
            onLanguageChange={handleLanguageChange} 
          />
        </TabsContent>
        
        {/* Conversation mode temporarily disabled until future implementation
        <TabsContent value="conversation" className="w-full">
          <ConversationTab onLaunch={onLaunch} language={language} />
        </TabsContent>
        */}
        
        <TabsContent value="personal_details" className="w-full">
          <div className="mb-8">
            <PersonalDetailsSettings 
              config={personalDetailsConfig}
              onConfigChange={onPersonalDetailsConfigChange}
            />
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setActiveTab("question")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 text-xl rounded-full"
            >
              Continue to Questions
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}