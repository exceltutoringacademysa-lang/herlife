/** All cash-flow arithmetic is performed in integer cents to avoid floating-point drift. */
export type MoneyRecord = { value: number };

export function parseTransactionAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 9_999_999_999.99) return null;
  return Math.round(amount * 100) / 100;
}

export function calculateNetCashFlow(transactions: ReadonlyArray<MoneyRecord>): number {
  const totalCents = transactions.reduce((total, row) => {
    if (!Number.isFinite(row.value)) throw new Error('Invalid transaction amount');
    return total + Math.round(row.value * 100);
  }, 0);
  if (!Number.isSafeInteger(totalCents)) throw new Error('Cash-flow total exceeds safe precision');
  return totalCents / 100;
}
