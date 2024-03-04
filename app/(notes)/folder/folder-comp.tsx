"use client"
import React from 'react'
import { Doc } from '@/convex/_generated/dataModel'
import { FileText } from 'lucide-react'
import Link from 'next/link'


type Props = {}

const FolderComp = ({note}:{note:Doc<'documents'>}) => {
    const noteCreationDateTime = note._creationTime
    ? new Date(note._creationTime
        ) 
    : null;
  return (
    <Link href={`/notes/${note._id}`} className='inline-block '>
    <div className='flex  space-x-2 hover:bg-primary/5 rounded-md p-2'>
        <span>
            <FileText size={32} />
        </span>
        <div className='flex flex-col text-xs'>
            <span>{note.title}</span>
            {noteCreationDateTime && (
            <div className="text-sm text-gray-500">
            Created on: {noteCreationDateTime.toLocaleDateString()} at {noteCreationDateTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })}
                    </div>
            )}
        </div>
    </div>
    </Link>
  )
}

export default FolderComp