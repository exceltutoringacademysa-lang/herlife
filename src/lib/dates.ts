export function localISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type CalendarDay = { iso: string; day: number; currentMonth: boolean };

export function calendarMonthGrid(year: number, monthIndex: number): CalendarDay[] {
  const monthStart = new Date(year, monthIndex, 1);
  const weekOffset = (monthStart.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1 - weekOffset);
    return { iso: localISODate(date), day: date.getDate(), currentMonth: date.getMonth() === monthStart.getMonth() };
  });
}
