import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/shared/components/user-avatar";
import { AvatarUpload } from "@/shared/components/avatar-upload";
import { useAuth } from "@/shared/hooks/use-auth";
import { getRoleDisplayName } from "@/shared/utils/auth";
import {
  Plus,
  Search,
  Users,
  Shield,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "cashier" | "manager";
  businessId: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

const getStaffDisplayName = (staff: StaffUser): string => {
  return `${staff.firstName} ${staff.lastName}`;
};

export default function UserManagementView({ onBack }: { onBack: () => void }) {
  const { user, createUser } = useAuth();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Form state for new user
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "cashier" as "cashier" | "manager",
    avatar: "",
    address: "",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state for editing user
  const [editUser, setEditUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "cashier" as "cashier" | "manager",
    avatar: "",
    address: "",
    isActive: true,
  });

  // Load existing staff users
  useEffect(() => {
    loadStaffUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear form errors when dialog is closed
  useEffect(() => {
    if (!isAddDialogOpen) {
      setFormErrors({});
    }
  }, [isAddDialogOpen]);

  const loadStaffUsers = async () => {
    if (!user?.businessId) return;

    setIsLoadingUsers(true);
    try {
      const response = await window.authAPI.getUsersByBusiness(user.businessId);

      if (response.success && response.users) {
        // Filter out admin users and convert to StaffUser format
        const staffUsers: StaffUser[] = response.users
          .filter((u) => u.role !== "admin")
          .map((u) => ({
            id: u.id,
            email: u.email || "", // Ensure always string
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role as "cashier" | "manager",
            businessId: u.businessId,
            avatar: u.avatar,
            createdAt: u.createdAt || new Date().toISOString(),
            isActive: u.isActive !== undefined ? u.isActive : true,
          }));

        setStaffUsers(staffUsers);
      } else {
        console.error("Failed to load staff users:", response.message);
        toast.error(response.message || "Failed to load staff users");
      }
    } catch (error) {
      console.error("Failed to load staff users:", error);
      toast.error("Failed to load staff users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddUser = async () => {
    // Clear previous errors
    setFormErrors({});

    if (!user?.businessId) {
      toast.error("Business ID not found");
      return;
    }

    // Validation
    const errors: Record<string, string> = {};

    if (!newUser.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!newUser.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!newUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!newUser.password) {
      errors.password = "Password is required";
    } else if (newUser.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!newUser.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newUser.password !== newUser.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      // Use email as username, and set a default PIN (should be changed by admin later)
      const userData = {
        businessId: user.businessId,
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        avatar: newUser.avatar || undefined,
        address: newUser.address || undefined,
        username: newUser.email, // Use email as username
        pin: "1234", // Default PIN, should be changed by admin/user later
      };

      const response = await createUser(userData);

      if (response.success) {
        toast.success("Staff member created successfully");

        // Reload the staff users list to get the fresh data
        await loadStaffUsers();

        // Reset form and close dialog
        setNewUser({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          role: "cashier",
          avatar: "",
          address: "",
        });
        setIsAddDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to create staff member");
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach((error) => toast.error(error));
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await window.authAPI.deleteUser(userId);

      if (response.success) {
        toast.success("Staff member deleted successfully");
        // Reload the staff users list
        await loadStaffUsers();
      } else {
        toast.error(response.message || "Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete staff member");
    }
  };

  const handleEditUser = (staffUser: StaffUser) => {
    setSelectedUser(staffUser);
    setEditUser({
      email: staffUser.email,
      firstName: staffUser.firstName,
      lastName: staffUser.lastName,
      role: staffUser.role,
      avatar: staffUser.avatar || "",
      address: "", // We'll need to get this from the backend if stored
      isActive: staffUser.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewUser = (staffUser: StaffUser) => {
    setSelectedUser(staffUser);
    setIsViewDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updates: Record<string, string | number | boolean> = {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        role: editUser.role,
        isActive: editUser.isActive,
      };

      if (editUser.avatar) {
        updates.avatar = editUser.avatar;
      }
      if (editUser.address) {
        updates.address = editUser.address;
      }

      const response = await window.authAPI.updateUser(
        selectedUser.id,
        updates
      );

      if (response.success) {
        toast.success("Staff member updated successfully");
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        // Reload the staff users list
        await loadStaffUsers();
      } else {
        toast.error(response.message || "Failed to update staff member");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update staff member");
    }
  };

  // Filter users based on search and role
  const filteredUsers = staffUsers.filter((staffUser) => {
    const matchesSearch =
      staffUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffUser.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffUser.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || staffUser.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Check if current user is admin
  const isAdmin = user?.role === "admin";

  // Handle loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage staff members and their permissions
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account with role-based permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Avatar Upload */}
              <AvatarUpload
                label="Profile Picture (Optional)"
                value={newUser.avatar}
                onChange={(avatar) =>
                  setNewUser((prev) => ({ ...prev, avatar: avatar || "" }))
                }
                type="user"
                size="md"
              />

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => {
                      setNewUser((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (formErrors.firstName) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.firstName;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="John"
                    className={formErrors.firstName ? "border-red-500" : ""}
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-red-500">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => {
                      setNewUser((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (formErrors.lastName) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.lastName;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Smith"
                    className={formErrors.lastName ? "border-red-500" : ""}
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-red-500">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser((prev) => ({ ...prev, email: e.target.value }));
                    // Clear error when user starts typing
                    if (formErrors.email) {
                      setFormErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.email;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="john.smith@example.com"
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="123 Main Street, City, State"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser((prev) => ({
                      ...prev,
                      role: value as "cashier" | "manager",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">
                      <div className="flex flex-col items-start">
                        <span>Cashier</span>
                        <span className="text-xs text-gray-500">
                          Process sales and view basic reports
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex flex-col items-start">
                        <span>Manager</span>
                        <span className="text-xs text-gray-500">
                          Full sales management and inventory control
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Fields */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => {
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (formErrors.password) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.password;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Minimum 8 characters"
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  {formErrors.password && (
                    <p className="text-xs text-red-500">
                      {formErrors.password}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => {
                      setNewUser((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (formErrors.confirmPassword) {
                        setFormErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.confirmPassword;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Confirm password"
                    className={
                      formErrors.confirmPassword ? "border-red-500" : ""
                    }
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleAddUser}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Create Staff Member"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member information and permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Avatar Upload */}
              <AvatarUpload
                label="Profile Picture (Optional)"
                value={editUser.avatar}
                onChange={(avatar) =>
                  setEditUser((prev) => ({ ...prev, avatar: avatar || "" }))
                }
                type="user"
                size="md"
              />

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={editUser.firstName}
                    onChange={(e) =>
                      setEditUser((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={editUser.lastName}
                    onChange={(e) =>
                      setEditUser((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Smith"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={editUser.address}
                  onChange={(e) =>
                    setEditUser((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="123 Main Street, City, State"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="editRole">Role *</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) =>
                    setEditUser((prev) => ({
                      ...prev,
                      role: value as "cashier" | "manager",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">
                      <div className="flex flex-col items-start">
                        <span>Cashier</span>
                        <span className="text-xs text-gray-500">
                          Process sales and view basic reports
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="manager">
                      <div className="flex flex-col items-start">
                        <span>Manager</span>
                        <span className="text-xs text-gray-500">
                          Full sales management and inventory control
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editUser.isActive}
                    onChange={(e) =>
                      setEditUser((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="editIsActive" className="text-sm">
                    Active (user can log in)
                  </Label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleUpdateUser}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Updating..." : "Update Staff Member"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Staff Member Details</DialogTitle>
              <DialogDescription>
                View detailed information about this staff member.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
                {/* Avatar */}
                <div className="flex justify-center">
                  <UserAvatar user={selectedUser} className="w-20 h-20" />
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Full Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {getStaffDisplayName(selectedUser)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Role
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          selectedUser.role === "manager"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getRoleDisplayName(selectedUser.role)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          selectedUser.isActive ? "default" : "destructive"
                        }
                      >
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Created Date
                    </Label>
                    <p className="text-sm">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Business ID
                    </Label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.businessId}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditUser(selectedUser);
                    }}
                    className="flex-1"
                  >
                    Edit User
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cashiers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffUsers.filter((u) => u.role === "cashier").length}
            </div>
            <p className="text-xs text-muted-foreground">Front desk staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staffUsers.filter((u) => u.role === "manager").length}
            </div>
            <p className="text-xs text-muted-foreground">Management staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="cashier">Cashiers</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Manage your team members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">
                Loading staff members...
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No staff members found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterRole !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first staff member"}
              </p>
              {!searchTerm && filterRole === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Staff Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((staffUser) => (
                  <TableRow key={staffUser.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={staffUser} className="w-8 h-8" />
                        <div>
                          <div className="font-medium">
                            {getStaffDisplayName(staffUser)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{staffUser.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          staffUser.role === "manager" ? "default" : "secondary"
                        }
                      >
                        {getRoleDisplayName(staffUser.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(staffUser.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={staffUser.isActive ? "default" : "destructive"}
                      >
                        {staffUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(staffUser)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(staffUser)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() =>
                            handleDeleteUser(
                              staffUser.id,
                              getStaffDisplayName(staffUser)
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
