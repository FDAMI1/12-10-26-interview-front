import React from "react";
import { Mic } from "lucide-react-native";
import { Interview, statusTone } from "@modules/interview/types";
import { formatDate, titleCase } from "@shared/format";
import { Card, ListRow, Divider, StatusChip, EmptyState } from "@shared/ui";

interface Props {
  interviews: Interview[];
  onOpen: (interview: Interview) => void;
  emptyMessage: string;
}

/** Interview rows - shared by the dashboard, the list and the company view. */
export function InterviewList({ interviews, onOpen, emptyMessage }: Props) {
  if (interviews.length === 0)
    return (
      <Card>
        <EmptyState icon={Mic} title="No interviews yet" message={emptyMessage} />
      </Card>
    );
  return (
    <Card padded={false}>
      {interviews.map((it, i) => (
        <React.Fragment key={it.id}>
          {i > 0 ? <Divider /> : null}
          <ListRow
            title={it.targetRole || it.templateName}
            subtitle={`${it.templateName} · ${formatDate(it.createdAt)}`}
            right={
              <StatusChip
                label={titleCase(it.status)}
                tone={statusTone(it.status)}
              />
            }
            onPress={() => onOpen(it)}
          />
        </React.Fragment>
      ))}
    </Card>
  );
}
