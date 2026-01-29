"use client";
import { useTherapistSearch } from "@/lib/hooks/useTherapistSearch";

export default function ResultsPageSimple() {
  const { results, loading, error, validation, retry } = useTherapistSearch();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seafoam-600 mx-auto mb-4"></div>
          <p className="text-seafoam-600 text-lg">Načítám výsledky...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-seafoam-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-600">Chyba při vyhledávání</h1>
            </div>
            <p className="text-red-500 mb-4">{error}</p>
            
            {validation && !validation.isValid && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-700 mb-2">Validation Errors:</h3>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  {validation.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={retry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-seafoam-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-seafoam-900 mb-2">
            Výsledky vyhledávání
          </h1>
          <p className="text-seafoam-600">
            Našli jsme {results?.total || 0} terapeutů
            {results?.fallbackUsed && (
              <span className="ml-2 text-amber-600">
                (rozšířené vyhledávání)
              </span>
            )}
          </p>
        </div>

        {validation && validation.warnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="font-semibold text-yellow-800 mb-2">Upozornění:</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              {validation.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl border border-seafoam-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-seafoam-900 mb-4">
              Raw API Response
            </h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(results?.meta ?? results, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
