import React, { useState, useEffect, useContext } from 'react';
import { runSystemHealthCheck } from '../services/apiService';
import { type SystemCheckResult } from './types';
import { BrandingContext } from '../contexts/BrandingContext';

const StatusIndicator: React.FC<{ status: SystemCheckResult['status'] }> = ({ status }) => {
    const baseClasses = "w-4 h-4 rounded-full";
    if (status === 'OK') return <div className={`${baseClasses} bg-green-500`} title="Działa"></div>;
    if (status === 'DEGRADED') return <div className={`${baseClasses} bg-yellow-500`} title="Wykryto problem"></div>;
    if (status === 'FAIL') return <div className={`${baseClasses} bg-red-500`} title="Błąd krytyczny"></div>;
    return <div className={`${baseClasses} bg-gray-400`} title="Nieznany"></div>;
};

const HealthDashboardPage: React.FC = () => {
  const [checkResults, setCheckResults] = useState<SystemCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { branding } = useContext(BrandingContext);

  const performCheck = async () => {
    setIsLoading(true);
    setCheckResults([]);
    try {
      // FIX: Pass the entire branding object for a complete check.
      const results = await runSystemHealthCheck(branding);
      setCheckResults(results);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Health check failed unexpectedly:", error);
      setCheckResults([{
        module: 'System Diagnostyczny',
        status: 'FAIL',
        message: 'Nie udało się uruchomić testów.',
        details: error instanceof Error ? error.message : String(error)
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform a check on component mount
  useEffect(() => {
    performCheck();
  }, []);
  
  const overallStatus = checkResults.reduce((acc, curr) => {
    if (curr.status === 'FAIL') return 'FAIL';
    if (curr.status === 'DEGRADED' && acc !== 'FAIL') return 'DEGRADED';
    return acc;
  }, checkResults.length > 0 ? 'OK' : 'UNKNOWN');

  const getOverallStatusInfo = () => {
    switch(overallStatus) {
        case 'OK': return { text: 'Wszystkie systemy działają poprawnie', color: 'bg-green-100 text-green-800 border-green-400' };
        case 'DEGRADED': return { text: 'System działa, ale wykryto problemy', color: 'bg-yellow-100 text-yellow-800 border-yellow-400' };
        case 'FAIL': return { text: 'Wykryto błędy krytyczne', color: 'bg-red-100 text-red-800 border-red-400' };
        default: return { text: 'Uruchom testy, aby sprawdzić stan systemu', color: 'bg-slate-100 text-slate-800 border-slate-400' };
    }
  };
  const statusInfo = getOverallStatusInfo();


  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h1 className="text-4xl font-bold">Panel Stanu Systemu</h1>
            <p className="opacity-80 mt-1">Automatyczna diagnostyka kluczowych komponentów aplikacji.</p>
        </div>
        <button
          onClick={performCheck}
          disabled={isLoading}
          className="px-5 py-2 bg-[var(--primary-color)] text-[var(--primary-contrast-text-color)] font-bold rounded-lg shadow-md hover:opacity-90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Testowanie...' : 'Uruchom ponowną weryfikację'}
        </button>
      </div>
      
      <div className={`p-4 rounded-lg border-l-4 mb-8 ${statusInfo.color}`}>
        <p className="font-bold">{statusInfo.text}</p>
        {lastCheck && <p className="text-sm opacity-80 mt-1">Ostatnie sprawdzenie: {lastCheck.toLocaleString()}</p>}
      </div>

      <div className="bg-[var(--secondary-color)] rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-[var(--background-color)] border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold">Szczegółowe Wyniki Testów</h2>
        </div>
        
        {isLoading && checkResults.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)] mx-auto"></div>
            <p className="mt-4 font-semibold">Uruchamiam testy systemu...</p>
            <p className="text-sm opacity-70">To może potrwać chwilę.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {checkResults.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIndicator status={result.status} />
                    <span className="font-semibold text-lg">{result.module}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      result.status === 'OK' ? 'bg-green-100 text-green-800' :
                      result.status === 'DEGRADED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                      {result.status === 'OK' ? 'Działa' : result.status === 'DEGRADED' ? 'Problem' : 'Błąd'}
                  </span>
                </div>
                <div className="pl-7 mt-1">
                    <p className="text-sm opacity-80">{result.message}</p>
                    {result.details && <p className="text-xs opacity-60 mt-1 font-mono bg-slate-100 p-2 rounded">{result.details}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthDashboardPage;