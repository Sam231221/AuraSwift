/**
 * System time change detection utility
 */

export interface TimeChangeInfo {
  detected: boolean;
  timeDifference: number; // milliseconds
  previousTime: Date | null;
  currentTime: Date;
}

/**
 * Time change detector class
 */
export class TimeChangeDetector {
  private lastKnownTime: Date | null = null;
  private lastCheckTime: Date | null = null;
  private readonly threshold: number; // milliseconds

  constructor(thresholdMs: number = 5000) {
    this.threshold = thresholdMs;
  }

  /**
   * Check for time changes
   * Returns info about detected time changes
   */
  checkTimeChange(): TimeChangeInfo {
    const now = new Date();

    if (!this.lastKnownTime) {
      // First check - just record the time
      this.lastKnownTime = now;
      this.lastCheckTime = now;
      return {
        detected: false,
        timeDifference: 0,
        previousTime: null,
        currentTime: now,
      };
    }

    // Calculate expected time difference
    const expectedElapsed = this.lastCheckTime
      ? now.getTime() - this.lastCheckTime.getTime()
      : 0;

    // Calculate actual time difference
    const actualTimeDiff = now.getTime() - this.lastKnownTime.getTime();

    // Detect if time jumped significantly (forward or backward)
    const timeJump = Math.abs(actualTimeDiff - expectedElapsed);

    if (timeJump > this.threshold) {
      const detected = true;
      const timeDifference = actualTimeDiff - expectedElapsed;

      // Update last known time
      this.lastKnownTime = now;
      this.lastCheckTime = now;

      return {
        detected,
        timeDifference,
        previousTime: this.lastKnownTime,
        currentTime: now,
      };
    }

    // No significant change detected
    this.lastCheckTime = now;
    return {
      detected: false,
      timeDifference: 0,
      previousTime: this.lastKnownTime,
      currentTime: now,
    };
  }

  /**
   * Reset the detector (useful when shift starts)
   */
  reset(): void {
    this.lastKnownTime = new Date();
    this.lastCheckTime = new Date();
  }

  /**
   * Get formatted time difference message
   */
  static formatTimeDifference(ms: number): string {
    const absMs = Math.abs(ms);
    const seconds = Math.floor(absMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
