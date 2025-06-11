import { useEffect, useState } from 'react';
import { Member, userService } from '../../services/user.service';
import { Separator } from '../../components/Separator';
import {
  MembersTable,
  HeaderItemsTableProps,
  BODY_STATE,
} from '../../components/members/MembersTable';
import Button from '../../components/Button';
import { usePaginatedUsageData } from '../../hooks/usePaginatedUserData';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

const TABLE_HEADERS: HeaderItemsTableProps[] = [
  {
    title: 'Member',
    key: 'member',
  },
  {
    title: 'Status',
    key: 'status',
  },
  {
    title: 'Role',
    key: 'role',
  },
];

const PAGINATED_ITEMS = 20;

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [tableBodyState, setTableBodyState] = useState<BODY_STATE>('loading');

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageInfo,
    totalItems,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedUsageData(members, PAGINATED_ITEMS);

  useEffect(() => {
    getMembers();
  }, []);

  const getMembers = async () => {
    try {
      setTableBodyState('loading');
      const membersList = await userService.getMembers();

      if (membersList.length === 0) {
        setTableBodyState('empty');
      } else {
        setTableBodyState('items');
      }

      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      setTableBodyState('empty');
    }
  };

  const handleCreateMember = () => {
    // TODO: Implement create member functionality
    console.log('Create member clicked');
  };

  const handleViewMember = (member: Member) => {
    // TODO: Implement view member functionality
    console.log('View member:', member);
  };

  const handleDeactivateMember = (member: Member) => {
    // TODO: Implement deactivate member functionality
    console.log('Deactivate member:', member);
  };

  const handleDeleteMember = (member: Member) => {
    // TODO: Implement delete member functionality
    console.log('Delete member:', member);
  };

  return (
    <div className='flex flex-col rounded-md bg-white gap-7 p-7'>
      <div className='flex flex-row w-full justify-between items-center'>
        <p className='text-xl font-semibold'>Members</p>
        <Button
          className='rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2'
          onClick={handleCreateMember}
        >
          Create Member
        </Button>
      </div>
      <Separator />
      <div className='flex flex-col w-full gap-4'>
        <MembersTable
          headers={TABLE_HEADERS}
          members={paginatedData}
          bodyState={tableBodyState}
          onViewMemberClicked={handleViewMember}
          onDeactivateMemberClicked={handleDeactivateMember}
          onDeleteMemberClicked={handleDeleteMember}
        />
        {tableBodyState === 'items' && (
          <div className='flex flex-row items-end justify-end w-full'>
            <div className='items-center flex flex-row gap-3'>
              <p className='text-sm text-gray-600'>
                {pageInfo.from}-{pageInfo.to} of {totalItems}
              </p>
              <div className='flex flex-row gap-3 items-center'>
                <button
                  disabled={!hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className='p-1 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <CaretLeft
                    size={20}
                    className={`${
                      !hasPrevPage
                        ? 'text-gray-30 cursor-no-drop'
                        : 'text-black'
                    }`}
                  />
                </button>
                <button
                  disabled={!hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className='p-1 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <CaretRight
                    size={20}
                    className={`${
                      !hasNextPage
                        ? 'text-gray-30 cursor-no-drop'
                        : 'text-black'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
