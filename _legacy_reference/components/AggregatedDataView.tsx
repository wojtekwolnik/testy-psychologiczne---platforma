
import React, { useState, useEffect, useContext } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTestsForAggregation, fetchDetailedAggregatedDataForTest, fetchTestById, fetchPsychometricData } from '../services/apiClient';
import type { AggregatedTestInfo, DetailedAggregatedData, Test, PsychometricData } from './types';
import { type StaffLayoutContext } from '../App';
import { ChevronLeftIcon, BeakerIcon } from './common/Icons';
import { BrandingContext } from '../contexts/BrandingContext';

const AggregatedDataView = () => {
  const { onNavigate } = useOutletContext<StaffLayoutContext>();
  const [tests, setTests] = useState<AggregatedTestInfo[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [data, setData] = useState<DetailedAggregatedData | null>(null);
  const [psychometricData, setPsychometricData] = useState<PsychometricData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useContext(BrandingContext);

  useEffect(() => {
    const loadTests = async () => {
      setIsLoading(true);
      try {
        const fetchedTests = await fetchTestsForAggregation();
        setTests(fetchedTests);
      } catch (err) { 
        setError('Nie udało się załadować listy testów.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTests();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedTestId) return;
      setIsLoading(true);
      setError(null);
      setData(null);
      setCurrentTest(null);
      setPsychometricData(null);

      try {
        const [aggregated, testDetails] = await Promise.all([
          fetchDetailedAggregatedDataForTest(selectedTestId),
          fetchTestById(selectedTestId),
        ]);
        setData(aggregated);
        setCurrentTest(testDetails);
      } catch (err) {
        setError('Nie udało się załadować zagregowanych danych dla tego testu.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedTestId]);
  
  const handlePsychometricAnalysis = async () => {
      if (!selectedTestId) return;
      setIsLoading(true);
      try {
          const psychoData = await fetchPsychometricData(selectedTestId);
          setPsychometricData(psychoData);
      } catch (err) {
          setError('Błąd podczas analizy psychometrycznej.');
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }
  
  const PIE_COLORS = [colors.primary, colors.accent1, colors.accent2, '#FFBB28', '#FF8042'];

  const renderDemographics = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data?.demographics.gender && (
              <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Płeć</h3>
                  <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                          <Pie data={data.demographics.gender} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label>
                              {data.demographics.gender.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          )}
          {data?.demographics.education && (
              <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Wykształcenie</h3>
                  <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                          <Pie data={data.demographics.education} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label>
                              {data.demographics.education.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          )}
      </div>
  );

  const renderScaleDistributions = () => (
      <div className="space-y-8">
          {data?.scaleDistributions.map(scaleData => (
              <div key={scaleData.scaleId} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Rozkład wyników dla skali: {currentTest?.scales.find(s => s.id === scaleData.scaleId)?.name}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scaleData.distribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill={colors.primary} name="Liczba osób" />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          ))}
      </div>
  );
  
    const renderPsychometricData = () => {
    if (!psychometricData) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h3 className="text-xl font-bold mb-4">Analiza Psychometryczna</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold">Rzetelność (Alfa Cronbacha)</h4>
                    <p>Ogólna: {psychometricData.reliability.overall.toFixed(3)}</p>
                    <ul className="list-disc list-inside pl-4 mt-2">
                        {Object.entries(psychometricData.reliability.scales).map(([scaleId, value]) => (
                            <li key={scaleId}>{currentTest?.scales.find(s => s.id === scaleId)?.name}: {value.toFixed(3)}</li>
                        ))}
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-semibold">Korelacje między skalami</h4>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 mt-2">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skala</th>
                                    {psychometricData.correlationMatrix.scaleNames.map(name => <th key={name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{name}</th>)}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {psychometricData.correlationMatrix.matrix.map((row, i) => (
                                    <tr key={psychometricData.correlationMatrix.scaleNames[i]}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{psychometricData.correlationMatrix.scaleNames[i]}</td>
                                        {row.map((val, j) => <td key={j} className={`px-6 py-4 whitespace-nowrap ${Math.abs(val) > 0.5 ? 'font-bold' : ''}`}>{val.toFixed(2)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-800">
      <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-8">
              <button onClick={() => onNavigate('/admin/dashboard')} className="p-2 mr-4 bg-white rounded-full shadow hover:bg-gray-100 transition">
                  <ChevronLeftIcon />
              </button>
              <h1 className="text-4xl font-bold">Zagregowane Dane i Analiza</h1>
          </div>

        <div className="mb-8">
          <label htmlFor="test-select" className="block text-sm font-medium text-gray-700 mb-2">Wybierz test do analizy:</label>
          <select
            id="test-select"
            value={selectedTestId || ''}
            onChange={e => setSelectedTestId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow"
          >
            <option value="" disabled>Wybierz...</option>
            {tests.map(test => (
              <option key={test.testId} value={test.testId}>({test.resultCount} wypełnień) - {test.title}</option>
            ))}
          </select>
        </div>

        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        )}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

        {data && currentTest && (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">Dane demograficzne ({data.totalRespondents} respondentów)</h2>
              {renderDemographics()}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Rozkład wyników w skalach</h2>
              {renderScaleDistributions()}
            </div>
            
            <div className="text-center mt-8">
                <button 
                    onClick={handlePsychometricAnalysis}
                    className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out inline-flex items-center gap-2"
                    disabled={isLoading}
                >
                    <BeakerIcon />
                    Uruchom analizę psychometryczną
                </button>
            </div>
            
            {renderPsychometricData()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AggregatedDataView;
