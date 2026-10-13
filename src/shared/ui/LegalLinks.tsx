import React from "react";
import { Linking, Platform, Pressable } from "react-native";
import { environment } from "@config/env";
import { Text } from "./Text";
import { HStack } from "./Stack";

const PAGES = [
  { label: "Privacy policy", path: "/privacy-policy.html" },
  { label: "Delete account", path: "/delete-account.html" },
];

/** On the web the pages sit beside the app; the phone app opens them on the website. */
function open(path: string) {
  if (Platform.OS === "web") window.open(path, "_blank", "noopener");
  else void Linking.openURL(environment.webUrl + path);
}

/** Links Google Play expects to be reachable from inside the app. */
export function LegalLinks() {
  return (
    <HStack gap={16} justify="center" wrap>
      {PAGES.map((p) => (
        <Pressable
          key={p.path}
          onPress={() => open(p.path)}
          hitSlop={8}
          accessibilityRole="link"
        >
          <Text variant="caption" tone="link">
            {p.label}
          </Text>
        </Pressable>
      ))}
    </HStack>
  );
}
