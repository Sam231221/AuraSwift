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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  useCashierForm,
  useCashierEditForm,
} from "./manage-cashier/hooks/use-cashier-form";

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

export default function CashierManagementView({
  onBack,
}: {
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [cashiers, setCashiers] = useState<StaffUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Load existing staff users
  useEffect(() => {
    loadStaffUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStaffUsers = async () => {
    if (!user?.businessId) return;

    setIsLoadingUsers(true);
    try {
      const response = await window.authAPI.getUsersByBusiness(user.businessId);

      if (response.success && response.users) {
        // Filter out admin users and convert to StaffUser format
        const cashiers: StaffUser[] = response.users
          .filter((u) => u.role === "cashier")
          .map((u) => ({
            id: u.id,
            email: u.email ?? "", // Ensure email is always a string
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role as "cashier",
            businessId: u.businessId,
            avatar: u.avatar,
            createdAt: u.createdAt || new Date().toISOString(),
            isActive: u.isActive !== undefined ? u.isActive : true,
          }));

        setCashiers(cashiers);
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
        toast.success("Cashier deleted successfully");
        // Reload the staff users list
        await loadStaffUsers();
      } else {
        toast.error(response.message || "Failed to delete cashier");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete cashier");
    }
  };

  const handleEditUser = (staffUser: StaffUser) => {
    setSelectedUser(staffUser);
    setIsEditDialogOpen(true);
  };

  const handleViewUser = (staffUser: StaffUser) => {
    setSelectedUser(staffUser);
    setIsViewDialogOpen(true);
  };

  // Filter users based on search and role
  const filteredUsers = cashiers.filter((staffUser) => {
    const matchesSearch =
      staffUser.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffUser.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffUser.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || staffUser.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Check if current user is admin
  const isAdminORManager = user?.role === "admin" || user?.role === "manager";

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

  if (!isAdminORManager) {
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
          <h1 className="text-3xl font-bold text-gray-900">
            Cashier Management
          </h1>
          <p className="text-gray-600 mt-1">Manage cashiers</p>
        </div>

        <CreateCashierDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          businessId={user?.businessId || ""}
          onSuccess={loadStaffUsers}
        />

        {/* Edit User Dialog */}
        {selectedUser && (
          <EditCashierDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            cashier={selectedUser}
            businessId={user?.businessId || ""}
            onSuccess={() => {
              setSelectedUser(null);
              loadStaffUsers();
            }}
          />
        )}

        {/* View User Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cashier Details</DialogTitle>
              <DialogDescription>
                View detailed information about this cashier.
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
            <CardTitle className="text-sm font-medium">
              Total Cashiers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashiers.length}</div>
            <p className="text-xs text-muted-foreground">Active cashiers</p>
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
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cashiers</CardTitle>
          <CardDescription>
            Manage your cashiers and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">Loading cashiers...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No cashiers found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterRole !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first cashier"}
              </p>
              {!searchTerm && filterRole === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Cashier
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cashier</TableHead>
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

// Create Cashier Dialog Component
interface CreateCashierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onSuccess: () => void;
}

function CreateCashierDialog({
  isOpen,
  onOpenChange,
  businessId,
  onSuccess,
}: CreateCashierDialogProps) {
  const { createUser } = useAuth();

  const { form, handleSubmit, isSubmitting } = useCashierForm({
    businessId,
    onSubmit: async (data) => {
      if (!businessId) {
        throw new Error("Business ID not found");
      }

      // Type guard: create form has password field
      if (!("password" in data)) {
        throw new Error("Invalid form data");
      }

      const userData = {
        businessId,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "cashier" as "cashier" | "manager",
        avatar: data.avatar || undefined,
        address: data.address || undefined,
        // Required for PIN-based system
        username: data.email, // Use email as username for now
        pin: "1234", // Default PIN, should be set by admin or user later
      };

      const response = await createUser(userData);

      if (!response.success) {
        throw new Error(response.message || "Failed to create cashier");
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] mx-4 sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Cashier</DialogTitle>
          <DialogDescription>
            Create a new staff account with role-based permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Avatar Upload */}
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AvatarUpload
                      value={field.value || ""}
                      onChange={(avatar) => field.onChange(avatar || "")}
                      type="user"
                      size="md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Smith"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john.smith@example.com"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123 Main Street, City, State"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Fields */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Minimum 8 characters"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm password"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating..." : "Create Cashier"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Cashier Dialog Component
interface EditCashierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cashier: StaffUser;
  businessId: string;
  onSuccess: () => void;
}

function EditCashierDialog({
  isOpen,
  onOpenChange,
  cashier,
  businessId,
  onSuccess,
}: EditCashierDialogProps) {
  const { form, handleSubmit, isSubmitting } = useCashierEditForm({
    cashier,
    businessId,
    onSubmit: async (data) => {
      // Type guard: update form has isActive field
      if (!("isActive" in data)) {
        throw new Error("Invalid form data");
      }

      const updates: Record<string, string | number | boolean> = {
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: data.isActive,
      };

      if (data.avatar) {
        updates.avatar = data.avatar;
      }
      if (data.address) {
        updates.address = data.address;
      }

      const response = await window.authAPI.updateUser(cashier.id, updates);

      if (!response.success) {
        throw new Error(response.message || "Failed to update cashier");
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Cashier</DialogTitle>
          <DialogDescription>
            Update cashier information and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-3 py-3">
            {/* Avatar Upload */}
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex">
                      <AvatarUpload
                        value={field.value || ""}
                        onChange={(avatar) => field.onChange(avatar || "")}
                        type="user"
                        className="w-15 h-15"
                        size="md"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Fields */}
            <div className="grid mt-12 grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="John"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Smith"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email (Read-only) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      disabled
                      className="bg-gray-50"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="123 Main Street, City, State"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active (user can log in)</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Updating..." : "Update Cashier"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
