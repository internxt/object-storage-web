import managementAxios from '../core/management-axios';
import { managementAuthService } from './management-auth.service';
import { ManagementRole } from './management.service';

const API = '/management';

export type AssignableManagementRole = Exclude<ManagementRole, 'owner'>;

export interface ManagementMember {
  id: string;
  email: string;
  role: ManagementRole;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface CreateManagementMemberDto {
  email: string;
  password: string;
  role: AssignableManagementRole;
}

async function getMembers(): Promise<ManagementMember[]> {
  const response = await managementAxios.get<ManagementMember[]>(`${API}/members`);
  return response.data;
}

async function createMember(dto: CreateManagementMemberDto): Promise<{ id: string }> {
  const response = await managementAxios.post<{ id: string }>(`${API}/members`, dto);
  return response.data;
}

async function updateMemberRole(id: string, role: AssignableManagementRole): Promise<void> {
  await managementAxios.patch(`${API}/members/${id}/role`, { role });
}

async function resetMemberTwoFactor(id: string): Promise<void> {
  await managementAxios.patch(`${API}/members/${id}/tfa`, {});
}

async function deleteMember(id: string): Promise<void> {
  await managementAxios.delete(`${API}/members/${id}`);
}

async function changeOwnPassword(oldPassword: string, newPassword: string, code?: string): Promise<void> {
  const { data } = await managementAxios.put<{ token: string }>(`${API}/me/password`, {
    oldPassword,
    newPassword,
    code: code || undefined,
  });
  managementAuthService.setToken(data.token);
}

export const managementMembersService = {
  getMembers,
  createMember,
  updateMemberRole,
  resetMemberTwoFactor,
  deleteMember,
  changeOwnPassword,
};
