import { apiClient, ApiOne, Paginated } from "@api/apiClient";
import { Interview } from "@modules/interview/types";

export type TenantRole = "owner" | "admin" | "recruiter";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
}

export interface Member {
  userId: string;
  displayName: string;
  email: string;
  role: TenantRole;
}

export interface Invitation {
  id: string;
  kind: "member" | "candidate";
  email: string;
  role: TenantRole | null;
  status: string;
  expiresAt: string;
  interviewId: string | null;
  /** Returned outside production only, so the flow works without a mailbox. */
  devToken?: string;
}

export interface InvitationPreview {
  kind: "member" | "candidate";
  tenantName: string;
  email: string;
  role: TenantRole | null;
}

export type AcceptResult =
  | { kind: "member"; tenantId: string }
  | { kind: "candidate"; tenantId: string; interviewId: string };

const one = async <T>(p: Promise<{ data: ApiOne<T> }>) => (await p).data.data;
const base = (tenantId: string) => `/companies/${tenantId}`;

export const companyApi = {
  list: () => one(apiClient.get<ApiOne<Tenant[]>>("/companies")),
  create: (name: string) =>
    one(apiClient.post<ApiOne<Tenant>>("/companies", { name })),
  members: (tenantId: string) =>
    one(apiClient.get<ApiOne<Member[]>>(`${base(tenantId)}/members`)),
  removeMember: (tenantId: string, userId: string) =>
    one(apiClient.delete(`${base(tenantId)}/members/${userId}`)),
  inviteMember: (tenantId: string, email: string, role: TenantRole) =>
    one(
      apiClient.post<ApiOne<Invitation>>(`${base(tenantId)}/invitations`, {
        email,
        role,
      }),
    ),
  inviteCandidate: (tenantId: string, email: string, templateId: string) =>
    one(
      apiClient.post<ApiOne<Invitation>>(
        `${base(tenantId)}/candidate-invitations`,
        { email, templateId },
      ),
    ),
  invitations: (tenantId: string) =>
    one(apiClient.get<ApiOne<Invitation[]>>(`${base(tenantId)}/invitations`)),
  interviews: async (tenantId: string) =>
    (await apiClient.get<Paginated<Interview>>(`${base(tenantId)}/interviews`))
      .data.data,
  previewInvitation: (token: string) =>
    one(
      apiClient.get<ApiOne<InvitationPreview>>("/invitations/preview", {
        params: { token },
      }),
    ),
  acceptInvitation: (token: string) =>
    one(apiClient.post<ApiOne<AcceptResult>>("/invitations/accept", { token })),
};
