import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStartTime, getEndTime, formatTimestamp, parseDuration } from '../../../src/utils/date.js';

describe('date utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getStartTime', () => {
    it('should return timestamp from 1 hour ago by default', () => {
      const result = getStartTime();
      const expected = Date.now() - 60 * 60 * 1000;
      expect(result).toBe(expected);
    });

    it('should return timestamp from specified hours ago', () => {
      const result = getStartTime(24);
      const expected = Date.now() - 24 * 60 * 60 * 1000;
      expect(result).toBe(expected);
    });

    it('should handle fractional hours', () => {
      const result = getStartTime(0.5);
      const expected = Date.now() - 0.5 * 60 * 60 * 1000;
      expect(result).toBe(expected);
    });
  });

  describe('getEndTime', () => {
    it('should return current timestamp', () => {
      const result = getEndTime();
      expect(result).toBe(Date.now());
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to ISO string', () => {
      const timestamp = new Date('2024-01-15T12:00:00.000Z').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toBe('2024-01-15T12:00:00.000Z');
    });

    it('should handle different timestamps', () => {
      const timestamp = new Date('2023-06-20T08:30:45.123Z').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toBe('2023-06-20T08:30:45.123Z');
    });
  });

  describe('parseDuration', () => {
    it('should parse minutes', () => {
      expect(parseDuration('30m')).toBe(30 * 60 * 1000);
      expect(parseDuration('1m')).toBe(60 * 1000);
    });

    it('should parse hours', () => {
      expect(parseDuration('1h')).toBe(60 * 60 * 1000);
      expect(parseDuration('24h')).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse days', () => {
      expect(parseDuration('1d')).toBe(24 * 60 * 60 * 1000);
      expect(parseDuration('7d')).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should throw error for invalid format', () => {
      expect(() => parseDuration('invalid')).toThrow('Invalid duration format');
      expect(() => parseDuration('10')).toThrow('Invalid duration format');
      expect(() => parseDuration('h')).toThrow('Invalid duration format');
      expect(() => parseDuration('')).toThrow('Invalid duration format');
    });
  });
});
