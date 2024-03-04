//useRecordVoice.ts
//useRecordVoice.ts
"use client";

import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveTranscriptionEvents,
  createClient,
} from "@deepgram/sdk";
import { useQueue } from "@uidotdev/usehooks";
import TranscriptionContext from "../app/components/TranscriptionContext";
import { createMediaStream } from "../utils/createMediaStream";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Transcription } from "@/app/types";
import { formatTimestamp } from "@/app/(speech)/utils";

const model = {
  model: "nova",
  interim_results: true,
  smart_format: true,
  diarize: true,
  utterances: true,
  // punctuate: true,
};

export const useRecordVoice = (
  documentId: Id<"documents">,
  onTranscriptionComplete: any
) => {
  const [apiKey, setApiKey] = useState<CreateProjectKeyResponse | null>();
  const [, setLoadingKey] = useState(true);
  const { add, remove, first, size, queue } = useQueue<any>([]);
  const [connection, setConnection] = useState<LiveClient | null>();
  const [isListening, setListening] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [microphone, setMicrophone] = useState<MediaRecorder | null>();
  const [userMedia, setUserMedia] = useState<MediaStream | null>();
  const chunks = useRef<Blob[]>([]);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const updateNoteWithAudio = useMutation(api.documents.updateNoteWithAudio);
  const updateDocument = useMutation(api.documents.update);
  const updateSummaryNote = useMutation(api.documents.saveSummaryNote);

  const {
    setLiveTranscription,
    addFinalTranscription,
    setFinalTranscription,
    generateNewSessionId,
    clearFinalTranscriptions,
    setIsTranscribed,
    isDisabledRecordButton,
    setisDisabledRecordButton,
    setAudioFileUrl,
    setSummarizationResult,
    setSummaryNote
  } = useContext(TranscriptionContext);

  const sendSummaryForBlocknote = async (summary: string) => {
    if (
      summary.length > 0
    ) {
      try {
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ content: summary }],
          }),
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const data = (await response.json()).data;
        console.log('Summary Note result:', data);
        return data;

      } catch (error) {
        console.error(
          "Error sending transcription for summarization:",
          error
        );
      }
      return null;
    }
  };


  const toggleMicrophone = useCallback(async () => {
    if (microphone && userMedia) {
      setUserMedia(null);
      setMicrophone(null);
      microphone.stop();

    } else {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      generateNewSessionId();

      const microphone = new MediaRecorder(userMedia);
      microphone.start(500);

      microphone.onstart = () => {
        setMicOpen(true);

        // createMediaStream(microphone.stream, true, (peak: number) => {});
        chunks.current = [];
        console.log("useRecordVoice.js - MediaRecorder started");
      };

      microphone.onstop = async () => {
        setMicOpen(false);
        setisDisabledRecordButton(true);
        const audioBlob = new Blob(chunks.current, { type: "audio/mp3" });
        // blobToBase64(audioBlob, getText); // Assuming you still want to convert and handle the text from the audio
        console.log("useRecordVoice.js - MediaRecorder stopped");

        try {
          const postUrl = await generateUploadUrl();
          console.log('is transcribing audio file, postUrl is', postUrl)

          const result = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'audio/mp3' },
            body: audioBlob,
          });
          const audioFileRef = await result.json(); // Assume this returns a reference to the uploaded audio file


            // Here, call the mutation to update the note with the audio file reference
            // Assume you have the note's ID and a mutation set up to update the note
            const uploadResult = await updateNoteWithAudio({ noteId: documentId, audioFileRef: audioFileRef.storageId, storageId: audioFileRef.storageId });
            if(uploadResult.success) {
              const transcribeResponse = await fetch("/api/deepgram/",             
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    url: uploadResult.fileUrl
                  })}
              );
              setAudioFileUrl(uploadResult.fileUrl);
              const utteranceResult = await transcribeResponse.json();
              console.log('utteranceResult', utteranceResult);

              clearFinalTranscriptions();
              
              const utterances = utteranceResult.results.utterances;
              utterances.map(function(transcription: Transcription, index: any){
                transcription.timestamp = formatTimestamp(transcription.start);
                addFinalTranscription(transcription);
              })
              
              const summary = utteranceResult.results.summary;
              if(summary.result === "success")  {
                setSummarizationResult(summary.short);
                const summaryNote = await sendSummaryForBlocknote(summary.short);
                setSummaryNote(summaryNote);
                await updateDocument({ id: documentId, content: JSON.stringify(utterances), summarizationResult: summary.short, summaryNote: summaryNote });
                setIsTranscribed(true);
                setisDisabledRecordButton(false);
              }              
            }

        } catch (error) {
          console.error("Error uploading audio:", error);
        }
      };

      microphone.ondataavailable = (e) => {
        add(e.data);
        chunks.current.push(e.data);
      };

      setUserMedia(userMedia);
      setMicrophone(microphone);
    }
  }, [add, microphone, userMedia]);

  useEffect(() => {
    if (!apiKey) {
      console.log("getting a new api key");
      fetch("/api/deepgram", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          if (!("key" in object)) throw new Error("No api key returned");

          setApiKey(object);
          setLoadingKey(false);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey && "key" in apiKey) {
      console.log("connecting to deepgram");
      const deepgram = createClient(apiKey?.key ?? "");
      const connection = deepgram.listen.live(model);
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("connection established");
        setListening(true);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("connection closed");
        setListening(false);
        setApiKey(null);
        setConnection(null);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const alternatives = data.channel.alternatives[0];
        const words = alternatives.words;
        console.log('words detected', words)
        // Process only if we have words.
        if (words && words.length > 0) {
          const speaker = words[0].speaker; // Assuming all words in this transcript have the same speaker.
          const startSeconds = words[0].start; // Start time of the first word.

          const formattedTimestamp = formatTimestamp(startSeconds);

          const isFinal = data.is_final;

          if (isFinal) {
            addFinalTranscription({
              ...alternatives,
              timestamp: formattedTimestamp,
              speaker: speaker,
            });
            setFinalTranscription({
              ...alternatives,
              timestamp: formattedTimestamp,
              speaker: speaker,
            });
            setLiveTranscription(null);
            console.log("final transcript: ", alternatives);
          } else {
            console.log("live transcript", alternatives);
            setLiveTranscription({
              ...alternatives,
              timestamp: formattedTimestamp,
              speaker: speaker,
            });
          }
        }
      });

      setConnection(connection);
    }
  }, [apiKey]);

  useEffect(() => {
    const processQueue = async () => {
      if (size > 0 && !isProcessing) {
        setProcessing(true);

        if (isListening) {
          const blob = first;
          connection?.send(blob);
          remove();
        }

        const waiting = setTimeout(() => {
          clearTimeout(waiting);
          setProcessing(false);
        }, 250);
      }
    };

    processQueue();
  }, [connection, queue, remove, first, size, isProcessing, isListening]);

  return { micOpen, toggleMicrophone };
};
