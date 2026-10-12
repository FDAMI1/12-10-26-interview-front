import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkspacesScreen from "./screens/WorkspacesScreen";
import WorkspaceDetailScreen from "./screens/WorkspaceDetailScreen";
import TemplatesScreen from "./screens/TemplatesScreen";
import TemplateEditorScreen from "./screens/TemplateEditorScreen";
import InviteScreen from "./screens/InviteScreen";

export type CompanyStackParamList = {
  Workspaces: undefined;
  Invite: { token?: string } | undefined;
  WorkspaceDetail: { tenantId: string };
  /** `scope` is a tenant id, or "platform" for admin-owned templates. */
  Templates: { scope: string };
  TemplateEditor: { scope: string; templateId: string };
};

const Stack = createNativeStackNavigator<CompanyStackParamList>();

export default function CompanyNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Workspaces"
    >
      <Stack.Screen name="Workspaces" component={WorkspacesScreen} />
      <Stack.Screen name="Invite" component={InviteScreen} />
      <Stack.Screen name="WorkspaceDetail" component={WorkspaceDetailScreen} />
      <Stack.Screen name="Templates" component={TemplatesScreen} />
      <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} />
    </Stack.Navigator>
  );
}
