// Microphone.tsx
import React, { useState, useEffect, useContext, useRef } from "react";
import { useRecordVoice } from "@/app/(speech)/hooks/useRecordVoice";
import { IconMicrophone } from "@/app/(speech)/app/components/IconMicrophone";
import TranscriptionContext from "./TranscriptionContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import SummarizationComponent from "./SummarizationComponent";

interface MicrophoneProps {
  documentId: Id<"documents">;
  // Assuming documentId is a string. Adjust the type as necessary.
}
const Microphone: React.FC<MicrophoneProps> = ({ documentId }) => {
  const [, setSummarizationResult] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const {
    finalTranscription,
    setLiveTranscription,
    setFinalTranscription,
    generateNewSessionId,
    clearFinalTranscriptions,
    isDisabledRecordButton,
  } = useContext(TranscriptionContext);

  const { toggleMicrophone } = useRecordVoice(
    documentId,
    setFinalTranscription
  );

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      clearFinalTranscriptions(); // Clear and start listening again
      generateNewSessionId(); // Generate a new session ID for each new recording
      toggleMicrophone();
      setFinalTranscription(null); // Clear the final transcription
    } else {
      toggleMicrophone();
      setLiveTranscription(null);
      setFinalTranscription(null); // Clear the final transcription
    }
  };

  // Your existing button style logic
  const buttonClass = `cursor-not-allowed record-button fixed left-1/2 bottom-[60px] transform -translate-x-1/2 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer z-50 animate-smooth-pulse ${isRecording ? "bg-red-500" : (isDisabledRecordButton ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-800 dark:bg-slate-600')}`;

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          @keyframes gentlePulse {
            0% { transform: translateX(-50%) scale(1); opacity: 1; }
            50% { transform: translateX(-50%) scale(1.05); opacity: 0.9; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
          },

          .visuallyHidden {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        `}
      </style>
      <button className={buttonClass} onClick={toggleRecording} disabled={isDisabledRecordButton}>
        <IconMicrophone />
      </button>
      <div className="visuallyHidden">
        <SummarizationComponent
          documentId={documentId}
          finalTranscription={finalTranscription}
        />
      </div>
    </>
  );
};

export { Microphone };
