import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InterviewsListScreen from "./screens/InterviewsListScreen";
import NewInterviewScreen from "./screens/NewInterviewScreen";
import InterviewSessionScreen from "./screens/InterviewSessionScreen";
import InterviewRoomScreen from "./screens/InterviewRoomScreen";
import InterviewReportScreen from "./screens/InterviewReportScreen";
import ResumeSetupScreen from "./screens/ResumeSetupScreen";
import McqSetupScreen from "./screens/McqSetupScreen";

export type InterviewsStackParamList = {
  InterviewsList: undefined;
  NewInterview: undefined;
  ResumeSetup: undefined;
  McqSetup: undefined;
  InterviewSession: { id: string };
  InterviewRoom: { id: string };
  InterviewReport: { id: string };
};

const Stack = createNativeStackNavigator<InterviewsStackParamList>();

export default function InterviewsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="InterviewsList"
    >
      <Stack.Screen name="InterviewsList" component={InterviewsListScreen} />
      <Stack.Screen name="NewInterview" component={NewInterviewScreen} />
      <Stack.Screen name="ResumeSetup" component={ResumeSetupScreen} />
      <Stack.Screen name="McqSetup" component={McqSetupScreen} />
      <Stack.Screen name="InterviewSession" component={InterviewSessionScreen} />
      <Stack.Screen name="InterviewRoom" component={InterviewRoomScreen} />
      <Stack.Screen name="InterviewReport" component={InterviewReportScreen} />
    </Stack.Navigator>
  );
}
