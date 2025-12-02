import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

interface EmptyStateProps {
  searchTerm: string;
  filterRole: string;
  onAddUser: () => void;
}

export function EmptyState({
  searchTerm,
  filterRole,
  onAddUser,
}: EmptyStateProps) {
  const hasFilters = searchTerm || filterRole !== "all";

  return (
    <div className="text-center py-6 sm:py-8">
      <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-gray-400 mx-auto mb-4" />
      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
        No staff members found
      </h3>
      <p className="text-xs sm:text-sm md:text-base lg:text-base text-gray-600 mb-4 px-4">
        {hasFilters
          ? "Try adjusting your search or filters"
          : "Get started by adding your first staff member"}
      </p>
      {!hasFilters && (
        <Button
          onClick={onAddUser}
          className="text-xs sm:text-sm md:text-base lg:text-base h-8 sm:h-9 md:h-10"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Add First Staff Member</span>
          <span className="sm:hidden">Add Staff</span>
        </Button>
      )}
    </div>
  );
}
