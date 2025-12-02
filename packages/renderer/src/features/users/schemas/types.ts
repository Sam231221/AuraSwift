/**
 * StaffUser interface with RBAC support
 *
 * Use `getUserRoleName()` and `getUserRoleDisplayName()` helpers to get role information.
 */
export interface StaffUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessId: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
  address?: string;

  // RBAC fields (from backend)
  primaryRoleId?: string;
  roleName?: string; // From backend join query (lowercase role name)
  primaryRole?: {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    permissions?: unknown[]; // Optional for StaffUser (not always needed)
  };
}
