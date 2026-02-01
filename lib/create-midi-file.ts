import type { MidiNote } from "@/lib/types"

export function createMidiFile(notes: MidiNote[], tempo: number): Uint8Array {
  const ticksPerBeat = 480
  
  // Filter out muted notes
  const activeNotes = notes.filter(n => !n.muted)
  
  // Create MIDI events
  type MidiEvent = { tick: number; data: number[] }
  const events: MidiEvent[] = []
  
  // Add tempo meta event (at tick 0)
  const microsecondsPerBeat = Math.round(60000000 / tempo)
  events.push({
    tick: 0,
    data: [0xff, 0x51, 0x03, 
      (microsecondsPerBeat >> 16) & 0xff,
      (microsecondsPerBeat >> 8) & 0xff,
      microsecondsPerBeat & 0xff
    ]
  })
  
  // Add note on/off events
  for (const note of activeNotes) {
    const startTick = Math.round(note.startTime * ticksPerBeat)
    const endTick = Math.round((note.startTime + note.duration) * ticksPerBeat)
    
    // Note On (channel 0)
    events.push({
      tick: startTick,
      data: [0x90, note.pitch, note.velocity]
    })
    
    // Note Off (channel 0)
    events.push({
      tick: endTick,
      data: [0x80, note.pitch, 0]
    })
  }
  
  // Sort events by tick
  events.sort((a, b) => a.tick - b.tick)
  
  // Add end of track
  const lastTick = events.length > 0 ? events[events.length - 1].tick : 0
  events.push({
    tick: lastTick,
    data: [0xff, 0x2f, 0x00]
  })
  
  // Build track data
  const trackData: number[] = []
  let prevTick = 0
  
  for (const event of events) {
    const deltaTick = event.tick - prevTick
    prevTick = event.tick
    
    // Write variable length delta time
    const varLen = writeVarLen(deltaTick)
    trackData.push(...varLen)
    trackData.push(...event.data)
  }
  
  // Build complete MIDI file
  const midiData: number[] = []
  
  // Header chunk "MThd"
  midiData.push(0x4d, 0x54, 0x68, 0x64) // "MThd"
  midiData.push(0x00, 0x00, 0x00, 0x06) // Header length (6)
  midiData.push(0x00, 0x00) // Format 0 (single track)
  midiData.push(0x00, 0x01) // Number of tracks (1)
  midiData.push((ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff) // Ticks per beat
  
  // Track chunk "MTrk"
  midiData.push(0x4d, 0x54, 0x72, 0x6b) // "MTrk"
  const trackLength = trackData.length
  midiData.push(
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff
  )
  midiData.push(...trackData)
  
  return new Uint8Array(midiData)
}

function writeVarLen(value: number): number[] {
  if (value < 0) value = 0
  
  const result: number[] = []
  let v = value & 0x7f
  result.unshift(v)
  
  value >>= 7
  while (value > 0) {
    v = (value & 0x7f) | 0x80
    result.unshift(v)
    value >>= 7
  }
  
  return result
}
