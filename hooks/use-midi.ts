"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { MidiNote } from "@/lib/types"

export interface MidiOutput {
  id: string
  name: string
  output: MIDIOutput
}

export function useMidi() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null)
  const [outputs, setOutputs] = useState<MidiOutput[]>([])
  const [selectedOutput, setSelectedOutput] = useState<MIDIOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const updateOutputsRef = useRef<(access: MIDIAccess) => void>(() => {})

  // Update function that enumerates MIDI outputs
  updateOutputsRef.current = (access: MIDIAccess) => {
    console.log("[v0] Enumerating MIDI outputs...")
    const outputList: MidiOutput[] = []
    access.outputs.forEach((output) => {
      console.log("[v0] Found MIDI output:", output.id, output.name, output.state, output.connection)
      outputList.push({
        id: output.id,
        name: output.name || "Unknown Device",
        output,
      })
    })
    console.log("[v0] Total outputs found:", outputList.length)
    setOutputs(outputList)

    // Auto-select first output if none selected
    if (outputList.length > 0 && !selectedOutput) {
      console.log("[v0] Auto-selecting first output:", outputList[0].name)
      setSelectedOutput(outputList[0].output)
    }
  }

  // Initialize Web MIDI API
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      console.log("[v0] Web MIDI API not available")
      setError("Web MIDI API not supported in this browser")
      return
    }

    console.log("[v0] Requesting MIDI access...")
    navigator.requestMIDIAccess({ sysex: false })
      .then((access) => {
        console.log("[v0] MIDI access granted")
        setMidiAccess(access)
        updateOutputsRef.current(access)

        // Listen for device changes
        access.onstatechange = (event) => {
          console.log("[v0] MIDI state changed:", event)
          updateOutputsRef.current(access)
        }
      })
      .catch((err) => {
        console.log("[v0] MIDI access error:", err)
        setError(`Failed to access MIDI devices: ${err.message}`)
      })
  }, [])

const selectOutput = useCallback(
    (outputId: string) => {
      const output = outputs.find((o) => o.id === outputId)
      if (output) {
        setSelectedOutput(output.output)
      }
    },
    [outputs],
  )

  const sendNoteOn = useCallback(
    (pitch: number, velocity: number, channel: number) => {
      if (!selectedOutput) return
      const status = 0x90 | ((channel - 1) & 0x0f)
      selectedOutput.send([status, pitch & 0x7f, velocity & 0x7f])
    },
    [selectedOutput],
  )

  const sendNoteOff = useCallback(
    (pitch: number, channel: number) => {
      if (!selectedOutput) return
      const status = 0x80 | ((channel - 1) & 0x0f)
      selectedOutput.send([status, pitch & 0x7f, 0])
    },
    [selectedOutput],
  )

  const sendProgramChange = useCallback(
    (program: number, channel: number) => {
      if (!selectedOutput) return
      const status = 0xc0 | ((channel - 1) & 0x0f)
      selectedOutput.send([status, (program - 1) & 0x7f])
    },
    [selectedOutput],
  )

  const sendBankSelect = useCallback(
    (bank: number, channel: number) => {
      if (!selectedOutput) return
      const status = 0xb0 | ((channel - 1) & 0x0f)
      // Bank Select MSB (CC 0)
      selectedOutput.send([status, 0, (bank - 1) & 0x7f])
    },
    [selectedOutput],
  )

  const sendAllNotesOff = useCallback(
    (channel: number) => {
      if (!selectedOutput) return
      const status = 0xb0 | ((channel - 1) & 0x0f)
      selectedOutput.send([status, 123, 0]) // All Notes Off
    },
    [selectedOutput],
  )

  return {
    outputs,
    selectedOutput,
    selectOutput,
    sendNoteOn,
    sendNoteOff,
    sendProgramChange,
    sendBankSelect,
    sendAllNotesOff,
    error,
    isReady: !!midiAccess && !!selectedOutput,
  }
}

// Playback engine hook
export function useMidiPlayback() {
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentTimeRef = useRef<number>(0)

  const startPlayback = useCallback(
    (
      notes: MidiNote[],
      tempo: number,
      channel: number,
      octave: number,
      loop: boolean,
      sendNoteOn: (pitch: number, velocity: number, channel: number) => void,
      sendNoteOff: (pitch: number, channel: number) => void,
      onPositionUpdate: (position: number) => void,
      onComplete: () => void,
    ) => {
      const activeNotes = new Map<string, number>()
      const beatsPerSecond = tempo / 60
      const maxTime = Math.max(...notes.map((n) => n.startTime + n.duration), 0)

      startTimeRef.current = performance.now() / 1000
      currentTimeRef.current = 0

      const tick = () => {
        const now = performance.now() / 1000
        const elapsed = now - startTimeRef.current
        currentTimeRef.current = elapsed * beatsPerSecond

        let currentPosition = currentTimeRef.current

        // Handle looping
        if (loop && currentPosition >= maxTime) {
          currentPosition = currentPosition % maxTime
          startTimeRef.current = now - currentPosition / beatsPerSecond
        }

        onPositionUpdate(currentPosition)

        // Check for notes to start
        notes.forEach((note) => {
          if (note.muted) return

          const noteStart = note.startTime
          const noteEnd = note.startTime + note.duration
          const isActive = activeNotes.has(note.id)

          if (currentPosition >= noteStart && currentPosition < noteEnd && !isActive) {
            const adjustedPitch = note.pitch + octave * 12
            if (adjustedPitch >= 0 && adjustedPitch <= 127) {
              sendNoteOn(adjustedPitch, note.velocity, channel)
              activeNotes.set(note.id, adjustedPitch)
            }
          } else if ((currentPosition >= noteEnd || currentPosition < noteStart) && isActive) {
            const adjustedPitch = activeNotes.get(note.id)!
            sendNoteOff(adjustedPitch, channel)
            activeNotes.delete(note.id)
          }
        })

        // Stop if reached end and not looping
        if (!loop && currentPosition >= maxTime) {
          stopPlayback(channel, sendNoteOff)
          onComplete()
        }
      }

      intervalRef.current = window.setInterval(tick, 10)
    },
    [],
  )

  const stopPlayback = useCallback((channel: number, sendNoteOff: (pitch: number, channel: number) => void) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Turn off all potentially active notes
    for (let pitch = 0; pitch <= 127; pitch++) {
      sendNoteOff(pitch, channel)
    }
  }, [])

  return {
    startPlayback,
    stopPlayback,
  }
}
