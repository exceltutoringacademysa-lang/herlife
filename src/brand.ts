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

/** Daily readings rotate through the 66-book Bible rather than repeating a weekly list.
 * The selection changes with each calendar date (local time) and is the same
 * each time the app opens during that day. These are references, not text.
 */
const READING_BOOKS = [
  ['Genesis',50],['Exodus',40],['Leviticus',27],['Numbers',36],['Deuteronomy',34],['Joshua',24],['Judges',21],['Ruth',4],['1 Samuel',31],['2 Samuel',24],['1 Kings',22],['2 Kings',25],['1 Chronicles',29],['2 Chronicles',36],['Ezra',10],['Nehemiah',13],['Esther',10],['Job',42],['Psalms',150],['Proverbs',31],['Ecclesiastes',12],['Song of Solomon',8],['Isaiah',66],['Jeremiah',52],['Lamentations',5],['Ezekiel',48],['Daniel',12],['Hosea',14],['Joel',3],['Amos',9],['Obadiah',1],['Jonah',4],['Micah',7],['Nahum',3],['Habakkuk',3],['Zephaniah',3],['Haggai',2],['Zechariah',14],['Malachi',4],
  ['Matthew',28],['Mark',16],['Luke',24],['John',21],['Acts',28],['Romans',16],['1 Corinthians',16],['2 Corinthians',13],['Galatians',6],['Ephesians',6],['Philippians',4],['Colossians',4],['1 Thessalonians',5],['2 Thessalonians',3],['1 Timothy',6],['2 Timothy',4],['Titus',3],['Philemon',1],['Hebrews',13],['James',5],['1 Peter',5],['2 Peter',3],['1 John',5],['2 John',1],['3 John',1],['Jude',1],['Revelation',22]
] as const;
export function dailyReadingReference(date=new Date()):string {
  const day=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
  const book=READING_BOOKS[(day*13+7)%READING_BOOKS.length];
  const chapter=((day*7+19)%book[1])+1;
  return book[0]+' '+chapter;
}
