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
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">MIDI:</Label>
      <Select value={selectedOutput?.id || ""} onValueChange={onSelectOutput}>
        <SelectTrigger className="h-7 flex-1 bg-secondary text-xs [&>svg]:hidden">
          <SelectValue placeholder={outputs.length === 0 ? "No devices" : "Select"} />
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
