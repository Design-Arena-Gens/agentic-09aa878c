import Papa from 'papaparse';
import { StatementTransaction, LedgerTransaction } from './types';
import { normalizeTransaction } from './normalizer';

export interface ParseResult<T> {
  data: T[];
  errors: string[];
}

export async function parseStatementCSV(file: File): Promise<ParseResult<StatementTransaction>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: StatementTransaction[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            const transaction: StatementTransaction = {
              id: `stmt-${Date.now()}-${index}`,
              date: new Date(row.date || row.Date || row.DATE),
              description: row.description || row.Description || row.DESCRIPTION || '',
              amount: parseFloat(row.amount || row.Amount || row.AMOUNT || '0'),
              type: (row.type || row.Type || row.TYPE || 'debit').toLowerCase() as 'debit' | 'credit',
            };

            const normalized = normalizeTransaction(transaction);
            data.push(normalized as StatementTransaction);
          } catch (error) {
            errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
          }
        });

        resolve({ data, errors });
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] });
      },
    });
  });
}

export async function parseLedgerCSV(file: File): Promise<ParseResult<LedgerTransaction>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: LedgerTransaction[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            const transaction: LedgerTransaction = {
              id: `ledger-${Date.now()}-${index}`,
              date: new Date(row.date || row.Date || row.DATE),
              description: row.description || row.Description || row.DESCRIPTION || '',
              amount: parseFloat(row.amount || row.Amount || row.AMOUNT || '0'),
              type: (row.type || row.Type || row.TYPE || 'debit').toLowerCase() as 'debit' | 'credit',
            };

            const normalized = normalizeTransaction(transaction);
            data.push(normalized as LedgerTransaction);
          } catch (error) {
            errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
          }
        });

        resolve({ data, errors });
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] });
      },
    });
  });
}
