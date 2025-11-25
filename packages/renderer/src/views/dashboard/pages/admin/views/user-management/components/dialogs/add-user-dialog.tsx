import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddUserForm } from "../forms/add-user-form";
import type { UserCreateFormData } from "../../schemas/user-schema";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserCreateFormData) => Promise<void>;
  isLoading: boolean;
  trigger?: React.ReactNode;
}

export function AddUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  trigger,
}: AddUserDialogProps) {
  const handleSubmit = async (data: UserCreateFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-2 sm:mx-4 md:mx-6 lg:mx-8 p-3 sm:p-4 md:p-6 max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col">
        <DialogHeader className="px-0 sm:px-0 md:px-2 flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl">
            Add New Staff Member
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base lg:text-base mt-1 sm:mt-2">
            Create a new staff account with role-based permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="px-0 sm:px-0 md:px-2 flex-1 overflow-y-auto min-h-0">
          <AddUserForm
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
