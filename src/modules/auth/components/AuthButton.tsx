import React, { useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { Text } from "@shared/ui";
import { authTheme as t } from "@modules/auth/authTheme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * The blue-to-violet primary action of the sign-in screens. A second press
 * while one is being handled, or within 400 ms, is ignored, so a double tap
 * never sends the form twice.
 */
export function AuthButton({ label, onPress, loading, disabled }: Props) {
  const last = useRef(0);
  const inactive = Boolean(loading || disabled);
  const press = () => {
    const now = Date.now();
    if (inactive || now - last.current < 400) return;
    last.current = now;
    onPress();
  };
  return (
    <Pressable
      onPress={press}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.shadow,
        {
          opacity: disabled ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={[...t.primary]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.fill}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" accessibilityLabel="Please wait" />
        ) : (
          <>
            <Text variant="h4" style={styles.label}>
              {label}
            </Text>
            <View style={styles.arrow}>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 999,
    shadowColor: t.blue,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  fill: {
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  label: { color: "#FFFFFF", letterSpacing: 0.3 },
  arrow: {
    position: "absolute",
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});
