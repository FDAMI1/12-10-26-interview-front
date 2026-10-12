import React from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "@modules/company/api/companyApi";
import { CompanyStackParamList } from "@modules/company/CompanyNavigator";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
import {
  Screen,
  Card,
  Text,
  VStack,
  Button,
  Banner,
  Skeleton,
  ErrorState,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

/** Landing page for an emailed invitation link (/company/invite?token=...). */
export default function InviteScreen() {
  const navigation = useNavigation<Nav>();
  const token = useRoute<RouteProp<CompanyStackParamList, "Invite">>().params?.token ?? "";
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const preview = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => companyApi.previewInvitation(token),
    enabled: token.length >= 16,
  });
  const accept = useMutation({
    mutationFn: () => companyApi.acceptInvitation(token),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["tenants"] });
      void qc.invalidateQueries({ queryKey: ["interviews"] });
      if (r.kind === "candidate")
        (navigation.getParent() as { navigate: (n: string, p: object) => void } | undefined)?.navigate(
          "Interviews",
          { screen: "InterviewSession", params: { id: r.interviewId } },
        );
      else navigation.replace("WorkspaceDetail", { tenantId: r.tenantId });
    },
  });

  const inv = preview.data;
  const wrongAccount =
    !!inv && !!user && inv.email.toLowerCase() !== user.email.toLowerCase();

  return (
    <Screen title="Invitation" back="Back to workspaces">
      {token.length < 16 ? (
        <Banner tone="warning" message="This invitation link is incomplete. Open the link from your email again." />
      ) : preview.isLoading ? (
        <Skeleton height={140} />
      ) : preview.isError || !inv ? (
        <ErrorState
          error={preview.error}
          title="This invitation can't be used"
          actionLabel="Go to workspaces"
          onAction={() => navigation.navigate("Workspaces")}
        />
      ) : (
        <VStack gap={12}>
          <VerifyEmailCard />
          <Card>
            <VStack gap={12}>
              <Text variant="h3">
                {inv.kind === "candidate"
                  ? `${inv.tenantName} invited you to an AI interview`
                  : `Join ${inv.tenantName} as ${inv.role}`}
              </Text>
              <Text variant="body-sm" tone="secondary">
                {inv.kind === "candidate"
                  ? `${inv.tenantName} covers the cost. Its authorised reviewers will be able to see your transcript; you will be asked for consent before the interview starts.`
                  : "You will be able to invite candidates and review their interviews."}
              </Text>
              {wrongAccount ? (
                <Banner
                  tone="warning"
                  title="Different account"
                  message={`This invitation was sent to ${inv.email}. Sign in with that email to accept it.`}
                />
              ) : null}
              {accept.isError ? (
                <Banner tone="danger" message={apiErrorMessage(accept.error)} />
              ) : null}
              <Button
                label="Accept invitation"
                disabled={wrongAccount || !user?.emailVerified}
                loading={accept.isPending}
                onPress={() => accept.mutate()}
              />
            </VStack>
          </Card>
        </VStack>
      )}
    </Screen>
  );
}
