import React, { useState } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Button } from "@shared/ui";
import { GoogleMark } from "@modules/auth/components/GoogleMark";

export interface GoogleSignInButtonProps {
  /** The web OAuth client id: Google issues the ID token for it, and the API checks that. */
  webClientId: string;
  onIdToken: (idToken: string) => void;
  onError: (message: string) => void;
  busy?: boolean;
}

/**
 * Android / iOS: the phone's own Google account picker. The Android OAuth
 * client (package name + signing SHA-1) only has to exist in Google Cloud;
 * it is matched by the device, not passed here.
 */
export function GoogleSignInButton({
  webClientId,
  onIdToken,
  onError,
  busy,
}: GoogleSignInButtonProps) {
  const [opening, setOpening] = useState(false);

  const press = async () => {
    setOpening(true);
    try {
      GoogleSignin.configure({ webClientId });
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const result = await GoogleSignin.signIn();
      if (!isSuccessResponse(result)) return; // the person closed the picker
      if (!result.data.idToken)
        throw new Error("Google did not return a sign-in token");
      onIdToken(result.data.idToken);
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return;
      onError(
        isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
          ? "Google Play services are not available on this device"
          : e instanceof Error && e.message
            ? e.message
            : "Google sign-in failed",
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <Button
      label="Continue with Google"
      variant="secondary"
      size="lg"
      icon={<GoogleMark />}
      loading={opening || busy}
      onPress={() => void press()}
    />
  );
}
