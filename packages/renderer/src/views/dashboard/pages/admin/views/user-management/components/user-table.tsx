import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";
import { UserTableRow } from "./user-table-row";
import type { StaffUser } from "../schemas/types";

interface UserTableProps {
  users: StaffUser[];
  isLoading: boolean;
  searchTerm: string;
  filterRole: string;
  onViewUser: (user: StaffUser) => void;
  onEditUser: (user: StaffUser) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onAddUser: () => void;
}

export function UserTable({
  users,
  isLoading,
  searchTerm,
  filterRole,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onAddUser,
}: UserTableProps) {
  return (
    <Card>
      <CardHeader className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
        <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl">
          Staff Members
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm md:text-base lg:text-base">
          Manage your team members and their access levels
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-xs sm:text-sm md:text-base lg:text-base text-gray-500">
              Loading staff members...
            </div>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            filterRole={filterRole}
            onAddUser={onAddUser}
          />
        ) : (
          <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
                    Staff Member
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap hidden sm:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
                    Role
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap hidden md:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((staffUser) => (
                  <UserTableRow
                    key={staffUser.id}
                    staffUser={staffUser}
                    onView={onViewUser}
                    onEdit={onEditUser}
                    onDelete={onDeleteUser}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
