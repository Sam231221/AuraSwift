import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  label: string;
  value: string; // HH:mm format
  onChange: (value: string) => void;
  id?: string;
  error?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  id,
  error,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}) => {
  const hour = value.split(":")[0] || "";
  const minute = value.split(":")[1] || "";

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute || "00"}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour || "00"}:${newMinute}`);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={error ? "text-red-600" : ""}>
        {label}
      </Label>
      <div className="flex gap-2">
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger
            className={`flex-1 ${error ? "border-red-500" : ""}`}
            aria-label={ariaLabel ? `${ariaLabel} - Hour` : `${label} - Hour`}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : ariaDescribedBy}
          >
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
        <Select value={minute} onValueChange={handleMinuteChange}>
          <SelectTrigger
            className={`flex-1 ${error ? "border-red-500" : ""}`}
            aria-label={ariaLabel ? `${ariaLabel} - Minute` : `${label} - Minute`}
            aria-invalid={error ? "true" : "false"}
          >
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 4 }, (_, i) => i * 15).map((minute) => (
              <SelectItem
                key={minute}
                value={minute.toString().padStart(2, "0")}
              >
                {minute.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Select hour (12 AM = midnight, 12 PM = noon) and minutes
      </p>
    </div>
  );
};

