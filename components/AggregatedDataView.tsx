
import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchTestsForAggregation, fetchDetailedAggregatedDataForTest, fetchTestById, fetchPsychometricData } from '../services/apiClient';
import type { AggregatedTestInfo, DetailedAggregatedData, View, Test, PsychometricData } from './types';
import { ChevronLeftIcon, BeakerIcon } from './common/Icons';
import { BrandingContext } from '../contexts/BrandingContext';

const AggregatedDataView: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
  // ... (reszta kodu bez zmian)
};

export default AggregatedDataView;
