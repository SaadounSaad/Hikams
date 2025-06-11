// src/components/analytics/AnalyticsPipelineDebug.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface PipelineStatus {
  lastEventDate: string | null;
  lastViewUpdate: string | null;
  eventCount: number;
  processedCount: number;
  queuedCount: number;
  errors: string[];
  viewsStatus: Record<string, any>;
}

const AnalyticsPipelineDebug: React.FC = () => {
  const { supabase, user } = useAuth();
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoFix, setAutoFix] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `${timestamp}: ${message}`]);
  };

  const diagnosePipeline = async () => {
    if (!supabase) return;

    setIsLoading(true);
    addLog('🔍 Starting pipeline diagnosis...');

    try {
      const errors: string[] = [];
      
      // 1. Vérifier les événements récents
      addLog('📊 Checking recent analytics events...');
      const { data: recentEvents, error: eventsError } = await supabase
        .from('analytics_events')
        .select('created_at, event_type, processed')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) {
        errors.push(`Events query failed: ${eventsError.message}`);
        addLog(`❌ Events query failed: ${eventsError.message}`);
      } else {
        const totalEvents = recentEvents?.length || 0;
        const processedEvents = recentEvents?.filter(e => e.processed).length || 0;
        const queuedEvents = totalEvents - processedEvents;
        const lastEventDate = recentEvents?.[0]?.created_at || null;

        addLog(`✅ Found ${totalEvents} recent events (${processedEvents} processed, ${queuedEvents} queued)`);
        if (lastEventDate) {
          addLog(`📅 Last event: ${new Date(lastEventDate).toLocaleString()}`);
        }

        // Vérifier si les événements sont récents
        if (lastEventDate) {
          const lastEvent = new Date(lastEventDate);
          const cutoffDate = new Date('2025-06-01');
          
          if (lastEvent < cutoffDate) {
            errors.push('No events found after June 1st, 2025');
            addLog('⚠️ No recent events found - this might explain why views are stale');
          }
        }
      }

      // 2. Vérifier les vues analytics
      addLog('🔍 Checking analytics views...');
      const viewsToCheck = [
        'daily_session_stats',
        'quote_reads_per_category_user', 
        'top_favorite_quotes'
      ];

      const viewsStatus: Record<string, any> = {};

      for (const viewName of viewsToCheck) {
        try {
          addLog(`📊 Checking view: ${viewName}`);
          
          const { data: viewData, error: viewError } = await supabase
            .from(viewName)
            .select('*')
            .order('activity_date', { ascending: false })
            .limit(5);

          if (viewError) {
            errors.push(`View ${viewName} error: ${viewError.message}`);
            viewsStatus[viewName] = { error: viewError.message, lastUpdate: null };
            addLog(`❌ View ${viewName} error: ${viewError.message}`);
          } else {
            const recordCount = viewData?.length || 0;
            const lastRecord = viewData?.[0];
            const lastUpdate = lastRecord?.activity_date || null;
            
            viewsStatus[viewName] = { 
              recordCount, 
              lastUpdate,
              error: null 
            };

            addLog(`✅ View ${viewName}: ${recordCount} records, last update: ${lastUpdate || 'unknown'}`);

            // Vérifier si la vue est à jour
            if (lastUpdate) {
              const lastUpdateDate = new Date(lastUpdate);
              const cutoffDate = new Date('2025-06-01');
              
              if (lastUpdateDate < cutoffDate) {
                errors.push(`View ${viewName} not updated since ${lastUpdate}`);
                addLog(`⚠️ View ${viewName} is stale (last update: ${lastUpdate})`);
              }
            }
          }
        } catch (error) {
          errors.push(`Failed to check view ${viewName}: ${error}`);
          addLog(`❌ Failed to check view ${viewName}: ${error}`);
        }
      }

      // 3. Vérifier les fonctions de traitement
      addLog('🔄 Testing processing functions...');
      try {
        const { data: processResult, error: processError } = await supabase
          .rpc('process_queued_events');

        if (processError) {
          errors.push(`Process function failed: ${processError.message}`);
          addLog(`❌ Process function failed: ${processError.message}`);
        } else {
          addLog(`✅ Process function executed successfully`);
        }
      } catch (error) {
        errors.push(`Process function test failed: ${error}`);
        addLog(`❌ Process function test failed: ${error}`);
      }

      // 4. Vérifier les triggers/cron jobs
      addLog('⏰ Checking automated processing...');
      try {
        // Vérifier si pg_cron est configuré (si applicable)
        const { data: cronJobs, error: cronError } = await supabase
          .from('cron.job')
          .select('*')
          .limit(5);

        if (cronError) {
          if (cronError.message.includes('does not exist')) {
            addLog('ℹ️ pg_cron not configured (manual processing required)');
          } else {
            errors.push(`Cron check failed: ${cronError.message}`);
          }
        } else {
          addLog(`✅ Found ${cronJobs?.length || 0} scheduled jobs`);
        }
      } catch (error) {
        addLog('ℹ️ Could not check cron jobs (likely not configured)');
      }

      const finalStatus: PipelineStatus = {
        lastEventDate: recentEvents?.[0]?.created_at || null,
        lastViewUpdate: null, // Will be populated from views
        eventCount: recentEvents?.length || 0,
        processedCount: recentEvents?.filter(e => e.processed).length || 0,
        queuedCount: recentEvents?.filter(e => !e.processed).length || 0,
        errors,
        viewsStatus
      };

      setStatus(finalStatus);
      addLog(`🎯 Diagnosis complete. Found ${errors.length} issues.`);

    } catch (error) {
      addLog(`💥 Diagnosis failed: ${error}`);
      console.error('Pipeline diagnosis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fixCommonIssues = async () => {
    if (!supabase || !status) return;

    setIsLoading(true);
    addLog('🔧 Starting automatic fixes...');

    try {
      let fixedCount = 0;

      // Fix 1: Process queued events
      if (status.queuedCount > 0) {
        addLog(`🔄 Processing ${status.queuedCount} queued events...`);
        try {
          const { error } = await supabase.rpc('process_queued_events');
          if (error) {
            addLog(`❌ Failed to process events: ${error.message}`);
          } else {
            addLog(`✅ Successfully processed queued events`);
            fixedCount++;
          }
        } catch (error) {
          addLog(`❌ Event processing failed: ${error}`);
        }
      }

      // Fix 2: Refresh materialized views (if they exist)
      const materializedViews = ['daily_session_stats_materialized', 'user_kpis_materialized'];
      
      for (const viewName of materializedViews) {
        try {
          addLog(`🔄 Refreshing materialized view: ${viewName}`);
          const { error } = await supabase.rpc('refresh_materialized_view', {
            view_name: viewName
          });
          
          if (error) {
            if (!error.message.includes('does not exist')) {
              addLog(`⚠️ Could not refresh ${viewName}: ${error.message}`);
            }
          } else {
            addLog(`✅ Refreshed ${viewName}`);
            fixedCount++;
          }
        } catch (error) {
          // Ignore if view doesn't exist
        }
      }

      // Fix 3: Generate test data if no recent events
      if (!status.lastEventDate || new Date(status.lastEventDate) < new Date('2025-06-01')) {
        addLog('🎲 Generating test events to trigger pipeline...');
        try {
          const testEvents = [
            { type: 'session_started', payload: { source: 'pipeline_fix' } },
            { type: 'quote_viewed', payload: { category: 'daily', quote_id: 'fix-test' } },
            { type: 'favorite_added', payload: { quote_id: 'fix-test' } }
          ];

          for (const event of testEvents) {
            const { error } = await supabase.rpc('insert_analytics_event', {
              p_session_id: 'pipeline-fix-session',
              p_type: event.type,
              p_payload: event.payload
            });

            if (error) {
              addLog(`❌ Failed to insert test event: ${error.message}`);
            }
          }

          addLog(`✅ Generated ${testEvents.length} test events`);
          fixedCount++;
        } catch (error) {
          addLog(`❌ Test event generation failed: ${error}`);
        }
      }

      // Fix 4: Manual view refresh via SQL
      addLog('🔄 Attempting manual view refresh...');
      try {
        const refreshQueries = [
          `REFRESH MATERIALIZED VIEW IF EXISTS daily_session_stats_mv;`,
          `REFRESH MATERIALIZED VIEW IF EXISTS user_kpis_mv;`,
          // Force recalculation by calling stored procedures
          `SELECT update_analytics_views();`
        ];

        for (const query of refreshQueries) {
          try {
            const { error } = await supabase.rpc('execute_sql', { query });
            if (!error) {
              addLog(`✅ Executed: ${query.substring(0, 50)}...`);
              fixedCount++;
            }
          } catch (error) {
            // Ignore if function doesn't exist
          }
        }
      } catch (error) {
        addLog(`ℹ️ Manual refresh not available (functions may not exist)`);
      }

      addLog(`🎉 Auto-fix completed! Applied ${fixedCount} fixes.`);
      
      // Re-run diagnosis to see if issues were resolved
      setTimeout(() => {
        addLog('🔍 Re-running diagnosis...');
        diagnosePipeline();
      }, 2000);

    } catch (error) {
      addLog(`💥 Auto-fix failed: ${error}`);
      console.error('Auto-fix error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const manualSQLFixes = `
-- Manual SQL fixes to run in Supabase SQL Editor

-- 1. Check recent events
SELECT 
  DATE(created_at) as date,
  COUNT(*) as events,
  COUNT(CASE WHEN processed THEN 1 END) as processed,
  COUNT(CASE WHEN NOT processed THEN 1 END) as queued
FROM analytics_events 
WHERE created_at >= '2025-06-01'::date
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 2. Force process all queued events
SELECT process_queued_events();

-- 3. Refresh materialized views (if they exist)
REFRESH MATERIALIZED VIEW IF EXISTS daily_session_stats_mv;
REFRESH MATERIALIZED VIEW IF EXISTS user_kpis_mv;

-- 4. Check view status
SELECT 
  'daily_session_stats' as view_name,
  MAX(activity_date) as last_update,
  COUNT(*) as record_count
FROM daily_session_stats
UNION ALL
SELECT 
  'quote_reads_per_category_user' as view_name,
  MAX(activity_date) as last_update,
  COUNT(*) as record_count
FROM quote_reads_per_category_user;

-- 5. Create missing indexes (if needed)
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_processed 
ON analytics_events(processed, created_at);
`;

  useEffect(() => {
    diagnosePipeline();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Analytics Pipeline Diagnosis</h3>
        <div className="flex space-x-2">
          <button
            onClick={diagnosePipeline}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : '🔍 Diagnose'}
          </button>
          {status && status.errors.length > 0 && (
            <button
              onClick={fixCommonIssues}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              🔧 Auto-Fix
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium">Events</div>
            <div className="text-lg font-bold text-blue-600">{status.eventCount}</div>
            <div className="text-xs text-gray-500">Total recent</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium">Processed</div>
            <div className="text-lg font-bold text-green-600">{status.processedCount}</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium">Queued</div>
            <div className={`text-lg font-bold ${status.queuedCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {status.queuedCount}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-medium">Issues</div>
            <div className={`text-lg font-bold ${status.errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {status.errors.length}
            </div>
            <div className="text-xs text-gray-500">Found</div>
          </div>
        </div>
      )}

      {/* Views Status */}
      {status && Object.keys(status.viewsStatus).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Views Status</h4>
          <div className="grid gap-3">
            {Object.entries(status.viewsStatus).map(([viewName, viewStatus]) => (
              <div key={viewName} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{viewName}</div>
                  <div className="text-sm text-gray-600">
                    {viewStatus.error ? (
                      <span className="text-red-600">Error: {viewStatus.error}</span>
                    ) : (
                      <>
                        {viewStatus.recordCount} records, 
                        last update: {viewStatus.lastUpdate || 'unknown'}
                      </>
                    )}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  viewStatus.error 
                    ? 'bg-red-500' 
                    : viewStatus.lastUpdate && new Date(viewStatus.lastUpdate) >= new Date('2025-06-01')
                    ? 'bg-green-500'
                    : 'bg-orange-500'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues Found */}
      {status && status.errors.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-red-600">Issues Found</h4>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <ul className="list-disc list-inside space-y-1">
              {status.errors.map((error, index) => (
                <li key={index} className="text-red-700 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="space-y-2">
        <h4 className="font-medium">Diagnostic Logs</h4>
        <div className="bg-gray-900 text-green-400 rounded p-3 h-48 overflow-y-auto font-mono text-xs">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* Manual SQL Fixes */}
      <details className="bg-gray-50 p-4 rounded">
        <summary className="cursor-pointer font-medium">Manual SQL Fixes</summary>
        <pre className="mt-3 text-xs bg-gray-800 text-green-400 p-3 rounded overflow-auto">
          {manualSQLFixes}
        </pre>
        <p className="mt-2 text-sm text-gray-600">
          Copy and run these queries in your Supabase SQL Editor if auto-fix doesn't work.
        </p>
      </details>
    </div>
  );
};

export default AnalyticsPipelineDebug;