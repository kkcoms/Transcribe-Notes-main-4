// page.tsx
"use client";

// Make sure all import statements are at the top of the file
import { useMutation, useQuery } from "convex/react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import Transcription from "@/app/(speech)/app/components/Transcription";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import { Microphone } from "@/app/(speech)/app/components/Microphone";
import TranscriptionContext from "@/app/(speech)/app/components/TranscriptionContext";
import { IconPicker } from "@/components/icon-picker";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import DetailsSection from "@/app/(main)/_components/details-section";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface DocumentIdPageProps {
  params: {
    documentId: Id<"documents">;
  };
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  const { 
    isDisabledRecordButton,
    audioFileUrl, 
    setAudioFileUrl, 
    setAudioCurrentTime, 
    isTranscribed, 
    setIsTranscribed, 
    addFinalTranscription, 
    clearFinalTranscriptions,
    setLiveTranscription,
    setSummarizationResult,
    summarizationResult,
    summaryNote,
    setSummaryNote
   } = useContext(TranscriptionContext);

  const document = useQuery(api.documents.getById, {
    documentId: params.documentId,
  });

  useEffect(() => {
    clearFinalTranscriptions();
    setAudioFileUrl("");
    setIsTranscribed(false);
    setAudioCurrentTime(0);
    setSummarizationResult("");
    setSummaryNote("");
    setLiveTranscription(null);
  }, [params.documentId]);

  useEffect(() => {
    if (document && document.content) {
      console.log('document', document)
      const content = JSON.parse(document.content);
      if (content && !isTranscribed) {
        content?.map(function(transcription: any, index: any) {
          addFinalTranscription(transcription);
          setIsTranscribed(true);
        })
      }
      if (document.audioFileUrl) {
        setAudioFileUrl(document.audioFileUrl);
      }

      setSummarizationResult(document.summarizationResult ? document.summarizationResult: "");

      setSummaryNote(document.summaryNote? document.summaryNote: "");
    }
  }, [document]);

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Document not found.</div>;
  }
  // return (
  //   <TranscriptionProvider>
  //     <div className="pb-40">
  //     <Cover url={document.coverImage} />
  //       <div className="mx-auto max-w-7xl px-4 lg:px-8">
  //       <Toolbar initialData={document} />

  //         <button
  //           className="lg:hidden" // This button is only visible on small screens
  //           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
  //         >
  //           {/* Icon or label for the button */}
  //           {isSidebarOpen ? 'Close' : 'Summary'}
  //         </button>
  //         <div className="flex flex-col lg:flex-row gap-x-8">
  //           <div className="flex-1 lg:flex-3/4 p-4 order-2 lg:order-1"> {/* Main content */}
  //           <Editor
  //                 onChange={onChange}
  //                 initialContent={document.content}
  //               />
  //               <Microphone documentId={params.documentId} />
  //           </div>
  //           <div
  //             className={`w-full lg:w-1/4 p-4 order-1 lg:order-2 ${
  //               isSidebarOpen ? 'block' : 'hidden'
  //             } lg:block`} // Control visibility on small screens
  //           >
  //             <div className="sticky top-20 text-lg lg:text-xl">
  //               {/* Summary content */}
  //               <div dangerouslySetInnerHTML={{ __html: fetchedSummarizationResult || '' }} />
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </TranscriptionProvider>
  // );
  return (
    <div className="flex h-full justify-end">
      <div className={`flex flex-col page ${!isCollapsed && isMobile ? 'w-0' : 'w-full transition-all ease-in-out duration-300'} h-full`}>
        <div className={"page-content w-auto" + (!isTranscribed ? "h-full" : "")}>
          <Cover url={document.coverImage} />
          {!!document.icon && (
            <div className="flex absolute transform translate-y-[-50%] left-[40px] bg-[#50d71e] w-[120px] h-[120px] p-[8px] justify-center rounded-md z-50">
              <IconPicker onChange={() => { }}>
                <p className="text-6xl hover:opacity-75 transition">
                  {document.icon}
                </p>
              </IconPicker>
            </div>
          )}

          <div className="body flex flex-col gap-y-[16px]">
            <Toolbar initialData={document} />
            <Tabs>
              <TabList>
                <Tab selectedClassName="TabsTrigger text-black">
                  <div className="text-sm font-bold">Transcription</div>
                </Tab>
                <Tab selectedClassName="TabsTrigger bg-transparent text-black">
                  <div className="text-sm font-bold">Summary</div>
                </Tab>
              </TabList>

              <TabPanel>
                <Transcription />
              </TabPanel>
              <TabPanel>
                <h2>{summarizationResult}</h2>
              </TabPanel>
            </Tabs>
          </div>
        </div>
        {!isTranscribed && <Microphone documentId={params.documentId} />}
        {isTranscribed && audioFileUrl && (
          <div className="fixed audio-wrapper left-0 right-0">
            <AudioPlayer
              autoPlay
              src={audioFileUrl}
              onListen={(e: any) => setAudioCurrentTime(parseFloat(e.srcElement.currentTime))}
            // other props here
            />
          </div>
        )}
      </div>
      <DetailsSection documentId={params.documentId} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    </div>
  );
};

export default DocumentIdPage;