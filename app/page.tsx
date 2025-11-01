'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ReconciliationResults from '@/components/ReconciliationResults';
import { parseStatementCSV, parseLedgerCSV } from '@/lib/csvParser';
import { reconcile } from '@/lib/matcher';
import { StatementTransaction, LedgerTransaction, ReconciliationResult } from '@/lib/types';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [statements, setStatements] = useState<StatementTransaction[]>([]);
  const [ledgers, setLedgers] = useState<LedgerTransaction[]>([]);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [statementFileName, setStatementFileName] = useState<string>('');
  const [ledgerFileName, setLedgerFileName] = useState<string>('');

  const handleStatementUpload = async (file: File) => {
    setLoading(true);
    setErrors([]);
    setStatementFileName(file.name);

    const { data, errors: parseErrors } = await parseStatementCSV(file);

    if (parseErrors.length > 0) {
      setErrors(prev => [...prev, ...parseErrors]);
    }

    setStatements(data);
    setLoading(false);

    // Auto-reconcile if both files are uploaded
    if (data.length > 0 && ledgers.length > 0) {
      performReconciliation(data, ledgers);
    }
  };

  const handleLedgerUpload = async (file: File) => {
    setLoading(true);
    setErrors([]);
    setLedgerFileName(file.name);

    const { data, errors: parseErrors } = await parseLedgerCSV(file);

    if (parseErrors.length > 0) {
      setErrors(prev => [...prev, ...parseErrors]);
    }

    setLedgers(data);
    setLoading(false);

    // Auto-reconcile if both files are uploaded
    if (statements.length > 0 && data.length > 0) {
      performReconciliation(statements, data);
    }
  };

  const performReconciliation = (stmts: StatementTransaction[], ldgrs: LedgerTransaction[]) => {
    setLoading(true);
    setTimeout(() => {
      const reconciliationResult = reconcile(stmts, ldgrs);
      setResult(reconciliationResult);
      setLoading(false);
    }, 500);
  };

  const handleReconcile = () => {
    if (statements.length > 0 && ledgers.length > 0) {
      performReconciliation(statements, ledgers);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Reconciliation Engine</h1>
              <p className="text-sm text-gray-600 mt-1">AI-powered transaction matching with fuzzy logic and aggregation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Errors during parsing:</h3>
                <ul className="mt-2 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!result && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Transaction Files</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <FileUpload
                  label="Upload Statement CSV"
                  onFileSelect={handleStatementUpload}
                />
                {statementFileName && (
                  <p className="mt-2 text-sm text-gray-600">
                    ✓ {statementFileName} ({statements.length} transactions)
                  </p>
                )}
              </div>

              <div>
                <FileUpload
                  label="Upload Ledger CSV"
                  onFileSelect={handleLedgerUpload}
                />
                {ledgerFileName && (
                  <p className="mt-2 text-sm text-gray-600">
                    ✓ {ledgerFileName} ({ledgers.length} transactions)
                  </p>
                )}
              </div>
            </div>

            {statements.length > 0 && ledgers.length > 0 && !loading && (
              <button
                onClick={handleReconcile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Run Reconciliation
              </button>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {/* CSV Format Guide */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">CSV Format Requirements</h3>
              <p className="text-xs text-gray-600 mb-2">
                Both files should have the following columns:
              </p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>date</strong> - Transaction date (YYYY-MM-DD or DD/MM/YYYY)</li>
                <li><strong>description</strong> - Transaction description</li>
                <li><strong>amount</strong> - Transaction amount (numbers only or with R symbol)</li>
                <li><strong>type</strong> - Transaction type (debit or credit)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && !loading && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reconciliation Results</h2>
              <button
                onClick={() => {
                  setResult(null);
                  setStatements([]);
                  setLedgers([]);
                  setStatementFileName('');
                  setLedgerFileName('');
                  setErrors([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            </div>

            <ReconciliationResults
              result={result}
              statements={statements}
              ledgers={ledgers}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            Smart Reconciliation Engine - Powered by AI matching algorithms
          </p>
        </div>
      </div>
    </div>
  );
}
