import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react-native";
import { adminApi, AdminAccount } from "@modules/admin/api/adminApi";
import { apiErrorMessage } from "@api/apiClient";
import { useAuthStore } from "@shared/store/useAuthStore";
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

type Action = "rename" | "reset" | "status" | "delete";

/** Create, rename, reset, deactivate and delete platform admin accounts. */
export default function AdminAccountsScreen() {
  const qc = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState("");
  const list = useQuery({
    queryKey: ["admin-accounts", search],
    queryFn: () => adminApi.admins(search.trim()),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-accounts"] });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Shown once: the server keeps only a hash.
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<AdminAccount | null>(null);

  const create = useMutation({
    mutationFn: () => adminApi.createAdmin(name.trim(), email.trim()),
    onSuccess: (r) => {
      setIssued({ email: r.admin.email, password: r.temporaryPassword });
      setName("");
      setEmail("");
      void refresh();
    },
  });
  const act = useMutation({
    mutationFn: async ({ kind, a }: { kind: Action; a: AdminAccount }) => {
      if (kind === "rename" && editing) await adminApi.renameAdmin(a.id, editing.name.trim());
      if (kind === "status") await adminApi.setAdminStatus(a.id, a.status === "active" ? "suspended" : "active");
      if (kind === "delete") await adminApi.deleteAdmin(a.id);
      if (kind === "reset") {
        const r = await adminApi.resetAdminPassword(a.id);
        setIssued({ email: a.email, password: r.temporaryPassword });
      }
    },
    onSuccess: (_r, { kind }) => {
      if (kind === "rename") setEditing(null);
    },
    onSettled: () => {
      setDeleting(null);
      void refresh();
    },
  });

  return (
    <Screen title="Admins" subtitle={`${list.data?.meta.total ?? "-"} admin accounts`} back="Back to admin">
      <VStack gap={14}>
        {issued ? (
          <Banner tone="success" title={`Temporary password for ${issued.email}`}>
            <Text variant="h3" style={{ marginVertical: 4 }}>
              {issued.password}
            </Text>
            <Text variant="body-sm" tone="secondary">
              Copy it now and send it to the new admin. It is not shown again, and they must choose their own
              password at first sign-in.
            </Text>
            <Button label="Done" variant="secondary" size="sm" fullWidth={false} onPress={() => setIssued(null)} />
          </Banner>
        ) : null}

        <Card>
          <VStack gap={12}>
            <Text variant="h3">Add an admin</Text>
            <Text variant="body-sm" tone="secondary">
              Admins can manage every candidate, admin and setting. Add only people you trust.
            </Text>
            <TextField label="Full name" value={name} onChangeText={setName} placeholder="Admin name" />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="admin@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {create.isError ? <Banner tone="danger" message={apiErrorMessage(create.error)} /> : null}
            <Button
              label="Create admin"
              fullWidth={false}
              disabled={name.trim().length < 2 || !email.includes("@")}
              loading={create.isPending}
              onPress={() => create.mutate()}
            />
          </VStack>
        </Card>

        <SectionHeader title="All admins" />
        <TextField value={search} onChangeText={setSearch} placeholder="Search by name or email" />
        {act.isError ? <Banner tone="danger" message={apiErrorMessage(act.error)} /> : null}
        {list.isLoading ? (
          <Skeleton height={160} />
        ) : list.isError ? (
          <ErrorState error={list.error} title="Couldn't load admins" onRetry={() => void list.refetch()} />
        ) : (list.data?.data ?? []).length === 0 ? (
          <Card>
            <EmptyState icon={ShieldCheck} title="No admins found" />
          </Card>
        ) : (
          <Card padded={false}>
            {(list.data?.data ?? []).map((a, i) => {
              const self = a.id === myId;
              // Your own account and the .env admin cannot be changed here.
              const locked = self || a.managedByEnv;
              return (
                <React.Fragment key={a.id}>
                  {i > 0 ? <Divider /> : null}
                  <VStack gap={8} style={{ padding: 12 }}>
                    <HStack justify="space-between" align="center" gap={8} wrap>
                      <VStack gap={0} flex={1}>
                        <Text variant="label">
                          {a.displayName}
                          {self ? " (you)" : ""}
                        </Text>
                        <Text variant="body-sm" tone="tertiary">
                          {a.email}
                          {a.managedByEnv ? " · set by the server (.env)" : ""}
                          {a.mustChangePassword ? " · temporary password" : ""}
                        </Text>
                      </VStack>
                      <StatusChip
                        label={a.status === "active" ? "Active" : "Deactivated"}
                        tone={a.status === "active" ? "success" : "danger"}
                      />
                    </HStack>
                    {editing?.id === a.id ? (
                      // Separate keys: reusing the Save button as Deactivate would carry over its double-tap guard.
                      <HStack key="edit" gap={8} align="flex-end" wrap>
                        <VStack flex={1}>
                          <TextField
                            label="Full name"
                            value={editing.name}
                            onChangeText={(v) => setEditing({ id: a.id, name: v })}
                          />
                        </VStack>
                        <Button
                          label="Save"
                          size="sm"
                          fullWidth={false}
                          disabled={editing.name.trim().length < 2}
                          loading={act.isPending}
                          onPress={() => act.mutate({ kind: "rename", a })}
                        />
                        <Button label="Cancel" variant="ghost" size="sm" fullWidth={false} onPress={() => setEditing(null)} />
                      </HStack>
                    ) : locked ? null : (
                      <HStack key="actions" gap={8} wrap>
                        <Button label="Edit name" variant="secondary" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => setEditing({ id: a.id, name: a.displayName })} />
                        <Button label={a.status === "active" ? "Deactivate" : "Activate"} variant="secondary" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => act.mutate({ kind: "status", a })} />
                        <Button label="Reset password" variant="secondary" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => act.mutate({ kind: "reset", a })} />
                        <Button label="Delete" variant="ghost" size="sm" fullWidth={false} disabled={act.isPending} onPress={() => setDeleting(a)} />
                      </HStack>
                    )}
                  </VStack>
                </React.Fragment>
              );
            })}
          </Card>
        )}
      </VStack>

      <ConfirmDialog
        visible={!!deleting}
        title={`Delete ${deleting?.displayName ?? "admin"}?`}
        message="Their admin account is deleted for good and they are signed out. To keep the account and only block access, use Deactivate."
        confirmLabel="Delete admin"
        destructive
        loading={act.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && act.mutate({ kind: "delete", a: deleting })}
      />
    </Screen>
  );
}
