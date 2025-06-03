// src/components/AnalyticsTestPanel.tsx - Version corrigée
import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

const AnalyticsTestPanel: React.FC = () => {
  const { analytics, trackEvent } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleGenerateTestEvents = async () => {
    if (!analytics) return;
    
    setIsLoading(true);
    addLog('🚀 Generating test events...');
    
    try {
      // ✅ CORRIGÉ: Utiliser trackEvent au lieu de generateTestEvents
      const testEvents = [
        { type: 'test_quote_viewed', payload: { category: 'daily', quote_id: 'test-1' } },
        { type: 'test_favorite_added', payload: { category: 'verses', quote_id: 'test-2' } },
        { type: 'test_search_performed', payload: { search_term: 'test query', category: 'mukhtarat' } },
        { type: 'test_category_changed', payload: { from: 'daily', to: 'favorites' } },
        { type: 'test_bookmark_created', payload: { category: 'hadiths', quote_index: 42 } }
      ];

      for (const event of testEvents) {
        await trackEvent(event.type, {
          ...event.payload,
          test_batch: true,
          timestamp: new Date().toISOString()
        });
      }

      addLog(`✅ Generated ${testEvents.length} test events`);
      
      // ✅ CORRIGÉ: Utiliser getQueueStats au lieu de showStats
      const stats = analytics.getQueueStats();
      addLog(`📊 Queue size: ${stats.queueSize}, Schema ready: ${stats.schemaReady}`);
      
    } catch (error) {
      addLog(`❌ Error generating events: ${error}`);
      console.error('Error generating test events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    if (!analytics) return;
    
    setIsLoading(true);
    addLog('🔄 Forcing sync...');
    
    try {
      // ✅ CORRIGÉ: forcSync au lieu de forceSync
      await analytics.forcSync();
      addLog('✅ Force sync completed');
      
      // ✅ CORRIGÉ: Utiliser getQueueStats au lieu de showStats
      const stats = analytics.getQueueStats();
      addLog(`📊 Queue after sync: ${stats.queueSize} events`);
      
    } catch (error) {
      addLog(`❌ Force sync failed: ${error}`);
      console.error('Force sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowStats = () => {
    if (!analytics) return;
    
    // ✅ CORRIGÉ: Utiliser getQueueStats au lieu de showStats
    const stats = analytics.getQueueStats();
    
    addLog('📊 Current Analytics Stats:');
    addLog(`   Queue Size: ${stats.queueSize}`);
    addLog(`   Schema Ready: ${stats.schemaReady}`);
    addLog(`   Sync Enabled: ${stats.syncEnabled}`);
    addLog(`   Online: ${stats.isOnline}`);
    addLog(`   User ID: ${stats.userId || 'Anonymous'}`);
    
    console.group('📊 Analytics Stats');
    console.log('Stats:', stats);
    console.groupEnd();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleTestKPIs = async () => {
    if (!analytics) return;
    
    setIsLoading(true);
    addLog('📈 Testing KPIs...');
    
    try {
      const kpis = await analytics.getMyKPIs();
      if (kpis) {
        addLog(`📊 KPIs: ${kpis.sessions} sessions, ${kpis.quotes_read} quotes`);
        console.log('KPIs:', kpis);
      } else {
        addLog('⚠️ No KPIs data available');
      }
    } catch (error) {
      addLog(`❌ KPIs error: ${error}`);
      console.error('KPIs error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!analytics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Analytics service not available</p>
      </div>
    );
  }

  const stats = analytics.getQueueStats();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Analytics Test Panel</h3>
      
      {/* Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Queue</div>
          <div className="text-lg font-bold">{stats.queueSize}</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Schema</div>
          <div className={`text-lg font-bold ${stats.schemaReady ? 'text-green-600' : 'text-red-600'}`}>
            {stats.schemaReady ? 'Ready' : 'Not Ready'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Sync</div>
          <div className={`text-lg font-bold ${stats.syncEnabled ? 'text-green-600' : 'text-orange-600'}`}>
            {stats.syncEnabled ? 'On' : 'Off'}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-medium">Online</div>
          <div className={`text-lg font-bold ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {stats.isOnline ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={handleGenerateTestEvents}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Generate Events
        </button>
        
        <button
          onClick={handleForceSync}
          disabled={isLoading || !stats.schemaReady}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          Force Sync
        </button>
        
        <button
          onClick={handleShowStats}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          Show Stats
        </button>
        
        <button
          onClick={handleTestKPIs}
          disabled={isLoading || !stats.schemaReady}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          Test KPIs
        </button>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Logs</h4>
          <button
            onClick={handleClearLogs}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        
        <div className="bg-gray-900 text-green-400 rounded p-3 h-32 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Warning */}
      {!stats.schemaReady && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-yellow-800 text-sm">
            ⚠️ Analytics schema not ready. Some functions may not work.
            Check that Supabase functions are properly created.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTestPanel;