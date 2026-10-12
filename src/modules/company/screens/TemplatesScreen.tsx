import React, { useState } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react-native";
import { templateApi } from "@modules/company/api/templateApi";
import { CompanyStackParamList } from "@modules/company/CompanyNavigator";
import { apiErrorMessage } from "@api/apiClient";
import { titleCase } from "@shared/format";
import {
  Screen,
  Card,
  ListRow,
  Divider,
  VStack,
  Button,
  Banner,
  TextField,
  Skeleton,
  ErrorState,
  EmptyState,
  SectionHeader,
  StatusChip,
} from "@shared/ui";

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export default function TemplatesScreen() {
  const navigation = useNavigation<Nav>();
  const { scope } = useRoute<RouteProp<CompanyStackParamList, "Templates">>().params;
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["managed-templates", scope],
    queryFn: () => templateApi.list(scope),
  });
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const create = useMutation({
    mutationFn: () =>
      templateApi.create(scope, { name: name.trim(), targetRole: targetRole.trim() }),
    onSuccess: (t) => {
      setName("");
      setTargetRole("");
      void qc.invalidateQueries({ queryKey: ["managed-templates", scope] });
      navigation.navigate("TemplateEditor", { scope, templateId: t.id });
    },
  });

  return (
    <Screen
      title={scope === "platform" ? "Platform templates" : "Interview templates"}
      subtitle={
        scope === "platform"
          ? "Published platform templates are what candidates practise against."
          : "Role-specific interviews for the candidates you invite."
      }
      back={scope === "platform" ? false : "Back to workspace"}
    >
      {list.isLoading ? (
        <Skeleton height={140} />
      ) : list.isError ? (
        <ErrorState
          error={list.error}
          title="Couldn't load templates"
          onRetry={() => void list.refetch()}
        />
      ) : (list.data ?? []).length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No templates yet"
            message="Create a draft below, add questions, then publish it."
          />
        </Card>
      ) : (
        <Card padded={false}>
          {(list.data ?? []).map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 ? <Divider /> : null}
              <ListRow
                title={t.targetRole}
                subtitle={`${t.name} · v${t.version}`}
                right={
                  <StatusChip
                    label={titleCase(t.status)}
                    tone={
                      t.status === "published"
                        ? "success"
                        : t.status === "draft"
                          ? "info"
                          : "neutral"
                    }
                  />
                }
                onPress={() =>
                  navigation.navigate("TemplateEditor", { scope, templateId: t.id })
                }
              />
            </React.Fragment>
          ))}
        </Card>
      )}

      <SectionHeader title="New template" />
      <Card>
        <VStack gap={12}>
          <TextField
            label="Target role"
            value={targetRole}
            onChangeText={setTargetRole}
            placeholder="Backend Developer"
          />
          <TextField
            label="Template name"
            value={name}
            onChangeText={setName}
            placeholder="Backend Developer - standard interview"
          />
          {create.isError ? (
            <Banner tone="danger" message={apiErrorMessage(create.error)} />
          ) : null}
          <Button
            label="Create draft"
            fullWidth={false}
            disabled={name.trim().length < 2 || targetRole.trim().length < 2}
            loading={create.isPending}
            onPress={() => create.mutate()}
          />
        </VStack>
      </Card>
    </Screen>
  );
}
