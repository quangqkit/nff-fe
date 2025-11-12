import {
  formatDate,
  formatCurrency,
  formatFileSize,
  truncateText,
  capitalizeFirst,
  formatStatus,
} from '../format';

describe('format utilities', () => {
  describe('formatDate', () => {
    it('formats valid date string', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024');
    });

    it('formats Date object', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('returns dash for null/undefined', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
    });

    it('uses custom format', () => {
      expect(formatDate('2024-01-15', 'yyyy-MM-dd')).toBe('2024-01-15');
    });
  });

  describe('formatCurrency', () => {
    it('formats VND currency', () => {
      expect(formatCurrency(1000000)).toContain('1.000.000');
    });

    it('returns dash for null/undefined', () => {
      expect(formatCurrency(null)).toBe('-');
      expect(formatCurrency(undefined)).toBe('-');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(0)).toBe('0 Bytes');
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long ...');
    });

    it('returns original text if within limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('Hello');
    });

    it('handles empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });
  });

  describe('formatStatus', () => {
    it('formats known statuses', () => {
      expect(formatStatus('draft')).toBe('Bản nháp');
      expect(formatStatus('published')).toBe('Đã xuất bản');
    });

    it('capitalizes unknown statuses', () => {
      expect(formatStatus('unknown')).toBe('Unknown');
    });
  });
});
