/**
 * Scanner Audio Feedback Utility
 * Provides audio feedback for barcode scanner operations
 * Based on real supermarket POS requirements
 */

export class ScannerAudio {
  private static audioContext: AudioContext | null = null;
  private static isEnabled = true;

  /**
   * Initialize audio context (call this once on user interaction)
   */
  static async init(): Promise<void> {
    try {
      if (!this.audioContext) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }

      // Resume context if suspended (required by browser autoplay policies)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    } catch (error) {
      logger.warn("Failed to initialize audio context:", error);
      this.isEnabled = false;
    }
  }

  /**
   * Play scanner beep sound
   * @param type - Type of beep: success, error, or warning
   */
  static async playBeep(
    type: "success" | "error" | "warning" = "success"
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await this.init();
      if (!this.audioContext) return;

      // Create oscillator for beep sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure sound based on type
      let frequency: number;
      let duration: number;
      let volume: number;

      switch (type) {
        case "success":
          frequency = 800; // High pitch for success
          duration = 0.15;
          volume = 0.3;
          break;
        case "error":
          frequency = 300; // Low pitch for error
          duration = 0.4;
          volume = 0.4;
          break;
        case "warning":
          frequency = 600; // Medium pitch for warning
          duration = 0.2;
          volume = 0.35;
          break;
      }

      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );
      oscillator.type = "sine";

      // Create envelope (attack and decay)
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      // For error sound, add a second lower tone
      if (type === "error") {
        setTimeout(() => {
          this.playSecondaryErrorTone();
        }, 150);
      }
    } catch (error) {
      logger.warn("Failed to play beep sound:", error);
      // Fallback to system beep if available
      this.playFallbackBeep();
    }
  }

  /**
   * Play secondary error tone for double beep effect
   */
  private static async playSecondaryErrorTone(): Promise<void> {
    try {
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(250, this.audioContext.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      logger.warn("Failed to play secondary error tone:", error);
    }
  }

  /**
   * Fallback beep using HTML5 Audio API
   */
  private static playFallbackBeep(): void {
    try {
      // Create a simple beep using data URL
      const beepUrl =
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUZBzuVy/DDeigJK3vE9N2OPAoTPajc9qNDBgxOqOHrTr";
      const audio = new Audio(beepUrl);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silent fallback failure
      });
    } catch {
      // Silent fallback failure
    }
  }

  /**
   * Play success beep (shorthand)
   */
  static success(): Promise<void> {
    return this.playBeep("success");
  }

  /**
   * Play error beep (shorthand)
   */
  static error(): Promise<void> {
    return this.playBeep("error");
  }

  /**
   * Play warning beep (shorthand)
   */
  static warning(): Promise<void> {
    return this.playBeep("warning");
  }

  /**
   * Enable/disable audio feedback
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  static getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Test audio functionality
   */
  static async test(): Promise<void> {
    logger.info("Testing scanner audio...");
    await this.success();
    setTimeout(async () => {
      await this.warning();
    }, 300);
    setTimeout(async () => {
      await this.error();
    }, 600);
  }
}
