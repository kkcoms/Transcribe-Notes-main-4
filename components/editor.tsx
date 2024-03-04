// This is the editor component that is used in the app. It uses the BlockNoteEditor and BlockNoteView components from the @blocknote/core and @blocknote/react packages.
//editor.tsx
"use client";
import React, { useContext, useEffect } from "react";
import { useTheme } from "next-themes";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import { useEdgeStore } from "@/lib/edgestore";
import TranscriptionContext from "@/app/(speech)/app/components/TranscriptionContext"; // This is the corrected import path

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();
  const { currentSessionId } =
    useContext(TranscriptionContext);

  // console.log("resolvedTheme:", resolvedTheme);
  // console.log("edgestore:", edgestore);
  // console.log("finalTranscription:", finalTranscription);
  // console.log("currentSessionId:", currentSessionId);
  console.log('initialContent', initialContent)

  let editor: BlockNoteEditor;
  try {
    //check if initialContent is JSON parseable
    editor = useBlockNote({
      editable,
      initialContent: initialContent
        ? (JSON.parse(initialContent) as PartialBlock[])
        : undefined,
      onEditorContentChange: (editor) => {
        onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
      },
      uploadFile: async (file: File) => {
        const response = await edgestore.publicFiles.upload({ file });
        return response.url;
      },
    });
  } catch(error) {
    // if content is a string, which means you have just completed recording
    const transcriptionBlockId = `transcription-${currentSessionId}`;
    editor = useBlockNote({
      editable,
      initialContent: undefined,
      onEditorContentChange: (editor) => {
        onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
      },
      uploadFile: async (file: File) => {
        const response = await edgestore.publicFiles.upload({ file });
        return response.url;
      },
    });

    const blockExists = editor.getBlock(transcriptionBlockId);

    if(!blockExists) {
      const arrayContent = initialContent?.split('\n');
      console.log('arrayContent', arrayContent)
      arrayContent?.map((paragraph, index) => {
        if(paragraph != '\n' && paragraph != '') {
          const newBlock: PartialBlock = {
            id: transcriptionBlockId,
            type: "bulletListItem",
            content:paragraph
          };
          editor.insertBlocks(
            [newBlock],
            editor.topLevelBlocks[editor.topLevelBlocks.length - 1],
            "after"
          );
        }            
      })
    }
  }


  
  // useEffect(() => {
  //   const transcriptionBlockId = `transcription-${currentSessionId}`;

  //   // if (editor) {

  //     // const blockExists = editor.getBlock(transcriptionBlockId);

  //     // if (summaryNote) {
  //     //   // If final transcription is available and the block exists, update it
  //     //   if (blockExists) {
  //     //     editor.updateBlock(transcriptionBlockId, {
  //     //       content: finalTranscription.transcript,
  //     //     });
  //     //   } else {
  //     //     // If the block doesn't exist yet, create it with final transcription
  //     //     const newBlock: PartialBlock = {
  //     //       id: transcriptionBlockId,
  //     //       type: "paragraph",
  //     //       content: finalTranscription.transcript,
  //     //     };
  //     //     editor.insertBlocks(
  //     //       [newBlock],
  //     //       editor.topLevelBlocks[editor.topLevelBlocks.length - 1],
  //     //       "after"
  //     //     );
  //     //   }
  //     // } else if (liveTranscription && !blockExists) {
  //     //   // If only live transcription is available and the block doesn't exist, create it
  //     //   const newBlock: PartialBlock = {
  //     //     id: transcriptionBlockId,
  //     //     type: "paragraph",
  //     //     content: liveTranscription.transcript,
  //     //   };
  //     //   editor.insertBlocks(
  //     //     [newBlock],
  //     //     editor.topLevelBlocks[editor.topLevelBlocks.length - 1],
  //     //     "after"
  //     //   );
  //     // } else if (liveTranscription && blockExists) {
  //     //   // If the block exists, update it with live transcription
  //     //   editor.updateBlock(transcriptionBlockId, {
  //     //     content: liveTranscription.transcript,
  //     //   });
  //     // }
  //   }
  // }, [editor, currentSessionId]);

  return (
    <div>
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
      {/*
            <div>
              <h3>Live Transcription:</h3>
              <p>{liveTranscription}</p>
              <h3>Final Transcription:</h3>
              <p>{finalTranscription}</p>
            </div>
      */}
    </div>
  );
};

export default Editor;
