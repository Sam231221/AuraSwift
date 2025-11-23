/**
 * Offline queue utility for storing operations when offline
 * Retries operations when connection is restored
 */

export interface QueuedOperation {
  id: string;
  type: "shift:start" | "shift:end" | "transaction" | "other";
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "aura_swift_offline_queue";
const MAX_RETRIES = 3;

/**
 * Get offline queue from localStorage
 */
function getQueue(): QueuedOperation[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save offline queue:", error);
  }
}

/**
 * Add operation to offline queue
 */
export function queueOperation(
  type: QueuedOperation["type"],
  data: any
): string {
  const queue = getQueue();
  const operation: QueuedOperation = {
    id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(operation);
  saveQueue(queue);

  return operation.id;
}

/**
 * Remove operation from queue
 */
export function removeOperation(operationId: string): void {
  const queue = getQueue();
  const filtered = queue.filter((op) => op.id !== operationId);
  saveQueue(filtered);
}

/**
 * Get all queued operations
 */
export function getQueuedOperations(): QueuedOperation[] {
  return getQueue();
}

/**
 * Clear all queued operations
 */
export function clearQueue(): void {
  saveQueue([]);
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Process queued operations when connection is restored
 * This should be called periodically or when online status changes
 */
export async function processQueue(
  processor: (operation: QueuedOperation) => Promise<boolean>
): Promise<{ processed: number; failed: number }> {
  if (!isOnline()) {
    return { processed: 0, failed: 0 };
  }

  const queue = getQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;
  const remaining: QueuedOperation[] = [];

  for (const operation of queue) {
    try {
      const success = await processor(operation);
      if (success) {
        processed++;
      } else {
        // Increment retries
        operation.retries++;
        if (operation.retries < MAX_RETRIES) {
          remaining.push(operation);
        } else {
          failed++;
          console.warn(
            `Operation ${operation.id} failed after ${MAX_RETRIES} retries`
          );
        }
      }
    } catch (error) {
      console.error(`Error processing operation ${operation.id}:`, error);
      operation.retries++;
      if (operation.retries < MAX_RETRIES) {
        remaining.push(operation);
      } else {
        failed++;
      }
    }
  }

  saveQueue(remaining);
  return { processed, failed };
}

/**
 * Setup online/offline event listeners
 */
export function setupOfflineListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

