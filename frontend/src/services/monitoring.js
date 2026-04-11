import api from './api';

const isProduction = import.meta.env.PROD;

const VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

const getRating = (metric, value) => {
  const limits = VITAL_THRESHOLDS[metric];
  if (!limits) return 'unknown';
  if (value <= limits.good) return 'good';
  if (value <= limits.poor) return 'needs-improvement';
  return 'poor';
};

const emitTelemetry = async (endpoint, payload) => {
  if (!isProduction) {
    return;
  }

  try {
    await api.post(endpoint, {
      ...payload,
      href: window.location.href,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never interrupt UX because of telemetry failures.
  }
};

export const initializeErrorMonitoring = () => {
  if (!isProduction) {
    return;
  }

  window.addEventListener('error', (event) => {
    emitTelemetry('/telemetry/frontend-error', {
      name: event.error?.name || 'WindowError',
      message: event.error?.message || event.message || 'Unknown window error',
      stack: event.error?.stack,
      source: 'window.error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    emitTelemetry('/telemetry/frontend-error', {
      name: 'UnhandledPromiseRejection',
      message: event.reason?.message || String(event.reason || 'Unknown rejection'),
      stack: event.reason?.stack,
      source: 'window.unhandledrejection',
    });
  });

  window.addEventListener('app-error', (event) => {
    emitTelemetry('/telemetry/frontend-error', event.detail || {
      name: 'AppError',
      message: 'Unknown app error event',
      source: 'app-error',
    });
  });
};

export const initializeWebVitalsMonitoring = () => {
  if (!isProduction) {
    return;
  }

  const sendMetric = (metric, value) => {
    emitTelemetry('/telemetry/web-vitals', {
      metric,
      value,
      rating: getRating(metric, value),
    });
  };

  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry?.responseStart) {
    sendMetric('TTFB', Math.round(navigationEntry.responseStart));
  }

  if (typeof PerformanceObserver === 'undefined') {
    return;
  }

  let lcpValue = 0;
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      lcpValue = lastEntry.startTime;
    }
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

  let clsValue = 0;
  const clsObserver = new PerformanceObserver((entryList) => {
    entryList.getEntries().forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });

  const paintObserver = new PerformanceObserver((entryList) => {
    entryList.getEntries().forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        sendMetric('FCP', Math.round(entry.startTime));
      }
    });
  });
  paintObserver.observe({ type: 'paint', buffered: true });

  let maxInp = 0;
  const inpObserver = new PerformanceObserver((entryList) => {
    entryList.getEntries().forEach((entry) => {
      if (entry.duration > maxInp) {
        maxInp = entry.duration;
      }
    });
  });
  inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });

  const flushMetrics = () => {
    if (lcpValue > 0) {
      sendMetric('LCP', Math.round(lcpValue));
    }
    if (clsValue > 0) {
      sendMetric('CLS', Number(clsValue.toFixed(4)));
    }
    if (maxInp > 0) {
      sendMetric('INP', Math.round(maxInp));
    }
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushMetrics();
    }
  });
};
