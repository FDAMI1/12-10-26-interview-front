import { apiClient, ApiOne, Paginated } from "@api/apiClient";
import {
  Interview,
  Template,
  RoomState,
  TurnResult,
  CompleteResult,
  Report,
  DeviceCheckResult,
  Entitlements,
  Turn,
  Round,
  UploadTicket,
} from "@modules/interview/types";

const one = async <T>(p: Promise<{ data: ApiOne<T> }>) => (await p).data.data;

export const interviewApi = {
  templates: () =>
    one(apiClient.get<ApiOne<Template[]>>("/interview-templates")),
  entitlements: () =>
    one(apiClient.get<ApiOne<Entitlements>>("/billing/entitlements")),
  list: async (params?: { page?: number; limit?: number }) =>
    (await apiClient.get<Paginated<Interview>>("/interviews", { params })).data,
  get: (id: string) =>
    one(apiClient.get<ApiOne<Interview>>(`/interviews/${id}`)),
  create: ({ templateId, targetRole }: { templateId: string; targetRole: string }) =>
    one(apiClient.post<ApiOne<Interview>>("/interviews", { templateId, targetRole })),
  consent: (id: string, accepted: boolean, consentVersion: string) =>
    one(
      apiClient.post<ApiOne<Interview>>(`/interviews/${id}/consent`, {
        accepted,
        consentVersion,
      }),
    ),
  deviceCheck: (id: string, result: DeviceCheckResult) =>
    one(
      apiClient.post<ApiOne<Interview>>(
        `/interviews/${id}/device-check`,
        result,
      ),
    ),
  start: (id: string) => one(apiClient.post(`/interviews/${id}/start`)),
  cancel: (id: string) =>
    one(apiClient.post<ApiOne<Interview>>(`/interviews/${id}/cancel`)),
  startRound: (id: string, roundId: string) =>
    one(apiClient.post(`/interviews/${id}/rounds/${roundId}/start`)),
  /** Live state for the room; also what a refresh or dropped connection calls. */
  room: async (id: string): Promise<RoomState> => {
    const data = await one(
      apiClient.post<ApiOne<Omit<RoomState, "deadlineMs">>>(
        `/interviews/${id}/reconnect`,
      ),
    );
    return {
      ...data,
      deadlineMs:
        Date.now() + (data.currentRound?.remainingSeconds ?? 0) * 1000,
    };
  },
  addTurn: (id: string, roundId: string, clientRequestId: string, text: string) =>
    one(
      apiClient.post<ApiOne<TurnResult>>(
        `/interviews/${id}/rounds/${roundId}/turns`,
        { clientRequestId, text },
      ),
    ),
  completeRound: (
    id: string,
    roundId: string,
    clientRequestId: string,
    reason: "timer_expired" | "candidate_finished",
  ) =>
    one(
      apiClient.post<ApiOne<CompleteResult>>(
        `/interviews/${id}/rounds/${roundId}/complete`,
        { clientRequestId, reason },
      ),
    ),
  turns: (id: string, roundId: string) =>
    one(
      apiClient.get<ApiOne<Turn[]>>(`/interviews/${id}/rounds/${roundId}/turns`),
    ),
  /** API route that returns an interviewer line as audio in the chosen voice. */
  turnSpeechPath: (id: string, roundId: string, turnId: string, voice: "female" | "male") =>
    `/interviews/${id}/rounds/${roundId}/turns/${turnId}/speech?voice=${voice}`,
  voiceSamplePath: (voice: "female" | "male") => `/interviews/voice-sample?voice=${voice}`,
  recordingUploadTicket: (id: string, roundId: string) =>
    one(
      apiClient.post<ApiOne<UploadTicket>>(
        `/interviews/${id}/rounds/${roundId}/recording/upload-ticket`,
      ),
    ),
  confirmRecording: (id: string, roundId: string) =>
    one(
      apiClient.post<ApiOne<Round>>(
        `/interviews/${id}/rounds/${roundId}/recording`,
        {},
        // Storage verification can be slow straight after a large upload.
        { timeout: 60_000 },
      ),
    ),
  /** A playback link that expires in a few minutes. */
  recordingAccess: (id: string, roundId: string) =>
    one(
      apiClient.get<ApiOne<{ url: string; expiresAt: string }>>(
        `/interviews/${id}/recordings/${roundId}/access`,
      ),
    ),
  report: (id: string) =>
    one(apiClient.get<ApiOne<Report>>(`/interviews/${id}/report`)),
};
