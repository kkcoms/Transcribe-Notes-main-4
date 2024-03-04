import { useQuery } from 'convex/react';
import React from 'react'
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Options from './options';
import { useState } from 'react';

import { api } from '@/convex/_generated/api'
import { Id } from "@/convex/_generated/dataModel";

type Props = {}

const Notes = ({folderId}:{
    folderId?:Id<"folder">
}) => {
    const notes = useQuery(api.note.getNotesById,{folderId});
    const [showOption, setShowOption] = useState<{key:string, value:boolean}>()
    const router = useRouter()
    if(!notes){
        return (
            <Skeleton className='w-4 h-4'/>
        )
    }
  return (
    <div className='border-b-[1px] mb-1'>
        {notes.map((note) => (
            <div key={note._id} onMouseEnter={() => setShowOption({ key: note._id, value: true })}
            onMouseLeave={() => setShowOption(undefined)}  onClick={() => router.push(`/notes/${note._id}`)} className='flex items-center justify-between hover:bg-primary/5 py-1 px-3'>
                <div className='flex items-center space-x-1'>
                    <FileText size={18} />
                    <span>{note.title}</span>
                </div>
                <div>
                    <Options showOption={showOption?.key === note._id } folder={false}  note={false} noteId={note._id} deleteOptions={true}/>
                </div>
            </div>
        ))}
    </div>
  )
}

export default Notes