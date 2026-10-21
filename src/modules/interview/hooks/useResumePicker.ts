import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useUploadResume } from "@modules/interview/hooks/usePreparations";
import { Preparation, SetupConfig } from "@modules/interview/types";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Opens the file picker and uploads the chosen resume; the server extracts its fields. */
export function useResumePicker(
  cfg: SetupConfig | undefined,
  onUploaded: (p: Preparation) => void,
) {
  const upload = useUploadResume();
  const [tooLarge, setTooLarge] = useState(false);

  const choose = async () => {
    if (!cfg) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: cfg.resumeFormats.map((f) => MIME[f]).filter(Boolean),
      copyToCacheDirectory: true,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    // Checked again on the server; this just saves uploading a file that will be refused.
    const big = Boolean(asset.size && asset.size > cfg.resumeMaxBytes);
    setTooLarge(big);
    if (big) return;
    upload.mutate(asset, { onSuccess: onUploaded });
  };

  return { choose, upload, tooLarge };
}
