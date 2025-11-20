/**
 * Hook for managing shift operations
 * Handles shift loading, starting, timing validation, and overtime detection
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Shift, Schedule } from "../types/shift.types";

interface UseShiftProps {
  userId: string | undefined;
  userRole: string | undefined; // eslint-disable-line @typescript-eslint/no-unused-vars
  businessId: string | undefined;
  onCartSessionInit?: () => Promise<void>;
}

/**
 * Hook for managing shift
 * @param props - Shift configuration props
 * @returns Shift state and operations
 */
export function useShift({
  userId,
  userRole: _userRole, // Prefixed with _ to indicate intentionally unused
  businessId,
  onCartSessionInit,
}: UseShiftProps) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState(true);
  const [showStartShiftDialog, setShowStartShiftDialog] = useState(false);
  const [showLateStartConfirm, setShowLateStartConfirm] = useState(false);
  const [startingCash, setStartingCash] = useState("");
  const [lateStartMinutes, setLateStartMinutes] = useState(0);
  const [showOvertimeWarning, setShowOvertimeWarning] = useState(false);
  const [overtimeMinutes, setOvertimeMinutes] = useState(0);

  /**
   * Load shift data function with smart updates to prevent flickering
   */
  const loadShiftData = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setIsLoadingShift(true);
        }

        if (!userId) return;

        // Load active shift
        const activeShiftResponse = await window.shiftAPI.getActive(userId);
        if (activeShiftResponse.success && activeShiftResponse.data) {
          const shiftData = activeShiftResponse.data as Shift;

          // Only update if data has actually changed
          setActiveShift((prevShift) => {
            if (
              !prevShift ||
              JSON.stringify(prevShift) !== JSON.stringify(shiftData)
            ) {
              return shiftData;
            }
            return prevShift;
          });
        } else {
          // Only update if currently there is an active shift
          setActiveShift((prevShift) => (prevShift ? null : prevShift));
        }

        // Load today's schedule
        const scheduleResponse = await window.shiftAPI.getTodaySchedule(
          userId
        );
        if (scheduleResponse.success && scheduleResponse.data) {
          const newSchedule = scheduleResponse.data as Schedule;
          setTodaySchedule((prevSchedule) => {
            if (!prevSchedule) return newSchedule;

            const now = new Date();
            const newShiftStart = new Date(newSchedule.startTime);
            const newShiftEnd = new Date(newSchedule.endTime);
            const prevScheduleEnd = prevSchedule
              ? new Date(prevSchedule.endTime)
              : null;

            // If schedules are the same (by ID), always prefer the new one (might have been updated)
            if (prevSchedule.id === newSchedule.id) {
              return newSchedule;
            }

            // Priority logic: always prefer the most relevant schedule
            // 1. Prefer schedules that haven't ended yet (current or future)
            const newScheduleNotEnded = newShiftEnd > now;
            const prevScheduleNotEnded =
              prevScheduleEnd && prevScheduleEnd > now;

            if (newScheduleNotEnded && !prevScheduleNotEnded) {
              // New schedule is current/future, old one is ended - use new
              return newSchedule;
            }

            if (!newScheduleNotEnded && prevScheduleNotEnded) {
              // Old schedule is current/future, new one is ended - keep old
              return prevSchedule;
            }

            if (newScheduleNotEnded && prevScheduleNotEnded) {
              // Both are current/future - prefer the one that starts later (more recent)
              if (newShiftStart > new Date(prevSchedule.startTime)) {
                return newSchedule;
              }
              return prevSchedule;
            }

            // Both are ended - prefer the one that starts later (more recent)
            if (newShiftStart > new Date(prevSchedule.startTime)) {
              return newSchedule;
            }

            return prevSchedule;
          });
        } else {
          // If API returns no schedule, clear it
          setTodaySchedule(null);
        }
      } catch (error) {
        console.error("Failed to load shift data:", error);
      } finally {
        if (isInitialLoad) {
          setIsLoadingShift(false);
        }
      }
    },
    [userId]
  );

  /**
   * Check for overtime and handle automatic shift ending
   */
  useEffect(() => {
    if (!activeShift || !todaySchedule) return;

    const checkOvertime = () => {
      const now = new Date();
      const scheduledEnd = new Date(todaySchedule.endTime);
      const timeDifference = now.getTime() - scheduledEnd.getTime();
      const minutesOvertime = Math.floor(timeDifference / (1000 * 60));

      if (minutesOvertime > 0) {
        setOvertimeMinutes(minutesOvertime);

        // Show warning after 15 minutes of overtime
        if (minutesOvertime >= 15 && !showOvertimeWarning) {
          setShowOvertimeWarning(true);
        }
      } else {
        setOvertimeMinutes(0);
        setShowOvertimeWarning(false);
      }
    };

    checkOvertime(); // Check immediately
    const overtimeInterval = setInterval(checkOvertime, 60000); // Check every minute

    return () => clearInterval(overtimeInterval);
  }, [activeShift, todaySchedule, showOvertimeWarning]);

  /**
   * Calculate shift timing validation
   */
  const shiftTimingInfo = useMemo(() => {
    if (!todaySchedule) {
      return {
        canStart: false,
        buttonText: "No Schedule",
        reason: "No schedule found",
      };
    }

    const now = new Date();
    const scheduledStart = new Date(todaySchedule.startTime);
    const scheduledEnd = new Date(todaySchedule.endTime);
    const timeDifference = now.getTime() - scheduledStart.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    // Check if shift has already ended
    const timeFromEnd = now.getTime() - scheduledEnd.getTime();
    const minutesAfterEnd = timeFromEnd / (1000 * 60);

    // Don't allow starting shifts that are more than 1 hour past their end time
    if (minutesAfterEnd > 60) {
      const hoursAfterEnd = Math.floor(minutesAfterEnd / 60);
      const remainingMinutes = Math.floor(minutesAfterEnd % 60);

      let overdueText;
      if (hoursAfterEnd > 0) {
        if (remainingMinutes === 0) {
          overdueText =
            hoursAfterEnd === 1 ? "1 hour" : `${hoursAfterEnd} hours`;
        } else {
          overdueText = `${hoursAfterEnd}h ${remainingMinutes}m`;
        }
      } else {
        overdueText = `${Math.floor(minutesAfterEnd)} minutes`;
      }

      return {
        canStart: false,
        buttonText: "Shift Ended",
        reason: `Shift ended ${overdueText} ago`,
      };
    }

    const EARLY_START_MINUTES = 15;
    const LATE_START_MINUTES = 30;

    if (minutesDifference < -EARLY_START_MINUTES) {
      const minutesUntilStart = Math.ceil(-minutesDifference);
      return {
        canStart: false,
        buttonText: `Start in ${minutesUntilStart}m`,
        reason: `Too early - wait ${minutesUntilStart} minutes`,
      };
    } else if (minutesDifference > LATE_START_MINUTES) {
      const minutesLate = Math.floor(minutesDifference);
      const hoursLate = Math.floor(minutesLate / 60);
      const remainingMinutes = minutesLate % 60;

      let lateText;
      if (hoursLate > 0) {
        if (remainingMinutes === 0) {
          lateText =
            hoursLate === 1 ? "1 hour late" : `${hoursLate} hours late`;
        } else {
          lateText = `${hoursLate}h ${remainingMinutes}m late`;
        }
      } else {
        lateText = `${minutesLate} minutes late`;
      }

      return {
        canStart: true,
        buttonText: `Start Shift (Late)`,
        reason: lateText,
      };
    } else {
      return {
        canStart: true,
        buttonText: "Start Shift",
        reason: "Ready to start",
      };
    }
  }, [todaySchedule]);

  /**
   * Handle start shift click
   */
  const handleStartShiftClick = useCallback(() => {
    if (!userId) {
      alert("User not authenticated");
      return;
    }

    if (!todaySchedule) {
      alert("No schedule found for today. Please contact your manager.");
      return;
    }

    // Validate shift timing
    const now = new Date();
    const scheduledStart = new Date(todaySchedule.startTime);
    const scheduledEnd = new Date(todaySchedule.endTime);
    const timeDifference = now.getTime() - scheduledStart.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    // Check if the scheduled shift has already ended
    const timeFromEnd = now.getTime() - scheduledEnd.getTime();
    const minutesAfterEnd = timeFromEnd / (1000 * 60);

    // Don't allow starting shifts that are more than 1 hour past their scheduled end time
    if (minutesAfterEnd > 60) {
      alert(
        `This shift ended at ${scheduledEnd.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })} and is now ${Math.floor(minutesAfterEnd / 60)}h ${Math.floor(
          minutesAfterEnd % 60
        )}m overdue. Please contact your manager to reschedule or create a new shift.`
      );
      return;
    }

    // Allow starting 15 minutes early or up to 30 minutes late
    const EARLY_START_MINUTES = 15;
    const LATE_START_MINUTES = 30;

    if (minutesDifference < -EARLY_START_MINUTES) {
      const minutesUntilStart = Math.ceil(-minutesDifference);
      alert(
        `Cannot start shift yet. Your shift is scheduled to start at ${scheduledStart.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        )}. Please wait ${minutesUntilStart} more minutes.`
      );
      return;
    }

    if (minutesDifference > LATE_START_MINUTES) {
      const minutesLate = Math.floor(minutesDifference);
      setLateStartMinutes(minutesLate);
      setShowLateStartConfirm(true);
      return;
    }

    // Show start shift dialog
    setStartingCash("");
    setShowStartShiftDialog(true);
  }, [userId, todaySchedule]);

  /**
   * Confirm start shift
   */
  const confirmStartShift = useCallback(async () => {
    try {
      if (!startingCash || isNaN(Number(startingCash))) {
        alert("Please enter a valid cash amount");
        return;
      }

      if (!userId || !businessId) {
        alert("User information missing");
        return;
      }

      const response = await window.shiftAPI.start({
        scheduleId: todaySchedule?.id,
        cashierId: userId,
        businessId,
        startingCash: Number(startingCash),
      });

      if (response.success && response.data) {
        const shiftData = response.data as Shift;
        setActiveShift(shiftData);
        setShowStartShiftDialog(false);
        setShowLateStartConfirm(false);
        setStartingCash("");
        // Refresh shift data
        await loadShiftData(false);
        // Initialize cart session now that shift is active
        if (onCartSessionInit) {
          await onCartSessionInit();
        }
      } else {
        alert(response.message || "Failed to start shift");
      }
    } catch (error) {
      console.error("Failed to start shift:", error);
      alert("Failed to start shift. Please try again.");
    }
  }, [
    startingCash,
    userId,
    businessId,
    todaySchedule,
    loadShiftData,
    onCartSessionInit,
  ]);

  /**
   * Confirm late start
   */
  const confirmLateStart = useCallback(() => {
    setShowLateStartConfirm(false);
    setStartingCash("");
    setShowStartShiftDialog(true);
  }, []);

  /**
   * Load shift data on component mount and periodically
   */
  useEffect(() => {
    loadShiftData(true); // Initial load with loading indicator

    // Refresh data every 30 seconds to pick up schedule changes made by manager
    const interval = setInterval(() => {
      if (userId) {
        loadShiftData(false); // Background refresh without loading indicator
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadShiftData, userId]);

  return {
    activeShift,
    todaySchedule,
    isLoadingShift,
    showStartShiftDialog,
    showLateStartConfirm,
    startingCash,
    lateStartMinutes,
    showOvertimeWarning,
    overtimeMinutes,
    shiftTimingInfo,
    loadShiftData,
    handleStartShiftClick,
    confirmStartShift,
    confirmLateStart,
    setShowStartShiftDialog,
    setShowLateStartConfirm,
    setStartingCash,
  };
}

