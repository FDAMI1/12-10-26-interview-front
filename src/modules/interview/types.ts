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
  setupMode: SetupMode;
  /** Title of the resume or question set the interview was prepared from. */
  preparationTitle: string;
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
  /** Check a spoken answer while it is given, and interrupt it if it leaves the question. */
  realtimeRelevance?: boolean;
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

export type Relevance =
  | "relevant"
  | "partially_relevant"
  | "irrelevant"
  | "unclear"
  | "incomplete"
  | "";

export interface QuestionOutcome {
  questionId: string;
  question: string;
  relevance: Relevance;
  redirections: number;
  retried: boolean;
  finalStatus:
    | "answered"
    | "partially_answered"
    | "unanswered"
    | "no_answer"
    | "not_assessed";
}

export interface RoundReport extends Round {
  questions: QuestionOutcome[];
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

export type SetupMode = "standard" | "resume" | "mcq";

export const SETUP_LABEL: Record<SetupMode, string> = {
  standard: "Standard interview",
  resume: "Resume-based interview",
  mcq: "MCQ-based preparation",
};

export interface McqQuestion {
  text: string;
  options: string[];
  /** The option the candidate marks as correct. */
  correctIndex: number;
}

export interface Preparation {
  id: string;
  kind: "resume" | "mcq";
  title: string;
  targetRole: string;
  resume: {
    fileName: string;
    format: string;
    sizeBytes: number;
    summary: string;
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    extractedBy: "ai" | "heuristic";
  } | null;
  questions: McqQuestion[];
  updatedAt: string;
}

export interface SetupConfig {
  resumeEnabled: boolean;
  mcqEnabled: boolean;
  resumeMaxBytes: number;
  resumeFormats: string[];
  mcqMaxQuestions: number;
  durationSeconds: number;
  /** "single": one interview on one round; "per_round": that long for each chosen round. */
  roundMode: "single" | "per_round";
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
