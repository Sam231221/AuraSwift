/**
 * Terminal Discovery Panel Component
 * Allows users to discover and add Viva Wallet terminals
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone,
  Radio,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  WifiOff,
} from "lucide-react";
import type { DiscoveredTerminal } from "../hooks/use-viva-wallet-settings";

interface TerminalDiscoveryPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect: (terminal: DiscoveredTerminal) => void;
  onDiscover: () => Promise<DiscoveredTerminal[]>;
  isDiscovering: boolean;
  discoveredTerminals: DiscoveredTerminal[];
}

/**
 * Terminal Type Badge
 */
function TerminalTypeBadge({ type }: { type: "dedicated" | "device-based" }) {
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

/**
 * Terminal Status Badge
 */
function TerminalStatusBadge({
  status,
}: {
  status: "online" | "offline" | "busy";
}) {
  const variants = {
    online: {
      className: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
      text: "Online",
    },
    offline: {
      className: "bg-gray-100 text-gray-700 border-gray-200",
      icon: <WifiOff className="h-3 w-3" />,
      text: "Offline",
    },
    busy: {
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      text: "Busy",
    },
  };

  const variant = variants[status];

  return (
    <Badge
      variant="outline"
      className={`${variant.className} text-xs flex items-center gap-1`}
    >
      {variant.icon}
      {variant.text}
    </Badge>
  );
}

export function TerminalDiscoveryPanel({
  open,
  onClose,
  onSelect,
  onDiscover,
  isDiscovering,
  discoveredTerminals,
}: TerminalDiscoveryPanelProps) {
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (open && !hasSearched) {
      handleDiscover();
    }
  }, [open]);

  const handleDiscover = async () => {
    setHasSearched(true);
    await onDiscover();
  };

  const handleAddTerminal = (terminal: DiscoveredTerminal) => {
    onSelect(terminal);
    onClose();
    setHasSearched(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discover Terminals</DialogTitle>
          <DialogDescription>
            Scan your local network for Viva Wallet terminals. Make sure
            terminals are powered on and connected to the same network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Discovery Controls */}
          <div className="flex items-center justify-between">
            <Button
              onClick={handleDiscover}
              disabled={isDiscovering}
              variant="outline"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Again
                </>
              )}
            </Button>
            {discoveredTerminals.length > 0 && (
              <span className="text-sm text-slate-500">
                Found {discoveredTerminals.length} terminal
                {discoveredTerminals.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Discovery Results */}
          {isDiscovering ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : discoveredTerminals.length > 0 ? (
            <div className="space-y-3">
              {discoveredTerminals.map((terminal) => (
                <div
                  key={terminal.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">
                          {terminal.name}
                        </h4>
                        <TerminalStatusBadge status={terminal.status} />
                        <TerminalTypeBadge type={terminal.terminalType} />
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>
                          <span className="font-mono">
                            {terminal.ipAddress}
                          </span>
                          <span className="text-slate-400">:</span>
                          <span className="font-mono">{terminal.port}</span>
                        </div>
                        {terminal.paymentCapabilities && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {terminal.paymentCapabilities.supportsTap && (
                              <Badge
                                variant="outline"
                                className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
                              >
                                Tap
                              </Badge>
                            )}
                            {terminal.paymentCapabilities.supportsChip && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                              >
                                Chip
                              </Badge>
                            )}
                            {terminal.paymentCapabilities.supportsSwipe && (
                              <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                              >
                                Swipe
                              </Badge>
                            )}
                            {terminal.paymentCapabilities.supportsNFC && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 text-xs"
                              >
                                NFC
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddTerminal(terminal)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">
                No terminals found
              </h3>
              <p className="text-sm text-slate-500 mb-4 max-w-md">
                No Viva Wallet terminals were discovered on your network. Make
                sure:
              </p>
              <ul className="text-sm text-slate-500 text-left space-y-1 mb-4">
                <li>• Terminals are powered on</li>
                <li>• Terminals are connected to the same network</li>
                <li>• Peer-to-peer mode is enabled on terminals</li>
                <li>• Firewall allows communication on terminal ports</li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-500">
                Click "Scan Again" to discover terminals on your network
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
