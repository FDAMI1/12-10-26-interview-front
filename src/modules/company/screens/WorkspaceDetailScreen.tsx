import React, { useState } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  companyApi,
  Invitation,
  TenantRole,
} from "@modules/company/api/companyApi";
import { templateApi } from "@modules/company/api/templateApi";
import { CompanyStackParamList } from "@modules/company/CompanyNavigator";
import { InterviewList } from "@modules/interview/components/InterviewList";
import { apiErrorMessage } from "@api/apiClient";
import { formatDate, titleCase } from "@shared/format";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  Text,
  VStack,
  Button,
  Banner,
  TextField,
  Select,
  Skeleton,
  ErrorState,
  SectionHeader,
  StatusChip,
  ConfirmDialog,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<CompanyStackParamList>;
const ROLE_OPTIONS = [
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
];

export default function WorkspaceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { tenantId } = useRoute<RouteProp<CompanyStackParamList, "WorkspaceDetail">>().params;
  const qc = useQueryClient();
  const key = (what: string) => ["tenant", tenantId, what];

  const tenants = useQuery({ queryKey: ["tenants"], queryFn: companyApi.list });
  const tenant = tenants.data?.find((t) => t.id === tenantId);
  const canManage = tenant?.role === "owner" || tenant?.role === "admin";

  const members = useQuery({ queryKey: key("members"), queryFn: () => companyApi.members(tenantId) });
  const interviews = useQuery({ queryKey: key("interviews"), queryFn: () => companyApi.interviews(tenantId) });
  const invitations = useQuery({ queryKey: key("invitations"), queryFn: () => companyApi.invitations(tenantId) });
  const templates = useQuery({
    queryKey: ["managed-templates", tenantId, "published"],
    queryFn: () => templateApi.list(tenantId, "published"),
  });

  const [removing, setRemoving] = useState<string | null>(null);
  const remove = useMutation({
    mutationFn: (userId: string) => companyApi.removeMember(tenantId, userId),
    onSettled: () => {
      setRemoving(null);
      void qc.invalidateQueries({ queryKey: key("members") });
    },
  });

  if (tenants.isSuccess && !tenant)
    return (
      <Screen title="Workspace">
        <ErrorState
          title="Workspace not found"
          message="You are not a member of this workspace."
          actionLabel="Back to workspaces"
          onAction={() => navigation.navigate("Workspaces")}
        />
      </Screen>
    );

  return (
    <Screen
      title={tenant?.name ?? "Workspace"}
      subtitle={tenant ? `You are ${titleCase(tenant.role)}` : undefined}
      back="Back to workspaces"
      right={
        <Button
          label="Interview templates"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={() => navigation.navigate("Templates", { scope: tenantId })}
        />
      }
    >
      <SectionHeader title="Invite a candidate" />
      <InviteForm
        tenantId={tenantId}
        kind="candidate"
        options={(templates.data ?? []).map((t) => ({
          value: t.id,
          label: `${t.targetRole} (v${t.version})`,
        }))}
        optionLabel="Interview template"
        emptyHint="Publish an interview template first."
      />

      <SectionHeader title="Candidate interviews" count={interviews.data?.length} />
      {interviews.isLoading ? (
        <Skeleton height={100} />
      ) : interviews.isError ? (
        <ErrorState error={interviews.error} onRetry={() => void interviews.refetch()} />
      ) : (
        <InterviewList
          interviews={interviews.data ?? []}
          emptyMessage="Invited candidates appear here once they accept."
          onOpen={(it) =>
            (navigation.getParent() as { navigate: (n: string, p: object) => void } | undefined)?.navigate(
              "Interviews",
              { screen: "InterviewReport", params: { id: it.id } },
            )
          }
        />
      )}

      <SectionHeader title="Team" count={members.data?.length} />
      {members.isLoading ? (
        <Skeleton height={100} />
      ) : members.isError ? (
        <ErrorState error={members.error} onRetry={() => void members.refetch()} />
      ) : (
        <Card padded={false}>
          {(members.data ?? []).map((m, i) => (
            <React.Fragment key={m.userId}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                title={m.displayName}
                subtitle={`${m.email} · ${titleCase(m.role)}`}
                right={
                  canManage && m.role !== "owner" ? (
                    <Button
                      label="Remove"
                      variant="ghost"
                      size="xs"
                      fullWidth={false}
                      onPress={() => setRemoving(m.userId)}
                    />
                  ) : undefined
                }
              />
            </React.Fragment>
          ))}
        </Card>
      )}

      {canManage ? (
        <>
          <SectionHeader title="Invite a team member" />
          <InviteForm
            tenantId={tenantId}
            kind="member"
            options={ROLE_OPTIONS}
            optionLabel="Role"
          />
          <SectionHeader title="Invitations" count={invitations.data?.length} />
          <Card padded={false}>
            {(invitations.data ?? []).length === 0 ? (
              <Text variant="body-sm" tone="tertiary" style={{ padding: 16 }}>
                No invitations sent yet.
              </Text>
            ) : (
              (invitations.data ?? []).map((inv, i) => (
                <React.Fragment key={inv.id}>
                  {i > 0 ? <Divider /> : null}
                  <ListRow
                    title={inv.email}
                    subtitle={`${titleCase(inv.kind)}${inv.role ? ` · ${titleCase(inv.role)}` : ""} · expires ${formatDate(inv.expiresAt)}`}
                    right={
                      <StatusChip
                        label={titleCase(inv.status)}
                        tone={inv.status === "accepted" ? "success" : "neutral"}
                      />
                    }
                  />
                </React.Fragment>
              ))
            )}
          </Card>
        </>
      ) : null}

      <ConfirmDialog
        visible={removing !== null}
        title="Remove this member?"
        message="They lose access to this workspace immediately."
        confirmLabel="Remove"
        destructive
        loading={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && remove.mutate(removing)}
      />
    </Screen>
  );
}

interface InviteFormProps {
  tenantId: string;
  kind: "member" | "candidate";
  options: { value: string; label: string }[];
  optionLabel: string;
  emptyHint?: string;
}

/** Email + one choice (role or template). Used for both kinds of invitation. */
function InviteForm({ tenantId, kind, options, optionLabel, emptyHint }: InviteFormProps) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [choice, setChoice] = useState<string | null>(null);
  const [sent, setSent] = useState<Invitation | null>(null);
  const invite = useMutation({
    mutationFn: () =>
      kind === "member"
        ? companyApi.inviteMember(tenantId, email.trim(), choice as TenantRole)
        : companyApi.inviteCandidate(tenantId, email.trim(), choice!),
    onSuccess: (inv) => {
      setSent(inv);
      setEmail("");
      void qc.invalidateQueries({ queryKey: ["tenant", tenantId, "invitations"] });
    },
  });

  if (options.length === 0 && emptyHint)
    return <Banner tone="info" message={emptyHint} />;

  return (
    <Card>
      <VStack gap={12}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="person@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Select label={optionLabel} value={choice} options={options} onChange={setChoice} />
        {invite.isError ? (
          <Banner tone="danger" message={apiErrorMessage(invite.error)} />
        ) : null}
        {sent ? (
          <Banner
            tone="success"
            title={`Invitation emailed to ${sent.email}`}
            message={
              sent.devToken
                ? `Development only - accept at /company/invite?token=${sent.devToken}`
                : "The link in the email expires in 7 days."
            }
          />
        ) : null}
        <Button
          label="Send invitation"
          fullWidth={false}
          disabled={!/^\S+@\S+\.\S+$/.test(email.trim()) || !choice}
          loading={invite.isPending}
          onPress={() => invite.mutate()}
        />
      </VStack>
    </Card>
  );
}
