"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { MidiOutput } from "@/hooks/use-midi"
import { AlertCircle } from "lucide-react"
import type * as WebMidi from "webmidi"

interface MidiDeviceSelectorProps {
  outputs: MidiOutput[]
  selectedOutput: WebMidi.MIDIOutput | null
  onSelectOutput: (outputId: string) => void
  error?: string | null
}

export function MidiDeviceSelector({ outputs, selectedOutput, onSelectOutput, error }: MidiDeviceSelectorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <p className="text-xs text-destructive">{error}</p>
      </div>
    )
  }

  if (outputs.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/20 p-2">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">No MIDI devices found</p>
      </div>
    )
  }

  return (
    <div>
      <Label className="text-xs text-muted-foreground">MIDI Device</Label>
      <Select value={selectedOutput?.id || ""} onValueChange={onSelectOutput}>
        <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
          <SelectValue placeholder="Select device" />
        </SelectTrigger>
        <SelectContent position="popper" side="right" sideOffset={4}>
          {outputs.map((output) => (
            <SelectItem key={output.id} value={output.id}>
              {output.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
