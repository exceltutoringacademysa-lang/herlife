/**
 * HerLife identity is fixed. Private recipient details must not appear on public screens,
 * notification previews, URLs or share metadata.
 */
export const BRAND = Object.freeze({
  appName: 'HerLife',
  tagline: 'Grow in grace. Live with purpose. Build your future.',
  ownerFirstName: 'Anelisa',
  developerCredit: 'Developed by Andzani Mashabana',
  currency: 'ZAR',
  defaultQuietTime: '06:00',
} as const);

/** These references are a reading guide, not licensed Bible verse quotations. */
export const WEEKLY_READING_REFERENCES = [
  'Psalm 23',
  'Proverbs 3:1–12',
  'Matthew 6:25–34',
  'Philippians 4:4–9',
  'Psalm 121',
  'Romans 12:9–21',
  'Isaiah 40:28–31',
] as const;
