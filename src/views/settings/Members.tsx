import { useEffect, useState } from 'react';
import { Member, userService } from '../../services/user.service';
import { Separator } from '../../components/Separator';
import { MembersTable, HeaderItemsTableProps, BODY_STATE } from '../../components/settings/MembersTable';
import Button from '../../components/Button';
import { usePaginatedUsageData } from '../../hooks/usePaginatedUserData';
import { Pagination } from '../../components/ui/Pagination';

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

  const { paginatedData, currentPage, setCurrentPage, pageInfo, totalItems } = usePaginatedUsageData(
    members,
    PAGINATED_ITEMS,
  );

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
    } catch {
      setTableBodyState('empty');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getMembers();
  }, []);

  // TODO: Implement create member functionality
  const handleCreateMember = () => {};

  // TODO: Implement view member functionality
  const handleViewMember = (_member: Member) => {};

  // TODO: Implement deactivate member functionality
  const handleDeactivateMember = (_member: Member) => {};

  // TODO: Implement delete member functionality
  const handleDeleteMember = (_member: Member) => {};

  return (
    <div className="flex flex-col rounded-md bg-white gap-7 p-7">
      <div className="flex flex-row w-full justify-between items-center">
        <p className="text-xl font-semibold">Members</p>
        <Button
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 hidden"
          onClick={handleCreateMember}
        >
          Create Member
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-4">
        <MembersTable
          headers={TABLE_HEADERS}
          members={paginatedData}
          bodyState={tableBodyState}
          onViewMemberClicked={handleViewMember}
          onDeactivateMemberClicked={handleDeactivateMember}
          onDeleteMemberClicked={handleDeleteMember}
        />
        {tableBodyState === 'items' && (
          <div className="flex flex-row items-end justify-end w-full">
            <div className="items-center flex flex-row gap-3">
              <p className="text-sm text-gray-600">
                {pageInfo.from}-{pageInfo.to} of {totalItems}
              </p>
              <div className="flex flex-row gap-3 items-center">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={PAGINATED_ITEMS}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
