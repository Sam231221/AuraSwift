/**
 * Viva Wallet Settings View
 * Main settings page for configuring Viva Wallet payment terminals
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TerminalList } from "../components/terminal-list";
import { TerminalDiscoveryPanel } from "../components/terminal-discovery-panel";
import { TerminalConfigForm } from "../components/terminal-config-form";
import { useVivaWalletSettings } from "../hooks/use-viva-wallet-settings";
import type {
  TerminalConfig,
  DiscoveredTerminal,
} from "../hooks/use-viva-wallet-settings";

interface VivaWalletSettingsViewProps {
  onBack: () => void;
}

export default function VivaWalletSettingsView({
  onBack,
}: VivaWalletSettingsViewProps) {
  const {
    enabled,
    terminals,
    isLoading,
    isSaving,
    isDiscovering,
    discoveredTerminals,
    isTestingConnection,
    setEnabled,
    saveSettings,
    discoverTerminals,
    addTerminal,
    updateTerminal,
    deleteTerminal,
    testConnection,
  } = useVivaWalletSettings();

  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<TerminalConfig | null>(
    null
  );

  const handleAddTerminal = (terminal: DiscoveredTerminal | TerminalConfig) => {
    if ("apiKey" in terminal) {
      // Already a full TerminalConfig
      addTerminal(terminal);
    } else {
      // Discovered terminal - add it (user will need to provide API key)
      const newTerminal = addTerminal(terminal);
      // Open config form to add API key
      setEditingTerminal(newTerminal);
      setShowConfigForm(true);
    }
    setShowDiscovery(false);
  };

  const handleEditTerminal = (terminal: TerminalConfig) => {
    setEditingTerminal(terminal);
    setShowConfigForm(true);
  };

  const handleFormSubmit = (data: any) => {
    if (editingTerminal) {
      // Update existing terminal
      updateTerminal(editingTerminal.id, data as Partial<TerminalConfig>);
    } else {
      // Add new terminal
      addTerminal(data);
    }
    setShowConfigForm(false);
    setEditingTerminal(null);
  };

  const handleTestConnectionFromForm = async (_data: any): Promise<boolean> => {
    // If editing, use existing ID to test connection
    if (editingTerminal) {
      return await testConnection(editingTerminal.id);
    } else {
      // For new terminals, we can't test until saved
      toast.info("Please save the terminal first, then test the connection");
      return false;
    }
  };

  const handleSaveSettings = async () => {
    const success = await saveSettings();
    if (success) {
      toast.success("Viva Wallet settings saved successfully");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Viva Wallet Settings</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Viva Wallet Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure payment terminals for Viva Wallet
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Viva Wallet Integration</CardTitle>
            <CardDescription>
              Enable or disable Viva Wallet payment processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-viva-wallet" className="text-base">
                Enable Viva Wallet
              </Label>
              <Switch
                id="enable-viva-wallet"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Terminal Management */}
        {enabled && (
          <>
            <TerminalList
              terminals={terminals}
              isTestingConnection={isTestingConnection}
              onEdit={handleEditTerminal}
              onDelete={deleteTerminal}
              onTest={testConnection}
              onAdd={() => {
                setEditingTerminal(null);
                setShowConfigForm(true);
              }}
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={() => setShowDiscovery(true)} variant="outline">
                Discover Terminals
              </Button>
              <Button
                onClick={() => {
                  setEditingTerminal(null);
                  setShowConfigForm(true);
                }}
                variant="outline"
              >
                Add Terminal Manually
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </>
        )}

        {/* Discovery Panel */}
        <TerminalDiscoveryPanel
          open={showDiscovery}
          onClose={() => setShowDiscovery(false)}
          onSelect={handleAddTerminal}
          onDiscover={discoverTerminals}
          isDiscovering={isDiscovering}
          discoveredTerminals={discoveredTerminals}
        />

        {/* Configuration Form */}
        <TerminalConfigForm
          open={showConfigForm}
          onClose={() => {
            setShowConfigForm(false);
            setEditingTerminal(null);
          }}
          onSubmit={handleFormSubmit}
          terminal={editingTerminal}
          onTestConnection={handleTestConnectionFromForm}
        />
      </div>
    </div>
  );
}
