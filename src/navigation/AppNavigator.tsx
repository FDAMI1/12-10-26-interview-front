/**
 * AppNavigator - responsive app shell. Wide screens get a permanent sidebar;
 * phones get the same sidebar as a slide-over opened from the app bar.
 * Sections are real drawer routes so the web URL tracks them (see App.tsx).
 */
import React from "react";
import { Pressable, StyleSheet, useWindowDimensions } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import { Menu } from "lucide-react-native";
import { palette, layout, radius } from "@shared/designSystem";
import { Text, HStack } from "@shared/ui";
import { Sidebar, APP_NAME } from "./Sidebar";
import { NAV_ITEMS, useVisibleNavItems } from "./navItems";

import DashboardScreen from "@modules/dashboard/screens/DashboardScreen";
import InterviewsNavigator from "@modules/interview/InterviewsNavigator";
import CompanyNavigator from "@modules/company/CompanyNavigator";
import AdminNavigator from "@modules/admin/AdminNavigator";
import ProfileScreen from "@modules/profile/screens/ProfileScreen";

const SCREENS: Record<string, React.ComponentType> = {
  Dashboard: DashboardScreen,
  Interviews: InterviewsNavigator,
  Company: CompanyNavigator,
  Admin: AdminNavigator,
  Profile: ProfileScreen,
};

const Drawer = createDrawerNavigator();

const drawerContent = (props: DrawerContentComponentProps) => (
  <Sidebar
    activeRoute={props.state.routeNames[props.state.index]}
    onNavigate={(name) => props.navigation.navigate(name)}
  />
);

export default function AppNavigator() {
  const { width } = useWindowDimensions();
  const isWide = width >= layout.wideBreakpoint;
  // Only routes the user may use are registered, so a deep link to /admin
  // cannot render its shell for a non-admin.
  const items = useVisibleNavItems();

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={drawerContent}
      screenOptions={{
        drawerType: isWide ? "permanent" : "front",
        headerShown: !isWide,
        header: ({ route, navigation }) => (
          <SafeAreaView edges={["top"]} style={styles.appBarSafe}>
            <HStack align="center" gap={12} style={styles.appBar}>
              <Pressable
                onPress={() => navigation.openDrawer()}
                hitSlop={8}
                style={styles.menuBtn}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
              >
                <Menu size={22} color={palette.text.primary} strokeWidth={2} />
              </Pressable>
              <Text variant="h4" tone="primary">
                {NAV_ITEMS.find((i) => i.name === route.name)?.label ||
                  APP_NAME}
              </Text>
            </HStack>
          </SafeAreaView>
        ),
        drawerStyle: { width: layout.sidebarWidth, borderRightWidth: 0 },
        overlayColor: "rgba(15,23,42,0.4)",
        sceneStyle: { backgroundColor: palette.surface.secondary },
      }}
    >
      {items.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={SCREENS[item.name]}
          options={{ title: item.label }}
        />
      ))}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  appBarSafe: { backgroundColor: palette.surface.primary },
  appBar: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: palette.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: palette.border.default,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
