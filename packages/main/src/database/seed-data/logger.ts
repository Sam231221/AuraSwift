/**
 * Simple logger for seed-data CLI scripts
 * Works in both Electron and standalone Node.js contexts
 */

interface Logger {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

/**
 * Create a simple console-based logger for CLI scripts
 * This avoids Electron dependencies that break when running with tsx
 */
export function getLogger(service: string): Logger {
  const prefix = `[${service}]`;

  return {
    info: (...args: any[]) => console.log(prefix, ...args),
    error: (...args: any[]) => console.error(prefix, ...args),
    warn: (...args: any[]) => console.warn(prefix, ...args),
    debug: (...args: any[]) => console.debug(prefix, ...args),
  };
}
