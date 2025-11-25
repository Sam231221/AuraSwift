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
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
              Backup Database
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base">
              You will be prompted to choose where to save your database backup
              file. The backup will include all your business data, products,
              transactions, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm md:text-base lg:text-base touch-manipulation">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBackupDatabase}
              className="w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm md:text-base lg:text-base touch-manipulation"
            >
              Choose Location & Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Database Confirmation Dialog */}
      <AlertDialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-base md:text-lg lg:text-xl text-red-600">
              ⚠️ Empty Database
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-[10px] sm:text-xs md:text-sm lg:text-base">
              <p className="font-semibold">This action cannot be undone!</p>
              <p>This will permanently delete ALL data from your database:</p>
              <ul className="list-disc list-inside space-y-1 text-[10px] sm:text-xs md:text-sm lg:text-base">
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
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm md:text-base lg:text-base touch-manipulation">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEmptyDatabase}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm md:text-base lg:text-base touch-manipulation"
            >
              I Understand, Empty Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm lg:text-base font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
              $45,231.89
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm lg:text-base font-medium">
              Active Users
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
              12
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
              3 online now
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm lg:text-base font-medium">
              System Health
            </CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
              99.9%
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm lg:text-base font-medium">
              Alerts
            </CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
              2
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
              User Management
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base">
              Manage staff and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6">
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
              onClick={onFront}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Manage Users
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Role Permissions
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Access Control
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
              System Settings
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base">
              Configure system preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6">
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              General Settings
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Store className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Store Configuration
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
              Advanced Reports
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base">
              Comprehensive analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6">
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Financial Reports
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              Business Intelligence
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              User Activity Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
              DB Management
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base">
              Database backup and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6">
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
              onClick={handleImportDatabase}
              disabled={isImporting}
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">
                {isImporting ? "Importing Database..." : "Import Database"}
              </span>
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
              onClick={() => setIsBackupDialogOpen(true)}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 animate-spin shrink-0" />
              ) : (
                <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              )}
              <span className="truncate">
                {isBackingUp ? "Creating Backup..." : "Backup Database"}
              </span>
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm md:text-base lg:text-base h-9 sm:h-10 touch-manipulation"
              variant="outline"
              onClick={handleEmptyDatabase}
              disabled={isEmptying}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2 shrink-0" />
              <span className="truncate">
                {isEmptying ? "Emptying Database..." : "Empty Database"}
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
     
    </>
  );
};
export default AdminDashboardPage;
