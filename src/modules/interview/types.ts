export type RoundType = "hr" | "technical" | "managerial";

export type InterviewStatus =
  | "created"
  | "consent_pending"
  | "device_check"
  | "ready"
  | "in_progress"
  | "reconnecting"
  | "round_submitted"
  | "evaluating"
  | "evaluation_review"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"
  | "closed";

export interface Round {
  id: string;
  roundType: RoundType;
  sequence: number;
  durationSeconds: number;
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  remainingSeconds: number;
  endedAt: string | null;
  endReason: string;
  questionCount: number;
  questionsAsked: number;
  score: number | null;
  evaluationStatus: "none" | "provisional" | "final";
  hasRecording: boolean;
}

export interface Interview {
  id: string;
  status: InterviewStatus;
  source: "self_practice" | "company_invite";
  tenantId: string | null;
  templateName: string;
  targetRole: string;
  consentRequired: boolean;
  currentRoundSequence: number;
  startedAt: string | null;
  completedAt: string | null;
  totalScore: number | null;
  reportStatus: "none" | "pending" | "ready";
  createdAt: string;
  rounds?: Round[];
  consentVersion?: string;
  /** The server has recording storage configured. */
  recordingEnabled: boolean;
  /** The server can speak the interviewer's lines in a studio voice. */
  voiceEnabled: boolean;
}

export interface Turn {
  id: string;
  sequence: number;
  speaker: "ai" | "candidate";
  text: string;
  kind: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  targetRole: string;
  description: string;
  version: number;
  rounds: { roundType: RoundType; sequence: number; durationSeconds: number }[];
}

export interface RoomState {
  interview: Interview;
  currentRound: Round | null;
  turns: Turn[];
  warningAtSeconds: number;
  /** Seconds of silence after which a spoken answer is sent by itself. */
  silenceSubmitSeconds: number;
  /** Local-clock deadline derived from the server's remaining seconds. */
  deadlineMs: number;
}

export interface TurnResult {
  turn: Turn;
  aiTurn: Turn | null;
  remainingSeconds: number;
  planComplete: boolean;
  round: Round;
}

export interface CompleteResult {
  round: Round;
  interview: Interview;
  nextRound: Round | null;
}

export interface Report {
  interview: Interview;
  provisional: boolean;
  overallScore: number | null;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  practiceTopics: string[];
  rounds: RoundReport[];
}

export interface ScoredDimension {
  key: string;
  label: string;
  weight: number;
  score: number;
  evidence: string;
}

export interface RoundReport extends Round {
  dimensions: ScoredDimension[];
  strengths: string[];
  improvements: string[];
  feedback: string;
  recordingDurationSeconds: number | null;
}

export interface UploadTicket {
  uploadUrl: string;
  fields: Record<string, string | number>;
}

export interface DeviceCheckResult {
  microphone: boolean;
  audioPlayback: boolean;
  network: boolean;
  browserSupported: boolean;
}

export interface Entitlements {
  available: number;
}

export const ROUND_LABEL: Record<RoundType, string> = {
  hr: "HR round",
  technical: "Technical round",
  managerial: "Managerial round",
};

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function statusTone(status: string): Tone {
  if (status === "completed" || status === "closed") return "success";
  if (status === "failed" || status === "expired") return "danger";
  if (status === "cancelled" || status === "pending") return "neutral";
  if (status === "in_progress" || status === "reconnecting") return "warning";
  return "info";
}
