import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, User, Building2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface AvatarUploadProps {
  value?: string;
  onChange: (value: string | null) => void;
  type?: "user" | "business";
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function AvatarUpload({
  value,
  onChange,
  type = "user",
  label,
  className,
  size = "md",
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconConfig = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
    });
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a JPEG, PNG, or WebP image.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size too large. Please upload an image smaller than 2MB.";
    }

    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to process image. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (disabled) return;
    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDefaultIcon = () => {
    if (type === "business") {
      return (
        <Building2 className={cn(iconConfig[size], "text-muted-foreground")} />
      );
    }
    return <User className={cn(iconConfig[size], "text-muted-foreground")} />;
  };

  const getFallbackText = () => {
    if (type === "business") return "BS";
    return "U";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            className={cn(
              sizeConfig[size],
              "border-2 border-dashed border-muted-foreground/25"
            )}
          >
            <AvatarImage src={value || undefined} alt="Avatar preview" />
            <AvatarFallback className="bg-muted">
              {value ? getFallbackText() : getDefaultIcon()}
            </AvatarFallback>
          </Avatar>

          {value && !disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={handleRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Uploading..." : value ? "Change" : "Upload"}
          </Button>

          <div className="text-xs text-muted-foreground">
            JPEG, PNG, WebP (max 2MB)
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
