/** Gates between the auth stack and the app shell on the persisted session. */
import React, { useEffect } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@shared/store/useAuthStore";
import { palette } from "@shared/designSystem";
import AuthNavigator from "@navigation/AuthNavigator";
import AppNavigator from "@navigation/AppNavigator";

const Stack = createNativeStackNavigator();

/**
 * The address the browser was opened at, read before navigation rewrites it.
 *
 * A signed-out visitor is sent to /login, which used to throw away where they
 * were going - so the link in an invitation email led to the dashboard and the
 * invitation was never seen. A private page asked for while signed out is kept
 * for this tab and reopened once they are in.
 */
const AUTH_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const RETURN_KEY = "return-to";
const isWeb = Platform.OS === "web" && typeof window !== "undefined";
const openedAt = isWeb ? window.location.pathname + window.location.search : "";
let considered = false;

function storage(): Storage | null {
  try {
    return isWeb ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export default function RootNavigator() {
  const { isAuthenticated, isHydrated, isAuthChecked } = useAuthStore();

  useEffect(() => {
    if (isHydrated) void useAuthStore.getState().initializeAuth();
  }, [isHydrated]);

  useEffect(() => {
    if (!isAuthChecked) return;
    const store = storage();
    if (!store) return;
    if (!isAuthenticated) {
      // Only the address this tab was opened at counts - never a page left
      // behind by signing out, which would follow the next person to sign in.
      if (!considered && !AUTH_PATHS.includes(openedAt.split("?")[0]))
        store.setItem(RETURN_KEY, openedAt);
      considered = true;
      return;
    }
    considered = true;
    const target = store.getItem(RETURN_KEY);
    if (!target) return;
    store.removeItem(RETURN_KEY);
    // A reload, so the linking config resolves the path exactly as a fresh visit would.
    window.location.replace(target);
  }, [isAuthenticated, isAuthChecked]);

  if (!isHydrated || !isAuthChecked) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.surface.secondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={palette.teal[600]} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? "app-root" : "auth-root"}
      screenOptions={{ headerShown: false }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="App" component={AppNavigator} />
      )}
    </Stack.Navigator>
  );
}
