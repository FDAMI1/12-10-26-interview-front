import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, Candidate } from "@modules/admin/api/adminApi";
import { apiErrorMessage } from "@api/apiClient";
import { requestId } from "@shared/format";
import {
  Screen,
  Card,
  Text,
  VStack,
  HStack,
  Button,
  Banner,
  TextField,
  Skeleton,
  ErrorState,
  EmptyState,
  SectionHeader,
  StatusChip,
  ConfirmDialog,
  Divider,
} from "@shared/ui";
import { Users } from "lucide-react-native";

/** Create, credit, reset, deactivate and delete candidates. */
export default function AdminCandidatesScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const list = useQuery({
    queryKey: ["admin-candidates", search],
    queryFn: () => adminApi.candidates(search.trim()),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-candidates"] });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("1");
  // Shown once: the server keeps only a hash.
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  const create = useMutation({
    mutationFn: () => adminApi.createCandidate(name.trim(), email.trim(), Number(credits) || 0),
    onSuccess: (r) => {
      setIssued({ email: r.candidate.email, password: r.temporaryPassword });
      setName("");
      setEmail("");
      void refresh();
    },
  });
  const act = useMutation({
    mutationFn: async (a: { kind: "credit" | "reset" | "status" | "delete"; c: Candidate }) => {
      if (a.kind === "credit") await adminApi.addCandidateCredits(a.c.id, 1, requestId());
      if (a.kind === "status")
        await adminApi.setUserStatus(
          a.c.id,
          a.c.status === "active" ? "suspended" : "active",
          a.c.status === "active" ? "Deactivated by admin" : "Reactivated by admin",
        );
      if (a.kind === "delete") await adminApi.deleteCandidate(a.c.id);
      if (a.kind === "reset") {
        const r = await adminApi.resetCandidatePassword(a.c.id);
        setIssued({ email: a.c.email, password: r.temporaryPassword });
      }
    },
    onSettled: () => {
      setDeleting(null);
      void refresh();
    },
  });
  const [deleting, setDeleting] = useState<Candidate | null>(null);
  const validCredits = /^\d{1,4}$/.test(credits);

  return (
    <Screen
      title="Candidates"
      subtitle={`${list.data?.meta.total ?? "-"} candidates`}
      back="Back to admin"
    >
      <VStack gap={14}>
        {issued ? (
          <Banner tone="success" title={`Temporary password for ${issued.email}`}>
            <Text variant="h3" style={{ marginVertical: 4 }}>
              {issued.password}
            </Text>
            <Text variant="body-sm" tone="secondary">
              Copy it now and send it to the candidate. It is not shown again,
              and they must choose their own password at first sign-in.
            </Text>
            <Button label="Done" variant="secondary" size="sm" fullWidth={false} onPress={() => setIssued(null)} />
          </Banner>
        ) : null}

        <Card>
          <VStack gap={12}>
            <Text variant="h3">Add a candidate</Text>
            <TextField label="Full name" value={name} onChangeText={setName} placeholder="Candidate name" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="candidate@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextField
              label="Interviews allowed"
              value={credits}
              onChangeText={setCredits}
              keyboardType="number-pad"
              error={validCredits ? undefined : "Enter a whole number"}
            />
            {create.isError ? <Banner tone="danger" message={apiErrorMessage(create.error)} /> : null}
            <Button
              label="Create candidate"
              fullWidth={false}
              disabled={name.trim().length < 2 || !email.includes("@") || !validCredits}
              loading={create.isPending}
              onPress={() => create.mutate()}
            />
          </VStack>
        </Card>

        <SectionHeader title="All candidates" />
        <TextField value={search} onChangeText={setSearch} placeholder="Search by name or email" />
        {act.isError ? <Banner tone="danger" message={apiErrorMessage(act.error)} /> : null}
        {list.isLoading ? (
          <Skeleton height={160} />
        ) : list.isError ? (
          <ErrorState error={list.error} title="Couldn't load candidates" onRetry={() => void list.refetch()} />
        ) : (list.data?.data ?? []).length === 0 ? (
          <Card>
            <EmptyState icon={Users} title="No candidates found" />
          </Card>
        ) : (
          <Card padded={false}>
            {(list.data?.data ?? []).map((c, i) => {
              const api = c.authType === "api";
              return (
                <React.Fragment key={c.id}>
                  {i > 0 ? <Divider /> : null}
                  <VStack gap={8} style={{ padding: 12 }}>
                    <HStack justify="space-between" align="center" gap={8} wrap>
                      <VStack gap={0} flex={1}>
                        <Text variant="label">{c.displayName}</Text>
                        <Text variant="body-sm" tone="tertiary">
                          {api ? "API-integrated candidate" : c.email} · {c.interviewCredits} interview
                          {c.interviewCredits === 1 ? "" : "s"} left
                          {c.mustChangePassword ? " · temporary password" : ""}
                        </Text>
                      </VStack>
                      <StatusChip
                        label={c.status === "active" ? "Active" : "Deactivated"}
                        tone={c.status === "active" ? "success" : "danger"}
                      />
                    </HStack>
                    <HStack gap={8} wrap>
                      <Button
                        label={c.status === "active" ? "Deactivate" : "Activate"}
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        disabled={act.isPending}
                        onPress={() => act.mutate({ kind: "status", c })}
                      />
                      {/* An API candidate's identity belongs to the company's own system. */}
                      {api ? null : (
                        <>
                          <Button label="+1 interview" variant="secondary" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => act.mutate({ kind: "credit", c })} />
                          <Button label="Reset password" variant="secondary" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => act.mutate({ kind: "reset", c })} />
                        </>
                      )}
                      <Button label="Delete" variant="ghost" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => setDeleting(c)} />
                    </HStack>
                  </VStack>
                </React.Fragment>
              );
            })}
          </Card>
        )}
      </VStack>

      <ConfirmDialog
        visible={!!deleting}
        title={`Delete ${deleting?.displayName ?? "candidate"}?`}
        message="Their account, interviews, transcripts and scores are deleted for good. To keep the data and only block access, use Deactivate."
        confirmLabel="Delete candidate"
        destructive
        loading={act.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && act.mutate({ kind: "delete", c: deleting })}
      />
    </Screen>
  );
}

