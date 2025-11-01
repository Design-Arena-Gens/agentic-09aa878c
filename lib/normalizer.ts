import { Transaction } from './types';

// Common supplier name mappings
const SUPPLIER_MAPPINGS: Record<string, string> = {
  'pick n pay': 'Pick n Pay',
  'pnp': 'Pick n Pay',
  "pick'n pay": 'Pick n Pay',
  'picknpay': 'Pick n Pay',
  'woolworths': 'Woolworths',
  'woolies': 'Woolworths',
  'checkers': 'Checkers',
  'shoprite': 'Shoprite',
  'spar': 'Spar',
  'clicks': 'Clicks',
  'dischem': 'Dis-Chem',
  'dis-chem': 'Dis-Chem',
};

export function normalizeText(text: string): string {
  if (!text) return '';

  // Remove special characters and extra spaces
  let normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove common prefixes
  normalized = normalized
    .replace(/^(payment|payment to|transfer|transfer to|debit|credit)\s+/i, '')
    .trim();

  // Check for supplier mappings
  for (const [key, value] of Object.entries(SUPPLIER_MAPPINGS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return normalized;
}

export function normalizeAmount(amount: number | string): number {
  if (typeof amount === 'number') return Math.abs(amount);

  // Remove R symbol, spaces, and commas
  const cleaned = amount.toString()
    .replace(/[R\s,]/g, '')
    .trim();

  return Math.abs(parseFloat(cleaned) || 0);
}

export function normalizeDate(date: string | Date): Date {
  if (date instanceof Date) return date;

  // Try to parse various date formats
  const parsed = new Date(date);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try DD/MM/YYYY format
  const parts = date.split(/[\/\-]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  return new Date();
}

export function normalizeTransaction(transaction: Transaction): Transaction {
  return {
    ...transaction,
    date: normalizeDate(transaction.date),
    amount: normalizeAmount(transaction.amount),
    normalizedDescription: normalizeText(transaction.description),
    originalDescription: transaction.description,
  };
}
