/**
 * Mobile Developer Terminal Logger
 * Formats outgoing network calls and internal events with timestamps and visual tags
 * for easy filtering in the Metro bundler terminal and Android logcat.
 */
class AppLogger {
  private isDev = __DEV__;

  http(method: string, url: string, data?: any) {
    if (this.isDev) {
      const payload = data !== undefined ? ` | Body: ${JSON.stringify(data)}` : '';
      console.log(`[HTTP ${method.toUpperCase()}] ${url}${payload}`);
    }
  }

  httpSuccess(method: string, url: string, status: number, summary?: string) {
    if (this.isDev) {
      console.log(`[HTTP ${status}] ${method.toUpperCase()} ${url} ${summary ? `| ${summary}` : ''}`);
    }
  }

  httpError(method: string, url: string, status: number, errorMsg: string) {
    console.error(`[HTTP ${status}] ${method.toUpperCase()} ${url} - Error: ${errorMsg}`);
  }

  info(message: string, context?: any) {
    if (this.isDev) {
      const extra = context !== undefined ? ` | ${JSON.stringify(context)}` : '';
      console.log(`[INFO] ${message}${extra}`);
    }
  }

  error(message: string, error?: unknown) {
    console.error(`[ERROR] ${message}`, error);
  }
}

export const logger = new AppLogger();
