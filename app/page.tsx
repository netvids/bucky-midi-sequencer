"use client"

import { useState, useEffect } from "react"
import { ControlPanel } from "@/components/control-panel"
import { SequencerView } from "@/components/sequencer-view"
import { TransportControls } from "@/components/transport-controls"
import { UploadDialog } from "@/components/upload-dialog"
import type { MidiTrack, MidiNote } from "@/lib/types"
import { useMidi, useMidiPlayback } from "@/hooks/use-midi"
import { createMidiFile } from "@/lib/create-midi-file"

// Demo data for visualization
const demoNotes: MidiNote[] = [
  { id: "1", pitch: 60, startTime: 0, duration: 0.5, velocity: 100, muted: false },
  { id: "2", pitch: 62, startTime: 0.5, duration: 0.5, velocity: 90, muted: false },
  { id: "3", pitch: 64, startTime: 1, duration: 1, velocity: 110, muted: false },
  { id: "4", pitch: 65, startTime: 2, duration: 0.5, velocity: 85, muted: false },
  { id: "5", pitch: 67, startTime: 2.5, duration: 0.5, velocity: 95, muted: false },
  { id: "6", pitch: 69, startTime: 3, duration: 1, velocity: 100, muted: false },
  { id: "7", pitch: 64, startTime: 4, duration: 0.5, velocity: 80, muted: false },
  { id: "8", pitch: 62, startTime: 4.5, duration: 0.5, velocity: 75, muted: false },
  { id: "9", pitch: 60, startTime: 5, duration: 1, velocity: 100, muted: false },
  { id: "10", pitch: 72, startTime: 6, duration: 0.5, velocity: 110, muted: false },
  { id: "11", pitch: 71, startTime: 6.5, duration: 0.5, velocity: 90, muted: false },
  { id: "12", pitch: 69, startTime: 7, duration: 1, velocity: 85, muted: false },
]

export default function MidiSequencer() {
  const [track, setTrack] = useState<MidiTrack>({
    id: "demo",
    name: "Demo Track",
    notes: demoNotes,
    channel: 1,
    bank: 1,
    program: 1,
  })
  const [tempo, setTempo] = useState(120)
  const [syncMode, setSyncMode] = useState<"internal" | "external">("internal")
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadPosition, setPlayheadPosition] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loop, setLoop] = useState(false)
  const [octave, setOctave] = useState(0)

  const {
    outputs,
    selectedOutput,
    selectOutput,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendBankSelect,
    sendAllNotesOff,
    isReady: midiReady,
  } = useMidi()

  const { startPlayback, stopPlayback } = useMidiPlayback()

  useEffect(() => {
    if (midiReady) {
      sendBankSelect(track.bank, track.channel)
      sendProgramChange(track.program, track.channel)
    }
  }, [track.bank, track.program, track.channel, midiReady, sendBankSelect, sendProgramChange])

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback(track.channel, sendNoteOff)
      setIsPlaying(false)
    } else {
      if (midiReady) {
        sendAllNotesOff(track.channel)
        startPlayback(
          track.notes,
          tempo,
          track.channel,
          octave,
          loop,
          sendNoteOn,
          sendNoteOff,
          setPlayheadPosition,
          () => setIsPlaying(false),
        )
        setIsPlaying(true)
      }
    }
  }

  const handleStop = () => {
    stopPlayback(track.channel, sendNoteOff)
    setIsPlaying(false)
    setPlayheadPosition(0)
  }

  const toggleNoteMute = (noteId: string) => {
    setTrack((prev) => ({
      ...prev,
      notes: prev.notes.map((note) => (note.id === noteId ? { ...note, muted: !note.muted } : note)),
    }))
  }

  const handleUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const parsedNotes = parseMidiFile(bytes)

    setTrack((prev) => ({
      ...prev,
      id: crypto.randomUUID(),
      name: file.name.replace(/\.mid$/i, ""),
      notes: parsedNotes,
    }))
    setUploadOpen(false)
  }

  const handleSaveProject = () => {
    // Export as MIDI file
    const midiBytes = createMidiFile(track.notes, tempo)
    const blob = new Blob([midiBytes], { type: "audio/midi" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${track.name || "project"}.mid`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLoadProject = async (file: File) => {
    try {
      const fileName = file.name.toLowerCase()
      
      if (fileName.endsWith('.mid') || fileName.endsWith('.midi')) {
        // Load MIDI file
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const parsedNotes = parseMidiFile(bytes)
        
        setTrack((prev) => ({
          ...prev,
          id: crypto.randomUUID(),
          name: file.name.replace(/\.(mid|midi)$/i, ""),
          notes: parsedNotes,
        }))
      } else {
        // Load JSON project file
        const text = await file.text()
        const projectData = JSON.parse(text)
        if (projectData.track) setTrack(projectData.track)
        if (projectData.tempo) setTempo(projectData.tempo)
        if (projectData.syncMode) setSyncMode(projectData.syncMode)
        if (typeof projectData.loop === "boolean") setLoop(projectData.loop)
        if (typeof projectData.octave === "number") setOctave(projectData.octave)
      }
    } catch (error) {
      console.error("Failed to load file:", error)
    }
  }

  return (
    <div className="flex h-[400px] w-full flex-col bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <h1 className="text-lg font-semibold text-foreground">MIDI Sequencer</h1>
        <TransportControls isPlaying={isPlaying} onPlayPause={handlePlayPause} onStop={handleStop} />
      </header>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Left Control Panel */}
        <ControlPanel
          track={track}
          tempo={tempo}
          syncMode={syncMode}
          loop={loop}
          octave={octave}
          onTempoChange={setTempo}
          onSyncModeChange={setSyncMode}
          onChannelChange={(ch) => setTrack((prev) => ({ ...prev, channel: ch }))}
          onBankChange={(bank) => setTrack((prev) => ({ ...prev, bank }))}
          onProgramChange={(prog) => setTrack((prev) => ({ ...prev, program: prog }))}
          onUploadClick={() => setUploadOpen(true)}
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProject}
          onLoopChange={setLoop}
          onOctaveChange={setOctave}
          midiOutputs={outputs}
          selectedMidiOutput={selectedOutput}
          onSelectMidiOutput={selectOutput}
        />

        {/* Sequencer View */}
        <SequencerView
          notes={track.notes}
          onNoteClick={toggleNoteMute}
          playheadPosition={playheadPosition}
          isPlaying={isPlaying}
        />
      </div>

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUpload={handleUpload} />
    </div>
  )
}

function parseMidiFile(bytes: Uint8Array): MidiNote[] {
  const notes: MidiNote[] = []
  const activeNotes = new Map<number, { startTime: number; velocity: number }>()

  let pos = 0
  let ticksPerBeat = 480
  let currentTick = 0

  // Read header
  if (bytes[0] === 0x4d && bytes[1] === 0x54 && bytes[2] === 0x68 && bytes[3] === 0x64) {
    pos = 8
    const format = (bytes[pos] << 8) | bytes[pos + 1]
    const numTracks = (bytes[pos + 2] << 8) | bytes[pos + 3]
    ticksPerBeat = (bytes[pos + 4] << 8) | bytes[pos + 5]
    pos += 6
  }

  // Helper to read variable length value
  function readVarLen(): number {
    let value = 0
    let byte: number
    do {
      byte = bytes[pos++]
      value = (value << 7) | (byte & 0x7f)
    } while (byte & 0x80)
    return value
  }

  // Parse tracks
  while (pos < bytes.length) {
    // Find track header
    if (bytes[pos] === 0x4d && bytes[pos + 1] === 0x54 && bytes[pos + 2] === 0x72 && bytes[pos + 3] === 0x6b) {
      pos += 4
      const trackLength = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]
      pos += 4
      const trackEnd = pos + trackLength
      currentTick = 0
      let runningStatus = 0

      while (pos < trackEnd) {
        const deltaTime = readVarLen()
        currentTick += deltaTime
        const timeInBeats = currentTick / ticksPerBeat

        let status = bytes[pos]

        // Handle running status
        if (status < 0x80) {
          status = runningStatus
        } else {
          pos++
          runningStatus = status
        }

        const type = status & 0xf0

        if (type === 0x90) {
          // Note On
          const pitch = bytes[pos++]
          const velocity = bytes[pos++]

          if (velocity > 0) {
            activeNotes.set(pitch, { startTime: timeInBeats, velocity })
          } else {
            // Velocity 0 = Note Off
            const start = activeNotes.get(pitch)
            if (start) {
              notes.push({
                id: crypto.randomUUID(),
                pitch,
                startTime: start.startTime,
                duration: Math.max(timeInBeats - start.startTime, 0.1),
                velocity: start.velocity,
                muted: false,
              })
              activeNotes.delete(pitch)
            }
          }
        } else if (type === 0x80) {
          // Note Off
          const pitch = bytes[pos++]
          pos++ // velocity
          const start = activeNotes.get(pitch)
          if (start) {
            notes.push({
              id: crypto.randomUUID(),
              pitch,
              startTime: start.startTime,
              duration: Math.max(timeInBeats - start.startTime, 0.1),
              velocity: start.velocity,
              muted: false,
            })
            activeNotes.delete(pitch)
          }
        } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
          pos += 2 // Skip 2 data bytes
        } else if (type === 0xc0 || type === 0xd0) {
          pos += 1 // Skip 1 data byte
        } else if (status === 0xff) {
          // Meta event
          const metaType = bytes[pos++]
          const metaLength = readVarLen()
          pos += metaLength
        } else if (status === 0xf0 || status === 0xf7) {
          // SysEx
          const sysexLength = readVarLen()
          pos += sysexLength
        }
      }
    } else {
      pos++
    }
  }

  return notes
}
