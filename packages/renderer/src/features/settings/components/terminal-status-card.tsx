/**
 * Terminal Status Card Component
 * Displays terminal information, status, and capabilities with quick actions
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Radio,
  CheckCircle2,
  Loader2,
  WifiOff,
  Edit,
  Trash2,
  TestTube,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TerminalConfig } from "../hooks/use-viva-wallet-settings";

interface TerminalStatusCardProps {
  terminal: TerminalConfig;
  isTesting?: boolean;
  onEdit: (terminal: TerminalConfig) => void;
  onDelete: (terminalId: string) => void;
  onTest: (terminalId: string) => void;
}

/**
 * Terminal Type Badge
 */
function TerminalTypeBadge({
  type,
}: {
  type: "dedicated" | "device-based" | undefined;
}) {
  if (type === "device-based") {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 text-xs flex items-center gap-1"
      >
        <Smartphone className="h-3 w-3" />
        Device
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="bg-purple-50 text-purple-700 border-purple-200 text-xs flex items-center gap-1"
    >
      <Radio className="h-3 w-3" />
      Dedicated
    </Badge>
  );
}

export function TerminalStatusCard({
  terminal,
  isTesting = false,
  onEdit,
  onDelete,
  onTest,
}: TerminalStatusCardProps) {
  const getStatusBadge = () => {
    if (terminal.lastSeen) {
      const timeSinceLastSeen =
        Date.now() - new Date(terminal.lastSeen).getTime();
      const minutesAgo = Math.floor(timeSinceLastSeen / 60000);

      if (minutesAgo < 5) {
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 border-green-200 text-xs flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Online
          </Badge>
        );
      } else if (minutesAgo < 30) {
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3" />
            Recently Seen
          </Badge>
        );
      }
    }

    return (
      <Badge
        variant="outline"
        className="bg-gray-100 text-gray-700 border-gray-200 text-xs flex items-center gap-1"
      >
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {terminal.name}
              {terminal.autoConnect && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                >
                  Auto-Connect
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge()}
              <TerminalTypeBadge type={terminal.terminalType} />
              {terminal.enabled ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 text-xs"
                >
                  Enabled
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                >
                  Disabled
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(terminal)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onTest(terminal.id)}
                disabled={isTesting}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? "Testing..." : "Test Connection"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(terminal.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">IP Address:</span>
            <span className="font-mono text-slate-700">
              {terminal.ipAddress}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Port:</span>
            <span className="font-mono text-slate-700">{terminal.port}</span>
          </div>
          {terminal.lastSeen && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last Seen:</span>
              <span className="text-slate-700">
                {new Date(terminal.lastSeen).toLocaleString()}
              </span>
            </div>
          )}
          {terminal.deviceInfo && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Platform:</span>
              <span className="text-slate-700 capitalize">
                {terminal.deviceInfo.platform || "Unknown"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
