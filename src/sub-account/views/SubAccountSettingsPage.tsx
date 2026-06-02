import { useEffect, useState } from 'react';
import { Trash, LockKey } from '@phosphor-icons/react';
import { Separator } from '../../components/Separator';
import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import notificationsService from '../../services/notifications.service';
import subAccountAxios from '../core/sub-account-axios';
import { useSubAccount } from '../context/SubAccountContext';
import { AddMemberModal } from '../components/AddMemberModal';
import { AssignPermissionsModal } from '../components/AssignPermissionsModal';

interface MemberItem {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export const SubAccountSettingsPage = () => {
  const { entityId } = useSubAccount();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<MemberItem | null>(null);
  const [permissionMember, setPermissionMember] = useState<MemberItem | null>(null);
  const [isAssigningPermission, setIsAssigningPermission] = useState(false);

  useEffect(() => {
    if (entityId) fetchMembers();
  }, [entityId]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await subAccountAxios.get<MemberItem[]>(`/sub-accounts/${entityId}/members`);
      setMembers(res.data);
    } catch {
      notificationsService.error({ text: 'Failed to load members' });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const onAddMember = async (email: string, password: string | undefined, role: 'admin' | 'standard') => {
    setIsAddingMember(true);
    try {
      await subAccountAxios.post(`/sub-accounts/${entityId}/members`, { email, password, role });
      notificationsService.success({ text: 'Member added' });
      setIsAddMemberOpen(false);
      await fetchMembers();
    } catch (err: any) {
      notificationsService.error({ text: err?.response?.data?.message ?? 'Failed to add member' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const onDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeletingMemberId(memberToDelete.id);
    try {
      await subAccountAxios.delete(`/sub-accounts/${entityId}/members/${memberToDelete.id}`);
      notificationsService.success({ text: 'Member removed' });
      setMemberToDelete(null);
      await fetchMembers();
    } catch {
      notificationsService.error({ text: 'Failed to remove member' });
    } finally {
      setDeletingMemberId(null);
    }
  };

  const onAssignPermissions = async (bucketName: string, prefixes: string[], permission: 'read' | 'write' | 'full') => {
    if (!permissionMember) return;
    setIsAssigningPermission(true);
    try {
      await subAccountAxios.put(`/sub-accounts/${entityId}/members/${permissionMember.id}/permissions`, {
        bucketName,
        prefixes,
        permission,
      });
      notificationsService.success({ text: 'Permissions updated' });
      setPermissionMember(null);
    } catch {
      notificationsService.error({ text: 'Failed to update permissions' });
    } finally {
      setIsAssigningPermission(false);
    }
  };

  return (
    <section className='flex flex-col items-center p-7 w-full'>
      <div className='flex flex-col p-8 w-full bg-white gap-5 rounded-md'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='font-semibold text-lg'>Members</p>
          <Button className='rounded-md' onClick={() => setIsAddMemberOpen(true)}>
            Add Member
          </Button>
        </div>
        <Separator />

        {isLoadingMembers ? (
          <p className='text-sm text-gray-400'>Loading...</p>
        ) : members.length === 0 ? (
          <p className='text-sm text-gray-400'>No members yet.</p>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-gray-500 border-b border-gray-100'>
                <th className='pb-2 font-medium'>Email</th>
                <th className='pb-2 font-medium'>Role</th>
                <th className='pb-2 font-medium'>Added</th>
                <th className='pb-2 font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className='border-b border-gray-50 hover:bg-gray-50'>
                  <td className='py-3'>{m.email}</td>
                  <td className='py-3 capitalize'>{m.role ?? 'standard'}</td>
                  <td className='py-3 text-gray-400'>
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className='py-3'>
                    <div className='flex items-center gap-2 justify-end'>
                      <button
                        onClick={() => setPermissionMember(m)}
                        className='text-blue-500 hover:text-blue-700 p-1'
                        title='Assign permissions'
                      >
                        <LockKey size={16} />
                      </button>
                      <button
                        onClick={() => setMemberToDelete(m)}
                        disabled={deletingMemberId === m.id}
                        className='text-red-400 hover:text-red-600 p-1 disabled:opacity-40'
                        title='Remove member'
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddMemberModal
        isOpen={isAddMemberOpen}
        isLoading={isAddingMember}
        onClose={() => setIsAddMemberOpen(false)}
        onAdd={onAddMember}
      />

      {permissionMember && (
        <AssignPermissionsModal
          isOpen={!!permissionMember}
          isLoading={isAssigningPermission}
          memberEmail={permissionMember.email}
          onClose={() => setPermissionMember(null)}
          onAssign={onAssignPermissions}
        />
      )}

      <Dialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onPrimaryAction={onDeleteMember}
        onSecondaryAction={() => setMemberToDelete(null)}
        isLoading={!!deletingMemberId}
        primaryAction='Remove'
        secondaryAction='Cancel'
        primaryActionColor='danger'
        title='Remove member'
        subtitle={`This will remove ${memberToDelete?.email} from this sub-account. Their IAM credentials will be deleted.`}
      />
    </section>
  );
};
