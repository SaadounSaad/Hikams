// src/components/AnalyticsDebug.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface DebugInfo {
  user: any;
  supabaseConnected: boolean;
  analyticsEvents: any[];
  lastSync: string | null;
  errors: string[];
}

const AnalyticsDebug: React.FC = () => {
  const { user, supabase } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    user: null,
    supabaseConnected: false,
    analyticsEvents: [],
    lastSync: null,
    errors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkAnalyticsHealth = async () => {
    setIsLoading(true);
    const errors: string[] = [];
    
    try {
      // Vérifier la connexion Supabase
      const supabaseConnected = !!supabase;
      if (!supabaseConnected) {
        errors.push("Supabase client not available");
      }

      // Vérifier l'utilisateur
      if (!user) {
        errors.push("User not authenticated");
      }

      // Tester une requête simple
      let analyticsEvents: any[] = [];
      if (supabase && user) {
        try {
          const { data, error } = await supabase
            .from('analytics_events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (error) {
            errors.push(`Analytics query error: ${error.message}`);
          } else {
            analyticsEvents = data || [];
          }
        } catch (err: any) {
          errors.push(`Analytics query exception: ${err.message}`);
        }

        // Tester la fonction KPI
        try {
          const { data: kpiData, error: kpiError } = await supabase
            .rpc('get_my_kpis_for_user', { p_user_id: user.id });
          
          if (kpiError) {
            errors.push(`KPI function error: ${kpiError.message}`);
          }
        } catch (err: any) {
          errors.push(`KPI function exception: ${err.message}`);
        }
      }

      setDebugInfo({
        user: user ? { id: user.id, email: user.email } : null,
        supabaseConnected,
        analyticsEvents,
        lastSync: new Date().toISOString(),
        errors
      });

    } catch (err: any) {
      errors.push(`General error: ${err.message}`);
      setDebugInfo(prev => ({ ...prev, errors }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAnalyticsHealth();
  }, [user, supabase]);

  const getStatusColor = (hasErrors: boolean) => {
    return hasErrors ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Analytics Debug Panel</h3>
        <button
          onClick={checkAnalyticsHealth}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium">User</div>
          <div className={`text-lg font-bold ${getStatusColor(!debugInfo.user)}`}>
            {debugInfo.user ? '✓' : '✗'}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium">Supabase</div>
          <div className={`text-lg font-bold ${getStatusColor(!debugInfo.supabaseConnected)}`}>
            {debugInfo.supabaseConnected ? '✓' : '✗'}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium">Events</div>
          <div className="text-lg font-bold text-blue-600">
            {debugInfo.analyticsEvents.length}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="font-medium">Errors</div>
          <div className={`text-lg font-bold ${getStatusColor(debugInfo.errors.length === 0)}`}>
            {debugInfo.errors.length}
          </div>
        </div>
      </div>

      {/* User Info */}
      {debugInfo.user && (
        <div className="space-y-2">
          <h4 className="font-medium">User Information</h4>
          <div className="bg-gray-50 p-3 rounded text-sm font-mono">
            <div>ID: {debugInfo.user.id}</div>
            <div>Email: {debugInfo.user.email}</div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      {debugInfo.analyticsEvents.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Recent Analytics Events</h4>
          <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
            {debugInfo.analyticsEvents.map((event, index) => (
              <div key={index} className="border-b border-gray-200 pb-1 mb-1 last:border-b-0">
                <span className="font-semibold">{event.event_type}</span> - {event.created_at}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {debugInfo.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-600">Errors</h4>
          <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
            {debugInfo.errors.map((error, index) => (
              <div key={index} className="text-red-700">
                • {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Check */}
      {debugInfo.lastSync && (
        <div className="text-xs text-gray-500">
          Last check: {new Date(debugInfo.lastSync).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDebug;