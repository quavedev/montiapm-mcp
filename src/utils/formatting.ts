/**
 * Format response time in milliseconds to a human-readable string
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}min`;
  }
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format trace metrics breakdown for display
 */
export function formatMetricsBreakdown(metrics: {
  total?: number;
  wait?: number;
  db?: number;
  compute?: number;
  http?: number;
  email?: number;
  async?: number;
}): string {
  const parts: string[] = [];

  if (metrics.total !== undefined) {
    parts.push(`Total: ${formatResponseTime(metrics.total)}`);
  }
  if (metrics.db !== undefined && metrics.db > 0) {
    parts.push(`DB: ${formatResponseTime(metrics.db)}`);
  }
  if (metrics.compute !== undefined && metrics.compute > 0) {
    parts.push(`Compute: ${formatResponseTime(metrics.compute)}`);
  }
  if (metrics.http !== undefined && metrics.http > 0) {
    parts.push(`HTTP: ${formatResponseTime(metrics.http)}`);
  }
  if (metrics.wait !== undefined && metrics.wait > 0) {
    parts.push(`Wait: ${formatResponseTime(metrics.wait)}`);
  }
  if (metrics.async !== undefined && metrics.async > 0) {
    parts.push(`Async: ${formatResponseTime(metrics.async)}`);
  }
  if (metrics.email !== undefined && metrics.email > 0) {
    parts.push(`Email: ${formatResponseTime(metrics.email)}`);
  }

  return parts.join(', ');
}
