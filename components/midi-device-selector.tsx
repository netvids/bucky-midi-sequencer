"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { MidiOutput } from "@/hooks/use-midi"

interface MidiDeviceSelectorProps {
  outputs: MidiOutput[]
  selectedOutput: MIDIOutput | null
  onSelectOutput: (outputId: string) => void
}

export function MidiDeviceSelector({ outputs, selectedOutput, onSelectOutput }: MidiDeviceSelectorProps) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">MIDI Device</Label>
      <Select value={selectedOutput?.id || ""} onValueChange={onSelectOutput}>
        <SelectTrigger className="mt-0.5 h-8 bg-secondary text-xs [&>svg]:hidden">
          <SelectValue placeholder={outputs.length === 0 ? "No devices" : "Select device"} />
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
