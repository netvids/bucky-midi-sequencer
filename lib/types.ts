export interface MidiNote {
  id: string
  pitch: number
  startTime: number
  duration: number
  velocity: number
  muted: boolean
}

export interface MidiTrack {
  id: string
  name: string
  notes: MidiNote[]
  channel: number
  bank: number
  program: number
}

export interface SequencerState {
  tracks: MidiTrack[]
  tempo: number
  syncMode: "internal" | "external"
  isPlaying: boolean
  playheadPosition: number
}
