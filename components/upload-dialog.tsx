"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileMusic } from "lucide-react"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => void
}

export function UploadDialog({ open, onOpenChange, onUpload }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.name.endsWith(".mid") || droppedFile?.name.endsWith(".midi")) {
      setFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = () => {
    if (file) {
      onUpload(file)
      setFile(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload MIDI File</DialogTitle>
          <DialogDescription>Select a MIDI file to load.</DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : file
                ? "border-accent bg-accent/10"
                : "border-border bg-secondary/50"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <FileMusic className="h-5 w-5 text-accent" />
              <span className="text-foreground">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop MIDI file here or{" "}
                <label className="cursor-pointer text-primary underline">
                  browse
                  <input type="file" accept=".mid,.midi" onChange={handleFileChange} className="hidden" />
                </label>
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
