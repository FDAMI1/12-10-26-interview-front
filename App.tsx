import { useEffect, useState } from "react";
import { loadServerOverride } from "@config/env";
import { Platform, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

import RootNavigator from "@navigation/RootNavigator";
import { palette } from "@shared/designSystem";

const APP_TITLE = "Aivarnix";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

/**
 * URL <-> route mapping. Every section and nested screen is listed: an
 * unmapped route silently falls back to the initial one on reload.
 */
const linking = {
  prefixes: [],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: "login",
          Signup: "signup",
          ForgotPassword: "forgot-password",
          ResetPassword: "reset-password",
        },
      },
      App: {
        screens: {
          Dashboard: "dashboard",
          Profile: "profile",
          Interviews: {
            path: "interviews",
            screens: {
              InterviewsList: "",
              NewInterview: "new",
              // Setup screens keep their address, so a refresh resumes them.
              ResumeSetup: "new/resume",
              McqSetup: "new/mcq",
              InterviewSession: ":id",
              InterviewRoom: ":id/room",
              InterviewReport: ":id/report",
            },
          },
          Company: {
            path: "company",
            screens: {
              Workspaces: "",
              // Emailed invitation links land here: /company/invite?token=...
              Invite: "invite",
              WorkspaceDetail: ":tenantId",
              Templates: ":scope/templates",
              TemplateEditor: ":scope/templates/:templateId",
            },
          },
          Admin: {
            path: "admin",
            screens: {
              AdminOverview: "",
              AdminUsers: "users",
              AdminSettings: "settings",
              AdminCandidates: "candidates",
              AdminUsage: "usage",
            },
          },
        },
      },
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined")
      document.title = APP_TITLE;
  }, []);

  // The server address must be known before the first request.
  const [serverReady, setServerReady] = useState(false);
  useEffect(() => {
    void loadServerOverride().finally(() => setServerReady(true));
  }, []);

  if (!fontsLoaded || !serverReady) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.surface.secondary }} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <NavigationContainer
            linking={linking as never}
            documentTitle={{ formatter: () => APP_TITLE }}
          >
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
