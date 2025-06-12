// src/pages/AnalyticsPage.tsx - Version intégrée pour Hikams
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // ✅ Ajoutez cet import
import MinimalAnalyticsDashboard from '../components/MinimalAnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalAnalyticsDashboard
        userId={user?.id}
        supabaseClient={supabase} // ✅ Remplacez null par supabase
      />
    </div>
  );
};

export default AnalyticsPage;