import levenshtein from 'fast-levenshtein';
import { Transaction, StatementTransaction, LedgerTransaction, Match, ReconciliationResult } from './types';

const DATE_TOLERANCE_DAYS = 3;
const FUZZY_MATCH_THRESHOLD = 0.8;
const AGGREGATE_DATE_WINDOW_DAYS = 7;

export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshtein.get(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

export function isDateWithinTolerance(date1: Date, date2: Date, toleranceDays: number = DATE_TOLERANCE_DAYS): boolean {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  const daysDiff = diff / (1000 * 60 * 60 * 24);
  return daysDiff <= toleranceDays;
}

export function findExactMatches(
  statements: StatementTransaction[],
  ledgers: LedgerTransaction[]
): Match[] {
  const matches: Match[] = [];
  const usedStatements = new Set<string>();
  const usedLedgers = new Set<string>();

  for (const statement of statements) {
    if (usedStatements.has(statement.id)) continue;

    for (const ledger of ledgers) {
      if (usedLedgers.has(ledger.id)) continue;

      // Check exact match: date, amount, and description similarity
      if (
        isDateWithinTolerance(statement.date, ledger.date) &&
        Math.abs(statement.amount - ledger.amount) < 0.01 &&
        calculateSimilarity(
          statement.normalizedDescription || statement.description,
          ledger.normalizedDescription || ledger.description
        ) >= FUZZY_MATCH_THRESHOLD
      ) {
        matches.push({
          statementIds: [statement.id],
          ledgerId: ledger.id,
          matchType: 'exact',
          score: 1.0,
          confidence: 'high',
        });

        usedStatements.add(statement.id);
        usedLedgers.add(ledger.id);
        break;
      }
    }
  }

  return matches;
}

export function findFuzzyMatches(
  statements: StatementTransaction[],
  ledgers: LedgerTransaction[],
  usedStatements: Set<string>,
  usedLedgers: Set<string>
): Match[] {
  const matches: Match[] = [];

  for (const statement of statements) {
    if (usedStatements.has(statement.id)) continue;

    let bestMatch: { ledger: LedgerTransaction; score: number } | null = null;

    for (const ledger of ledgers) {
      if (usedLedgers.has(ledger.id)) continue;

      // Check fuzzy match
      if (
        isDateWithinTolerance(statement.date, ledger.date, DATE_TOLERANCE_DAYS * 2) &&
        Math.abs(statement.amount - ledger.amount) < 0.01
      ) {
        const descriptionScore = calculateSimilarity(
          statement.normalizedDescription || statement.description,
          ledger.normalizedDescription || ledger.description
        );

        if (descriptionScore >= 0.6 && (!bestMatch || descriptionScore > bestMatch.score)) {
          bestMatch = { ledger, score: descriptionScore };
        }
      }
    }

    if (bestMatch && bestMatch.score >= 0.6) {
      matches.push({
        statementIds: [statement.id],
        ledgerId: bestMatch.ledger.id,
        matchType: 'fuzzy',
        score: bestMatch.score,
        confidence: bestMatch.score >= 0.8 ? 'high' : bestMatch.score >= 0.7 ? 'medium' : 'low',
      });

      usedStatements.add(statement.id);
      usedLedgers.add(bestMatch.ledger.id);
    }
  }

  return matches;
}

export function findAggregateMatches(
  statements: StatementTransaction[],
  ledgers: LedgerTransaction[],
  usedStatements: Set<string>,
  usedLedgers: Set<string>
): Match[] {
  const matches: Match[] = [];

  // Get unmatched transactions
  const unmatchedStatements = statements.filter(s => !usedStatements.has(s.id));
  const unmatchedLedgers = ledgers.filter(l => !usedLedgers.has(l.id));

  // For each ledger transaction, try to find a combination of statement transactions
  for (const ledger of unmatchedLedgers) {
    if (usedLedgers.has(ledger.id)) continue;

    // Find statements within date window
    const candidateStatements = unmatchedStatements.filter(
      s => !usedStatements.has(s.id) &&
           isDateWithinTolerance(s.date, ledger.date, AGGREGATE_DATE_WINDOW_DAYS)
    );

    if (candidateStatements.length < 2) continue;

    // Try to find combinations that sum to the ledger amount
    const combination = findSumCombination(
      candidateStatements.map(s => ({ id: s.id, amount: s.amount })),
      ledger.amount
    );

    if (combination.length > 0) {
      matches.push({
        statementIds: combination,
        ledgerId: ledger.id,
        matchType: 'aggregate',
        score: 0.9,
        confidence: 'high',
      });

      combination.forEach(id => usedStatements.add(id));
      usedLedgers.add(ledger.id);
    }
  }

  return matches;
}

function findSumCombination(
  items: { id: string; amount: number }[],
  targetSum: number,
  tolerance: number = 0.01
): string[] {
  // Try all possible combinations using backtracking
  const result: string[] = [];

  function backtrack(start: number, currentSum: number, currentIds: string[]) {
    if (Math.abs(currentSum - targetSum) < tolerance) {
      result.push(...currentIds);
      return true;
    }

    if (start >= items.length || currentSum > targetSum + tolerance) {
      return false;
    }

    for (let i = start; i < items.length; i++) {
      if (backtrack(i + 1, currentSum + items[i].amount, [...currentIds, items[i].id])) {
        return true;
      }
    }

    return false;
  }

  backtrack(0, 0, []);
  return result;
}

export function reconcile(
  statements: StatementTransaction[],
  ledgers: LedgerTransaction[]
): ReconciliationResult {
  const usedStatements = new Set<string>();
  const usedLedgers = new Set<string>();
  const allMatches: Match[] = [];

  // Step 1: Find exact matches
  const exactMatches = findExactMatches(statements, ledgers);
  exactMatches.forEach(match => {
    match.statementIds.forEach(id => usedStatements.add(id));
    usedLedgers.add(match.ledgerId);
  });
  allMatches.push(...exactMatches);

  // Step 2: Find fuzzy matches
  const fuzzyMatches = findFuzzyMatches(statements, ledgers, usedStatements, usedLedgers);
  fuzzyMatches.forEach(match => {
    match.statementIds.forEach(id => usedStatements.add(id));
    usedLedgers.add(match.ledgerId);
  });
  allMatches.push(...fuzzyMatches);

  // Step 3: Find aggregate matches
  const aggregateMatches = findAggregateMatches(statements, ledgers, usedStatements, usedLedgers);
  aggregateMatches.forEach(match => {
    match.statementIds.forEach(id => usedStatements.add(id));
    usedLedgers.add(match.ledgerId);
  });
  allMatches.push(...aggregateMatches);

  // Calculate unmatched
  const unmatchedStatement = statements.filter(s => !usedStatements.has(s.id));
  const unmatchedLedger = ledgers.filter(l => !usedLedgers.has(l.id));

  return {
    matches: allMatches,
    unmatchedStatement,
    unmatchedLedger,
    stats: {
      totalStatement: statements.length,
      totalLedger: ledgers.length,
      matched: allMatches.length,
      unmatchedStatement: unmatchedStatement.length,
      unmatchedLedger: unmatchedLedger.length,
      matchRate: (allMatches.length / Math.max(statements.length, ledgers.length)) * 100,
    },
  };
}
