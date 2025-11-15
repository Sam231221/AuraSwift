/**
 * React hooks for Office Printer Management
 * Supports HP LaserJet, Canon, Epson, Brother, Dell and other office/laser printers
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import type {
  OfficePrinter,
  PrintJobConfig,
  PrintJobStatus,
  PrintOptions,
  PrinterHealth,
  PrintMetrics,
} from "../../types/officePrinter";

export type PrintState =
  | "idle"
  | "discovering"
  | "queuing"
  | "printing"
  | "completed"
  | "failed";

/**
 * Hook for managing office printer operations
 */
export const useOfficePrinter = () => {
  const [printers, setPrinters] = useState<OfficePrinter[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<OfficePrinter | null>(
    null
  );
  const [selectedPrinter, setSelectedPrinter] = useState<OfficePrinter | null>(
    null
  );
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<PrintJobStatus | null>(null);
  const [failedJobs, setFailedJobs] = useState<PrintJobStatus[]>([]);
  const [metrics, setMetrics] = useState<PrintMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusPollInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Discover available printers
   */
  const discoverPrinters = useCallback(async () => {
    setIsLoading(true);
    setPrintState("discovering");
    setError(null);

    try {
      if (!window.officePrinterAPI) {
        throw new Error("Office printer API not available");
      }

      const result = await window.officePrinterAPI.list();

      if (result.success) {
        setPrinters(result.printers);

        // Get default printer
        const defaultResult = await window.officePrinterAPI.getDefault();
        if (defaultResult.success && defaultResult.printer) {
          setDefaultPrinter(defaultResult.printer);
          if (!selectedPrinter) {
            setSelectedPrinter(defaultResult.printer);
          }
        }

        toast.success(`Found ${result.printers.length} printer(s)`);
      } else {
        throw new Error(result.error || "Failed to discover printers");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      toast.error(`Failed to discover printers: ${errorMsg}`);
    } finally {
      setIsLoading(false);
      setPrintState("idle");
    }
  }, [selectedPrinter]);

  /**
   * Stop polling for job status
   */
  const stopStatusPolling = useCallback(() => {
    if (statusPollInterval.current) {
      clearInterval(statusPollInterval.current);
      statusPollInterval.current = null;
    }
  }, []);

  /**
   * Get status of a print job
   */
  const getJobStatusById = useCallback(
    async (jobId: string) => {
      try {
        if (!window.officePrinterAPI) {
          throw new Error("Office printer API not available");
        }

        const result = await window.officePrinterAPI.getJobStatus(jobId);

        if (result.success && result.status) {
          setJobStatus(result.status);

          // Update print state based on job status
          switch (result.status.status) {
            case "printing":
              setPrintState("printing");
              break;
            case "completed":
              setPrintState("completed");
              stopStatusPolling();
              toast.success("Print completed successfully");
              break;
            case "failed":
              setPrintState("failed");
              setError(result.status.error || "Print job failed");
              stopStatusPolling();
              toast.error(`Print failed: ${result.status.error}`);
              break;
            case "cancelled":
              setPrintState("idle");
              stopStatusPolling();
              toast.info("Print job cancelled");
              break;
          }

          return result.status;
        } else {
          throw new Error(result.error || "Failed to get job status");
        }
      } catch (err) {
        console.error("Failed to get job status:", err);
        return null;
      }
    },
    [stopStatusPolling]
  );

  /**
   * Start polling for job status
   */
  const startStatusPolling = useCallback(
    (jobId: string) => {
      stopStatusPolling(); // Clear any existing polling

      statusPollInterval.current = setInterval(() => {
        getJobStatusById(jobId);
      }, 2000); // Poll every 2 seconds
    },
    [getJobStatusById, stopStatusPolling]
  );

  /**
   * Print a document
   */
  const printDocument = useCallback(
    async (
      documentPath: string,
      documentType: "pdf" | "image" | "text" | "raw" = "pdf",
      options?: PrintOptions
    ): Promise<{ success: boolean; jobId?: string; error?: string }> => {
      if (!selectedPrinter) {
        const error = "No printer selected";
        toast.error(error);
        return { success: false, error };
      }

      setIsLoading(true);
      setPrintState("queuing");
      setError(null);

      try {
        if (!window.officePrinterAPI) {
          throw new Error("Office printer API not available");
        }

        const jobId = `job_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const config: PrintJobConfig = {
          jobId,
          printerName: selectedPrinter.name,
          documentPath,
          documentType,
          options: options || {
            copies: 1,
            color: true,
            duplex: "simplex",
            paperSize: "letter",
            orientation: "portrait",
            quality: "normal",
          },
          createdBy: "current_user", // TODO: Get from auth context
          businessId: "current_business", // TODO: Get from auth context
        };

        const result = await window.officePrinterAPI.print(config);

        if (result.success) {
          setCurrentJobId(result.jobId);
          setPrintState("printing");

          // Start polling for status
          startStatusPolling(result.jobId);

          toast.success("Print job submitted successfully");
          return { success: true, jobId: result.jobId };
        } else {
          throw new Error(result.error || "Failed to print document");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        setPrintState("failed");
        toast.error(`Print failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPrinter, startStatusPolling]
  );

  /**
   * Cancel a print job
   */
  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        if (!window.officePrinterAPI) {
          throw new Error("Office printer API not available");
        }

        const result = await window.officePrinterAPI.cancel(jobId);

        if (result.success) {
          toast.success("Print job cancelled");
          if (jobId === currentJobId) {
            setPrintState("idle");
            setCurrentJobId(null);
            setJobStatus(null);
          }
          return true;
        } else {
          throw new Error(result.error || "Failed to cancel job");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to cancel job: ${errorMsg}`);
        return false;
      }
    },
    [currentJobId]
  );

  /**
   * Retry a failed print job
   */
  const retryJob = useCallback(
    async (jobId: string) => {
      try {
        if (!window.officePrinterAPI) {
          throw new Error("Office printer API not available");
        }

        const result = await window.officePrinterAPI.retry(jobId);

        if (result.success) {
          toast.success("Print job requeued for retry");
          setCurrentJobId(jobId);
          setPrintState("printing");
          startStatusPolling(jobId);
          return true;
        } else {
          throw new Error(result.error || "Failed to retry job");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to retry job: ${errorMsg}`);
        return false;
      }
    },
    [startStatusPolling]
  );

  /**
   * Get all failed print jobs
   */
  const loadFailedJobs = useCallback(async () => {
    try {
      if (!window.officePrinterAPI) {
        throw new Error("Office printer API not available");
      }

      const result = await window.officePrinterAPI.getFailedJobs();

      if (result.success) {
        setFailedJobs(result.jobs);
        return result.jobs;
      } else {
        throw new Error(result.error || "Failed to load failed jobs");
      }
    } catch (err) {
      console.error("Failed to load failed jobs:", err);
      return [];
    }
  }, []);

  /**
   * Get printer health status
   */
  const getPrinterHealth = useCallback(
    async (printerName?: string): Promise<PrinterHealth | null> => {
      const targetPrinter = printerName || selectedPrinter?.name;
      if (!targetPrinter) {
        return null;
      }

      try {
        if (!window.officePrinterAPI) {
          throw new Error("Office printer API not available");
        }

        const result = await window.officePrinterAPI.getHealth(targetPrinter);

        if (result.success && result.health) {
          return result.health;
        } else {
          throw new Error(result.error || "Failed to get printer health");
        }
      } catch (err) {
        console.error("Failed to get printer health:", err);
        return null;
      }
    },
    [selectedPrinter]
  );

  /**
   * Load print metrics
   */
  const loadMetrics = useCallback(async () => {
    try {
      if (!window.officePrinterAPI) {
        throw new Error("Office printer API not available");
      }

      const result = await window.officePrinterAPI.getMetrics();
      setMetrics(result);
      return result;
    } catch (err) {
      console.error("Failed to load metrics:", err);
      return null;
    }
  }, []);

  /**
   * Clear print queue
   */
  const clearQueue = useCallback(async () => {
    try {
      if (!window.officePrinterAPI) {
        throw new Error("Office printer API not available");
      }

      const result = await window.officePrinterAPI.clearQueue();

      if (result.success) {
        toast.success(`Cleared ${result.cleared} job(s) from queue`);
        return true;
      } else {
        toast.error("Failed to clear queue");
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to clear queue: ${errorMsg}`);
      return false;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  return {
    // State
    printers,
    defaultPrinter,
    selectedPrinter,
    printState,
    currentJobId,
    jobStatus,
    failedJobs,
    metrics,
    isLoading,
    error,

    // Actions
    discoverPrinters,
    printDocument,
    getJobStatus: getJobStatusById,
    cancelJob,
    retryJob,
    loadFailedJobs,
    getPrinterHealth,
    loadMetrics,
    clearQueue,

    // Setters
    setSelectedPrinter,
    setPrintState,
  };
};

/**
 * Hook for printer selection dialog
 */
export const usePrinterSelection = () => {
  const {
    printers,
    defaultPrinter,
    selectedPrinter,
    discoverPrinters,
    setSelectedPrinter,
    isLoading,
  } = useOfficePrinter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    copies: 1,
    color: true,
    duplex: "simplex",
    paperSize: "letter",
    orientation: "portrait",
    quality: "normal",
  });

  const openDialog = useCallback(async () => {
    setIsDialogOpen(true);
    if (printers.length === 0) {
      await discoverPrinters();
    }
  }, [printers.length, discoverPrinters]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const selectPrinter = useCallback(
    (printer: OfficePrinter) => {
      setSelectedPrinter(printer);
      toast.success(`Selected: ${printer.displayName}`);
    },
    [setSelectedPrinter]
  );

  return {
    printers,
    defaultPrinter,
    selectedPrinter,
    isDialogOpen,
    printOptions,
    isLoading,
    openDialog,
    closeDialog,
    selectPrinter,
    setPrintOptions,
    refreshPrinters: discoverPrinters,
  };
};

/**
 * Hook for monitoring print job progress
 */
export const usePrintJobMonitor = (jobId: string | null) => {
  const [status, setStatus] = useState<PrintJobStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorInterval = useRef<NodeJS.Timeout | null>(null);

  const stopMonitoring = useCallback(() => {
    if (monitorInterval.current) {
      clearInterval(monitorInterval.current);
      monitorInterval.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const startMonitoring = useCallback(async () => {
    if (!jobId || !window.officePrinterAPI) {
      return;
    }

    setIsMonitoring(true);

    const checkStatus = async () => {
      try {
        const result = await window.officePrinterAPI.getJobStatus(jobId);
        if (result.success && result.status) {
          setStatus(result.status);

          // Stop monitoring if job is complete, failed, or cancelled
          if (
            ["completed", "failed", "cancelled"].includes(result.status.status)
          ) {
            stopMonitoring();
          }
        }
      } catch (err) {
        console.error("Error monitoring job:", err);
      }
    };

    // Initial check
    await checkStatus();

    // Start polling
    monitorInterval.current = setInterval(checkStatus, 2000);
  }, [jobId, stopMonitoring]);

  useEffect(() => {
    if (jobId) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [jobId, startMonitoring, stopMonitoring]);

  return {
    status,
    isMonitoring,
    refresh: startMonitoring,
    stop: stopMonitoring,
  };
};
