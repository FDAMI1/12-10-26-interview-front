import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Mic, Timer, FileText } from "lucide-react-native";
import { palette, gradients, radius, layout } from "@shared/designSystem";
import { Text, VStack, HStack, LegalLinks } from "@shared/ui";

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const HIGHLIGHTS = [
  { icon: Mic, text: "Voice interviews with an AI interviewer" },
  { icon: Timer, text: "HR, technical and managerial rounds, 10 minutes each" },
  { icon: FileText, text: "A transcript and feedback after every session" },
];

/** Split auth layout - brand panel on wide screens, form on the right. */
export function AuthLayout({ title, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.wideBreakpoint;

  return (
    <View style={styles.root}>
      {isWide && (
        <LinearGradient
          colors={[...gradients.hero] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandPanel}
        >
          <SafeAreaView style={styles.brandInner}>
            <Text variant="h2" tone="inverse">
              AI Interview
            </Text>
            <VStack gap={18}>
              <Text variant="display-sm" tone="inverse">
                Practise the interview{"\n"}before the interview.
              </Text>
              <VStack gap={14} style={{ marginTop: 12 }}>
                {HIGHLIGHTS.map((h) => (
                  <HStack key={h.text} gap={12} align="center">
                    <View style={styles.hIcon}>
                      <h.icon size={18} color="#FFFFFF" strokeWidth={2} />
                    </View>
                    <Text variant="body" tone="inverse">
                      {h.text}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
            <Text variant="caption" tone="inverse">
              Practice tool. AI feedback is not an employment decision.
            </Text>
          </SafeAreaView>
        </LinearGradient>
      )}

      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formInner}>
                {!isWide && (
                  <Text variant="h2" tone="accent" style={{ marginBottom: 24 }}>
                    AI Interview
                  </Text>
                )}
                <VStack gap={6} style={{ marginBottom: 24 }}>
                  <Text variant="h1" tone="primary">
                    {title}
                  </Text>
                  <Text variant="body" tone="tertiary">
                    {subtitle}
                  </Text>
                </VStack>
                {children}
                <View style={{ marginTop: 28 }}>
                  <LegalLinks />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: palette.surface.secondary,
  },
  brandPanel: { flex: 1, maxWidth: 520 },
  brandInner: { flex: 1, justifyContent: "space-between", padding: 48 },
  hIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  formScroll: { flexGrow: 1, justifyContent: "center", padding: 28 },
  formInner: { width: "100%", maxWidth: 420, alignSelf: "center" },
});
