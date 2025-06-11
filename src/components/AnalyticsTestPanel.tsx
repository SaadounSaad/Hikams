// src/components/AnalyticsTestPanel.tsx - Version compatible avec vos types existants
import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

// Interface pour les stats de queue basée sur vos types réels
interface QueueStats {
  queueSize: number;
  syncEnabled: boolean;
  sessionId: string;
  isOnline: boolean;
  syncInProgress: boolean;
  schemaReady: boolean;
  userId?: string;
}

const AnalyticsTestPanel: React.FC = () => {
  const { analytics, trackEvent } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-15), `${timestamp}: ${message}`]); // Garder 15 logs max
  };

  // Auto-refresh des stats
  useEffect(() => {
    if (!autoRefresh || !analytics) return;

    const interval = setInterval(() => {
      const stats = analytics.getQueueStats();
      addLog(`📊 Auto-refresh: Queue ${stats.queueSize}, Schema ${stats.schemaReady ? 'Ready' : 'Not Ready'}`);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, analytics]);

  const handleGenerateTestEvents = async () => {
    if (!analytics) {
      addLog('❌ Analytics service not available');
      return;
    }
    
    setIsLoading(true);
    addLog('🚀 Generating test events...');
    
    try {
      const testEvents = [
        { type: 'test_quote_viewed', payload: { category: 'daily', quote_id: 'test-1', duration: 5.2 } },
        { type: 'test_favorite_added', payload: { category: 'verses', quote_id: 'test-2' } },
        { type: 'test_search_performed', payload: { search_term: 'test query', category: 'mukhtarat', results_count: 42 } },
        { type: 'test_category_changed', payload: { from: 'daily', to: 'favorites' } },
        { type: 'test_bookmark_created', payload: { category: 'hadiths', quote_index: 42 } },
        { type: 'test_session_started', payload: { app_version: '1.0.0', device_type: 'web' } },
        { type: 'test_reading_time', payload: { category: 'daily', total_seconds: 120 } }
      ];

      let successCount = 0;
      for (const event of testEvents) {
        try {
          await trackEvent(event.type, {
            ...event.payload,
            test_batch: true,
            timestamp: new Date().toISOString(),
            test_id: Math.random().toString(36).substr(2, 9)
          });
          successCount++;
        } catch (error) {
          addLog(`❌ Failed to track ${event.type}: ${error}`);
        }
      }

      addLog(`✅ Generated ${successCount}/${testEvents.length} test events successfully`);
      
      // Attendre un peu puis afficher les stats
      setTimeout(() => {
        if (analytics) {
          const stats = analytics.getQueueStats();
          addLog(`📊 Queue after events: ${stats.queueSize} events, Schema: ${stats.schemaReady ? 'Ready' : 'Not Ready'}`);
        }
      }, 1000);
      
    } catch (error) {
      addLog(`❌ Error generating events: ${error}`);
      console.error('Error generating test events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    if (!analytics) {
      addLog('❌ Analytics service not available');
      return;
    }
    
    setIsLoading(true);
    addLog('🔄 Forcing sync...');
    
    try {
      // Utiliser forcSync (votre méthode réelle)
      await analytics.forcSync();
      addLog('✅ Force sync completed');
      
      // Attendre un peu puis afficher les stats
      setTimeout(() => {
        if (analytics) {
          const stats = analytics.getQueueStats();
          addLog(`📊 Queue after sync: ${stats.queueSize} events`);
        }
      }, 1000);
      
    } catch (error) {
      addLog(`❌ Force sync failed: ${error}`);
      console.error('Force sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowStats = () => {
    if (!analytics) {
      addLog('❌ Analytics service not available');
      return;
    }
    
    try {
      const stats = analytics.getQueueStats();
      
      addLog('📊 Current Analytics Stats:');
      addLog(`   Queue Size: ${stats.queueSize}`);
      addLog(`   Schema Ready: ${stats.schemaReady}`);
      addLog(`   Sync Enabled: ${stats.syncEnabled}`);
      addLog(`   Online: ${stats.isOnline}`);
      addLog(`   Sync In Progress: ${stats.syncInProgress}`);
      addLog(`   Session ID: ${stats.sessionId}`);
      addLog(`   User ID: ${stats.userId || 'Anonymous'}`);
      
      console.group('📊 Analytics Stats');
      console.log('Stats:', stats);
      console.groupEnd();
    } catch (error) {
      addLog(`❌ Error getting stats: ${error}`);
      console.error('Stats error:', error);
    }
  };

  const handleTestKPIs = async () => {
    if (!analytics) {
      addLog('❌ Analytics service not available');
      return;
    }
    
    setIsLoading(true);
    addLog('📈 Testing KPIs...');
    
    try {
      const kpis = await analytics.getMyKPIs();
      if (kpis) {
        addLog(`📊 KPIs Retrieved Successfully:`);
        // Utiliser les propriétés réelles de votre interface AnalyticsKPIs
        addLog(`   KPIs data available: ${Object.keys(kpis).length} properties`);
        
        // Log les propriétés disponibles pour debug
        console.group('📊 KPIs Detail');
        console.log('KPIs object:', kpis);
        console.log('Available properties:', Object.keys(kpis));
        console.groupEnd();
        
        // Afficher de manière générique
        Object.entries(kpis).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            addLog(`   ${key}: ${value}`);
          }
        });
        
      } else {
        addLog('⚠️ No KPIs data available - may be normal for new users');
      }
    } catch (error) {
      addLog(`❌ KPIs error: ${error}`);
      console.error('KPIs error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs cleared');
  };

  const handleTestConnection = async () => {
    if (!analytics) {
      addLog('❌ Analytics service not available');
      return;
    }

    setIsLoading(true);
    addLog('🔌 Testing analytics connection...');

    try {
      // Test basique de connectivité
      const stats = analytics.getQueueStats();
      addLog(`✅ Connection OK - Service responding`);
      addLog(`   Queue: ${stats.queueSize}, Schema: ${stats.schemaReady ? 'Ready' : 'Not Ready'}`);
      addLog(`   Session: ${stats.sessionId}`);

      // Test d'un événement simple
      await trackEvent('test_connection', { 
        timestamp: new Date().toISOString(),
        test: true 
      });
      addLog(`✅ Event tracking test successful`);

    } catch (error) {
      addLog(`❌ Connection test failed: ${error}`);
      console.error('Connection test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!analytics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <div>
            <p className="text-yellow-800 font-medium">Analytics service not available</p>
            <p className="text-yellow-700 text-sm">Please check that AnalyticsContext is properly configured</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = analytics.getQueueStats();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Analytics Test Panel</h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-refresh</span>
          </label>
        </div>
      </div>
      
      {/* Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Queue</div>
          <div className="text-lg font-bold text-blue-600">{stats.queueSize}</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Schema</div>
          <div className={`text-lg font-bold ${stats.schemaReady ? 'text-green-600' : 'text-red-600'}`}>
            {stats.schemaReady ? '✓' : '✗'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Sync</div>
          <div className={`text-lg font-bold ${stats.syncEnabled ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.syncEnabled ? 'ON' : 'OFF'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Online</div>
          <div className={`text-lg font-bold ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {stats.isOnline ? '✓' : '✗'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Syncing</div>
          <div className={`text-lg font-bold ${stats.syncInProgress ? 'text-orange-600' : 'text-gray-400'}`}>
            {stats.syncInProgress ? '⏳' : '✓'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">User</div>
          <div className="text-xs font-bold text-gray-600 truncate">
            {stats.userId ? stats.userId.substring(0, 8) + '...' : 'None'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <button
          onClick={handleTestConnection}
          disabled={isLoading}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          Test Connection
        </button>
        
        <button
          onClick={handleGenerateTestEvents}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Generate Events
        </button>
        
        <button
          onClick={handleForceSync}
          disabled={isLoading || !stats.schemaReady}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          Force Sync
        </button>
        
        <button
          onClick={handleShowStats}
          disabled={isLoading}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          Show Stats
        </button>
        
        <button
          onClick={handleTestKPIs}
          disabled={isLoading || !stats.schemaReady}
          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          Test KPIs
        </button>
      </div>

      {/* Logs Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Event Logs</h4>
          <div className="flex space-x-2">
            <span className="text-xs text-gray-500">
              {logs.length}/15 logs
            </span>
            <button
              onClick={handleClearLogs}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
        
        <div className="bg-gray-900 text-green-400 rounded p-3 h-40 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500 flex items-center justify-center h-full">
              No logs yet... Click a button to start testing!
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Warnings */}
      <div className="space-y-2">
        {!stats.schemaReady && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ Analytics schema not ready. Some functions may not work.
              Check that Supabase functions are properly deployed.
            </p>
          </div>
        )}
        
        {!stats.isOnline && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-800 text-sm">
              🔌 Analytics appears to be offline. Check your internet connection and Supabase status.
            </p>
          </div>
        )}
        
        {stats.syncInProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-blue-800 text-sm">
              ⏳ Sync in progress... Please wait for completion.
            </p>
          </div>
        )}
        
        {stats.queueSize > 50 && (
          <div className="bg-orange-50 border border-orange-200 rounded p-3">
            <p className="text-orange-800 text-sm">
              📊 Large queue detected ({stats.queueSize} events). Consider forcing a sync.
            </p>
          </div>
        )}
      </div>

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="bg-gray-100 p-3 rounded text-xs">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <pre className="mt-2 text-gray-600 overflow-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default AnalyticsTestPanel;