"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { MidiNote } from "@/lib/types"

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

function getPitchName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1
  const note = NOTE_NAMES[pitch % 12]
  return `${note}${octave}`
}

interface SequencerViewProps {
  notes: MidiNote[]
  onNoteClick: (noteId: string) => void
  playheadPosition: number
  isPlaying: boolean
}

const PIANO_LABEL_WIDTH = 48

export function SequencerView({ notes, onNoteClick, playheadPosition, isPlaying }: SequencerViewProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const activePitches = useMemo(() => {
    const pitches = new Set(notes.map((n) => n.pitch))
    return Array.from(pitches).sort((a, b) => b - a)
  }, [notes])

  const maxTime = Math.max(...notes.map((n) => n.startTime + n.duration), 4)
  const totalBeats = Math.ceil(maxTime)

  const beatWidth = dimensions.width > 0 ? dimensions.width / totalBeats : 100
  const rowHeight = activePitches.length > 0 && dimensions.height > 0 ? dimensions.height / activePitches.length : 40

  const pitchToRowIndex = useMemo(() => {
    const map = new Map<number, number>()
    activePitches.forEach((pitch, index) => {
      map.set(pitch, index)
    })
    return map
  }, [activePitches])

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header with beat markers */}
      <div className="flex h-8 shrink-0 border-b border-border">
        <div className="shrink-0 border-r border-border bg-card" style={{ width: PIANO_LABEL_WIDTH }} />
        <div className="flex flex-1">
          {Array.from({ length: totalBeats }, (_, i) => (
            <div
              key={i}
              className="flex h-8 flex-1 items-center justify-center border-r border-border/50 bg-secondary/50 text-xs text-muted-foreground"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Main sequencer area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Piano roll labels - uses same row heights as grid */}
        <div className="flex shrink-0 flex-col border-r border-border bg-card" style={{ width: PIANO_LABEL_WIDTH }}>
          {activePitches.map((pitch) => {
            const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12)
            return (
              <div
                key={pitch}
                className={cn(
                  "flex flex-1 items-center justify-end border-b border-border/30 px-2 text-xs font-medium",
                  isBlackKey ? "bg-secondary/80 text-muted-foreground" : "text-foreground",
                )}
              >
                {getPitchName(pitch)}
              </div>
            )
          })}
        </div>

        {/* Grid and notes container */}
        <div ref={gridRef} className="relative flex-1 overflow-hidden">
          {/* Grid lines */}
          <svg className="absolute inset-0 h-full w-full">
            {/* Vertical beat lines */}
            {Array.from({ length: totalBeats + 1 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * beatWidth}
                y1={0}
                x2={i * beatWidth}
                y2={dimensions.height}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeOpacity={0.5}
              />
            ))}
            {/* Horizontal row lines */}
            {activePitches.map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * rowHeight}
                x2={dimensions.width}
                y2={i * rowHeight}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeOpacity={0.3}
              />
            ))}
          </svg>

          {/* Notes */}
          {notes.map((note) => {
            const rowIndex = pitchToRowIndex.get(note.pitch) ?? 0
            const top = rowIndex * rowHeight
            const left = note.startTime * beatWidth
            const width = note.duration * beatWidth

            return (
              <button
                key={note.id}
                onClick={() => onNoteClick(note.id)}
                onMouseEnter={() => setHoveredNote(note.id)}
                onMouseLeave={() => setHoveredNote(null)}
                className={cn(
                  "absolute rounded-sm border transition-all duration-150",
                  note.muted
                    ? "border-muted bg-muted opacity-50"
                    : "border-green-400/70 bg-green-500 hover:brightness-110",
                  hoveredNote === note.id && "ring-2 ring-primary/50",
                )}
                style={{
                  top: top + 2,
                  left,
                  width: Math.max(width - 2, 4),
                  height: rowHeight - 4,
                }}
                title={`${getPitchName(note.pitch)} - ${note.muted ? "Muted (click to unmute)" : "Click to mute"}`}
              />
            )
          })}

          {/* Playhead */}
          {isPlaying && (
            <div
              className="absolute top-0 z-10 w-0.5 bg-red-500"
              style={{
                left: playheadPosition * beatWidth,
                height: dimensions.height,
              }}
            />
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
        <span>Click note to mute/unmute</span>
        <span>
          {notes.filter((n) => n.muted).length} muted / {notes.length} total
        </span>
      </div>
    </div>
  )
}
