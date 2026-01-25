"use client"

import type React from "react"
import type WebMidi from "webmidi"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Upload, Save, FolderOpen, Minus, Plus } from "lucide-react"
import type { MidiTrack } from "@/lib/types"
import { MidiDeviceSelector } from "@/components/midi-device-selector"
import type { MidiOutput } from "@/hooks/use-midi"

interface ControlPanelProps {
  track: MidiTrack
  tempo: number
  syncMode: "internal" | "external"
  loop: boolean
  octave: number
  onTempoChange: (tempo: number) => void
  onSyncModeChange: (mode: "internal" | "external") => void
  onChannelChange: (channel: number) => void
  onBankChange: (bank: number) => void
  onProgramChange: (program: number) => void
  onUploadClick: () => void
  onSaveProject: () => void
  onLoadProject: (file: File) => void
  onLoopChange: (loop: boolean) => void
  onOctaveChange: (octave: number) => void
  midiOutputs?: MidiOutput[]
  selectedMidiOutput?: WebMidi.MIDIOutput | null
  onSelectMidiOutput?: (outputId: string) => void
  midiError?: string | null
}

export function ControlPanel({
  track,
  tempo,
  syncMode,
  loop,
  octave,
  onTempoChange,
  onSyncModeChange,
  onChannelChange,
  onBankChange,
  onProgramChange,
  onUploadClick,
  onSaveProject,
  onLoadProject,
  onLoopChange,
  onOctaveChange,
  midiOutputs = [],
  selectedMidiOutput,
  onSelectMidiOutput,
  midiError,
}: ControlPanelProps) {
  const loadInputRef = useRef<HTMLInputElement>(null)
  const [tempoOpen, setTempoOpen] = useState(false)

  const handleLoadClick = () => {
    loadInputRef.current?.click()
  }

  const handleLoadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onLoadProject(file)
    }
    e.target.value = ""
  }

  const adjustTempo = (delta: number) => {
    const newTempo = Math.max(40, Math.min(240, tempo + delta))
    onTempoChange(newTempo)
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card p-3">
      <div className="flex flex-col gap-3">
        {/* MIDI Device Selector */}
        {onSelectMidiOutput && (
          <MidiDeviceSelector
            outputs={midiOutputs}
            selectedOutput={selectedMidiOutput || null}
            onSelectOutput={onSelectMidiOutput}
            error={midiError}
          />
        )}

        {/* Track Name */}
        <div>
          <Label className="text-xs text-muted-foreground">MIDI Name</Label>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">{track.name}</p>
        </div>

        {/* Sync & Tempo Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Sync</Label>
            <Select value={syncMode} onValueChange={(v) => onSyncModeChange(v as "internal" | "external")}>
              <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="right" sideOffset={4}>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tempo</Label>
            <Popover open={tempoOpen} onOpenChange={setTempoOpen}>
              <PopoverTrigger asChild>
                <Button variant="secondary" className="mt-0.5 h-8 w-full justify-center font-mono text-xs">
                  {tempo} BPM
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" sideOffset={4} className="w-40 p-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => adjustTempo(-10)}
                    >
                      <Minus className="h-3 w-3" />
                      <Minus className="h-3 w-3 -ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => adjustTempo(-1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="min-w-12 text-center font-mono text-sm">{tempo}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => adjustTempo(1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => adjustTempo(10)}
                    >
                      <Plus className="h-3 w-3" />
                      <Plus className="h-3 w-3 -ml-2" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Channel / Bank / Program Row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Channel</Label>
            <Select value={String(track.channel)} onValueChange={(v) => onChannelChange(Number(v))}>
              <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="right" sideOffset={4}>
                {Array.from({ length: 16 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Ch {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Bank</Label>
            <Select value={String(track.bank)} onValueChange={(v) => onBankChange(Number(v))}>
              <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="right" sideOffset={4}>
                {Array.from({ length: 16 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Program</Label>
            <Select value={String(track.program)} onValueChange={(v) => onProgramChange(Number(v))}>
              <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="right" sideOffset={4}>
                {Array.from({ length: 16 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loop & Octave Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Loop</Label>
            <Select value={loop ? "yes" : "no"} onValueChange={(v) => onLoopChange(v === "yes")}>
              <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="right" sideOffset={4}>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Octave</Label>
            <Select value={String(octave)} onValueChange={(v) => onOctaveChange(Number(v))}>
              <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="right" sideOffset={4}>
                {[-3, -2, -1, 0, 1, 2, 3].map((oct) => (
                  <SelectItem key={oct} value={String(oct)}>
                    {oct > 0 ? `+${oct}` : oct}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save & Load Row */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onSaveProject} variant="secondary" className="h-8 w-full gap-1 text-xs">
            <Save className="h-3 w-3" />
            Save
          </Button>
          <Button onClick={handleLoadClick} variant="secondary" className="h-8 w-full gap-1 text-xs">
            <FolderOpen className="h-3 w-3" />
            Load
          </Button>
          <input ref={loadInputRef} type="file" accept=".json" onChange={handleLoadChange} className="hidden" />
        </div>

        {/* Upload MIDI Button */}
        <Button
          onClick={onUploadClick}
          className="h-9 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Upload MIDI
        </Button>
      </div>
    </aside>
  )
}
