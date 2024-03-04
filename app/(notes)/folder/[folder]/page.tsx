'use client'
import React from 'react'
import FolderComp from '../folder-comp'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from "@/convex/_generated/dataModel";



type Props = {}

const FolderPage = ({ params }: { params: { folder: string } }) => {
  const notes = useQuery(api.note.FolderNotes, {folderId:params.folder as Id<'folder'>})

  if(!notes) return <div>No Notes found</div>
return (
  <div className='p-5 mt-10'>
      <div className='grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5'>
      {notes.map((note) => (
          <div key={note._id}>
              <FolderComp note={note} />
          </div>
      ))}
      </div>
  </div>
)
}

export default FolderPage