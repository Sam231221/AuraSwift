import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditUserForm } from "../forms/edit-user-form";
import type { UserUpdateFormData } from "../../schemas/user-schema";
import type { StaffUser } from "../../schemas/types";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: StaffUser;
  onSubmit: (data: UserUpdateFormData) => Promise<void>;
  isLoading: boolean;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}: EditUserDialogProps) {
  const handleSubmit = async (data: UserUpdateFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-2 sm:mx-4 md:mx-6 lg:mx-8 p-3 sm:p-4 md:p-6 max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col">
        <DialogHeader className="px-0 sm:px-0 md:px-2 shrink-0">
          <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl">
            Edit Staff Member
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base lg:text-base mt-1 sm:mt-2">
            Update staff member information and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="px-0 sm:px-0 md:px-2 flex-1 overflow-y-auto min-h-0">
          <EditUserForm
            user={user}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            isOpen={open}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
