import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  ProductBatch,
  ExpiryAlert,
  ExpirySettings,
  ExpiryNotificationResponse,
} from "../types/batch.types";
import {
  generateExpiryAlert,
  filterBatchesByExpiryStatus,
  getBatchesExpiringInRange,
} from "../utils/expiry-calculations";

interface UseExpiryAlertsProps {
  batches: ProductBatch[];
  expirySettings: ExpirySettings | null;
  businessId?: string;
}

export const useExpiryAlerts = ({
  batches,
  expirySettings,
  businessId,
}: UseExpiryAlertsProps) => {
  const [notifications, setNotifications] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate alerts from batches
  const alerts = useMemo(() => {
    if (!expirySettings || batches.length === 0) {
      return [];
    }

    const alertsList: ExpiryAlert[] = [];

    batches.forEach((batch) => {
      if (batch.status === "ACTIVE") {
        const alert = generateExpiryAlert(batch, {
          criticalAlertDays: expirySettings.criticalAlertDays,
          warningAlertDays: expirySettings.warningAlertDays,
          infoAlertDays: expirySettings.infoAlertDays,
        });

        if (alert) {
          alertsList.push(alert);
        }
      }
    });

    // Sort by severity and days until expiry
    return alertsList.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff =
        severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });
  }, [batches, expirySettings]);

  const loadNotifications = useCallback(async () => {
    if (!businessId || !window.expiryNotificationsAPI) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await window.expiryNotificationsAPI.get(businessId, "PENDING,SENT");

      if (response.success && response.alerts) {
        setNotifications(response.alerts);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Categorized alerts
  const criticalAlerts = useMemo(
    () => alerts.filter((alert) => alert.alertType === "CRITICAL" || alert.alertType === "EXPIRED"),
    [alerts]
  );

  const warningAlerts = useMemo(
    () => alerts.filter((alert) => alert.alertType === "WARNING"),
    [alerts]
  );

  const infoAlerts = useMemo(
    () => alerts.filter((alert) => alert.alertType === "INFO"),
    [alerts]
  );

  // Batch counts by status
  const expiredBatches = useMemo(
    () =>
      expirySettings
        ? filterBatchesByExpiryStatus(batches, "expired", expirySettings)
        : [],
    [batches, expirySettings]
  );

  const criticalBatches = useMemo(
    () =>
      expirySettings
        ? filterBatchesByExpiryStatus(batches, "critical", expirySettings)
        : [],
    [batches, expirySettings]
  );

  const warningBatches = useMemo(
    () =>
      expirySettings
        ? filterBatchesByExpiryStatus(batches, "warning", expirySettings)
        : [],
    [batches, expirySettings]
  );

  const expiringThisWeek = useMemo(
    () => getBatchesExpiringInRange(batches, 0, 7),
    [batches]
  );

  const expiringNext30Days = useMemo(
    () => getBatchesExpiringInRange(batches, 0, 30),
    [batches]
  );

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    expiredBatches,
    criticalBatches,
    warningBatches,
    expiringThisWeek,
    expiringNext30Days,
    notifications,
    loading,
    loadNotifications,
  };
};

