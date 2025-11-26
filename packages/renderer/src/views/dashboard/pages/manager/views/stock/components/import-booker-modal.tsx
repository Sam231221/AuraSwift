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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  FolderTree,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import type {
  ImportProgress,
  ImportResult,
  ImportOptions,
} from "../types/import.types";

interface ImportBookerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: "department" | "product";
  onSuccess?: () => void;
}

export function ImportBookerModal({
  open,
  onOpenChange,
  importType,
  onSuccess,
}: ImportBookerModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<
    "select" | "preview" | "import" | "complete"
  >("select");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<any[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDepartment = importType === "department";
  const title = isDepartment
    ? "Import Booker Departments"
    : "Import Booker Products";

  // Reset state when modal closes and trigger onSuccess if needed
  useEffect(() => {
    if (!open) {
      // If we had a successful import, call onSuccess when modal closes
      if (result?.success && onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        setStep("select");
        setSelectedFile(null);
        setParsedData([]);
        setParseErrors([]);
        setParseWarnings([]);
        setImporting(false);
        setProgress(null);
        setResult(null);
        setError(null);
      }, 300);
    }
  }, [open, result, onSuccess]);

  // Subscribe to progress updates
  useEffect(() => {
    if (!open) return;

    const unsubscribe = window.importAPI.onProgress((progressData) => {
      setProgress(progressData);
    });

    return () => {
      unsubscribe();
    };
  }, [open]);

  const handleSelectFile = async () => {
    try {
      const response = await window.importAPI.selectFile(importType);
      if (response.success && response.filePath) {
        setSelectedFile(response.filePath);
        await handleParseFile(response.filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select file");
    }
  };

  const handleParseFile = async (filePath: string) => {
    try {
      setError(null);
      const response = await window.importAPI.parseFile(filePath);

      if (response.success) {
        setParsedData(response.data || []);
        setParseErrors(response.errors || []);
        setParseWarnings(response.warnings || []);

        // Verify file type matches expected type
        if (isDepartment && response.fileType !== "department") {
          setError(
            "This appears to be a Product report, not a Department report. Please select the correct file."
          );
          return;
        }
        if (!isDepartment && response.fileType !== "product") {
          setError(
            "This appears to be a Department report, not a Product report. Please select the correct file."
          );
          return;
        }

        if (response.errors && response.errors.length > 0) {
          setError(
            `File contains ${response.errors.length} parsing error(s). Please fix and try again.`
          );
        } else {
          setStep("preview");
        }
      } else {
        setError(response.message || "Failed to parse file");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    }
  };

  const handleImport = async () => {
    if (!user?.businessId) {
      setError("No business ID found");
      return;
    }

    try {
      setImporting(true);
      setStep("import");
      setError(null);

      const options: ImportOptions = {
        onDuplicateSku: "update",
        onDuplicateBarcode: "skip",
        createMissingCategories: true,
        updateStockLevels: !isDepartment,
        mapVatFromPercentage: !isDepartment,
        batchSize: 100,
        defaultExpiryDays: 365,
      };

      let importResult: ImportResult;

      if (isDepartment) {
        importResult = await window.importAPI.importDepartments(
          parsedData,
          user.businessId,
          options
        );
      } else {
        importResult = await window.importAPI.importProducts(
          parsedData,
          user.businessId,
          options
        );
      }

      setResult(importResult);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const renderSelectStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          {isDepartment ? (
            <FolderTree className="h-12 w-12 text-primary" />
          ) : (
            <Package className="h-12 w-12 text-primary" />
          )}
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Select a Booker CSV file to import{" "}
          {isDepartment ? "department categories" : "products"}. The file should
          be exported from your Booker account.
        </p>
      </div>

      {selectedFile && (
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription className="text-xs break-all">
            {selectedFile}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parseWarnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-xs">
              <p className="font-semibold mb-1">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {parseWarnings.slice(0, 5).map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
                {parseWarnings.length > 5 && (
                  <li>... and {parseWarnings.length - 5} more</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {parseErrors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-xs">
              <p className="font-semibold mb-1">Errors found in file:</p>
              <ul className="list-disc list-inside space-y-1">
                {parseErrors.slice(0, 5).map((error, i) => (
                  <li key={i}>
                    Row {error.row}: {error.message}
                  </li>
                ))}
                {parseErrors.length > 5 && (
                  <li>... and {parseErrors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {parsedData.length} {isDepartment ? "categories" : "products"} ready
            to import
          </p>
          <p className="text-xs text-muted-foreground">
            Review the data below before importing
          </p>
        </div>
      </div>

      <div className="border rounded-lg max-h-[400px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              {isDepartment ? (
                <>
                  <th className="text-left p-2 font-medium">Department Name</th>
                  <th className="text-right p-2 font-medium">Items</th>
                  <th className="text-right p-2 font-medium">Total Value</th>
                </>
              ) : (
                <>
                  <th className="text-left p-2 font-medium">Product</th>
                  <th className="text-left p-2 font-medium">SKU</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Stock</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {parsedData.slice(0, 100).map((item, idx) => (
              <tr key={idx} className="border-t">
                {isDepartment ? (
                  <>
                    <td className="p-2">{item.department}</td>
                    <td className="p-2 text-right">{item.balanceOnHand}</td>
                    <td className="p-2 text-right">
                      £{item.totalRetailPrice.toFixed(2)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{item.productDescription}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {item.itemCode}
                    </td>
                    <td className="p-2 text-right">
                      £{item.retailPrice.toFixed(2)}
                    </td>
                    <td className="p-2 text-right">{item.balanceOnHand}</td>
                  </>
                )}
              </tr>
            ))}
            {parsedData.length > 100 && (
              <tr className="border-t bg-muted/50">
                <td
                  colSpan={isDepartment ? 3 : 4}
                  className="p-2 text-center text-xs text-muted-foreground"
                >
                  ... and {parsedData.length - 100} more items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {parseWarnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {parseWarnings.length} warning(s) detected. Import will proceed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderImportStep = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium">Importing...</p>
        <p className="text-xs text-muted-foreground">
          {progress?.currentItem || "Processing data"}
        </p>
      </div>

      {progress && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">
              {progress.stage}
            </span>
            <span className="font-medium">
              {progress.processed} / {progress.total}
            </span>
          </div>
          <Progress value={(progress.processed / progress.total) * 100} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Succeeded: {progress.succeeded}</span>
            <span>Failed: {progress.failed}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      {result && (
        <>
          <div className="flex flex-col items-center justify-center py-6">
            {result.success ? (
              <>
                <div className="rounded-full bg-green-500/10 p-6 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-lg font-semibold">Import Successful!</p>
                <p className="text-sm text-muted-foreground">
                  Completed in {(result.duration / 1000).toFixed(1)}s
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-destructive/10 p-6 mb-4">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
                <p className="text-lg font-semibold">
                  Import Completed with Errors
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {result.categoriesCreated > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Categories Created
                </p>
                <p className="text-2xl font-bold">{result.categoriesCreated}</p>
              </div>
            )}
            {result.vatCategoriesCreated > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">VAT Categories</p>
                <p className="text-2xl font-bold">
                  {result.vatCategoriesCreated}
                </p>
              </div>
            )}
            {result.suppliersCreated > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Suppliers Created
                </p>
                <p className="text-2xl font-bold">{result.suppliersCreated}</p>
              </div>
            )}
            {result.productsCreated > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Products Created
                </p>
                <p className="text-2xl font-bold">{result.productsCreated}</p>
              </div>
            )}
            {result.productsUpdated > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Products Updated
                </p>
                <p className="text-2xl font-bold">{result.productsUpdated}</p>
              </div>
            )}
            {result.batchesCreated > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Batches Created</p>
                <p className="text-2xl font-bold">{result.batchesCreated}</p>
              </div>
            )}
            {result.productsSkipped > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Products Skipped
                </p>
                <p className="text-2xl font-bold">{result.productsSkipped}</p>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-xs">
                  <p className="font-semibold mb-1">
                    Errors ({result.errors.length}):
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.errors.slice(0, 5).map((error: any, i: number) => (
                      <li key={i}>
                        {error.item && `${error.item}: `}
                        {error.message}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-xs">
                  <p className="font-semibold mb-1">
                    Warnings ({result.warnings.length}):
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.warnings
                      .slice(0, 5)
                      .map((warning: string, i: number) => (
                        <li key={i}>{warning}</li>
                      ))}
                    {result.warnings.length > 5 && (
                      <li>
                        ... and {result.warnings.length - 5} more warnings
                      </li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Import {isDepartment ? "categories" : "products"} from Booker CSV
            export file
          </DialogDescription>
        </DialogHeader>

        {step === "select" && renderSelectStep()}
        {step === "preview" && renderPreviewStep()}
        {step === "import" && renderImportStep()}
        {step === "complete" && renderCompleteStep()}

        <DialogFooter>
          {step === "select" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelectFile}>
                <Upload className="h-4 w-4 mr-2" />
                Select CSV File
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                Import {parsedData.length} Items
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
