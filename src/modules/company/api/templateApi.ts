import { apiClient, ApiOne, Paginated } from "@api/apiClient";
import { RoundType } from "@modules/interview/types";

/** A tenant id, or "platform" for the admin-owned templates candidates practise on. */
export type TemplateScope = string;

export interface ManagedTemplate {
  id: string;
  name: string;
  targetRole: string;
  description: string;
  version: number;
  status: "draft" | "published" | "archived";
  rounds: { roundType: RoundType; sequence: number; durationSeconds: number }[];
  rubric: { dimensions: { key: string; label: string; weight: number }[] };
}

export interface Question {
  id: string;
  roundType: RoundType;
  questionText: string;
  competency: string;
  active: boolean;
}

/** New templates start with the standard three rounds and the PRD 2.5 rubric. */
const DEFAULTS = {
  rounds: [
    { roundType: "hr", sequence: 1 },
    { roundType: "technical", sequence: 2 },
    { roundType: "managerial", sequence: 3 },
  ],
  rubric: {
    dimensions: [
      { key: "relevance", label: "Answer relevance", weight: 25 },
      { key: "reasoning", label: "Reasoning / structure", weight: 25 },
      { key: "competency", label: "Role-specific competency", weight: 30 },
      { key: "communication", label: "Communication", weight: 20 },
    ],
  },
};

const one = async <T>(p: Promise<{ data: ApiOne<T> }>) => (await p).data.data;
const base = (scope: TemplateScope) =>
  scope === "platform" ? "/admin/templates" : `/companies/${scope}/templates`;

type Details = { name: string; targetRole: string; description?: string };

export const templateApi = {
  list: async (scope: TemplateScope, status?: string) =>
    (
      await apiClient.get<Paginated<ManagedTemplate>>(base(scope), {
        params: { limit: 100, status },
      })
    ).data.data,
  get: (scope: TemplateScope, id: string) =>
    one(apiClient.get<ApiOne<ManagedTemplate>>(`${base(scope)}/${id}`)),
  create: (scope: TemplateScope, details: Details) =>
    one(
      apiClient.post<ApiOne<ManagedTemplate>>(base(scope), {
        ...DEFAULTS,
        ...details,
      }),
    ),
  update: (scope: TemplateScope, id: string, details: Details) =>
    one(
      apiClient.patch<ApiOne<ManagedTemplate>>(`${base(scope)}/${id}`, details),
    ),
  action: (
    scope: TemplateScope,
    id: string,
    action: "publish" | "archive" | "versions",
  ) =>
    one(
      apiClient.post<ApiOne<ManagedTemplate>>(
        `${base(scope)}/${id}/${action}`,
      ),
    ),
  questions: (scope: TemplateScope, id: string) =>
    one(apiClient.get<ApiOne<Question[]>>(`${base(scope)}/${id}/questions`)),
  addQuestion: (
    scope: TemplateScope,
    id: string,
    q: { roundType: RoundType; questionText: string; competency?: string },
  ) => one(apiClient.post<ApiOne<Question>>(`${base(scope)}/${id}/questions`, q)),
  setQuestionActive: (
    scope: TemplateScope,
    id: string,
    questionId: string,
    active: boolean,
  ) =>
    one(
      apiClient.patch<ApiOne<Question>>(
        `${base(scope)}/${id}/questions/${questionId}`,
        { active },
      ),
    ),
};
