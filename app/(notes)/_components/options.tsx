import React, { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { useMutation, useQuery } from "convex/react";
  import { toast } from "sonner";
  
  import { MoreHorizontal, Plus} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


import { api } from '@/convex/_generated/api'
import { Id } from "@/convex/_generated/dataModel";
  
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


type Props = {}

const Options = ({
    folder = true,
    folderId,
    deleteOptions = false,
    showOption = false,
    note = true,
    noteId,
}:{
    folder?:boolean,
    folderId?:Id<"folder">
    deleteOptions?:boolean
    showOption:boolean
    note?:boolean
    noteId?:Id<"documents">
}) => {
    const folders = useQuery(api.folder.getAllFolders,{});
    const createfolder = useMutation(api.folder.create);
    const createnote = useMutation(api.note.create);
    const deletefolder = useMutation(api.folder.deleteFolder)
    const deletenote = useMutation(api.note.deleteNote)
    const movenote = useMutation(api.note.moveNote)
    const updatefoldertitle = useMutation(api.folder.updateTitleFolder)
    const updatenotetitle = useMutation(api.note.updateTitleNote)
    const [selectedFolder, setSelectedFolder] = useState<Id<"folder">>()
    const [title, setTitle] = useState<string>("")
    console.log(selectedFolder)

    const handleCreateFolder = () => {
      const promise = createfolder({ title: "Untitled" })
        // .then((documentId) => router.push(`/documents/${documentId}`))
  
      toast.promise(promise, {
        loading: "Creating a new folder...",
        success: "New folder created!",
        error: "Failed to create a new folder."
      });
    };
    const handleCreateNote = () => {
      const promise = createnote({ title: "Untitled", folderId: folderId })
        // .then((documentId) => router.push(`/documents/${documentId}`))
  
      toast.promise(promise, {
        loading: "Creating a new note...",
        success: "New note created!",
        error: "Failed to create a new note."
      });
    };

    const handleDeleteFolder = () => {
        if(!folderId) return
        const promise = deletefolder({folderId:folderId})
        toast.promise(promise, {
            loading: "Deleting the  folder ...",
            success: "Deleted folder successfully",
            error: "Failed to delete folder"
        });
    }
    const handleDeleteNote = () => {
        if(!noteId) return
        const promise = deletenote({noteId})
        toast.promise(promise, {
            loading: "Deleting the  note ...",
            success: "Deleted note successfully",
            error: "Failed to delete note"
        });
    }

    const handleMoveNote = () => {
        if(!noteId || !selectedFolder) return
        const promise = movenote({noteId, folderId:selectedFolder})

        toast.promise(promise, {
            loading: "Moving note ...",
            success: "Moved note successfully",
            error: "Failed to move note"
        });
    }

    const handleEditFolder = () => {
        if(!folderId) return
        const promise = updatefoldertitle({folderId:folderId, title})
        toast.promise(promise, {
            loading: "updating the  folder title ...",
            success: "updated folder title successfully",
            error: "Failed to update folder title"
        });
    }
    const handleEditNote = () => {
        if(!noteId) return
        const promise = updatenotetitle({noteId, title})
        toast.promise(promise, {
            loading: "updating the  note title ...",
            success: "updated note title successfully",
            error: "Failed to update note title"
        });
    }
  return (
    <div className='px-3'>
        <DropdownMenu>
          <DropdownMenuTrigger className='cursor-pointer hover:bg-primary/10 p-1 rounded-md'>
            <span className={`${showOption ? "" :"invisible"}`}>
             <MoreHorizontal size={18}/>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='max-w-[250px] min-w-[180px]'>
            <DropdownMenuItem className={`${folder ? "" : "hidden"}`} onClick={handleCreateFolder}>Add Folder</DropdownMenuItem>
            <DropdownMenuItem className={`${note ? "" : "hidden"}`} onClick={handleCreateNote}>Add Note</DropdownMenuItem>
            {(note === false && noteId) && (
                <div>
                    <Dialog >
                        <DialogTrigger className='w-full text-left text-sm p-1 px-2 hover:bg-primary/10 rounded'>Move to</DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle className='text-base mb-2'>Select Folder</DialogTitle>
                            <Select onValueChange={(event) => setSelectedFolder(event as Id<"folder">)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    {folders?.map((folder) => (
                                        <SelectItem key={folder._id} value={folder._id}>{folder.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            </DialogHeader>
                            <DialogClose onClick={handleMoveNote}><Button className='w-full'>Move</Button></DialogClose>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
            {(deleteOptions && folderId) && (
                <div>
                <DropdownMenuItem  onClick={handleDeleteFolder}>Delete Folder</DropdownMenuItem>
                <div>
                    <Dialog >
                        <DialogTrigger className='w-full text-left text-sm p-1 px-2 hover:bg-primary/10 rounded'>Edit Folder</DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle className='text-base mb-2'>Folder Title</DialogTitle>
                            <Input onChange={(e) => setTitle(e.target.value)} placeholder='title' />
                            </DialogHeader>
                            <DialogClose onClick={handleEditFolder}><Button className='w-full'>Save</Button></DialogClose>
                        </DialogContent>
                    </Dialog>
                </div>
                </div>
            )}
            {(deleteOptions && noteId) &&(
                <div>
                <DropdownMenuItem  onClick={handleDeleteNote}>Delete Note</DropdownMenuItem>
                <div>
                    <Dialog >
                        <DialogTrigger className='w-full text-left text-sm p-1 px-2 hover:bg-primary/10 rounded'>Edit Note</DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle className='text-base mb-2'>Note Title</DialogTitle>
                            <Input onChange={(e) => setTitle(e.target.value)}  placeholder='title' />
                            </DialogHeader>
                            <DialogClose onClick={handleEditNote}><Button className='w-full'>Save</Button></DialogClose>
                        </DialogContent>
                    </Dialog>
                </div>
                </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
    </div>
  )
}

export default Options
