import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { interviewApi } from "@modules/interview/api/interviewApi";
import { DeviceCheckResult } from "@modules/interview/types";

export const useTemplates = () =>
  useQuery({ queryKey: ["templates"], queryFn: interviewApi.templates });

export const useEntitlements = () =>
  useQuery({ queryKey: ["entitlements"], queryFn: interviewApi.entitlements });

export const useInterviews = (limit = 20) =>
  useQuery({
    queryKey: ["interviews", limit],
    queryFn: () => interviewApi.list({ limit }),
  });

export const useInterview = (id: string) =>
  useQuery({
    queryKey: ["interview", id],
    queryFn: () => interviewApi.get(id),
    enabled: !!id,
  });

export const useReport = (id: string) =>
  useQuery({
    queryKey: ["interview-report", id],
    queryFn: () => interviewApi.report(id),
    enabled: !!id,
    // Scoring and the recording upload finish after the last round closes.
    refetchInterval: (q) =>
      q.state.data &&
      (q.state.data.provisional ||
        (q.state.data.interview.recordingEnabled &&
          q.state.data.rounds.some((r) => !r.hasRecording))) &&
      q.state.dataUpdateCount < 40
        ? 5000
        : false,
  });

export const useRoom = (id: string) =>
  useQuery({
    queryKey: ["interview-room", id],
    queryFn: () => interviewApi.room(id),
    enabled: !!id,
    // The room owns its state between explicit refreshes.
    staleTime: Infinity,
    gcTime: 0,
  });

/** Every step that moves the session forward refreshes the same caches. */
function useInterviewMutation<V>(
  id: string | null,
  mutationFn: (vars: V) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["interviews"] });
      void qc.invalidateQueries({ queryKey: ["entitlements"] });
      if (id) void qc.invalidateQueries({ queryKey: ["interview", id] });
    },
  });
}

export const useCreateInterview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: interviewApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["interviews"] });
      void qc.invalidateQueries({ queryKey: ["entitlements"] });
    },
  });
};

export const useConsent = (id: string) =>
  useInterviewMutation(id, (v: { accepted: boolean; version: string }) =>
    interviewApi.consent(id, v.accepted, v.version),
  );

export const useDeviceCheck = (id: string) =>
  useInterviewMutation(id, (result: DeviceCheckResult) =>
    interviewApi.deviceCheck(id, result),
  );

export const useStartInterview = (id: string) =>
  useInterviewMutation(id, () => interviewApi.start(id));

export const useCancelInterview = (id: string) =>
  useInterviewMutation(id, () => interviewApi.cancel(id));
