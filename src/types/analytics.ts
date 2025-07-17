// src/utils/analytics.ts
export type AnalyticsEvent = Record<string, unknown> & { event: string };

/**
 * Safe push to dataLayer. Creates it if missing.
 */
export function pushToDataLayer(evt: AnalyticsEvent) {
    if (typeof window === 'undefined') return;
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push(evt);
}

/**
 * Fire a DOM CustomEvent so CTM (or any listener) can react.
 */
export function fireCustomEvent(name: string, detail?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(name, { detail }));
}
