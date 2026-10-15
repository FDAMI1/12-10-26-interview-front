import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { palette, radius, layout } from "@shared/designSystem";
import { Text, VStack } from "@shared/ui";
import { useAuthStore } from "@shared/store/useAuthStore";
import { useVisibleNavItems } from "./navItems";

const MARK = require("../../assets/brand/aivarnix-mark.png");

export const APP_NAME = "Aivarnix";

interface Props {
  activeRoute: string;
  onNavigate: (name: string) => void;
}

export function Sidebar({ activeRoute, onNavigate }: Props) {
  const items = useVisibleNavItems();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={[styles.brand, styles.brandRow]} accessibilityRole="header">
        <Image source={MARK} style={styles.mark} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text variant="h2" style={{ color: "#0B1640" }}>
          {APP_NAME}
        </Text>
      </View>
      <VStack gap={2} flex={1}>
        {items.map((item) => {
          const active = item.name === activeRoute;
          return (
            <Pressable
              key={item.name}
              onPress={() => onNavigate(item.name)}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              style={[styles.row, active && styles.rowActive]}
            >
              <item.icon
                size={18}
                strokeWidth={2}
                color={active ? palette.text.accent : palette.text.tertiary}
              />
              <Text variant="label" tone={active ? "accent" : "secondary"}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </VStack>
      <View style={styles.footer}>
        <Text variant="label" tone="primary" numberOfLines={1}>
          {user?.displayName}
        </Text>
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          {user?.email}
        </Text>
        <Pressable
          onPress={() => void logout()}
          accessibilityRole="button"
          style={[styles.row, { marginTop: 8, paddingHorizontal: 0 }]}
        >
          <LogOut size={18} strokeWidth={2} color={palette.text.tertiary} />
          <Text variant="label" tone="secondary">
            Sign out
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: palette.surface.primary,
    borderRightWidth: 1,
    borderRightColor: palette.border.default,
    padding: 12,
  },
  brand: { paddingHorizontal: 10, paddingVertical: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: { width: 34, height: 26 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: layout.navRowHeight + 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  rowActive: { backgroundColor: palette.teal[50] },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.border.subtle,
    paddingTop: 12,
    paddingHorizontal: 10,
  },
});
