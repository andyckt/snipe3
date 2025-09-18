"use client"

import { useState, useEffect } from "react"
import { CameraView } from "@/components/camera-view"
import { CameraControls } from "@/components/camera-controls"
import { AudioLanguage, TextInput, TimeLimit } from "@/components/question-tab"
import { useCamera } from "@/hooks/use-camera"
import { useQuestionRecording } from "@/hooks/use-question-recording"
import { useConversationRecording } from "@/hooks/use-conversation-recording"
import { Button } from "@/components/ui/button"
import { unlockAudio } from "@/lib/audio"
import { initAudioContext } from "@/lib/mobile-audio"
import PersonalDetailsCollector, { PersonalDetailField, PersonalDetailsConfig, PersonalDetailsResponse } from "@/components/personal-details-collector"

// App states
type AppState = "personal_details" | "recording" | "completed"

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    _debugInfo?: {
      completionAttempts: number;
      lastCompletionTime: string | null;
      events: Array<{
        timestamp: string;
        message: string;
        data: any;
      }>;
    };
    _logDebug?: (message: string, data?: any) => void;
    _preventFurtherRecording?: boolean;
  }
}

// Add a global flag to track completion state
if (typeof window !== 'undefined') {
  window._debugInfo = window._debugInfo || {
    completionAttempts: 0,
    lastCompletionTime: null,
    events: []
  };
  
  // Add a helper function to log debug info
  window._logDebug = (message: string, data: any = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] ${message}`, data);
    
    if (window._debugInfo) {
      window._debugInfo.events.push({
        timestamp,
        message,
        data
      });
    }
  };
  
  // Initialize the prevention flag
  window._preventFurtherRecording = window._preventFurtherRecording || false;
  
  if (window._logDebug) {
    window._logDebug('SnipePage component initialized');
  }
}

export default function SnipePage() {
  // Check for URL parameters on initial load
  const [initialParamsChecked, setInitialParamsChecked] = useState(false)
  
  // Log component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window._logDebug) {
      window._logDebug('SnipePage component mounted');
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && window._logDebug) {
        window._logDebug('SnipePage component unmounting');
      }
    };
  }, []);
  
  // State management
  const [appState, setAppState] = useState<AppState>("personal_details")
  const [numRecordings, setNumRecordings] = useState(3)
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>("english")
  const [textInputs, setTextInputs] = useState<TextInput[]>([{ id: "default", value: "" }])
  const [mode, setMode] = useState<"question" | "conversation">("question")
  const [timeLimit, setTimeLimit] = useState<TimeLimit>("no_limit")
  
  // Personal details configuration and responses
  const [personalDetailsConfig, setPersonalDetailsConfig] = useState<PersonalDetailsConfig>({
    includePersonalDetails: false,
    personalFields: []
  })
  const [personalDetailsResponses, setPersonalDetailsResponses] = useState<PersonalDetailsResponse>({})
  
  // Parse URL parameters on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialParamsChecked) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paramsData = urlParams.get('data');
        
        if (paramsData) {
          // Decode and parse the data
          const decodedData = decodeURIComponent(paramsData);
          const parsedData = JSON.parse(decodedData);
          
          // Apply the settings from URL parameters
          if (parsedData.numRecordings) setNumRecordings(parsedData.numRecordings);
          if (parsedData.audioLanguage) setAudioLanguage(parsedData.audioLanguage);
          
          // Handle text inputs and their audio URLs/keys
          if (parsedData.textInputs) {
            // Make sure we refresh presigned URLs if needed
            const refreshedTextInputs = [...parsedData.textInputs];
            setTextInputs(refreshedTextInputs);
            
            // Preload audio for better performance
            refreshedTextInputs.forEach(input => {
              if (input.audioUrl) {
                import('@/lib/mobile-audio').then(({ preloadMobileAudio }) => {
                  preloadMobileAudio(input.audioUrl!).catch(err => 
                    console.warn(`Failed to preload audio: ${err}`)
                  );
                });
              }
            });
          }
          
          if (parsedData.mode) setMode(parsedData.mode);
          if (parsedData.timeLimit) setTimeLimit(parsedData.timeLimit);
          if (parsedData.personalDetailsConfig) setPersonalDetailsConfig(parsedData.personalDetailsConfig);
          
          // Set initial app state based on URL parameters
          setAppState(parsedData.personalDetailsConfig?.includePersonalDetails ? "personal_details" : "recording");
        } else {
          // If no data is provided, redirect to the main page
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
        // If there's an error, redirect to the main page
        window.location.href = '/';
      }
      
      setInitialParamsChecked(true);
    }
  }, [initialParamsChecked]);
  
  // Try to unlock audio on component mount and on any user interaction
  useEffect(() => {
    // Try to unlock audio immediately
    unlockAudio();
    initAudioContext();
    
    // Add event listeners to unlock audio on any user interaction
    const unlockOnUserInteraction = () => {
      unlockAudio();
      initAudioContext();
      console.log("User interaction detected, attempting to unlock audio");
      
      // Create and play a silent sound to unlock audio on iOS
      const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
      silentSound.play().catch(err => console.error("Failed to play silent sound:", err));
      
      // Remove event listeners after first interaction
      document.removeEventListener('click', unlockOnUserInteraction);
      document.removeEventListener('touchstart', unlockOnUserInteraction);
      document.removeEventListener('touchend', unlockOnUserInteraction);
    };
    
    // Add listener for custom completion event
    const handleSessionComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      console.log("[DEBUG] Received session complete event:", JSON.stringify(detail));
      console.log(`[DEBUG] Current app state: ${appState}`);
      console.log(`[DEBUG] Current recording state - isRecording: ${isRecording}, isCountingDown: ${isCountingDown}`);
      console.log(`[DEBUG] Recording progress: ${currentRecordingIndex}/${totalRecordings}`);
      
      // Force immediate completion
      console.log("[DEBUG] Stopping camera");
      stopCamera(); // Stop the camera
      
      console.log("[DEBUG] Setting app state to 'completed'");
      setAppState("completed"); // Force transition to completed state
      
      // Add a visual indicator that can be seen in the DOM
      document.body.setAttribute('data-recording-completed', 'true');
      document.body.style.border = '5px solid green';
      
      console.log("[DEBUG] Session completion handler finished");
    };
    
    // Add event listeners
    document.addEventListener('click', unlockOnUserInteraction);
    document.addEventListener('touchstart', unlockOnUserInteraction);
    document.addEventListener('touchend', unlockOnUserInteraction);
    window.addEventListener('recordingSessionComplete', handleSessionComplete);
    
    return () => {
      // Clean up all event listeners
      document.removeEventListener('click', unlockOnUserInteraction);
      document.removeEventListener('touchstart', unlockOnUserInteraction);
      document.removeEventListener('touchend', unlockOnUserInteraction);
      window.removeEventListener('recordingSessionComplete', handleSessionComplete);
    };
  }, [])
  
  const { videoRef, streamRef, hasPermission, showPermissionButton, requestPermissions, stopCamera } = useCamera()

  // Use the appropriate recording hook based on the selected mode
  const questionRecording = useQuestionRecording(streamRef, { 
    totalRecordings: numRecordings, 
    audioLanguage,
    textInputs, // Pass the textInputs to the question recording hook
    timeLimit // Pass the time limit setting
  })
  
  const conversationRecording = useConversationRecording(streamRef, { 
    totalRecordings: numRecordings,
    timeLimit: timeLimit
  })
  
  // Select the appropriate recording hook based on mode
  const { 
    isRecording, 
    isCountingDown, 
    countdown, 
    currentRecordingIndex,
    totalRecordings,
    isLastRecording,
    isSessionComplete,
    recordingTimeLeft,
    startRecording, 
    nextRecording,
    completeSession
  } = mode === "question" ? questionRecording : conversationRecording

  // Handle completion of personal details
  const handlePersonalDetailsComplete = (responses: PersonalDetailsResponse) => {
    setPersonalDetailsResponses(responses)
    setAppState("recording")
  }
  
  // Handle skipping personal details
  const handlePersonalDetailsSkip = () => {
    setAppState("recording")
  }

  // Handle starting a recording
  const handleStartRecording = async () => {
    if (!hasPermission) {
      await requestPermissions()
      return
    }
    await startRecording()
  }

  // Handle session completion
  if (isSessionComplete) {
    console.log("[DEBUG] isSessionComplete detected in main component render");
    console.log(`[DEBUG] Current app state: ${appState}`);
    console.log(`[DEBUG] Current recording state - isRecording: ${isRecording}, isCountingDown: ${isCountingDown}`);
    console.log(`[DEBUG] Recording progress: ${currentRecordingIndex}/${totalRecordings}`);
    
    // Stop the camera and transition to completed state
    setTimeout(() => {
      console.log("[DEBUG] isSessionComplete timeout fired");
      console.log("[DEBUG] Stopping camera");
      stopCamera() // Stop the camera when recordings are complete
      
      console.log("[DEBUG] Setting app state to 'completed'");
      setAppState("completed")
      
      // Add a visual indicator
      document.body.setAttribute('data-completion-method', 'isSessionComplete');
      
      console.log("[DEBUG] Session completion via isSessionComplete complete");
    }, 100)
  }

  // Render based on current app state
  if (appState === "personal_details") {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center">
        <div className="flex flex-col h-full w-full bg-white md:max-w-sm md:h-screen">
          <PersonalDetailsCollector 
            config={personalDetailsConfig}
            onComplete={handlePersonalDetailsComplete}
            onSkip={handlePersonalDetailsSkip}
          />
        </div>
      </div>
    )
  }
  
  if (appState === "completed") {
    return (
      <div className="flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center">
        <div className="flex flex-col h-full w-full bg-white md:max-w-sm md:h-screen p-8 items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg">
            All {numRecordings} recordings have been completed and downloaded.
          </p>
        </div>
      </div>
    )
  }

  // Recording state
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white md:bg-gray-100 md:items-center md:justify-center">
      <div className="flex flex-col h-full w-full bg-black md:max-w-sm md:h-screen">
        <CameraView videoRef={videoRef} countdown={countdown} recordingTimeLeft={recordingTimeLeft} />

        <CameraControls
          showPermissionButton={showPermissionButton}
          hasPermission={hasPermission}
          isRecording={isRecording}
          isCountingDown={isCountingDown}
          currentRecordingIndex={currentRecordingIndex}
          totalRecordings={totalRecordings}
          isLastRecording={isLastRecording}
          onRequestPermissions={requestPermissions}
          onStartRecording={handleStartRecording}
          onNextRecording={nextRecording}
          onCompleteSession={completeSession}
        />
      </div>
    </div>
  )
}
