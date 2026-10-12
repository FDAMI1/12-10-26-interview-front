import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react-native";
import { companyApi } from "@modules/company/api/companyApi";
import { CompanyStackParamList } from "@modules/company/CompanyNavigator";
import { VerifyEmailCard } from "@modules/auth/components/VerifyEmailCard";
import { apiErrorMessage } from "@api/apiClient";
import { titleCase } from "@shared/format";
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
  Skeleton,
  ErrorState,
  EmptyState,
  SectionHeader,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export default function WorkspacesScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const tenants = useQuery({ queryKey: ["tenants"], queryFn: companyApi.list });
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: companyApi.create,
    onSuccess: (t) => {
      setName("");
      void qc.invalidateQueries({ queryKey: ["tenants"] });
      navigation.navigate("WorkspaceDetail", { tenantId: t.id });
    },
  });

  return (
    <Screen
      title="Company workspaces"
      subtitle="Invite candidates to role-specific interviews and review their sessions."
    >
      {tenants.isLoading ? (
        <Skeleton height={120} />
      ) : tenants.isError ? (
        <ErrorState
          error={tenants.error}
          title="Couldn't load your workspaces"
          onRetry={() => void tenants.refetch()}
        />
      ) : (tenants.data ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No workspace yet"
            message="Create one below, or accept an invitation from your company."
          />
        </Card>
      ) : (
        <Card padded={false}>
          {(tenants.data ?? []).map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                title={t.name}
                subtitle={titleCase(t.role)}
                chevron
                onPress={() =>
                  navigation.navigate("WorkspaceDetail", { tenantId: t.id })
                }
              />
            </React.Fragment>
          ))}
        </Card>
      )}

      <SectionHeader title="Create a workspace" />
      <Card>
        <VStack gap={12}>
          <VerifyEmailCard />
          <Text variant="body-sm" tone="secondary">
            A new workspace starts with 3 free interview credits for invited
            candidates.
          </Text>
          <TextField
            label="Company name"
            value={name}
            onChangeText={setName}
            placeholder="Acme Ltd"
          />
          {create.isError ? (
            <Banner tone="danger" message={apiErrorMessage(create.error)} />
          ) : null}
          <Button
            label="Create workspace"
            fullWidth={false}
            disabled={name.trim().length < 2}
            loading={create.isPending}
            onPress={() => create.mutate(name.trim())}
          />
        </VStack>
      </Card>
    </Screen>
  );
}
