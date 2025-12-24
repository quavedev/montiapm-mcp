/**
 * Get Unix timestamp for a time in the past
 * @param hoursAgo - Number of hours ago (default: 1)
 * @returns Unix timestamp in milliseconds
 */
export function getStartTime(hoursAgo: number = 1): number {
  return Date.now() - hoursAgo * 60 * 60 * 1000;
}

/**
 * Get Unix timestamp for now
 * @returns Unix timestamp in milliseconds
 */
export function getEndTime(): number {
  return Date.now();
}

/**
 * Format a Unix timestamp to a human-readable date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Parse a duration string (e.g., "1h", "30m", "1d") to milliseconds
 * @param duration - Duration string
 * @returns Duration in milliseconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(m|h|d)$/);
  if (!match) {
    throw new Error(
      `Invalid duration format: ${duration}. Use format like "1h", "30m", or "1d"`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}
