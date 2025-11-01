'use client';

import { ReconciliationResult, StatementTransaction, LedgerTransaction } from '@/lib/types';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface ReconciliationResultsProps {
  result: ReconciliationResult;
  statements: StatementTransaction[];
  ledgers: LedgerTransaction[];
}

export default function ReconciliationResults({ result, statements, ledgers }: ReconciliationResultsProps) {
  const getStatementById = (id: string) => statements.find(s => s.id === id);
  const getLedgerById = (id: string) => ledgers.find(l => l.id === id);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact': return 'Exact Match';
      case 'fuzzy': return 'Fuzzy Match';
      case 'aggregate': return 'Aggregate Match';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Match Rate</p>
              <p className="text-2xl font-bold text-gray-900">{result.stats.matchRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Matched</p>
              <p className="text-2xl font-bold text-gray-900">{result.stats.matched}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Unmatched</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.stats.unmatchedStatement + result.stats.unmatchedLedger}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-green-50 border-b border-green-200">
          <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Matched Transactions ({result.matches.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {result.matches.map((match, index) => {
            const ledger = getLedgerById(match.ledgerId);
            const statementTxns = match.statementIds.map(id => getStatementById(id)).filter(Boolean);

            return (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.confidence)}`}>
                      {match.confidence}
                    </span>
                    <span className="text-xs text-gray-500">{getMatchTypeLabel(match.matchType)}</span>
                    <span className="text-xs text-gray-400">Score: {(match.score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Statement Side */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Statement</p>
                    {statementTxns.map((stmt, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-gray-900">{stmt?.description}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-600">{stmt?.date.toLocaleDateString()}</p>
                          <p className="text-sm font-semibold text-blue-600">R {stmt?.amount.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {match.statementIds.length > 1 && (
                      <div className="flex justify-end pr-3">
                        <p className="text-sm font-bold text-blue-700">
                          Total: R {statementTxns.reduce((sum, stmt) => sum + (stmt?.amount || 0), 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ledger Side */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Ledger</p>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-gray-900">{ledger?.description}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-600">{ledger?.date.toLocaleDateString()}</p>
                        <p className="text-sm font-semibold text-green-600">R {ledger?.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unmatched Statement Transactions */}
      {result.unmatchedStatement.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Unmatched Statement Transactions ({result.unmatchedStatement.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {result.unmatchedStatement.map((stmt, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stmt.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{stmt.date.toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">R {stmt.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched Ledger Transactions */}
      {result.unmatchedLedger.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Unmatched Ledger Transactions ({result.unmatchedLedger.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {result.unmatchedLedger.map((ledger, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ledger.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{ledger.date.toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">R {ledger.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
