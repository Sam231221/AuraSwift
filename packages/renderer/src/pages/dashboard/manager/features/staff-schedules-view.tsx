import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  User,
  CreditCard,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  format,
  addWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";

// Using database interfaces
interface Cashier {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  role: "cashier" | "manager" | "admin";
  businessId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Schedule {
  id: string;
  staffId: string;
  businessId: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  status: "upcoming" | "active" | "completed" | "missed";
  assignedRegister?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface StaffSchedulesViewProps {
  onBack: () => void;
}

const StaffSchedulesView: React.FC<StaffSchedulesViewProps> = ({ onBack }) => {
  const { user } = useAuth();

  // State for cashiers - will be loaded from database
  const [cashiers, setCashiers] = useState<Cashier[]>([]);

  // State for schedules - will be loaded from database
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Loading states
  const [isLoadingCashiers, setIsLoadingCashiers] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Get business ID from current authenticated user
  const businessId = user?.businessId || "";

  // Load cashiers/staff users
  useEffect(() => {
    const loadCashiers = async () => {
      if (!businessId) {
        console.log("No business ID available, skipping cashier load");
        setIsLoadingCashiers(false);
        return;
      }

      try {
        setIsLoadingCashiers(true);
        console.log("Loading cashiers for businessId:", businessId);
        const response = await window.scheduleAPI.getCashierUsers(businessId);
        console.log("Cashiers response:", response);
        if (response.success && response.data) {
          setCashiers(response.data as Cashier[]);
          console.log("Loaded cashiers:", response.data);
        } else {
          console.error("Failed to load cashiers:", response.message);
        }
      } catch (error) {
        console.error("Error loading cashiers:", error);
      } finally {
        setIsLoadingCashiers(false);
      }
    };

    loadCashiers();
  }, [businessId]);

  // Load schedules
  useEffect(() => {
    const loadSchedules = async () => {
      if (!businessId) {
        console.log("No business ID available, skipping schedules load");
        setIsLoadingSchedules(false);
        return;
      }

      try {
        setIsLoadingSchedules(true);
        const response = await window.scheduleAPI.getByBusiness(businessId);
        if (response.success && response.data) {
          setSchedules(response.data as Schedule[]);
        } else {
          console.error("Failed to load schedules:", response.message);
        }
      } catch (error) {
        console.error("Error loading schedules:", error);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [businessId]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [formData, setFormData] = useState({
    staffId: "",
    startTime: "",
    endTime: "",
    assignedRegister: "",
    notes: "",
  });

  // Calendar view functions
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
    setSelectedDate(new Date());
  };

  const resetForm = () => {
    setFormData({
      staffId: "",
      startTime: "",
      endTime: "",
      assignedRegister: "",
      notes: "",
    });
    setSelectedDate(new Date());
    setEditingSchedule(null);
  };

  const openDrawer = (schedule?: Schedule, date?: Date) => {
    if (schedule) {
      console.log("Opening drawer for editing schedule:", schedule);
      setEditingSchedule(schedule);
      const startDate = new Date(schedule.startTime);
      const endDate = new Date(schedule.endTime);

      const formDataToSet = {
        staffId: schedule.staffId,
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        assignedRegister: schedule.assignedRegister || "",
        notes: schedule.notes || "",
      };

      console.log("Setting form data for editing:", formDataToSet);
      setFormData(formDataToSet);
      setSelectedDate(new Date(schedule.startTime.split("T")[0]));
    } else {
      console.log("Opening drawer for creating new schedule");
      resetForm();
      if (date) {
        setSelectedDate(date);
      }
    }
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    resetForm();
  };

  // Configuration constants for shift validation
  const SHIFT_CONFIG = {
    MIN_DURATION_MINUTES: 60, // 1 hour minimum as recommended in shiftallCases.md
    MAX_DURATION_MINUTES: 16 * 60, // 16 hours maximum (configurable between 12-16)
    ALLOW_BACKDATED_SHIFTS: false, // Only managers should be able to create past shifts
  };

  // Helper function to validate shift data and return array of errors
  const validateShiftData = () => {
    const errors: string[] = [];

    // Basic field validation
    if (
      !formData.staffId ||
      !selectedDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      errors.push("Please fill in all required fields.");
      return errors; // Return early if basic fields are missing
    }

    // Case 7: Validate backdated shifts
    if (!SHIFT_CONFIG.ALLOW_BACKDATED_SHIFTS) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shiftDate = new Date(selectedDate);
      shiftDate.setHours(0, 0, 0, 0);

      if (shiftDate < today) {
        errors.push(
          "Cannot schedule shifts in the past. Please select today or a future date."
        );
      }
    }

    // Calculate shift duration with validation
    const shiftDurationMinutes = calculateShiftDuration(
      formData.startTime,
      formData.endTime
    );

    if (shiftDurationMinutes === -1) {
      errors.push(
        "Invalid time format. Please ensure times are in HH:MM format."
      );
    } else if (shiftDurationMinutes === 0) {
      errors.push(
        "End time must be later than start time. A shift cannot have zero duration."
      );
    } else {
      // Duration-based validations
      if (shiftDurationMinutes < SHIFT_CONFIG.MIN_DURATION_MINUTES) {
        const minHours = Math.floor(SHIFT_CONFIG.MIN_DURATION_MINUTES / 60);
        const minMinutes = SHIFT_CONFIG.MIN_DURATION_MINUTES % 60;
        const minDurationText =
          minMinutes > 0
            ? `${minHours} hours and ${minMinutes} minutes`
            : `${minHours} hour${minHours > 1 ? "s" : ""}`;
        errors.push(`Shift duration must be at least ${minDurationText}.`);
      }

      if (shiftDurationMinutes > SHIFT_CONFIG.MAX_DURATION_MINUTES) {
        const maxHours = SHIFT_CONFIG.MAX_DURATION_MINUTES / 60;
        errors.push(`Shift cannot be longer than ${maxHours} hours.`);
      }

      // Check for overlapping shifts
      const hasOverlap = checkShiftOverlap(
        formData.startTime,
        formData.endTime,
        selectedDate,
        formData.staffId,
        editingSchedule?.id
      );

      if (hasOverlap) {
        const staffMember = cashiers.find((c) => c.id === formData.staffId);
        const staffName = staffMember
          ? `${staffMember.firstName} ${staffMember.lastName}`
          : "This staff member";
        errors.push(`${staffName} already has an overlapping shift scheduled.`);
      }
    }

    return errors;
  };

  // Helper function to calculate shift duration handling overnight shifts
  const calculateShiftDuration = (startTime: string, endTime: string) => {
    // Validate time format first
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return -1; // Invalid time format
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Check for invalid hour/minute values
    if (
      startHour < 0 ||
      startHour > 23 ||
      startMinute < 0 ||
      startMinute > 59 ||
      endHour < 0 ||
      endHour > 23 ||
      endMinute < 0 ||
      endMinute > 59
    ) {
      return -1; // Invalid time values
    }

    const startTotalMinutes = startHour * 60 + startMinute;
    let endTotalMinutes = endHour * 60 + endMinute;

    // Case 1: Start time = End time (Invalid)
    if (startTotalMinutes === endTotalMinutes) {
      return 0; // No duration
    }

    // If end time is earlier in the day than start time, assume it's next day (overnight shift)
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours
    }

    return endTotalMinutes - startTotalMinutes;
  };

  // Helper function to check if shift is overnight
  const isOvernightShift = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    return endTotalMinutes < startTotalMinutes;
  };

  // Helper function to check for shift overlaps
  const checkShiftOverlap = (
    newStartTime: string,
    newEndTime: string,
    selectedDate: Date,
    staffId: string,
    excludeScheduleId?: string
  ) => {
    // Create proper Date objects for comparison
    const newStart = new Date(selectedDate);
    const [startHour, startMinute] = newStartTime.split(":").map(Number);
    newStart.setHours(startHour, startMinute, 0, 0);

    const newEnd = new Date(selectedDate);
    const [endHour, endMinute] = newEndTime.split(":").map(Number);
    newEnd.setHours(endHour, endMinute, 0, 0);

    // Handle overnight shifts
    if (isOvernightShift(newStartTime, newEndTime)) {
      newEnd.setDate(newEnd.getDate() + 1);
    }

    // Check against existing schedules for this staff member
    return schedules.some((schedule) => {
      // Skip the schedule being edited
      if (excludeScheduleId && schedule.id === excludeScheduleId) {
        return false;
      }

      // Only check schedules for the same staff member
      if (schedule.staffId !== staffId) {
        return false;
      }

      const existingStart = new Date(schedule.startTime);
      const existingEnd = new Date(schedule.endTime);

      // Check for overlap: new shift starts before existing ends AND new shift ends after existing starts
      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  const handleSubmit = async () => {
    // Run comprehensive validation
    const validationErrors = validateShiftData();

    if (validationErrors.length > 0) {
      // Show all validation errors in a single alert
      alert(
        "Please fix the following issues:\n\n" +
          validationErrors
            .map((error, index) => `${index + 1}. ${error}`)
            .join("\n")
      );
      return;
    }

    // Create proper Date objects in local timezone, then convert to ISO strings for UTC storage
    // This ensures proper timezone handling as recommended in shiftallCases.md (Case 9)
    if (!selectedDate) {
      alert("Please select a date for the shift.");
      return;
    }

    const [startHour, startMinute] = formData.startTime.split(":").map(Number);
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const [endHour, endMinute] = formData.endTime.split(":").map(Number);
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Case 3: Handle overnight shifts (crossing midnight)
    if (isOvernightShift(formData.startTime, formData.endTime)) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // Convert to ISO strings for UTC storage in database
    const startDateTimeISO = startDateTime.toISOString();
    const endDateTimeISO = endDateTime.toISOString();

    try {
      if (editingSchedule) {
        // Update existing schedule
        if (!editingSchedule.id) {
          console.error("No schedule ID found for editing:", editingSchedule);
          alert("Error: Schedule ID is missing. Please try again.");
          return;
        }
        console.log("Attempting to update schedule:", {
          id: editingSchedule.id,
          updateData: {
            staffId: formData.staffId,
            startTime: startDateTimeISO,
            endTime: endDateTimeISO,
            assignedRegister: formData.assignedRegister,
            notes: formData.notes,
          },
        });

        const response = await window.scheduleAPI.update(editingSchedule.id, {
          staffId: formData.staffId,
          startTime: startDateTimeISO,
          endTime: endDateTimeISO,
          assignedRegister: formData.assignedRegister,
          notes: formData.notes,
        });

        console.log("Update response received:", response);

        if (response.success) {
          console.log("Schedule update successful:", response);

          // Update local state with the response data if available, otherwise use form data
          const updatedSchedule: Schedule = response.data
            ? (response.data as Schedule)
            : {
                ...editingSchedule,
                staffId: formData.staffId,
                startTime: startDateTimeISO,
                endTime: endDateTimeISO,
                assignedRegister: formData.assignedRegister,
                notes: formData.notes,
                updatedAt: new Date().toISOString(),
              };

          setSchedules(
            schedules.map((schedule) =>
              schedule.id === editingSchedule.id ? updatedSchedule : schedule
            )
          );

          console.log("Local schedules state updated");

          // Optional: Reload schedules from database to ensure consistency
          // This helps prevent issues where local state gets out of sync with database
          try {
            const refreshResponse = await window.scheduleAPI.getByBusiness(
              businessId
            );
            if (refreshResponse.success && refreshResponse.data) {
              console.log("Refreshed schedules from database after update");
              setSchedules(refreshResponse.data as Schedule[]);
            }
          } catch (refreshError) {
            console.warn(
              "Failed to refresh schedules after update:",
              refreshError
            );
            // Don't fail the whole operation if refresh fails
          }
        } else {
          console.error("Failed to update schedule:", response.message);
          alert("Failed to update schedule: " + response.message);
          return;
        }
      } else {
        // Create new schedule
        const response = await window.scheduleAPI.create({
          staffId: formData.staffId,
          businessId: businessId,
          startTime: startDateTimeISO,
          endTime: endDateTimeISO,
          assignedRegister: formData.assignedRegister,
          notes: formData.notes,
        });

        if (response.success && response.data) {
          // Add to local state
          setSchedules([...schedules, response.data as Schedule]);
        } else {
          console.error("Failed to create schedule:", response.message);
          alert("Failed to create schedule: " + response.message);
          return;
        }
      }

      closeDrawer();
    } catch (error) {
      console.error("Error submitting schedule:", error);
      alert("An error occurred while saving the schedule.");
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const response = await window.scheduleAPI.delete(id);
      if (response.success) {
        setSchedules(schedules.filter((schedule) => schedule.id !== id));
      } else {
        console.error("Failed to delete schedule:", response.message);
        alert("Failed to delete schedule: " + response.message);
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("An error occurred while deleting the schedule.");
    }
  };

  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
    return `${diffHours}h`;
  };

  const getScheduleStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start)
      return {
        status: "upcoming",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      };
    if (now >= start && now <= end)
      return {
        status: "active",
        color: "bg-green-100 text-green-800 border-green-200",
      };
    return {
      status: "completed",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    };
  };

  const getSchedulesForDate = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return schedules.filter((schedule) => {
      const scheduleDate = schedule.startTime.split("T")[0];
      return scheduleDate === dateString;
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen  p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Cashier Shifts
              </h1>
              <p className="text-slate-600">
                Manage POS cashier schedules and shifts
              </p>
            </div>
          </div>

          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                onClick={() => openDrawer()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Schedule Shift
              </Button>
            </DrawerTrigger>

            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader>
                <DrawerTitle className="text-2xl">
                  {editingSchedule
                    ? "Edit Staff Schedule"
                    : "Create New Schedule"}
                </DrawerTitle>
                <DrawerDescription>
                  {editingSchedule
                    ? "Update the schedule details below."
                    : "Schedule a new staff shift for the POS system."}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cashier">Staff Member</Label>
                    <Select
                      value={formData.staffId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, staffId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingCashiers
                              ? "Loading staff..."
                              : "Select staff member"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCashiers ? (
                          <SelectItem value="loading" disabled>
                            Loading staff members...
                          </SelectItem>
                        ) : cashiers.length === 0 ? (
                          <SelectItem value="no-staff" disabled>
                            No staff members found. Create staff users first.
                          </SelectItem>
                        ) : (
                          cashiers.map((cashier) => (
                            <SelectItem key={cashier.id} value={cashier.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {cashier.firstName} {cashier.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {cashier.email} • {cashier.role}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule Date</Label>
                    <Popover
                      open={isDatePickerOpen}
                      onOpenChange={setIsDatePickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedRegister">Assigned Register</Label>
                    <Input
                      id="assignedRegister"
                      type="text"
                      value={formData.assignedRegister}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          assignedRegister: e.target.value,
                        })
                      }
                      placeholder="e.g. Register 1, Main POS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.startTime.split(":")[0] || ""}
                        onValueChange={(value) => {
                          const minutes =
                            formData.startTime.split(":")[1] || "00";
                          setFormData({
                            ...formData,
                            startTime: `${value}:${minutes}`,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour24 = i;
                            const hour12 =
                              hour24 === 0
                                ? 12
                                : hour24 > 12
                                ? hour24 - 12
                                : hour24;
                            const period = hour24 < 12 ? "AM" : "PM";
                            const display = `${hour12}:00 ${period}`;
                            return (
                              <SelectItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {display}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.startTime.split(":")[1] || ""}
                        onValueChange={(value) => {
                          const hour = formData.startTime.split(":")[0] || "00";
                          setFormData({
                            ...formData,
                            startTime: `${hour}:${value}`,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 4 }, (_, i) => i * 15).map(
                            (minute) => (
                              <SelectItem
                                key={minute}
                                value={minute.toString().padStart(2, "0")}
                              >
                                {minute.toString().padStart(2, "0")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-500">
                      Select hour (12 AM = midnight, 12 PM = noon) and minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.endTime.split(":")[0] || ""}
                        onValueChange={(value) => {
                          const minutes =
                            formData.endTime.split(":")[1] || "00";
                          setFormData({
                            ...formData,
                            endTime: `${value}:${minutes}`,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour24 = i;
                            const hour12 =
                              hour24 === 0
                                ? 12
                                : hour24 > 12
                                ? hour24 - 12
                                : hour24;
                            const period = hour24 < 12 ? "AM" : "PM";
                            const display = `${hour12}:00 ${period}`;
                            return (
                              <SelectItem
                                key={i}
                                value={i.toString().padStart(2, "0")}
                              >
                                {display}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.endTime.split(":")[1] || ""}
                        onValueChange={(value) => {
                          const hour = formData.endTime.split(":")[0] || "00";
                          setFormData({
                            ...formData,
                            endTime: `${hour}:${value}`,
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Min" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 4 }, (_, i) => i * 15).map(
                            (minute) => (
                              <SelectItem
                                key={minute}
                                value={minute.toString().padStart(2, "0")}
                              >
                                {minute.toString().padStart(2, "0")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-slate-500">
                      Select hour (12 AM = midnight, 12 PM = noon) and minutes
                    </p>
                  </div>

                  {formData.startTime && formData.endTime && (
                    <div className="md:col-span-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">
                          Shift Duration:
                        </span>
                        <span className="text-emerald-700">
                          {(() => {
                            const formatTime = (time: string) => {
                              const [hour, minute] = time
                                .split(":")
                                .map(Number);
                              const period = hour >= 12 ? "PM" : "AM";
                              const displayHour =
                                hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              return `${displayHour}:${minute
                                .toString()
                                .padStart(2, "0")} ${period}`;
                            };

                            const durationMinutes = calculateShiftDuration(
                              formData.startTime,
                              formData.endTime
                            );

                            // Handle invalid durations
                            if (durationMinutes === -1) {
                              return "Invalid time format";
                            }

                            if (durationMinutes === 0) {
                              return "Start and end time cannot be the same";
                            }

                            const hours = Math.floor(durationMinutes / 60);
                            const minutes = durationMinutes % 60;

                            const isOvernight = isOvernightShift(
                              formData.startTime,
                              formData.endTime
                            );

                            // Show validation warnings in the duration display
                            let warningText = "";
                            if (
                              durationMinutes <
                              SHIFT_CONFIG.MIN_DURATION_MINUTES
                            ) {
                              warningText = " ⚠️ Too short";
                            } else if (
                              durationMinutes >
                              SHIFT_CONFIG.MAX_DURATION_MINUTES
                            ) {
                              warningText = " ⚠️ Too long";
                            }

                            return `${formatTime(
                              formData.startTime
                            )} - ${formatTime(formData.endTime)}${
                              isOvernight ? " (+1 day)" : ""
                            } (${hours}h ${minutes}m)${warningText}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Quick Time Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            startTime: "09:00",
                            endTime: "17:00",
                          })
                        }
                      >
                        9 AM - 5 PM
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            startTime: "08:00",
                            endTime: "16:00",
                          })
                        }
                      >
                        8 AM - 4 PM
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            startTime: "10:00",
                            endTime: "18:00",
                          })
                        }
                      >
                        10 AM - 6 PM
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            startTime: "14:00",
                            endTime: "22:00",
                          })
                        }
                      >
                        2 PM - 10 PM
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            startTime: "22:00",
                            endTime: "06:00",
                          })
                        }
                      >
                        10 PM - 6 AM (Night)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            startTime: "23:00",
                            endTime: "07:00",
                          })
                        }
                      >
                        11 PM - 7 AM (Night)
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Add any special instructions or notes for this schedule..."
                      rows={3}
                    />
                  </div>
                </div>

                <DrawerFooter className="px-0">
                  <Button
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {editingSchedule ? "Update Schedule" : "Create Schedule"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" onClick={closeDrawer}>
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Calendar View Toggle */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={goToToday}
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                Today
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold text-slate-800">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </h2>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Week View
              </Button>
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                onClick={() => setViewMode("day")}
              >
                Day View
              </Button>
            </div>
          </div>

          {/* Week Calendar */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "text-center p-2 rounded-lg border transition-colors cursor-pointer",
                  isToday(day)
                    ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold"
                    : "bg-slate-50 border-slate-200",
                  selectedDate && isSameDay(day, selectedDate)
                    ? "ring-2 ring-emerald-400 ring-opacity-50"
                    : ""
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-sm font-medium">{format(day, "EEE")}</div>
                <div className="text-lg font-semibold">{format(day, "d")}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {getSchedulesForDate(day).length} schedules
                </div>
              </div>
            ))}
          </div>

          {/* Date Picker for Mobile/Quick Selection */}
          <div className="flex justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-xs justify-center"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Select Specific Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Shifts for Selected Date */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">
            Shifts for{" "}
            {selectedDate
              ? format(selectedDate, "MMMM d, yyyy")
              : "selected date"}
          </h3>

          <Button
            onClick={() => openDrawer(undefined, selectedDate)}
            variant="outline"
            className="mb-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shift for This Date
          </Button>

          {getSchedulesForDate(selectedDate || new Date()).length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                No shifts scheduled for this date.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {getSchedulesForDate(selectedDate || new Date()).map(
                  (schedule) => {
                    const scheduleStatus = getScheduleStatus(
                      schedule.startTime,
                      schedule.endTime
                    );
                    const duration = getShiftDuration(
                      schedule.startTime,
                      schedule.endTime
                    );

                    // Find staff member details
                    const staffMember = cashiers.find(
                      (c) => c.id === schedule.staffId
                    );
                    const staffName = staffMember
                      ? `${staffMember.firstName} ${staffMember.lastName}`
                      : "Unknown Staff";

                    return (
                      <motion.div
                        key={schedule.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.9 }}
                        layout
                        whileHover={{ y: -4 }}
                        className="transform transition-all duration-200"
                      >
                        <Card className="bg-white shadow-lg hover:shadow-xl border-0 overflow-hidden">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                                  <CreditCard className="w-5 h-5 text-emerald-600" />
                                  {staffName}
                                </CardTitle>
                                <p className="text-sm text-slate-600">
                                  {staffMember?.role || "Staff"} •{" "}
                                  {schedule.assignedRegister ||
                                    "No register assigned"}
                                </p>
                              </div>
                              <Badge className={scheduleStatus.color}>
                                {scheduleStatus.status}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <CalendarIcon className="w-4 h-4 text-emerald-500" />
                                <span>
                                  {format(
                                    new Date(schedule.startTime),
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="w-4 h-4 text-teal-500" />
                                <span>{duration}</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 rounded-lg p-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  Schedule Time:
                                </span>
                              </div>
                              <div className="text-slate-700 mt-1">
                                {format(new Date(schedule.startTime), "h:mm a")}{" "}
                                - {format(new Date(schedule.endTime), "h:mm a")}
                              </div>
                            </div>

                            {schedule.notes && (
                              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                                <StickyNote className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-amber-800 mb-1">
                                    Notes:
                                  </p>
                                  <p className="text-sm text-amber-700">
                                    {schedule.notes}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => openDrawer(schedule)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 hover:bg-emerald-50 hover:border-emerald-300"
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => deleteSchedule(schedule.id)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  }
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {isLoadingSchedules ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-slate-400 mb-4">
              <CreditCard className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              No shifts scheduled
            </h3>
            <p className="text-slate-500">
              Click "Schedule Shift" to create your first cashier shift.
            </p>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default StaffSchedulesView;
