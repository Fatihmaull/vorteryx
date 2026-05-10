// ═══════════════════════════════════════════════════════════════════════
// VoteryX — TypeScript Types
// ═══════════════════════════════════════════════════════════════════════

export interface KTP {
  nama: string;
  nik: bigint;
  domisili: string;
  isVerified: boolean;
}

export interface Candidate {
  id: bigint;
  name: string;
  region: string;
  voteCount: bigint;
}

export enum ElectionStatus {
  NotStarted = 0,
  Active = 1,
  Ended = 2,
}

export interface Election {
  id: bigint;
  title: string;
  region: string;
  status: ElectionStatus;
  candidateIds: bigint[];
  totalVotes: bigint;
  createdAt: bigint;
  startedAt: bigint;
  endedAt: bigint;
}

export interface ElectionResult {
  title: string;
  region: string;
  status: ElectionStatus;
  totalVotes: bigint;
  candidates: Candidate[];
}

export const REGIONS = [
  "Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Bali",
  "Sumatera Utara",
  "Sulawesi Selatan",
  "Kalimantan Timur",
  "Papua",
  "DI Yogyakarta",
  "Nasional",
] as const;

export type Region = (typeof REGIONS)[number];

declare global {
  interface Window {
    ethereum?: any;
  }
}
