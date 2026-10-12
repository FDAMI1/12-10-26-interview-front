import React, { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { adminApi } from "@modules/admin/api/adminApi";
import { apiErrorMessage } from "@api/apiClient";
import { User, useAuthStore } from "@shared/store/useAuthStore";
import { titleCase } from "@shared/format";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  Text,
  VStack,
  HStack,
  Button,
  Banner,
  TextField,
  Skeleton,
  ErrorState,
  StatusChip,
} from "@shared/ui";

export default function AdminUsersScreen() {
  const qc = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<User | null>(null);
  const [reason, setReason] = useState("");

  const users = useQuery({
    queryKey: ["admin-users", search.trim()],
    queryFn: () => adminApi.users(search.trim()),
    placeholderData: keepPreviousData,
  });

  const nextStatus = target?.status === "active" ? "suspended" : "active";
  const change = useMutation({
    mutationFn: () => adminApi.setUserStatus(target!.id, nextStatus, reason.trim()),
    onSuccess: () => {
      setTarget(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return (
    <Screen title="Users" subtitle={`${users.data?.meta.total ?? "-"} accounts`} back="Back to admin">
      <VStack gap={12}>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email"
          accessibilityLabel="Search users"
          autoCapitalize="none"
        />

        {target ? (
          <Card>
            <VStack gap={12}>
              <Text variant="h3">
                {nextStatus === "suspended" ? "Suspend" : "Reactivate"}{" "}
                {target.displayName}
              </Text>
              <Text variant="body-sm" tone="secondary">
                {nextStatus === "suspended"
                  ? "They are signed out everywhere and cannot sign in again. The reason is written to the audit log."
                  : "They can sign in again. The reason is written to the audit log."}
              </Text>
              <TextField
                label="Reason"
                value={reason}
                onChangeText={setReason}
                placeholder="Why are you making this change?"
              />
              {change.isError ? (
                <Banner tone="danger" message={apiErrorMessage(change.error)} />
              ) : null}
              <HStack gap={8}>
                <Button
                  label={nextStatus === "suspended" ? "Suspend account" : "Reactivate account"}
                  variant={nextStatus === "suspended" ? "destructive" : "primary"}
                  fullWidth={false}
                  disabled={reason.trim().length < 3}
                  loading={change.isPending}
                  onPress={() => change.mutate()}
                />
                <Button
                  label="Cancel"
                  variant="secondary"
                  fullWidth={false}
                  onPress={() => setTarget(null)}
                />
              </HStack>
            </VStack>
          </Card>
        ) : null}

        {users.isLoading ? (
          <Skeleton height={200} />
        ) : users.isError ? (
          <ErrorState
            error={users.error}
            title="Couldn't load users"
            onRetry={() => void users.refetch()}
          />
        ) : (
          <Card padded={false}>
            {(users.data?.data ?? []).length === 0 ? (
              <Text variant="body-sm" tone="tertiary" style={{ padding: 16 }}>
                No accounts match that search.
              </Text>
            ) : (
              (users.data?.data ?? []).map((u, i) => (
                <React.Fragment key={u.id}>
                  {i > 0 ? <Divider /> : null}
                  <ListRow
                    title={u.displayName}
                    subtitle={`${u.email} · ${titleCase(u.role)}${u.emailVerified ? "" : " · unverified"}`}
                    right={
                      <HStack gap={8} align="center">
                        <StatusChip
                          label={titleCase(u.status)}
                          tone={u.status === "active" ? "success" : "danger"}
                        />
                        {u.id !== myId ? (
                          <Button
                            label={u.status === "active" ? "Suspend" : "Reactivate"}
                            variant="ghost"
                            size="xs"
                            fullWidth={false}
                            onPress={() => {
                              setReason("");
                              setTarget(u);
                            }}
                          />
                        ) : null}
                      </HStack>
                    }
                  />
                </React.Fragment>
              ))
            )}
          </Card>
        )}
      </VStack>
    </Screen>
  );
}
