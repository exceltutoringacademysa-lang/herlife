import { describe, expect, it } from 'vitest';
import { localISODate, calendarMonthGrid } from '../src/lib/dates';

describe('date and month planning', () => {
  it('produces locale-independent YYYY-MM-DD dates', () => {
    expect(localISODate(new Date(2026, 9, 13))).toBe('2026-10-13');
  });
  it('places Monday first and includes leap day', () => {
    const grid = calendarMonthGrid(2024, 1);
    expect(grid).toHaveLength(42);
    expect(grid[0].iso).toBe('2024-01-29');
    expect(grid.some((day) => day.iso === '2024-02-29' && day.currentMonth)).toBe(true);
  });
  it('starts October 2026 with the preceding Monday', () => {
    expect(calendarMonthGrid(2026, 9)[0].iso).toBe('2026-09-28');
  });
});
