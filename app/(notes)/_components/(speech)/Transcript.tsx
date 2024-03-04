'use client';
import React, { useState, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { IconMicrophone } from './IconMicroPhone';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Id } from "@/convex/_generated/dataModel";

type Props = {
    
};

const Transcript = ({noteId}:{noteId:Id<'documents'>}) => {
    const [isRecording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const transcriptionRef = useRef<HTMLDivElement | null>(null);
    const generateUploadUrl = useMutation(api.note.generateUploadUrl);
    const updateNoteWithAudio = useMutation(api.note.updateNoteWithAudio); 
    const updateNote = useMutation(api.note.update)
    const chunks = useRef<Blob[]>([]);

    const toggleRecording = async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const deepgram = createClient(`${process.env.NEXT_PUBLIC_VOICELY_API_SECRET}`);
            const live = deepgram.listen.live({ 
                model: "nova",         
                interim_results: true,
                smart_format: true,
                punctuate:true,
                paragraphs:true,
                utterances:false,
                // profanity_filter:false
                diarize: true,
            });

            const mediaRecorder = new window.MediaRecorder(stream, { mimeType: "audio/webm" });

            mediaRecorderRef.current = mediaRecorder;

            live.on(LiveTranscriptionEvents.Open, () => {
                console.log("Connection opened");

                mediaRecorder.addEventListener('dataavailable', (event) => {
                    live.send(event.data);
                });

                mediaRecorder.start(250);
            });

            live.on(LiveTranscriptionEvents.Close, async () => {
                console.log("Connection closed");
                setRecording(false);

                // try {
                //     const audioBlob = new Blob(chunks.current, { type: "audio/webm" });

                //     // Fetch a URL for uploading
                //     const uploadUrl = await generateUploadUrl();

                //     // Upload the audio blob to the obtained URL
                //     const result = await fetch(uploadUrl, {
                //         method: 'POST',
                //         headers: {
                //             'Content-Type': 'audio/webm',
                //         },
                //         body: audioBlob,
                //     });

                //     const audioFileRef = await result.json(); 

                //     // Update note with audio reference
                //     const promise =  updateNoteWithAudio({
                //         noteId: noteId,  // Replace with actual note ID
                //         audioFileRef: audioFileRef.storageId, 
                //         storageId: audioFileRef.storageId
                //     });

                //     toast.promise(promise, {
                //         loading: "updating the  note audio ...",
                //         success: "updated note audio successfully",
                //         error: "Failed to update note audio "
                //     });

                //     const promise2 = updateNote({id:noteId, content:transcriptionRef.current?.innerHTML || ""});

                //     toast.promise(promise2, {
                //         loading: "updating the  note  ...",
                //         success: "updated note  successfully",
                //         error: "Failed to update note "
                //     });


                // } catch (error) {
                //     console.error("Error uploading audio:", error);
                // }
            });

            live.on(LiveTranscriptionEvents.Transcript, (data) => {
                console.log(data.channel.alternatives[0].words[0].speaker, data.channel.alternatives[0].transcript);
                // console.log(data)
                // const words = data.channel.alternatives[0].words;
                // const caption = words
                //   .map((word: any) => word.punctuated_word ?? word.word)
                //   .join(" ");
                // if (caption !== "") {
                //   setCaption(caption);
                // }
                // console.log(caption)
                // Handle the transcript data as needed

                function formatDuration(seconds:number) {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    const remainingSeconds = Math.floor(seconds % 60);
                
                    const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
                    return formattedTime;
                }
                
                function pad(number:number) {
                    return (number < 10 ? '0' : '') + number;
                }

                if(data.is_final === true){
                    const p = document.createElement('p')
                    p.style.paddingTop = '4px'
                    p.style.paddingBottom = '4px'
                    const time = formatDuration(data.channel.alternatives[0].words[0].start)
                    p.textContent = `[ Speaker${data.channel.alternatives[0].words[0].speaker} ${time}] : ${data.channel.alternatives[0].transcript}`
                    transcriptionRef.current?.appendChild(p)
                }
            });

            setRecording(true);

        } catch (error) {
            console.error("Error accessing audio: ", error);
        }
    };

// ... (previous code)

const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setRecording(false);

        try {
            const audioBlob = new Blob(chunks.current, { type: "audio/webm" });

            // Fetch a URL for uploading
            const uploadUrl = await generateUploadUrl();

            // Upload the audio blob to the obtained URL
            const result1 = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'audio/webm',
                },
                body: audioBlob,
            });

            const audioFileRef = await result1.json(); 

            // Update note with audio reference
            const promise =  updateNoteWithAudio({
                noteId: noteId,
                audioFileRef: audioFileRef.storageId, 
                storageId: audioFileRef.storageId
            });

            toast.promise(promise, {
                loading: "updating the  note audio ...",
                success: "updated note audio successfully",
                error: "Failed to update note audio "
            });

            const fileUrl = await promise.then((res) => res.fileUrl)

            const deepgram = createClient(`${process.env.NEXT_PUBLIC_VOICELY_API_SECRET}`);

            // STEP 2: Call the transcribeUrl method with the audio payload and options
            const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
                {
                url: fileUrl,
                },
                // STEP 3: Configure Deepgram options for audio analysis
                {
                model: "nova-2",
                smart_format: true,
                diarize:true,
                punctuate:true,
                paragraphs:true,
                }
            );

            console.log("New Transcribed",result)

            if (error) throw error;

            

            // Update note content immediately
            const promise2 = updateNote({
                id: noteId,
                content: transcriptionRef.current?.innerHTML || ""
            });

            toast.promise(promise2, {
                loading: "updating the  note  ...",
                success: "updated note  successfully",
                error: "Failed to update note "
            });

            // Clear the transcriptionRef innerHTML
            transcriptionRef.current!.innerHTML = "";
            
        } catch (error) {
            console.error("Error uploading audio:", error);
        }
    }
};

// ... (rest of the code)




    const buttonClass = `fixed bottom-16 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer z-50 animate-smooth-gentlePulse ${
        isRecording ? ' bg-red-500' : ' bg-slate-800 dark:bg-slate-600'
    }`;

    return (
        <div>
            {/* <button  disabled={isRecording}>
                {isRecording ? 'Recording...' : 'Start Recording'}
            </button> */}
            <button className={buttonClass} onClick={toggleRecording}>
                <IconMicrophone />
            </button>
            {/* {isRecording && <button onClick={stopRecording}>Stop Recording</button>} */}
            <div className='px-5' ref={transcriptionRef} id='transcription'></div>
        </div>
    );
};

export default Transcript;
