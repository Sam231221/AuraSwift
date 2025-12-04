/**
 * Update Available Toast Component
 * Displays when a new update is available
 */

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Gift, Download, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { UpdateInfo } from "@app/shared";

interface UpdateAvailableToastProps {
  updateInfo: UpdateInfo;
  currentVersion: string;
  onDownload: () => void;
  onPostpone: () => void;
}

export function UpdateAvailableToast({
  updateInfo,
  currentVersion,
  onDownload,
  onPostpone,
}: UpdateAvailableToastProps) {
  const [showNotes, setShowNotes] = useState(false);

  const formatReleaseNotes = (notes?: string | string[] | unknown): string => {
    if (!notes) return "";

    // Handle objects - try to extract meaningful content
    if (typeof notes === "object" && !Array.isArray(notes)) {
      // If it's an object, try to stringify it or extract a message property
      if (notes && typeof notes === "object") {
        const obj = notes as Record<string, unknown>;
        // Try common properties that might contain release notes
        if (typeof obj.message === "string") {
          return obj.message;
        }
        if (typeof obj.content === "string") {
          return obj.content;
        }
        if (typeof obj.body === "string") {
          return obj.body;
        }
        // If no known property, try to stringify (but format nicely)
        try {
          const str = JSON.stringify(notes, null, 2);
          // If it's a simple object with one property, extract it
          const entries = Object.entries(obj);
          if (entries.length === 1 && typeof entries[0][1] === "string") {
            return entries[0][1];
          }
          return str;
        } catch {
          return "Release notes available on GitHub";
        }
      }
      return "Release notes available on GitHub";
    }

    if (Array.isArray(notes)) {
      return notes.join("\n");
    }

    if (typeof notes === "string") {
      // Strip HTML tags if present
      return notes.replace(/<[^>]*>/g, "").trim();
    }

    return "Release notes available on GitHub";
  };

  const releaseNotes = formatReleaseNotes(updateInfo.releaseNotes);
  const hasNotes = releaseNotes.length > 0;

  return (
    <div className="flex flex-col gap-3 w-full max-w-md bg-card border-2 border-border rounded-lg shadow-xl p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight text-card-foreground">
            New update available
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            AuraSwift {updateInfo.version} is now available
          </p>
          <p className="text-xs text-muted-foreground">
            You're currently on v{currentVersion}
          </p>
        </div>
      </div>

      {/* Release Notes (Expandable) */}
      {hasNotes && (
        <div className="border-t pt-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showNotes ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showNotes ? "Hide" : "View"} release notes</span>
          </button>
          {showNotes && (
            <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">
                {releaseNotes}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button onClick={onDownload} size="sm" className="flex-1">
          <Download className="h-4 w-4" />
          Download Now
        </Button>
        <Button onClick={onPostpone} variant="ghost" size="sm">
          <Clock className="h-4 w-4" />
          Later
        </Button>
      </div>
    </div>
  );
}

/**
 * Show update available toast
 */
export function showUpdateAvailableToast(
  updateInfo: UpdateInfo,
  currentVersion: string,
  onDownload: () => void,
  onPostpone: () => void
): string | number {
  return toast.custom(
    (t) => (
      <UpdateAvailableToast
        updateInfo={updateInfo}
        currentVersion={currentVersion}
        onDownload={() => {
          onDownload();
          toast.dismiss(t);
        }}
        onPostpone={() => {
          onPostpone();
          toast.dismiss(t);
        }}
      />
    ),
    {
      duration: Infinity, // Don't auto-dismiss
      position: "top-right",
      id: "update-available", // Use fixed ID to replace any existing toast
    }
  );
}
