type GtagArgs = [command: string, action: string, params?: Record<string, unknown>];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, params);
}

