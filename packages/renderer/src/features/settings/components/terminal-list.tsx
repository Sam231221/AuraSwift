/**
 * Terminal List Component
 * Displays configured terminals with status and management actions
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TerminalStatusCard } from "./terminal-status-card";
import type { TerminalConfig } from "../hooks/use-viva-wallet-settings";

interface TerminalListProps {
  terminals: TerminalConfig[];
  isTestingConnection: string | null;
  onEdit: (terminal: TerminalConfig) => void;
  onDelete: (terminalId: string) => void;
  onTest: (terminalId: string) => void;
  onAdd: () => void;
}

export function TerminalList({
  terminals,
  isTestingConnection,
  onEdit,
  onDelete,
  onTest,
  onAdd,
}: TerminalListProps) {
  if (terminals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configured Terminals</CardTitle>
          <CardDescription>
            Add terminals to enable Viva Wallet payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-500 mb-4">
              No terminals configured. Add a terminal to get started.
            </p>
            <Button onClick={onAdd} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Terminal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configured Terminals</CardTitle>
            <CardDescription>
              {terminals.length} terminal{terminals.length !== 1 ? "s" : ""}{" "}
              configured
            </CardDescription>
          </div>
          <Button onClick={onAdd} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Terminal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terminals.map((terminal) => (
            <TerminalStatusCard
              key={terminal.id}
              terminal={terminal}
              isTesting={isTestingConnection === terminal.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onTest={onTest}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
