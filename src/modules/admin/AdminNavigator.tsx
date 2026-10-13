import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AdminOverviewScreen from "./screens/AdminOverviewScreen";
import AdminUsersScreen from "./screens/AdminUsersScreen";
import AdminSettingsScreen from "./screens/AdminSettingsScreen";
import AdminCandidatesScreen from "./screens/AdminCandidatesScreen";
import AdminUsageScreen from "./screens/AdminUsageScreen";

export type AdminStackParamList = {
  AdminOverview: undefined;
  AdminUsers: undefined;
  AdminSettings: undefined;
  AdminCandidates: undefined;
  AdminUsage: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="AdminOverview"
    >
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminCandidates" component={AdminCandidatesScreen} />
      <Stack.Screen name="AdminUsage" component={AdminUsageScreen} />
    </Stack.Navigator>
  );
}
