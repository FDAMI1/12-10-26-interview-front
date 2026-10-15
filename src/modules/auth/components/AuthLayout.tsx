import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Text, LegalLinks } from "@shared/ui";
import { ServerAddress } from "@modules/auth/components/ServerAddress";
import { authTheme as t } from "@modules/auth/authTheme";

const MARK = require("../../../../assets/brand/aivarnix-mark.png");

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/** Soft rings and discs in the background, as in the Aivarnix sign-in design. Decorative only. */
function Backdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.ring,
          { width: 360, height: 360, top: -170, left: -150 },
        ]}
      />
      <LinearGradient
        colors={["#FFFFFF", "#DCE4FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.disc, { width: 190, height: 190, top: 150, right: -95 }]}
      />
      <LinearGradient
        colors={["#E3E9FF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.disc,
          { width: 300, height: 300, bottom: -150, right: -110 },
        ]}
      />
      <View
        style={[
          styles.ring,
          { width: 240, height: 240, bottom: -130, left: -80 },
        ]}
      />
    </View>
  );
}

/** Fades the form in once; skipped when the person has asked the system to reduce motion. */
function useEntrance() {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) return progress.setValue(1);
        Animated.timing(progress, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [progress]);
  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  };
}

/** The Aivarnix sign-in frame: gradient backdrop, glass logo badge, title, then the form. */
export function AuthLayout({ title, subtitle, children }: Props) {
  const entrance = useEntrance();
  return (
    <LinearGradient
      colors={[...t.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.column, entrance]}>
              <View
                style={styles.badge}
                accessibilityRole="image"
                accessibilityLabel="Aivarnix"
              >
                <Image source={MARK} style={styles.mark} resizeMode="contain" />
              </View>
              <View style={styles.heading}>
                <Text
                  variant="display-sm"
                  align="center"
                  style={{ color: t.navy }}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
                <Text variant="body" align="center" style={styles.subtitle}>
                  {subtitle}
                </Text>
              </View>
              {children}
              <View style={styles.footer}>
                <LegalLinks />
                <ServerAddress />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const glassShadow = {
  shadowColor: t.shadow,
  shadowOpacity: 0.18,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 6,
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 26,
    borderColor: t.ring,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  disc: { position: "absolute", borderRadius: 999, opacity: 0.9 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  column: { width: "100%", maxWidth: 420, alignSelf: "center" },
  badge: {
    alignSelf: "center",
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: t.glass,
    borderWidth: 1,
    borderColor: t.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    ...glassShadow,
  },
  mark: { width: 74, height: 74 },
  heading: { gap: 6, marginBottom: 26 },
  subtitle: { color: t.muted, letterSpacing: 1.2 },
  footer: { marginTop: 28, gap: 14 },
});
