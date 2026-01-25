"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, Square } from "lucide-react"

interface TransportControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onStop: () => void
}

export function TransportControls({ isPlaying, onPlayPause, onStop }: TransportControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="icon" onClick={onStop} className="h-10 w-10">
        <Square className="h-4 w-4" />
      </Button>
      <Button
        variant="default"
        size="icon"
        onClick={onPlayPause}
        className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  )
}
