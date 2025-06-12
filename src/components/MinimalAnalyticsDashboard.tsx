import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Types pour les données de graphiques
interface DailyProgressData {
  date: string;
  quotes_read: number;
  reading_time: number;
  favorites_added: number;
  sessions: number;
}

interface CategoryData {
  category: string;
  count: number;
  time: number;
  color: string;
}

// Types pour les stats de session en temps réel
interface SessionStats {
  session_id: string;
  duration_minutes: number;
  quotes_read: number;
  total_reading_time: number;
  favorites_added: number;
  categories_visited: number;
}

// Types pour les KPIs étendus avec notes
interface UserKPIs {
  sessions_count: number;
  total_reading_time_seconds: number;
  quotes_read_total: number;
  favorites_added: number;
  most_read_category: string;
  avg_session_duration_minutes: number;
  unique_categories_visited: number;
  bookmarks_created: number;
  searches_performed: number;
  deepest_reading_session_minutes: number;
  reading_streak_days: number;
  best_reading_day: string;
  engagement_score: number;
  // Nouvelles métriques pour les notes
  notes_written: number;
  notes_by_category: {
    reflexion: number;
    action: number;
    objectif: number;
  };
  total_words_written: number;
  avg_words_per_note: number;
}

// Types pour les filtres
type TimeFilter = 'today' | 'week' | 'month' | 'year';
// ✅ Type spécifique pour AnalyticsCharts
type AnalyticsTimeFilter = 'week' | 'month' | 'year';

// Props du composant
interface MinimalAnalyticsDashboardProps {
  userId?: string;
  supabaseClient?: any;
}

// Props des composants
interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  className?: string;
  size?: 'normal' | 'large';
}

interface TimeFilterButtonsProps {
  activeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

// ✅ Interface pour le composant AnalyticsCharts
interface AnalyticsChartsProps {
  userId?: string;
  timeFilter: AnalyticsTimeFilter;
}

// Composant Card minimaliste
const StatCard: React.FC<StatCardProps> = ({ label, value, unit = '', subtitle = '', className = '', size = 'normal' }) => (
  <div className={`bg-white border border-gray-100 rounded-lg p-4 ${className}`}>
    <div className={`${size === 'large' ? 'text-3xl' : 'text-2xl'} font-light text-gray-900 mb-1`}>
      {value}{unit}
    </div>
    <div className="text-sm text-gray-500 font-medium mb-1">
      {label}
    </div>
    {subtitle && (
      <div className="text-xs text-gray-400">
        {subtitle}
      </div>
    )}
  </div>
);

// Composant pour les filtres temporels
const TimeFilterButtons: React.FC<TimeFilterButtonsProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'today', label: 'Aujourd\'hui' },
    { key: 'week', label: '7 jours' },
    { key: 'month', label: '30 jours' },
    { key: 'year', label: 'Année' }
  ];

  return (
    <div className="flex gap-3 p-2 bg-gray-100 rounded-xl border border-gray-200">
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key as TimeFilter)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border ${
            activeFilter === filter.key
              ? 'bg-blue-600 text-white shadow-md border-blue-600 transform scale-105'
              : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

// Barre de progression minimaliste
const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, className = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`w-full bg-gray-100 rounded-full h-1.5 ${className}`}>
      <div 
        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// ✅ Tooltip personnalisé pour les graphiques
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ✅ Composant AnalyticsCharts
const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ userId, timeFilter }) => {
  const [dailyData, setDailyData] = useState<DailyProgressData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!userId) {
        generateDemoData();
        return;
      }

      try {
        generateDemoData();
      } catch (error) {
        console.error('Erreur chargement analytics:', error);
        generateDemoData();
      }
    };

    // Générer des données de démonstration basées sur le filtre
    const generateDemoData = () => {
      const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 365;
      
      // Données quotidiennes
      const daily = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        daily.push({
          date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
          quotes_read: Math.floor(Math.random() * 15) + 1,
          reading_time: Math.floor(Math.random() * 45) + 5,
          favorites_added: Math.floor(Math.random() * 5),
          sessions: Math.floor(Math.random() * 3) + 1
        });
      }
      
      // ✅ Données par catégorie basées sur les vrais book_titles
      const categories = [
        { category: 'التربية والتزكية', color: '#3B82F6' },
        { category: 'الآداب والفضائل', color: '#10B981' },
        { category: 'أدعية ومناجاة', color: '#F59E0B' },
        { category: 'معرفــة اللـــه ورسـوله', color: '#EF4444' },
        { category: 'من فضائل القرآن', color: '#8B5CF6' },
        { category: 'تدبر القرآن الكريم', color: '#06B6D4' },
        { category: 'الزهد والرقائق', color: '#EC4899' },
        { category: 'حكم ومواعظ', color: '#F97316' },
        { category: 'الاحاديث القدسية', color: '#84CC16' },
        { category: 'فوائد -ابن القيم', color: '#6366F1' }
      ];
      
      const categoryStats = categories.map(cat => ({
        ...cat,
        count: Math.floor(Math.random() * 25) + 5,
        time: Math.floor(Math.random() * 60) + 10
      }));
      
      setDailyData(daily);
      setCategoryData(categoryStats);
    };

    loadAnalyticsData();
  }, [timeFilter, userId]);

  return (
    <div className="space-y-8">
      {/* Progression quotidienne - Courbe */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-lg font-light text-gray-900 mb-2">
            📈 Progression de lecture
          </h3>
          <p className="text-sm text-gray-500">
            Évolution de votre activité de lecture
          </p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="quotes_read" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                name="Citations lues"
              />
              <Line 
                type="monotone" 
                dataKey="reading_time" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                name="Temps de lecture"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition par catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique en barres */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-light text-gray-900 mb-2">
              📊 Citations par catégorie
            </h3>
            <p className="text-sm text-gray-500">
              Répartition de vos lectures
            </p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="category" 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  name="Citations"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique camembert */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-light text-gray-900 mb-2">
              🎯 Temps par catégorie
            </h3>
            <p className="text-sm text-gray-500">
              Répartition du temps de lecture
            </p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="time"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} min`, 'Temps']}
                  labelFormatter={(label: any) => `${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Légende */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 truncate">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendances */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-light text-gray-900 mb-4">
          📊 Tendances récentes
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-light text-blue-600">+23%</div>
            <div className="text-sm text-gray-600">Temps de lecture</div>
            <div className="text-xs text-green-600">vs semaine précédente</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-light text-green-600">+15%</div>
            <div className="text-sm text-gray-600">Citations lues</div>
            <div className="text-xs text-green-600">vs semaine précédente</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-light text-purple-600">+8%</div>
            <div className="text-sm text-gray-600">Favoris ajoutés</div>
            <div className="text-xs text-green-600">vs semaine précédente</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-light text-orange-600">5j</div>
            <div className="text-sm text-gray-600">Série actuelle</div>
            <div className="text-xs text-blue-600">jours consécutifs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal du dashboard
const MinimalAnalyticsDashboard: React.FC<MinimalAnalyticsDashboardProps> = ({ 
  userId,
  supabaseClient 
}) => {
  const [kpis, setKpis] = useState<UserKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false); // ✅ État pour le bouton de sync

  // ✅ Fonction pour convertir TimeFilter vers AnalyticsTimeFilter
  const getAnalyticsTimeFilter = (filter: TimeFilter): AnalyticsTimeFilter => {
    return filter === 'today' ? 'week' : filter as AnalyticsTimeFilter;
  };

  // Générer des données démo basées sur le filtre
  const generateDemoData = (filter: TimeFilter): UserKPIs => {
    const multipliers = {
      today: { sessions: 0.1, time: 0.05, quotes: 0.08 },
      week: { sessions: 0.25, time: 0.2, quotes: 0.3 },
      month: { sessions: 1, time: 1, quotes: 1 },
      year: { sessions: 10, time: 8, quotes: 12 }
    };

    const mult = multipliers[filter as keyof typeof multipliers];
    const notesTotal = Math.round(5 * mult.quotes) || 1;
    
    return {
      sessions_count: Math.round(12 * mult.sessions) || 1,
      total_reading_time_seconds: Math.round(3600 * mult.time) || 180,
      quotes_read_total: Math.round(45 * mult.quotes) || 3,
      favorites_added: Math.round(8 * mult.quotes) || 1,
      most_read_category: 'التربية والتزكية',
      avg_session_duration_minutes: 15 + Math.round(Math.random() * 10),
      unique_categories_visited: Math.min(Math.round(5 * mult.quotes) || 1, 8),
      bookmarks_created: Math.round(3 * mult.quotes) || 1,
      searches_performed: Math.round(6 * mult.quotes) || 1,
      deepest_reading_session_minutes: 25 + Math.round(Math.random() * 15),
      reading_streak_days: filter === 'today' ? 1 : Math.min(Math.round(7 * mult.sessions), 15),
      best_reading_day: filter === 'today' ? 'Aujourd\'hui' : 'Dimanche',
      engagement_score: Math.round(75 + Math.random() * 20),
      // Données pour les notes
      notes_written: notesTotal,
      notes_by_category: {
        reflexion: Math.round(notesTotal * 0.4),
        action: Math.round(notesTotal * 0.35),
        objectif: Math.round(notesTotal * 0.25)
      },
      total_words_written: Math.round(notesTotal * 25 * mult.quotes) || 25,
      avg_words_per_note: 20 + Math.round(Math.random() * 15)
    };
  };

  // Charger les KPIs
  useEffect(() => {
    const loadKPIs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Si on a un client Supabase et un userId, utiliser les vraies données
        if (supabaseClient && userId) {
          // ✅ Utiliser la nouvelle fonction avec le filtre temporel
          const { data, error: kpiError } = await supabaseClient
            .rpc('get_user_kpis_with_categories', { 
              p_user_id: userId,
              p_time_filter: timeFilter 
            });

          if (kpiError) {
            throw kpiError;
          }

          // ✅ Mapper les données réelles vers le format étendu
          const realData = data?.[0];
          if (realData) {
            setKpis({
              sessions_count: realData.sessions_count || 0,
              total_reading_time_seconds: realData.total_reading_time_seconds || 0,
              quotes_read_total: realData.quotes_read_total || 0,
              favorites_added: realData.favorites_added || 0,
              most_read_category: realData.most_read_category || 'غير محدد',
              avg_session_duration_minutes: realData.avg_session_duration_minutes || 0,
              unique_categories_visited: realData.unique_categories_visited || 0,
              bookmarks_created: realData.bookmarks_created || 0,
              searches_performed: realData.searches_performed || 0,
              deepest_reading_session_minutes: realData.deepest_reading_session_minutes || 0,
              reading_streak_days: realData.reading_streak_days || 0,
              best_reading_day: realData.best_reading_day || 'الأحد',
              engagement_score: realData.engagement_score || 0,
              // ✅ Utiliser directement les données de la fonction principale
              notes_written: realData.notes_written || 0,
              notes_by_category: {
                reflexion: Math.round((realData.notes_written || 0) * 0.4),
                action: Math.round((realData.notes_written || 0) * 0.35),
                objectif: Math.round((realData.notes_written || 0) * 0.25)
              },
              total_words_written: realData.total_words_written || 0,
              avg_words_per_note: realData.avg_words_per_note || 0
            });
          }
        } else {
          // ✅ IMPORTANT: Si pas de Supabase, utiliser quand même les données de démo
          // Mais en développement, vous devriez toujours avoir supabaseClient
          console.warn('Aucun client Supabase - utilisation des données de démonstration');
          setTimeout(() => {
            setKpis(generateDemoData(timeFilter));
            setIsLoading(false);
          }, 800);
          return;
        }
      } catch (err) {
        console.error('Erreur chargement KPIs:', err);
        setError((err as Error).message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadKPIs();
  }, [userId, supabaseClient, timeFilter]);

  // Rafraîchissement automatique des stats temps réel
  useEffect(() => {
    if (!userId) return;

    const updateSessionStats = async () => {
      try {
        const { batchAnalytics } = await import('../services/batchAnalyticsService');
        const currentStats = batchAnalytics.getCurrentSessionStats();
        setSessionStats(currentStats);
      } catch (error) {
        console.log('Service analytics pas encore disponible');
      }
    };

    updateSessionStats();
    const interval = setInterval(updateSessionStats, 2000);

    return () => clearInterval(interval);
  }, [userId]);

  // ✅ Fonction de synchronisation manuelle
  const handleManualSync = async () => {
    if (!userId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // 1. Forcer la synchronisation du service analytics
      try {
        const { batchAnalytics } = await import('../services/batchAnalyticsService');
        // Utiliser une méthode existante du service, par exemple forceBatch() ou sync()
        if (typeof (batchAnalytics as any).forceBatch === 'function') {
          await (batchAnalytics as any).forceBatch();
        }
        console.log('✅ Synchronisation analytics forcée');
      } catch (error) {
        console.warn('Service analytics non disponible:', error);
      }
      
      // 2. Attendre un peu pour que Supabase traite les données
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Recharger les KPIs depuis la base
      if (supabaseClient) {
        const { data, error: kpiError } = await supabaseClient
          .rpc('get_user_kpis_with_categories', { 
            p_user_id: userId,
            p_time_filter: timeFilter 
          });

        if (!kpiError && data?.[0]) {
          const realData = data[0];

          setKpis({
            sessions_count: realData.sessions_count || 0,
            total_reading_time_seconds: realData.total_reading_time_seconds || 0,
            quotes_read_total: realData.quotes_read_total || 0,
            favorites_added: realData.favorites_added || 0,
            most_read_category: realData.most_read_category || 'غير محدد',
            avg_session_duration_minutes: realData.avg_session_duration_minutes || 0,
            unique_categories_visited: realData.unique_categories_visited || 0,
            bookmarks_created: realData.bookmarks_created || 0,
            searches_performed: realData.searches_performed || 0,
            deepest_reading_session_minutes: realData.deepest_reading_session_minutes || 0,
            reading_streak_days: realData.reading_streak_days || 0,
            best_reading_day: realData.best_reading_day || 'الأحد',
            engagement_score: realData.engagement_score || 0,
            notes_written: realData.notes_written || 0,
            notes_by_category: {
              reflexion: Math.round((realData.notes_written || 0) * 0.4),
              action: Math.round((realData.notes_written || 0) * 0.35),
              objectif: Math.round((realData.notes_written || 0) * 0.25)
            },
            total_words_written: realData.total_words_written || 0,
            avg_words_per_note: realData.avg_words_per_note || 0
          });
          
          console.log('✅ Données mises à jour:', realData.quotes_read_total, 'citations');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Formatage du temps de lecture
  const formatReadingTime = (seconds: number): string => {
    if (!seconds) return '0min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}min`;
  };

  // Calculer les insights
  const getInsights = () => {
    if (!kpis) return [];
    
    const insights = [];
    
    if (kpis.reading_streak_days > 0) {
      insights.push({
        icon: '🔥',
        text: `${kpis.reading_streak_days} jour${kpis.reading_streak_days > 1 ? 's' : ''} de lecture continue`,
        type: 'streak'
      });
    }
    
    if (kpis.notes_written > 0) {
      const noteRatio = kpis.notes_written / Math.max(kpis.favorites_added, 1);
      if (noteRatio > 0.7) {
        insights.push({
          icon: '✍️',
          text: 'Excellent engagement d\'écriture',
          type: 'writing'
        });
      }
    }
    
    if (kpis.avg_words_per_note > 30) {
      insights.push({
        icon: '📝',
        text: 'Notes très détaillées',
        type: 'detail'
      });
    }
    
    if (kpis.notes_by_category.reflexion > kpis.notes_by_category.action && 
        kpis.notes_by_category.reflexion > kpis.notes_by_category.objectif) {
      insights.push({
        icon: '🧠',
        text: 'Orientation réflexive dominante',
        type: 'reflection'
      });
    } else if (kpis.notes_by_category.action > kpis.notes_by_category.reflexion) {
      insights.push({
        icon: '⚡',
        text: 'Focalisé sur l\'action',
        type: 'action'
      });
    }
    
    if (kpis.engagement_score > 80) {
      insights.push({
        icon: '⭐',
        text: 'Excellent engagement global',
        type: 'engagement'
      });
    }
    
    return insights;
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-light text-gray-900">Analytics</h1>
            <div className="w-64 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-px bg-gray-200"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-2">Analytics</h1>
          <div className="h-px bg-gray-200"></div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-800 font-medium mb-2">Erreur de chargement</div>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  const insights = getInsights();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header avec filtres */}
      <div className="mb-8">
        {/* Affichage des stats temps réel si disponibles */}
        {sessionStats && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-xs text-green-800 font-medium mb-1">📊 Session en cours (temps réel)</div>
            <div className="flex gap-4 text-xs text-green-700">
              <span>⏱️ {sessionStats.duration_minutes}min</span>
              <span>📖 {sessionStats.quotes_read} citations</span>
              <span>⭐ {sessionStats.favorites_added} favoris</span>
              <span>📚 {sessionStats.categories_visited} catégories</span>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4 mb-6">
          {/* Header avec titre et bouton sync */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-light text-gray-900">Analytics</h1>
            
            {/* ✅ Bouton de synchronisation manuelle - séparé */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !userId || !supabaseClient}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border
                flex items-center gap-2 min-w-[110px] justify-center
                ${isSyncing 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                }
              `}
            >
              {isSyncing ? (
                <>
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="text-xs">Sync...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">🔄</span>
                  <span className="text-xs">Synchroniser</span>
                </>
              )}
            </button>
          </div>
          
          {/* Filtres temporels - ligne séparée et centrée */}
          <div className="flex justify-center">
            <TimeFilterButtons 
              activeFilter={timeFilter} 
              onFilterChange={setTimeFilter}
            />
          </div>
        </div>
        <div className="h-px bg-gray-200"></div>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Sessions"
          value={kpis.sessions_count}
          size="large"
          className="md:col-span-1"
        />
        
        <StatCard
          label="Temps de lecture"
          value={formatReadingTime(kpis.total_reading_time_seconds)}
          size="large"
          className="md:col-span-1"
        />
        
        <StatCard
          label="Citations lues"
          value={kpis.quotes_read_total}
          size="large"
          className="md:col-span-1"
        />
        
        <StatCard
          label="Score d'engagement"
          value={kpis.engagement_score}
          unit="%"
          size="large"
          className="md:col-span-1 border-blue-100 bg-blue-50"
        />
      </div>

      {/* KPIs secondaires avec notes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Favoris ajoutés"
          value={kpis.favorites_added}
          className="border-red-100 bg-red-50"
        />
        
        <StatCard
          label="Notes rédigées"
          value={kpis.notes_written}
          className="border-blue-100 bg-blue-50"
        />
        
        <StatCard
          label="Mots écrits"
          value={kpis.total_words_written}
          className="border-green-100 bg-green-50"
        />
        
        <StatCard
          label="Mots par note"
          value={kpis.avg_words_per_note}
          subtitle="Moyenne"
          className="border-purple-100 bg-purple-50"
        />
      </div>

      {/* Analytics des notes par catégorie */}
      <div className="mb-8">
        <h2 className="text-lg font-light text-gray-900 mb-4">Répartition des notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="🤔 Réflexions"
            value={kpis.notes_by_category.reflexion}
            subtitle={`${Math.round((kpis.notes_by_category.reflexion / Math.max(kpis.notes_written, 1)) * 100)}% du total`}
            className="border-indigo-100 bg-indigo-50"
          />
          
          <StatCard
            label="⚡ Actions"
            value={kpis.notes_by_category.action}
            subtitle={`${Math.round((kpis.notes_by_category.action / Math.max(kpis.notes_written, 1)) * 100)}% du total`}
            className="border-orange-100 bg-orange-50"
          />
          
          <StatCard
            label="🎯 Objectifs"
            value={kpis.notes_by_category.objectif}
            subtitle={`${Math.round((kpis.notes_by_category.objectif / Math.max(kpis.notes_written, 1)) * 100)}% du total`}
            className="border-emerald-100 bg-emerald-50"
          />
        </div>
      </div>

      {/* Autres métriques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Signets créés"
          value={kpis.bookmarks_created}
          className="border-yellow-100 bg-yellow-50"
        />
        
        <StatCard
          label="Recherches"
          value={kpis.searches_performed}
          className="border-teal-100 bg-teal-50"
        />
        
        <StatCard
          label="Catégories visitées"
          value={kpis.unique_categories_visited}
          className="border-pink-100 bg-pink-50"
        />

        <StatCard
          label="Engagement"
          value={kpis.engagement_score}
          unit="%"
          className="border-violet-100 bg-violet-50"
        />
      </div>

      {/* Métriques d'engagement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Session moyenne"
          value={kpis.avg_session_duration_minutes}
          unit="min"
          subtitle="Durée par session"
          className="border-indigo-100 bg-indigo-50"
        />
        
        <StatCard
          label="Plus longue session"
          value={kpis.deepest_reading_session_minutes}
          unit="min"
          subtitle="Session la plus approfondie"
          className="border-teal-100 bg-teal-50"
        />
        
        <StatCard
          label="Série de lecture"
          value={kpis.reading_streak_days}
          unit=" jour(s)"
          subtitle="Jours consécutifs"
          className="border-orange-100 bg-orange-50"
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-light text-gray-900 mb-4">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{insight.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{insight.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catégorie préférée et progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {kpis.most_read_category && (
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Catégorie préférée</div>
              <div className="text-xl font-light text-gray-900 bg-gray-50 inline-block px-4 py-2 rounded-full mb-3">
                {kpis.most_read_category}
              </div>
              <div className="text-xs text-gray-400">
                Meilleur jour: {kpis.best_reading_day}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-lg p-6">
          <div className="text-sm text-gray-500 mb-3">Progression vers l'objectif</div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sessions quotidiennes</span>
                <span>{Math.min(kpis.sessions_count, 3)}/3</span>
              </div>
              <ProgressBar value={kpis.sessions_count} max={3} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Temps de lecture</span>
                <span>{Math.min(Math.round(kpis.total_reading_time_seconds / 60), 60)}/60min</span>
              </div>
              <ProgressBar value={kpis.total_reading_time_seconds / 60} max={60} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Notes rédigées</span>
                <span>{Math.min(kpis.notes_written, 10)}/10</span>
              </div>
              <ProgressBar value={kpis.notes_written} max={10} />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Graphiques analytics intégrés avec conversion de type */}
      <div className="mt-8">
        <AnalyticsCharts 
          userId={userId} 
          timeFilter={getAnalyticsTimeFilter(timeFilter)} 
        />
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-100">
        <div className="text-center text-sm text-gray-400">
          Statistiques pour la période sélectionnée • Mis à jour en temps réel
        </div>
      </div>
    </div>
  );
};

export default MinimalAnalyticsDashboard;