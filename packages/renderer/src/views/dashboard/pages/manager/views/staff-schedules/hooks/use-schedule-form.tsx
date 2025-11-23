/**
 * Staff Schedule Form Hook
 * 
 * Custom hook for managing staff schedule form state, validation, and submission
 * using React Hook Form with Zod validation.
 */

import { useForm } from "react-hook-form";
import { configuredZodResolver } from "@/shared/validation/resolvers";
import {
  scheduleCreateSchema,
  scheduleUpdateSchema,
  type ScheduleFormData,
  type ScheduleUpdateData,
} from "../schemas/schedule-schema";
import { useFormNotification } from "@/shared/hooks/use-form-notification";
import { format } from "date-fns";

interface Schedule {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string;
  assignedRegister?: string;
  notes?: string;
  businessId: string;
}

interface UseScheduleFormOptions {
  /**
   * Schedule to edit (if in edit mode)
   */
  schedule?: Schedule | null;

  /**
   * Selected date for the schedule
   */
  selectedDate: Date;

  /**
   * Business ID (required for all operations)
   */
  businessId: string;

  /**
   * Callback when form is submitted successfully
   */
  onSubmit: (data: ScheduleFormData | ScheduleUpdateData) => Promise<void>;

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void;
}

/**
 * Get default form values for creating a new schedule
 */
const getDefaultValues = (
  selectedDate: Date,
  businessId: string
): ScheduleFormData => ({
  staffId: "",
  date: format(selectedDate, "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "17:00",
  assignedRegister: "",
  notes: "",
  businessId,
});

/**
 * Map schedule entity to form data
 */
const mapScheduleToFormData = (
  schedule: Schedule,
  businessId: string
): ScheduleUpdateData => {
  const startDate = new Date(schedule.startTime);
  const endDate = new Date(schedule.endTime);

  return {
    id: schedule.id,
    staffId: schedule.staffId,
    date: format(startDate, "yyyy-MM-dd"),
    startTime: format(startDate, "HH:mm"),
    endTime: format(endDate, "HH:mm"),
    assignedRegister: schedule.assignedRegister || "",
    notes: schedule.notes || "",
    businessId,
  };
};

/**
 * Hook for managing schedule form
 * 
 * @example
 * ```tsx
 * const { form, handleSubmit, isSubmitting } = useScheduleForm({
 *   schedule: editingSchedule,
 *   selectedDate: new Date(),
 *   businessId: user.businessId,
 *   onSubmit: async (data) => {
 *     await saveSchedule(data);
 *   },
 *   onSuccess: () => {
 *     setIsDrawerOpen(false);
 *   },
 * });
 * ```
 */
export function useScheduleForm({
  schedule,
  selectedDate,
  businessId,
  onSubmit,
  onSuccess,
}: UseScheduleFormOptions) {
  const isEditMode = !!schedule;
  const schema = isEditMode ? scheduleUpdateSchema : scheduleCreateSchema;

  const form = useForm<ScheduleFormData | ScheduleUpdateData>({
    resolver: configuredZodResolver(schema),
    defaultValues: schedule
      ? mapScheduleToFormData(schedule, businessId)
      : getDefaultValues(selectedDate, businessId),
    mode: "onBlur", // Validate on blur for better UX
  });

  const { notifySuccess, notifyError } = useFormNotification({
    entityName: "Schedule",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      notifySuccess(isEditMode ? "update" : "create");
      
      // Reset form after successful creation (not on update)
      if (!isEditMode) {
        form.reset(getDefaultValues(selectedDate, businessId));
      }
      
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      notifyError(errorMessage);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    isEditMode,
  };
}

