import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  preparationApi,
  McqSetInput,
} from "@modules/interview/api/preparationApi";

export const useSetupConfig = () =>
  useQuery({ queryKey: ["setup-config"], queryFn: preparationApi.config });

export const usePreparations = (kind: "resume" | "mcq") =>
  useQuery({
    queryKey: ["preparations", kind],
    queryFn: () => preparationApi.list(kind),
  });

/** Every change to a resume or question set refreshes both lists. */
function usePreparationMutation<V, R>(mutationFn: (vars: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["preparations"] }),
  });
}

export const useUploadResume = () =>
  usePreparationMutation(preparationApi.uploadResume);

export const useSaveMcqSet = () =>
  usePreparationMutation(
    ({ id, body }: { id: string | null; body: McqSetInput }) =>
      id ? preparationApi.update(id, body) : preparationApi.createMcq(body),
  );

export const useUpdateRole = () =>
  usePreparationMutation(
    ({ id, targetRole }: { id: string; targetRole: string }) =>
      preparationApi.update(id, { targetRole }),
  );

export const useDeletePreparation = () =>
  usePreparationMutation(preparationApi.remove);
