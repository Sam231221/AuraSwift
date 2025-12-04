/**
 * Terminal Cache for Viva Wallet terminals
 * Caches discovered terminals with expiration and persistence
 */

import { getLogger } from "../../utils/logger.js";
import type { Terminal } from "./types.js";

const logger = getLogger("TerminalCache");

// =============================================================================
// TERMINAL CACHE
// =============================================================================

interface CachedTerminal extends Terminal {
  cachedAt: Date;
  expiresAt: Date;
}

export class TerminalCache {
  private cache: Map<string, CachedTerminal> = new Map();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour default TTL

  /**
   * Store terminal in cache
   */
  set(terminal: Terminal, ttl?: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || this.DEFAULT_TTL));

    this.cache.set(terminal.id, {
      ...terminal,
      cachedAt: now,
      expiresAt,
    });

    logger.debug(
      `Cached terminal: ${terminal.id} (expires at ${expiresAt.toISOString()})`
    );
  }

  /**
   * Get terminal from cache
   */
  get(terminalId: string): Terminal | null {
    const cached = this.cache.get(terminalId);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(terminalId);
      logger.debug(`Terminal cache expired: ${terminalId}`);
      return null;
    }

    return {
      id: cached.id,
      name: cached.name,
      ipAddress: cached.ipAddress,
      port: cached.port,
      status: cached.status,
      firmwareVersion: cached.firmwareVersion,
      capabilities: cached.capabilities,
      lastSeen: cached.lastSeen,
      connectionType: cached.connectionType,
      terminalType: cached.terminalType,
      deviceInfo: cached.deviceInfo,
      paymentCapabilities: cached.paymentCapabilities,
      apiKey: cached.apiKey,
    };
  }

  /**
   * Get all cached terminals (non-expired)
   */
  getAll(): Terminal[] {
    const terminals: Terminal[] = [];
    const now = new Date();

    for (const [id, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(id);
        continue;
      }

      terminals.push({
        id: cached.id,
        name: cached.name,
        ipAddress: cached.ipAddress,
        port: cached.port,
        status: cached.status,
        firmwareVersion: cached.firmwareVersion,
        capabilities: cached.capabilities,
        lastSeen: cached.lastSeen,
        connectionType: cached.connectionType,
        terminalType: cached.terminalType,
        deviceInfo: cached.deviceInfo,
        paymentCapabilities: cached.paymentCapabilities,
        apiKey: cached.apiKey,
      });
    }

    return terminals;
  }

  /**
   * Update terminal in cache
   */
  update(terminalId: string, updates: Partial<Terminal>): boolean {
    const cached = this.cache.get(terminalId);

    if (!cached) {
      return false;
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(terminalId);
      return false;
    }

    // Update cached terminal
    this.cache.set(terminalId, {
      ...cached,
      ...updates,
      lastSeen: new Date(),
      cachedAt: cached.cachedAt, // Keep original cache time
      expiresAt: cached.expiresAt, // Keep original expiration
    });

    return true;
  }

  /**
   * Remove terminal from cache
   */
  delete(terminalId: string): boolean {
    return this.cache.delete(terminalId);
  }

  /**
   * Clear all cached terminals
   */
  clear(): void {
    this.cache.clear();
    logger.info("Terminal cache cleared");
  }

  /**
   * Clear expired terminals
   */
  clearExpired(): number {
    const now = new Date();
    let cleared = 0;

    for (const [id, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.debug(`Cleared ${cleared} expired terminal(s) from cache`);
    }

    return cleared;
  }

  /**
   * Check if terminal is cached (and not expired)
   */
  has(terminalId: string): boolean {
    const cached = this.cache.get(terminalId);

    if (!cached) {
      return false;
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(terminalId);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; expired: number; active: number } {
    const now = new Date();
    let expired = 0;
    let active = 0;

    for (const cached of this.cache.values()) {
      if (now > cached.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      expired,
      active,
    };
  }
}
