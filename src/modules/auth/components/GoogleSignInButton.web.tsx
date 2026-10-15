import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { GoogleSignInButtonProps } from "./GoogleSignInButton";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (opts: {
        client_id: string;
        callback: (r: { credential?: string }) => void;
        ux_mode?: "popup";
      }) => void;
      renderButton: (
        el: HTMLElement,
        opts: Record<string, string | number>,
      ) => void;
    };
  };
}

const SCRIPT = "https://accounts.google.com/gsi/client";
let loading: Promise<GoogleIdentity> | null = null;

/** Google's own sign-in script, loaded once and only on the screens that show the button. */
function loadGoogle(): Promise<GoogleIdentity> {
  const ready = () => (window as unknown as { google?: GoogleIdentity }).google;
  if (ready()?.accounts?.id) return Promise.resolve(ready()!);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () =>
      ready()?.accounts?.id
        ? resolve(ready()!)
        : reject(new Error("no google"));
    s.onerror = () => {
      loading = null;
      reject(new Error("blocked"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Web: Google's official "Continue with Google" button. Google renders and
 * styles it; the browser receives a signed ID token for this site's client id.
 */
export function GoogleSignInButton({
  webClientId,
  onIdToken,
  onError,
}: GoogleSignInButtonProps) {
  const host = useRef<View>(null);
  const [width, setWidth] = useState(0);
  // The latest handlers, so re-renders do not re-initialise Google.
  const sink = useRef({ onIdToken, onError });
  useEffect(() => {
    sink.current = { onIdToken, onError };
  });

  useEffect(() => {
    if (!width) return;
    let alive = true;
    loadGoogle()
      .then((google) => {
        const el = host.current as unknown as HTMLElement | null;
        if (!alive || !el) return;
        google.accounts.id.initialize({
          client_id: webClientId,
          ux_mode: "popup",
          callback: (r) =>
            r.credential
              ? sink.current.onIdToken(r.credential)
              : sink.current.onError("Google sign-in was not completed"),
        });
        el.innerHTML = "";
        google.accounts.id.renderButton(el, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          // Google's button is at most 400 px wide.
          width: Math.min(400, width),
        });
      })
      .catch(() =>
        sink.current.onError(
          "Google sign-in could not load. Check your connection or ad blocker.",
        ),
      );
    return () => {
      alive = false;
    };
  }, [webClientId, width]);

  return (
    <View
      ref={host}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      style={{ minHeight: 44, alignItems: "center" }}
      accessibilityLabel="Continue with Google"
    />
  );
}
