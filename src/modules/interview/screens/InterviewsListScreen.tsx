import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus } from "lucide-react-native";
import { useInterviews } from "@modules/interview/hooks/useInterviews";
import { InterviewList } from "@modules/interview/components/InterviewList";
import { InterviewsStackParamList } from "@modules/interview/InterviewsNavigator";
import { Screen, Button, Skeleton, ErrorState } from "@shared/ui";

type Nav = NativeStackNavigationProp<InterviewsStackParamList>;

export default function InterviewsListScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useInterviews(50);

  return (
    <Screen
      title="Interviews"
      subtitle="Every session you have started, newest first"
      refreshing={isRefetching}
      onRefresh={refetch}
      right={
        <Button
          label="New interview"
          size="sm"
          fullWidth={false}
          icon={<Plus size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate("NewInterview")}
        />
      }
    >
      {isLoading ? (
        <Skeleton height={160} />
      ) : isError ? (
        <ErrorState
          error={error}
          title="Couldn't load your interviews"
          onRetry={refetch}
          retrying={isRefetching}
        />
      ) : (
        <InterviewList
          interviews={data?.data ?? []}
          emptyMessage="Start one to practise all three rounds."
          onOpen={(it) => navigation.navigate("InterviewSession", { id: it.id })}
        />
      )}
    </Screen>
  );
}
