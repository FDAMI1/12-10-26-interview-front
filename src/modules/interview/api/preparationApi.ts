import { Platform } from "react-native";
import type { DocumentPickerAsset } from "expo-document-picker";
import { apiClient, ApiOne } from "@api/apiClient";
import {
  McqQuestion,
  Preparation,
  SetupConfig,
} from "@modules/interview/types";

const one = async <T>(p: Promise<{ data: ApiOne<T> }>) => (await p).data.data;

export interface McqSetInput {
  title?: string;
  targetRole: string;
  questions: McqQuestion[];
  selfAssessment?: boolean;
}

/** The picked file as bytes: the browser hands over a File, a phone a local uri. */
async function fileBody(asset: DocumentPickerAsset): Promise<Blob> {
  if (Platform.OS === "web" && asset.file) return asset.file;
  return await (await fetch(asset.uri)).blob();
}

export const preparationApi = {
  config: () => one(apiClient.get<ApiOne<SetupConfig>>("/preparations/config")),
  list: (kind: "resume" | "mcq") =>
    one(
      apiClient.get<ApiOne<Preparation[]>>("/preparations", {
        params: { kind },
      }),
    ),
  /** The file is the request body; the server decides its type from its bytes. */
  uploadResume: async (asset: DocumentPickerAsset) =>
    one(
      apiClient.post<ApiOne<Preparation>>(
        "/preparations/resume",
        await fileBody(asset),
        {
          headers: {
            "Content-Type": asset.mimeType || "application/octet-stream",
            "X-File-Name": encodeURIComponent(asset.name),
          },
          // Reading the file (and the AI extraction) can take a while.
          timeout: 90_000,
        },
      ),
    ),
  createMcq: (body: McqSetInput) =>
    one(apiClient.post<ApiOne<Preparation>>("/preparations/mcq", body)),
  update: (id: string, body: McqSetInput | { targetRole: string }) =>
    one(apiClient.put<ApiOne<Preparation>>(`/preparations/${id}`, body)),
  remove: async (id: string) => {
    await apiClient.delete(`/preparations/${id}`);
  },
};
