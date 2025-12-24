import { describe, it, expect } from 'vitest';
import {
  formatResponseTime,
  formatNumber,
  formatBytes,
  formatPercentage,
  formatMetricsBreakdown,
} from '../../../src/utils/formatting.js';

describe('formatting utilities', () => {
  describe('formatResponseTime', () => {
    it('should format milliseconds', () => {
      expect(formatResponseTime(150)).toBe('150ms');
      expect(formatResponseTime(0)).toBe('0ms');
      expect(formatResponseTime(999)).toBe('999ms');
    });

    it('should round milliseconds', () => {
      expect(formatResponseTime(150.6)).toBe('151ms');
      expect(formatResponseTime(150.4)).toBe('150ms');
    });

    it('should format seconds', () => {
      expect(formatResponseTime(1000)).toBe('1.00s');
      expect(formatResponseTime(1500)).toBe('1.50s');
      expect(formatResponseTime(2000)).toBe('2.00s');
    });

    it('should format minutes', () => {
      expect(formatResponseTime(60000)).toBe('1.00min');
      expect(formatResponseTime(90000)).toBe('1.50min');
      expect(formatResponseTime(120000)).toBe('2.00min');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with locale separators', () => {
      // toLocaleString behavior varies by locale, so we check it's a string
      expect(typeof formatNumber(1000)).toBe('string');
      expect(typeof formatNumber(1000000)).toBe('string');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(2048)).toBe('2.00 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(512 * 1024 * 1024)).toBe('512.00 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB');
    });
  });

  describe('formatPercentage', () => {
    it('should format with default 1 decimal', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.333)).toBe('33.3%');
    });

    it('should format with custom decimals', () => {
      expect(formatPercentage(50, 0)).toBe('50%');
      expect(formatPercentage(33.333, 2)).toBe('33.33%');
      expect(formatPercentage(100, 3)).toBe('100.000%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('formatMetricsBreakdown', () => {
    it('should format metrics breakdown as string', () => {
      const metrics = {
        total: 1000,
        db: 600,
        compute: 300,
        http: 0,
        wait: 50,
        async: 50,
        email: 0,
      };

      const result = formatMetricsBreakdown(metrics);
      expect(typeof result).toBe('string');
      expect(result).toContain('Total: 1.00s');
      expect(result).toContain('DB: 600ms');
      expect(result).toContain('Compute: 300ms');
      expect(result).toContain('Wait: 50ms');
      expect(result).toContain('Async: 50ms');
      // HTTP and Email are 0, so they shouldn't appear
      expect(result).not.toContain('HTTP');
      expect(result).not.toContain('Email');
    });

    it('should handle empty metrics', () => {
      const result = formatMetricsBreakdown({});
      expect(result).toBe('');
    });

    it('should only show non-zero values', () => {
      const metrics = {
        total: 500,
        db: 0,
        compute: 0,
      };

      const result = formatMetricsBreakdown(metrics);
      expect(result).toBe('Total: 500ms');
    });

    it('should include email time when non-zero', () => {
      const metrics = {
        total: 1000,
        db: 200,
        compute: 300,
        email: 400,
      };

      const result = formatMetricsBreakdown(metrics);
      expect(result).toContain('Email: 400ms');
    });
  });
});
