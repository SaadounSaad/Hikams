import React, { useEffect, useCallback } from 'react';
import { useKPIs } from '../hooks/useKPIs';
import { useAppearanceSettings } from '../context/AppearanceContext';

const AnalyticsPage: React.FC = () => {
  const { data: kpis, formatted, loading, error, load } = useKPIs();
  const { isSepiaMode } = useAppearanceSettings();

  // Chargement silencieux au montage
  useEffect(() => {
    if (!kpis && !loading && !error) {
      load();
    }
  }, [kpis, loading, error, load]);

  const handleRefresh = useCallback(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="font-arabic text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error && !kpis) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center bg-red-50 p-8 rounded-xl max-w-md">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-lg font-bold text-red-800 mb-4 font-arabic">خطأ في التحميل</h2>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-arabic transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!kpis || !formatted) return null;

  const bgClass = isSepiaMode ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200';
  const getCardClass = (color: string) => {
    const sepiaSchemes = {
      purple: 'bg-gradient-to-br from-amber-200 to-orange-200 text-amber-900',
      blue: 'bg-gradient-to-br from-blue-200 to-indigo-200 text-blue-900',
      green: 'bg-gradient-to-br from-green-200 to-emerald-200 text-green-900',
      orange: 'bg-gradient-to-br from-orange-200 to-red-200 text-orange-900'
    };
    const normalSchemes = {
      purple: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
      blue: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white',
      green: 'bg-gradient-to-br from-green-500 to-emerald-500 text-white',
      orange: 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
    };
    
    const schemes = isSepiaMode ? sepiaSchemes : normalSchemes;
    return schemes[color as keyof typeof schemes] || schemes.purple;
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sky-600 font-arabic">📊 إحصائياتي في حِكم</h1>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-arabic transition-colors ${
              loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isSepiaMode 
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                  : 'bg-sky-100 hover:bg-sky-200 text-sky-800'
            }`}
          >
            {loading ? '🔄 جاري التحديث...' : '↻ تحديث'}
          </button>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-6 rounded-2xl shadow-lg transition-transform hover:scale-105 ${getCardClass('purple')}`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{formatted.current_favorites_formatted}</div>
              <div className="text-sm opacity-90 font-arabic">⭐ المفضلة</div>
              <div className="text-xs opacity-75 font-arabic mt-1">
                من {formatted.total_quotes_formatted}
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl shadow-lg transition-transform hover:scale-105 ${getCardClass('blue')}`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{formatted.total_quotes_formatted}</div>
              <div className="text-sm opacity-90 font-arabic">📚 إجمالي الحكم</div>
              <div className="text-xs opacity-75 font-arabic mt-1">مكتبة شاملة</div>
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl shadow-lg transition-transform hover:scale-105 ${getCardClass('green')}`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{formatted.sessions_last_30d_formatted}</div>
              <div className="text-sm opacity-90 font-arabic">🔄 الجلسات</div>
              <div className="text-xs opacity-75 font-arabic mt-1">آخر 30 يوماً</div>
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl shadow-lg transition-transform hover:scale-105 ${getCardClass('orange')}`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{formatted.events_last_30d_formatted}</div>
              <div className="text-sm opacity-90 font-arabic">📈 النشاطات</div>
              <div className="text-xs opacity-75 font-arabic mt-1">{formatted.activity_level}</div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Metrics */}
          <div className={`p-6 rounded-2xl shadow-lg ${bgClass}`}>
            <h3 className="text-xl font-bold mb-6 font-arabic flex items-center gap-2">
              📊 مؤشرات الاستخدام
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{formatted.engagement_rate}%</div>
                  <div className="text-sm text-gray-600 font-arabic">معدل الإعجاب</div>
                </div>
                <div className="text-3xl">💜</div>
              </div>
              
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatted.avg_events_per_session}</div>
                  <div className="text-sm text-gray-600 font-arabic">نشاط لكل جلسة</div>
                </div>
                <div className="text-3xl">⚡</div>
              </div>
            </div>
          </div>

          {/* Category & Activity */}
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl shadow-lg ${bgClass}`}>
              <h3 className="text-lg font-semibold mb-4 font-arabic">🎯 الفئة المفضلة</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-600 mb-2 font-arabic">{kpis.top_category}</div>
                <p className="text-sm text-gray-600 font-arabic">الأكثر استخداماً</p>
              </div>
            </div>
            
            <div className={`p-6 rounded-2xl shadow-lg ${bgClass}`}>
              <h3 className="text-lg font-semibold mb-4 font-arabic">⏰ آخر نشاط</h3>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 mb-2">{formatted.last_activity_formatted}</div>
                <p className="text-sm text-gray-600 font-arabic">آخر تفاعل</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className={`p-6 rounded-2xl shadow-lg ${bgClass}`}>
          <h3 className="text-xl font-bold mb-6 font-arabic">🏆 إنجازاتك في حِكم</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
              kpis.current_favorites >= 50 
                ? 'bg-yellow-100 border-2 border-yellow-300 shadow-md' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              <div className="text-3xl mb-2">{kpis.current_favorites >= 50 ? '🏆' : '🏅'}</div>
              <div className="font-bold text-sm font-arabic">
                {kpis.current_favorites >= 50 ? 'جامع الحكم' : 'محب الحكم'}
              </div>
              <div className="text-xs text-gray-600 font-arabic">{kpis.current_favorites}/50</div>
            </div>

            <div className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
              kpis.sessions_last_30d >= 15 
                ? 'bg-blue-100 border-2 border-blue-300 shadow-md' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              <div className="text-3xl mb-2">{kpis.sessions_last_30d >= 15 ? '🔥' : '⚡'}</div>
              <div className="font-bold text-sm font-arabic">
                {kpis.sessions_last_30d >= 15 ? 'مستخدم نشط' : 'زائر منتظم'}
              </div>
              <div className="text-xs text-gray-600 font-arabic">{kpis.sessions_last_30d}/15</div>
            </div>

            <div className="p-4 rounded-xl text-center bg-purple-100 border-2 border-purple-300 transition-all hover:scale-105">
              <div className="text-3xl mb-2">🗺️</div>
              <div className="font-bold text-sm font-arabic">مستكشف الفئات</div>
              <div className="text-xs text-gray-600 font-arabic">{kpis.top_category}</div>
            </div>

            <div className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${
              Number(formatted.engagement_rate) >= 1 
                ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              <div className="text-3xl mb-2">{Number(formatted.engagement_rate) >= 1 ? '💎' : '💚'}</div>
              <div className="font-bold text-sm font-arabic">
                {Number(formatted.engagement_rate) >= 1 ? 'ذواق الحكم' : 'محب الحكم'}
              </div>
              <div className="text-xs text-gray-600 font-arabic">{formatted.engagement_rate}%</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 font-arabic">
            📱 تطبيق حِكم - {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;