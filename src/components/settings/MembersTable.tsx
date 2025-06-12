import { Member } from '../../services/user.service';
import { LoadingRowSkeleton } from '../LoadingSkeleton';
import {
  DotsThreeVertical,
  Eye,
  Trash,
  UserMinus,
} from '@phosphor-icons/react';
import { Dropdown } from '../Dropdown';

export interface HeaderItemsTableProps {
  title: string;
  key: string;
}

export type BODY_STATE = 'loading' | 'empty' | 'items';

interface MembersTableProps {
  headers: HeaderItemsTableProps[];
  members: Member[];
  bodyState: BODY_STATE;
  onViewMemberClicked: (member: Member) => void;
  onDeactivateMemberClicked: (member: Member) => void;
  onDeleteMemberClicked: (member: Member) => void;
}

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();

  if (statusLower === 'active') {
    return (
      <div className='flex flex-row items-center gap-3'>
        <div className='h-3 w-3 rounded-full border border-black/30 p-[1px]'>
          <div className='h-full w-full rounded-full bg-green' />
        </div>
        <p className='text-sm'>Active</p>
      </div>
    );
  } else if (statusLower === 'inactive') {
    return (
      <div className='flex flex-row items-center gap-3'>
        <div className='h-3 w-3 rounded-full border border-black/30 p-[1px]'>
          <div className='h-full w-full rounded-full bg-red' />
        </div>
        <p className='text-sm'>Inactive</p>
      </div>
    );
  }

  return (
    <div className='flex flex-row items-center gap-3'>
      <div className='h-3 w-3 rounded-full border border-black/30 p-[1px]'>
        <div className='h-full w-full rounded-full bg-gray-400' />
      </div>
      <p className='text-sm'>{status}</p>
    </div>
  );
};

export const MembersTable = ({
  headers,
  members,
  bodyState,
  onViewMemberClicked,
  onDeactivateMemberClicked,
  onDeleteMemberClicked,
}: MembersTableProps) => {
  const renderCellValue = (member: Member, key: string) => {
    switch (key) {
      case 'member':
        return (
          <div className='flex flex-col'>
            <p className='text-primary font-medium'>
              {member.firstName} {member.lastName}
            </p>
            <p className='text-sm text-gray-500'>{member.email}</p>
          </div>
        );
      case 'status':
        return getStatusBadge(member.status);
      case 'role':
        return <p className='text-black'>{member.memberRole}</p>;
      default:
        return '-';
    }
  };

  return (
    <table className='w-full'>
      <thead>
        <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
          {headers.map((header) => (
            <th key={header.key} className='w-[33%] px-5 text-left'>
              {header.title}
            </th>
          ))}
          <th className='w-[1%]' />
        </tr>
      </thead>
      <tbody>
        {bodyState === 'loading' && (
          <LoadingRowSkeleton
            numberOfColumns={headers.length + 1}
            numberOfRows={5}
            itemWidth='25%'
          />
        )}
        {bodyState === 'empty' && (
          <tr>
            <td
              colSpan={headers.length + 1}
              className='text-center py-4 text-sm text-gray-400'
            >
              No members found
            </td>
          </tr>
        )}
        {bodyState === 'items' &&
          members.map((member) => (
            <tr key={member.id} className='w-full h-12 text-sm text-gray-500'>
              {headers.map((header) => (
                <td key={header.key} className='px-5 text-left'>
                  {renderCellValue(member, header.key)}
                </td>
              ))}
              <td className='w-[1%] px-5'>
                <Dropdown
                  button={
                    <DotsThreeVertical
                      size={28}
                      weight='bold'
                      className='hover:bg-gray-20 rounded-full p-1 cursor-pointer'
                    />
                  }
                  items={[
                    {
                      label: 'View',
                      icon: <Eye size={18} className='text-blue-600' />,
                      onClick: () => onViewMemberClicked(member),
                    },
                    {
                      label: 'Deactivate',
                      icon: <UserMinus size={18} className='text-orange-600' />,
                      onClick: () => onDeactivateMemberClicked(member),
                    },
                    {
                      label: 'Delete',
                      icon: <Trash size={18} className='text-red-600' />,
                      onClick: () => onDeleteMemberClicked(member),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};
