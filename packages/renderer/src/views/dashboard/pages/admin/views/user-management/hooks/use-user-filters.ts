import { useState, useMemo } from "react";
import type { StaffUser } from "../schemas/types";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";

export function useUserFilters(staffUsers: StaffUser[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const filteredUsers = useMemo(() => {
    return staffUsers.filter((staffUser) => {
      const matchesSearch =
        staffUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffUser.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffUser.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        filterRole === "all" || getUserRoleName(staffUser) === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [staffUsers, searchTerm, filterRole]);

  return {
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filteredUsers,
  };
}
