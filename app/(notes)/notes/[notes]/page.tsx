'use client'
import React from 'react'
import Image from 'next/image'
import { IconMicrophone } from '../../_components/(speech)/IconMicroPhone'
import Microphone from '../../_components/(speech)/microphone'
import { useState } from 'react'
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import Transcript from '../../_components/(speech)/Transcript'
import { useQuery } from 'convex/react'
import { Toolbar } from '@/components/toolbar'
import { api } from '@/convex/_generated/api'
import { Id } from "@/convex/_generated/dataModel";


type Props = {}

const NotePage = ({ params }: { params: { notes: string } }) => {
    const [transcript, setTranscript] = useState<string>('');
    const getNoteBYId = useQuery(api.note.getById, params.notes ? { noteId: params.notes as Id<"documents"> } : "skip")
    console.log(getNoteBYId)
    const StartTransciption = async () => {
        navigator.mediaDevices.getUserMedia({audio:true}).then((stream) => {
            const mediaRecorder = new window.MediaRecorder(stream, {mimeType: "audio/webm"})

            const deepgram = createClient(`${process.env.NEXT_PUBLIC_VOICELY_API_SECRET}`);

            const connection = deepgram.listen.live({
                model: "nova-2",
                language: "en-US",
                smart_format: true,
            });

            // const socket = new window.WebSocket('wss://api.deepgram.com/v1/listen',['token', `${process.env.NEXT_PUBLIC_VOICELY_API_SECRET}`])

            // socket.onopen = () => {
            //     mediaRecorder.addEventListener('dataavailable',event => {
            //         socket.send(event.data)
            //     })

            //     mediaRecorder.start(250)
            // }

            // socket.onmessage = (message) => {
            //     const recieved = JSON.parse(message.data)
            //     const newTranscript = recieved.channel.alternatives[0].transcript
            //     setTranscript((prevTranscript) => prevTranscript + ' ' + newTranscript);
            //     console.log(transcript)
            // }

            connection.on(LiveTranscriptionEvents.Open, () => {
                connection.on(LiveTranscriptionEvents.Close, () => {
                  console.log("Connection closed.");
                });
            
                connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                  console.log(data.channel.alternatives[0].transcript);
                });
            
                connection.on(LiveTranscriptionEvents.Metadata, (data) => {
                  console.log(data);
                });
            
                connection.on(LiveTranscriptionEvents.Error, (err) => {
                  console.error(err);
                });
            
                // STEP 4: Fetch the audio stream and send it to the live transcription connection
                // fetch(url)
                //   .then((r) => r.body)
                //   .then((res) => {
                //     res.on("readable", () => {
                //       connection.send(res.read());
                //     });
                //   });

                mediaRecorder.addEventListener('dataavailable',event => {
                    connection.send(event.data)
                })

                
            });
        })
    }

    // StartTransciption()
  return (
    <div className="">
        {/* <div onClick={StartTransciption}>
      <IconMicrophone />
      </div>
      <p>{transcript}</p> */}
      {/* <Microphone/> */}
      {getNoteBYId && (
        <div>
        <Toolbar initialData={getNoteBYId}/>
        <div className='px-5' dangerouslySetInnerHTML={{ __html: getNoteBYId.content || '' }} />
        </div>
      )}
      <Transcript noteId={params.notes as Id<'documents'>}/>
    </div>
  )
}

export default NotePage