const isDev = import.meta.env.DEV;

function sanitizeError(error: unknown): string {
  if (isDev) return String(error);
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export const logger = {
  error(message: string, ...args: unknown[]) {
    if (isDev) {
      console.error(message, ...args);
    } else {
      console.error(message);
    }
  },
  warn(message: string, ...args: unknown[]) {
    if (isDev) {
      console.warn(message, ...args);
    }
  },
  info(message: string, ...args: unknown[]) {
    if (isDev) {
      console.info(message, ...args);
    }
  },
  debug(message: string, ...args: unknown[]) {
    if (isDev) {
      console.debug(message, ...args);
    }
  },
};

export { sanitizeError };
