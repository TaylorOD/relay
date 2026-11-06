import type { Config, Snapshot, ComparisonResult } from './simulation/types.ts'

export type WorkerCommand =
  | { type: 'reset'; config: Config; revision: number }
  | { type: 'play' | 'pause' }
  | { type: 'speed'; speed: number }
  | { type: 'inject'; revision: number }
  | { type: 'compare'; config: Config }

export type WorkerReply =
  | { type: 'snapshot'; revision: number; data: Snapshot }
  | { type: 'comparison'; revision: number; data: ComparisonResult }
