// src/components/AnalyticsDebug.tsx - Version corrigée
import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';

interface AnalyticsDebugProps {
  show: boolean;
}

const AnalyticsDebug: React.FC<AnalyticsDebugProps> = ({ show }) => {
  const { analytics, trackEvent, getQueueStats } = useAnalytics(); // ✅ CORRIGÉ
  const [queueStats, setQueueStats] = useState<any>(null); // ✅ NOUVEAU: État local
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ NOUVEAU: Récupérer les stats périodiquement
  useEffect(() => {
    if (!analytics) return;

    const updateStats = () => {
      setQueueStats(analytics.getQueueStats());
    };

    // Mise à jour immédiate
    updateStats();

    // Mise à jour périodique
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, [analytics]);

  if (!show) return null;

  const handleTrackTestEvent = async () => {
    try {
      await trackEvent('debug_test_event', {
        test_data: 'Debug panel test',
        timestamp: new Date().toISOString(),
        random_value: Math.random()
      });
      console.log('✅ Debug test event tracked');
    } catch (error) {
      console.error('❌ Failed to track debug event:', error);
    }
  };

  const handleForceSync = async () => {
    if (!analytics) return;
    
    try {
      await analytics.forcSync(); // ✅ CORRIGÉ: forcSync au lieu de forceSync
      console.log('✅ Force sync completed from debug panel');
    } catch (error) {
      console.error('❌ Force sync failed:', error);
    }
  };

  const handleShowStats = () => {
    if (!analytics) return;
    
    const stats = analytics.getQueueStats();
    console.group('📊 Analytics Stats from Debug Panel');
    console.log('Queue Size:', stats.queueSize);
    console.log('Schema Ready:', stats.schemaReady);
    console.log('Sync Enabled:', stats.syncEnabled);
    console.log('Is Online:', stats.isOnline);
    console.log('Session ID:', stats.sessionId);
    console.log('User ID:', stats.userId);
    console.groupEnd();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl max-w-xs">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer border-b border-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-sm font-medium">Analytics Debug</span>
          </div>
          <button className="text-gray-400 hover:text-white">
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 space-y-3">
            {/* Stats */}
            {queueStats && (
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Queue:</span>
                  <span className="font-mono">{queueStats.queueSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Schema:</span>
                  <span className={`font-mono ${queueStats.schemaReady ? 'text-green-400' : 'text-red-400'}`}>
                    {queueStats.schemaReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Online:</span>
                  <span className={`font-mono ${queueStats.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {queueStats.isOnline ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sync:</span>
                  <span className={`font-mono ${queueStats.syncEnabled ? 'text-green-400' : 'text-orange-400'}`}>
                    {queueStats.syncEnabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleTrackTestEvent}
                className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                disabled={!analytics}
              >
                Track Test Event
              </button>
              
              <button
                onClick={handleForceSync}
                className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                disabled={!analytics || !queueStats?.schemaReady}
              >
                Force Sync
              </button>
              
              <button
                onClick={handleShowStats}
                className="w-full px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                disabled={!analytics}
              >
                Show Stats
              </button>
            </div>

            {/* Warning */}
            {queueStats && !queueStats.schemaReady && (
              <div className="text-xs text-orange-400 border border-orange-400 rounded p-2">
                ⚠️ Schema not ready. Check Supabase functions.
              </div>
            )}

            {/* Status */}
            <div className="text-xs text-gray-400 text-center">
              {analytics ? (
                `Session: ${queueStats?.sessionId?.slice(-8) || 'Unknown'}`
              ) : (
                'Analytics not initialized'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDebug;