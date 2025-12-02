/**
 * Staff Schedule Validation Schema
 *
 * Validation schemas for staff schedule management forms.
 * Uses common schemas from shared/validation/common for consistency.
 */

import { z } from "zod";
import { optionalStringSchema } from "@/shared/validation/common";

/**
 * Time validation (HH:MM format)
 */
const timeSchema = z
  .string()
  .regex(
    /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    "Time must be in HH:MM format (24-hour)"
  );

/**
 * Date string validation (YYYY-MM-DD format)
 */
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), "Please enter a valid date");

/**
 * Schedule create schema
 * Used for creating new schedules
 */
export const scheduleCreateSchema = z
  .object({
    staffId: z.string().min(1, "Staff member is required"),
    date: dateStringSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    assignedRegister: optionalStringSchema,
    notes: z
      .string()
      .max(500, "Notes must not exceed 500 characters")
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((val) => val || ""),
    businessId: z.string().min(1, "Business ID is required"),
  })
  .superRefine((data, ctx) => {
    // Parse times
    const [startHour, startMinute] = data.startTime.split(":").map(Number);
    const [endHour, endMinute] = data.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if it's an overnight shift (end time is before start time)
    const isOvernight = endMinutes < startMinutes;

    if (isOvernight) {
      // For overnight shifts, calculate duration across midnight
      const duration = 24 * 60 - startMinutes + endMinutes;

      // Minimum duration: 1 hour (60 minutes)
      if (duration < 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration must be at least 1 hour",
          path: ["endTime"],
        });
      }

      // Maximum duration: 16 hours (960 minutes)
      if (duration > 16 * 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration cannot exceed 16 hours",
          path: ["endTime"],
        });
      }
    } else {
      // Regular shift (same day)
      const duration = endMinutes - startMinutes;

      // Minimum duration: 1 hour (60 minutes)
      if (duration < 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration must be at least 1 hour",
          path: ["endTime"],
        });
      }

      // Maximum duration: 16 hours (960 minutes)
      if (duration > 16 * 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration cannot exceed 16 hours",
          path: ["endTime"],
        });
      }

      // End time must be after start time
      if (endMinutes <= startMinutes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
          path: ["endTime"],
        });
      }
    }

    // Validate date is not in the past (for new schedules)
    const scheduleDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot schedule shifts in the past",
        path: ["date"],
      });
    }
  });

/**
 * Schedule update schema
 * Extends create schema with required ID field
 * Note: We need to merge with the base schema before refinements to maintain validation
 */
export const scheduleUpdateSchema = z
  .object({
    id: z.string().min(1, "Schedule ID is required"),
    staffId: z.string().min(1, "Staff member is required"),
    date: dateStringSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    assignedRegister: optionalStringSchema,
    notes: z
      .string()
      .max(500, "Notes must not exceed 500 characters")
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((val) => val || ""),
    businessId: z.string().min(1, "Business ID is required"),
  })
  .superRefine((data, ctx) => {
    // Parse times
    const [startHour, startMinute] = data.startTime.split(":").map(Number);
    const [endHour, endMinute] = data.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if it's an overnight shift (end time is before start time)
    const isOvernight = endMinutes < startMinutes;

    if (isOvernight) {
      // For overnight shifts, calculate duration across midnight
      const duration = 24 * 60 - startMinutes + endMinutes;

      // Minimum duration: 1 hour (60 minutes)
      if (duration < 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration must be at least 1 hour",
          path: ["endTime"],
        });
      }

      // Maximum duration: 16 hours (960 minutes)
      if (duration > 16 * 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration cannot exceed 16 hours",
          path: ["endTime"],
        });
      }
    } else {
      // Regular shift (same day)
      const duration = endMinutes - startMinutes;

      // Minimum duration: 1 hour (60 minutes)
      if (duration < 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration must be at least 1 hour",
          path: ["endTime"],
        });
      }

      // Maximum duration: 16 hours (960 minutes)
      if (duration > 16 * 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Shift duration cannot exceed 16 hours",
          path: ["endTime"],
        });
      }

      // End time must be after start time
      if (endMinutes <= startMinutes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
          path: ["endTime"],
        });
      }
    }

    // For updates, we don't validate past dates since we might be editing existing schedules
    // Only validate that the date is valid
  });

/**
 * Type exports
 * Inferred from schemas for type safety
 */
export type ScheduleFormData = z.infer<typeof scheduleCreateSchema>;
export type ScheduleUpdateData = z.infer<typeof scheduleUpdateSchema>;
