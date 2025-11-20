import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  BarChart3,
  TrendingUp,
  Store,
  Users,
  Settings,
  Shield,
  DollarSign,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
} from "lucide-react";

const AdminDashboardPage = ({ onFront }: { onFront: () => void }) => {
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isEmptyDialogOpen, setIsEmptyDialogOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Backup/Export Database Handler
  const handleBackupDatabase = async () => {
    setIsBackupDialogOpen(false);
    setIsBackingUp(true);

    try {
      toast.loading("Opening save dialog...", { id: "backup" });

      // Call database backup API which will show save dialog
      const response = await window.databaseAPI.backup();

      if (!response || !response.success) {
        // Check if user cancelled the save dialog
        const responseWithCancelled = response as typeof response & {
          cancelled?: boolean;
        };
        if (responseWithCancelled.cancelled) {
          toast.dismiss("backup");
          toast.info("Backup cancelled");
          return;
        }
        throw new Error(response?.message || "Could not backup database");
      }

      const data = response.data as {
        path: string;
        size: number;
        timestamp: string;
      };

      toast.success(`Database backed up successfully!`, {
        id: "backup",
        description: `Saved to: ${data.path} (${(
          data.size /
          (1024 * 1024)
        ).toFixed(2)} MB)`,
        duration: 6000,
      });
    } catch (error) {
      console.error("Backup error:", error);
      toast.error("Failed to backup database", {
        id: "backup",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Import Database Handler (placeholder)
  const handleImportDatabase = async () => {
    setIsImporting(true);

    try {
      toast.loading("Opening file picker...", { id: "import" });

      // Call database import API which will show open file dialog
      const response = await window.databaseAPI.import();

      if (!response || !response.success) {
        // Check if user cancelled the file dialog
        const responseWithCancelled = response as typeof response & {
          cancelled?: boolean;
        };
        if (responseWithCancelled.cancelled) {
          toast.dismiss("import");
          toast.info("Import cancelled");
          return;
        }
        throw new Error(response?.message || "Could not import database");
      }

      const data = response.data as {
        importedFrom: string;
        importSize: number;
        backupPath?: string;
        newSize: number;
      };

      const backupMsg = data.backupPath
        ? `\nPrevious database backed up to: ${data.backupPath}`
        : "";

      toast.success("Database imported successfully!", {
        id: "import",
        description: `Imported from: ${data.importedFrom} (${(
          data.importSize /
          (1024 * 1024)
        ).toFixed(2)} MB)${backupMsg}\n\nThe application will now restart.`,
        duration: 5000,
      });

      // Restart the application after a short delay
      setTimeout(async () => {
        try {
          await window.appAPI.restart();
        } catch (restartError) {
          console.error("Restart error:", restartError);
          // Fallback to window reload if restart fails
          window.location.reload();
        }
      }, 1500);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import database", {
        id: "import",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Empty Database Handler
  const handleEmptyDatabase = () => {
    setIsEmptyDialogOpen(true);
  };

  const confirmEmptyDatabase = async () => {
    setIsEmptyDialogOpen(false);
    setIsEmptying(true);

    try {
      toast.loading("Creating backup and emptying database...", {
        id: "empty-db",
      });

      // Call database empty API
      const response = await window.databaseAPI.empty();

      if (!response || !response.success) {
        throw new Error(response?.message || "Could not empty database");
      }

      const data = response.data as {
        backupPath: string;
        backupSize: number;
        tablesEmptied: number;
        totalRowsDeleted: number;
        tableList: string[];
      };

      toast.success("Database emptied successfully!", {
        id: "empty-db",
        description: `Backup saved to: ${data.backupPath}\n${data.tablesEmptied} tables emptied, ${data.totalRowsDeleted} rows deleted.\nThe application will now restart.`,
        duration: 5000,
      });

      // Restart the application after a short delay
      setTimeout(async () => {
        try {
          await window.appAPI.restart();
        } catch (restartError) {
          console.error("Restart error:", restartError);
          // Fallback to window reload if restart fails
          window.location.reload();
        }
      }, 1500);
    } catch (error) {
      console.error("Empty database error:", error);
      toast.error("Failed to empty database", {
        id: "empty-db",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsEmptying(false);
    }
  };

  return (
    <>
      {/* Backup Confirmation Dialog */}
      <AlertDialog
        open={isBackupDialogOpen}
        onOpenChange={setIsBackupDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Backup Database</AlertDialogTitle>
            <AlertDialogDescription>
              You will be prompted to choose where to save your database backup
              file. The backup will include all your business data, products,
              transactions, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackupDatabase}>
              Choose Location & Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Database Confirmation Dialog */}
      <AlertDialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              ⚠️ Empty Database
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold">This action cannot be undone!</p>
              <p>This will permanently delete ALL data from your database:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All user accounts and permissions</li>
                <li>All products and categories</li>
                <li>All transactions and sales history</li>
                <li>All business data</li>
              </ul>
              <p className="text-red-600 font-semibold mt-2">
                A backup will be created automatically before emptying.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmptyDatabase}
              className="bg-red-600 hover:bg-red-700"
            >
              I Understand, Empty Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenueß
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 online now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Controls */}
      <div className="grid md:grid-cols-3 mt-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage staff and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={onFront}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Role Permissions
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              Access Control
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Settings className="w-4 h-4 mr-2" />
              General Settings
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Store className="w-4 h-4 mr-2" />
              Store Configuration
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Reports</CardTitle>
            <CardDescription>Comprehensive analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Financial Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Business Intelligence
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
            >
              <Users className="w-4 h-4 mr-2" />
              User Activity Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DB Management</CardTitle>
            <CardDescription>Database backup and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={handleImportDatabase}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing Database..." : "Import Database"}
            </Button>
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={() => setIsBackupDialogOpen(true)}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <Download className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isBackingUp ? "Creating Backup..." : "Backup Database"}
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
              variant="outline"
              onClick={handleEmptyDatabase}
              disabled={isEmptying}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isEmptying ? "Emptying Database..." : "Empty Database"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
export default AdminDashboardPage;
