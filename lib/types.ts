export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  originalDescription?: string;
  normalizedDescription?: string;
}

export interface StatementTransaction extends Transaction {
  matched?: boolean;
  matchedLedgerId?: string;
  matchType?: 'exact' | 'fuzzy' | 'aggregate' | 'manual';
  matchScore?: number;
}

export interface LedgerTransaction extends Transaction {
  matched?: boolean;
  matchedStatementIds?: string[];
  matchType?: 'exact' | 'fuzzy' | 'aggregate' | 'manual';
  matchScore?: number;
}

export interface Match {
  statementIds: string[];
  ledgerId: string;
  matchType: 'exact' | 'fuzzy' | 'aggregate';
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ReconciliationResult {
  matches: Match[];
  unmatchedStatement: StatementTransaction[];
  unmatchedLedger: LedgerTransaction[];
  stats: {
    totalStatement: number;
    totalLedger: number;
    matched: number;
    unmatchedStatement: number;
    unmatchedLedger: number;
    matchRate: number;
  };
}
