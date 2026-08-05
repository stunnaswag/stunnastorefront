import { describe, expect, it } from 'vitest';
import { getAnalyticsDayKey, formatAnalyticsDayLabel } from './analyticsDateUtils';

describe('analytics date bucketing', () => {
  it('keeps UTC events in the correct calendar day across month edges', () => {
    expect(getAnalyticsDayKey('2026-07-31T23:30:00Z')).toBe('2026-07-31');
    expect(getAnalyticsDayKey('2026-08-01T00:30:00Z')).toBe('2026-08-01');
  });

  it('formats labels without drifting the day across month rollover', () => {
    expect(formatAnalyticsDayLabel('2026-07-31T23:30:00Z')).toBe('Jul 31');
    expect(formatAnalyticsDayLabel('2026-08-01T00:30:00Z')).toBe('Aug 1');
  });
});
